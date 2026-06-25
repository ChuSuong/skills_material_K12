from __future__ import annotations

import importlib.util
import json
import shutil
import sys
from pathlib import Path

import pytest


MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "run_bundle.py"
SPEC = importlib.util.spec_from_file_location("chem_run_bundle", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _copy_templates(skill_dir: Path) -> None:
    src = Path(__file__).resolve().parents[1] / "templates"
    dst = skill_dir / "templates"
    dst.mkdir(parents=True, exist_ok=True)
    for template in src.glob("*.json"):
        shutil.copy2(template, dst / template.name)


def _base_payloads() -> tuple[dict, dict, dict]:
    request = {
        "prompt": "Create an electrolysis lab.",
        "slug": "demo-lab",
        "created_at": "2026-06-20T00:00:00Z"
    }
    design_brief = {
        "goal": "Electrolysis demo",
        "grade": "Hóa 12",
        "design_family": "electrolysis",
        "model_fidelity": "qualitative",
        "learning_loop": {
            "predict": "predict",
            "observe": "observe",
            "compare": "compare",
            "explain": "explain"
        },
        "must_show": ["catot"],
        "must_control": ["run"],
        "must_explain": ["ions"],
        "forbidden_shortcuts": []
    }
    interaction_spec = {
        "layout_family": "stage-first",
        "primary_stage_type": "threejs",
        "control_mode": "hybrid",
        "dependencies": [{"name": "Three.js", "version": "r128", "role": "render"}],
        "dependency_rationale": ["observable chemistry"],
        "autoplay_policy": "required",
        "fallback_policy": "visible-error",
        "verification_targets": ["stage_present", "mobile_fit_pass"]
    }
    return request, design_brief, interaction_spec


def test_publish_attempt_updates_manifest_and_legacy_mirror(tmp_path: Path) -> None:
    request, design_brief, interaction_spec = _base_payloads()
    module = MODULE
    module.RUNS_DIR = tmp_path / "runs"
    module.OUTPUTS_DIR = tmp_path / "outputs"
    module.EVAL_RUNS_DIR = tmp_path / "eval-runs"
    module.SKILL_DIR = tmp_path
    _copy_templates(tmp_path)

    bundle = module.RunBundle.init_run(
        slug="demo-lab",
        request=request,
        design_brief=design_brief,
        interaction_spec=interaction_spec,
        run_id="2026-06-20T00-00-00Z-demo-lab"
    )
    attempt_dir = bundle.create_attempt()
    (attempt_dir / "widget.html").write_text("<html><body>demo</body></html>", encoding="utf-8")
    _write_json(attempt_dir / "validation.json", {"status": "pass", "created_at": "2026-06-20T00:00:01Z"})
    _write_json(
        attempt_dir / "verification" / "result.json",
        {
            "schema_version": "chem-lab.verification-result.v2",
            "artifact_type": "verification_result",
            "slug": "demo-lab",
            "html_file": str(attempt_dir / "widget.html"),
            "final_status": "pass",
            "blockers": [],
            "warnings": [],
            "verification": {},
            "artifacts": {
                "desktop_screenshot": "desktop.png",
                "mobile_screenshot": "mobile.png",
                "trace": "trace.zip"
            },
            "checks": {},
            "created_at": "2026-06-20T00:00:02Z",
        }
    )
    _write_json(
        attempt_dir / "evaluation_record.json",
        {
            "slug": "demo-lab",
            "output_file": "outputs/demo-lab.html",
            "experiment": {"title": "Demo", "grade": "Hóa 12", "learning_goal": "Goal"},
            "interaction_pattern": "stage-first",
            "libraries": [],
            "model_fidelity": "qualitative",
            "validation_results": {},
            "scores": {"total": 91},
            "final_status": "pass",
            "created_at": "2026-06-20T00:00:03Z"
        }
    )

    manifest = bundle.publish_attempt("attempt_0")

    assert manifest["status"] == "published"
    assert manifest["published_attempt"] == "attempt_0"
    assert (tmp_path / "outputs" / "demo-lab.html").exists()
    mirror_files = list((tmp_path / "eval-runs" / "demo-lab").glob("*.json"))
    assert len(mirror_files) == 1


def test_publish_attempt_marks_mirror_error_without_rolling_back_output(tmp_path: Path) -> None:
    request, design_brief, interaction_spec = _base_payloads()
    module = MODULE
    module.RUNS_DIR = tmp_path / "runs"
    module.OUTPUTS_DIR = tmp_path / "outputs"
    module.EVAL_RUNS_DIR = tmp_path / "eval-runs-file"
    module.SKILL_DIR = tmp_path
    module.EVAL_RUNS_DIR.write_text("not-a-directory", encoding="utf-8")
    _copy_templates(tmp_path)

    bundle = module.RunBundle.init_run(
        slug="demo-lab",
        request=request,
        design_brief=design_brief,
        interaction_spec=interaction_spec,
        run_id="2026-06-20T00-00-00Z-demo-lab"
    )
    attempt_dir = bundle.create_attempt()
    (attempt_dir / "widget.html").write_text("<html><body>demo</body></html>", encoding="utf-8")
    _write_json(attempt_dir / "validation.json", {"status": "pass", "created_at": "2026-06-20T00:00:01Z"})
    _write_json(
        attempt_dir / "verification" / "result.json",
        {
            "schema_version": "chem-lab.verification-result.v2",
            "artifact_type": "verification_result",
            "slug": "demo-lab",
            "html_file": str(attempt_dir / "widget.html"),
            "final_status": "pass-with-warnings",
            "blockers": [],
            "warnings": ["warn"],
            "verification": {},
            "artifacts": {
                "desktop_screenshot": "desktop.png",
                "mobile_screenshot": "mobile.png",
                "trace": "trace.zip"
            },
            "checks": {},
            "created_at": "2026-06-20T00:00:02Z",
        }
    )

    manifest = bundle.publish_attempt("attempt_0", legacy_eval_root=module.EVAL_RUNS_DIR)

    assert manifest["status"] == "published-with-mirror-error"
    assert (tmp_path / "outputs" / "demo-lab.html").exists()
    assert manifest["legacy_mirrors"][-1]["status"] == "error"


def test_init_run_rejects_invalid_request_schema(tmp_path: Path) -> None:
    request, design_brief, interaction_spec = _base_payloads()
    module = MODULE
    module.RUNS_DIR = tmp_path / "runs"
    module.OUTPUTS_DIR = tmp_path / "outputs"
    module.EVAL_RUNS_DIR = tmp_path / "eval-runs"
    module.SKILL_DIR = tmp_path
    _copy_templates(tmp_path)

    request.pop("prompt")

    with pytest.raises(Exception):
        module.RunBundle.init_run(
            slug="demo-lab",
            request=request,
            design_brief=design_brief,
            interaction_spec=interaction_spec,
            run_id="2026-06-20T00-00-00Z-demo-lab",
        )
