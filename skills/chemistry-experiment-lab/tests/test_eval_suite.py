from __future__ import annotations

import importlib.util
import json
import shutil
import sys
from pathlib import Path


MODULE_PATH = (
    Path(__file__).resolve().parents[1] / "scripts" / "eval_suite.py"
)
SPEC = importlib.util.spec_from_file_location("chem_eval_suite", MODULE_PATH)
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


def test_evaluate_suite_handles_pass_and_fail_cases(tmp_path: Path) -> None:
    skill_dir = tmp_path / "skill"
    (skill_dir / "evals").mkdir(parents=True)
    (skill_dir / "outputs").mkdir(parents=True)
    (skill_dir / "eval-runs" / "demo-slug").mkdir(parents=True)
    (skill_dir / "evaluations" / "artifacts" / "demo-slug" / "2026-06-20T00-00-00Z").mkdir(parents=True)
    _copy_templates(skill_dir)

    html_path = skill_dir / "outputs" / "demo.html"
    html_path.write_text("<html><body><h1>Demo Lab</h1><button>Run</button></body></html>", encoding="utf-8")

    _write_json(
        skill_dir / "evaluations" / "artifacts" / "demo-slug" / "2026-06-20T00-00-00Z" / "result.json",
        {
            "schema_version": "chem-lab.verification-result.v2",
            "artifact_type": "verification_result",
            "slug": "demo-slug",
            "html_file": str(html_path),
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
            "created_at": "2026-06-20T00:00:00Z"
        },
    )
    _write_json(
        skill_dir / "eval-runs" / "demo-slug" / "2026-06-20T00-00-00Z.json",
        {
            "slug": "demo-slug",
            "output_file": str(html_path),
            "experiment": {
                "title": "Demo Lab",
                "grade": "Hóa 10",
                "learning_goal": "Observe a simple demo."
            },
            "interaction_pattern": "demo",
            "libraries": [],
            "model_fidelity": "qualitative",
            "validation_results": {},
            "scores": {"total": 90},
            "final_status": "pass",
            "created_at": "2026-06-20T00:00:00Z",
        },
    )

    suite_path = skill_dir / "evals" / "eval-suite.yaml"
    suite_path.write_text(
        """
suite_id: demo-suite
cases:
  - id: pass-case
    slug: demo-slug
    design_family: titration
    source:
      type: output_html
      path: outputs/demo.html
      verification_result: evaluations/artifacts/demo-slug/2026-06-20T00-00-00Z/result.json
      eval_record: eval-runs/demo-slug/2026-06-20T00-00-00Z.json
    must_show:
      - Demo Lab
    must_control:
      - Run
    forbidden_shortcuts:
      - TODO
    expected_verify: pass
  - id: fail-case
    slug: demo-slug
    design_family: equilibrium
    source:
      type: output_html
      path: outputs/demo.html
      verification_result: evaluations/artifacts/demo-slug/2026-06-20T00-00-00Z/result.json
    must_show:
      - Missing Phrase
    forbidden_shortcuts: []
    expected_verify: pass
""".strip(),
        encoding="utf-8",
    )

    result = MODULE.evaluate_suite(skill_dir, suite_path)

    assert result["summary"] == {"total": 2, "passed": 1, "failed": 1, "status": "fail"}
    assert result["lane_summary"]["modes"] == {"legacy": 2, "contract-aware": 0}
    assert result["results"][0]["status"] == "pass"
    assert result["results"][0]["checks"]["verification_schema_ok"] is True
    assert result["results"][0]["checks"]["must_control_ok"] is True
    assert result["results"][1]["status"] == "fail"
    assert "Missing required phrases" in result["results"][1]["errors"][0]


def test_evaluate_suite_supports_live_verify_and_contract_aware_mode(tmp_path: Path, monkeypatch) -> None:
    skill_dir = tmp_path / "skill"
    (skill_dir / "evals").mkdir(parents=True)
    (skill_dir / "outputs").mkdir(parents=True)
    _copy_templates(skill_dir)

    legacy_html = skill_dir / "outputs" / "legacy.html"
    legacy_html.write_text(
        "<html><body><h1>Legacy Demo</h1><button>Run</button></body></html>",
        encoding="utf-8",
    )

    contract_html = skill_dir / "outputs" / "contract.html"
    contract_html.write_text(
        """
<html>
  <body>
    <section data-widget-family="classification" data-phase="predict">
      <div data-role="stage"></div>
      <button data-role="primary-action">Observe flame</button>
      <button data-role="reset">Reset</button>
      <div data-role="result"></div>
      <script type="application/json" data-role="test-contract">
        {
          "schema_version": "chem-lab.test-contract.v1",
          "interaction_family": "classification",
          "answer_reveal_policy": "after-complete",
          "primary_observation": "flame-color-change",
          "supports_reset": true,
          "supports_pause": false
        }
      </script>
    </section>
  </body>
</html>
""".strip(),
        encoding="utf-8",
    )

    live_results = {
        str(contract_html.resolve()): {
            "schema_version": "chem-lab.verification-result.v2",
            "artifact_type": "verification_result",
            "slug": "contract-demo",
            "html_file": str(contract_html.resolve()),
            "final_status": "pass",
            "mode": "contract-aware",
            "blockers": [],
            "warnings": [],
            "verification": {
                "invariants": {
                    "stage_present": True,
                    "fallback_present": True,
                    "mobile_fit_pass": True,
                }
            },
            "checks": {},
            "contract_checks": {"runtime_contract_visible": True},
            "probe_results": [
                {"probe_id": "classification", "status": "pass"}
            ],
            "human_review_required": True,
            "human_review_reason": "Visual signoff pending.",
            "created_at": "2026-06-20T00:00:00Z"
        }
    }

    def _fake_run_live_verify(target: Path) -> tuple[dict, str | None]:
        payload = live_results.get(str(target.resolve()))
        if payload is None:
            return None, "missing fixture"
        return payload, None

    monkeypatch.setattr(MODULE, "run_live_verify", _fake_run_live_verify)

    suite_path = skill_dir / "evals" / "eval-suite.yaml"
    suite_path.write_text(
        """
suite_id: mixed-suite
cases:
  - id: legacy-case
    design_family: legacy-demo
    source:
      type: output_html
      path: outputs/legacy.html
    must_show:
      - Legacy Demo
    must_control:
      - Run
    forbidden_shortcuts: []
  - id: contract-case
    design_family: classification
    source:
      type: output_html
      path: outputs/contract.html
      live_verify: true
    must_show:
      - Observe flame
    must_control:
      - Reset
    forbidden_shortcuts: []
    required_probes:
      - classification
    expected_verify: pass
""".strip(),
        encoding="utf-8",
    )

    result = MODULE.evaluate_suite(skill_dir, suite_path)

    assert result["summary"] == {"total": 2, "passed": 2, "failed": 0, "status": "pass"}
    assert result["lane_summary"]["modes"] == {"legacy": 1, "contract-aware": 1}
    assert result["lane_summary"]["live_run"] == {"requested": 1, "passed": 1, "failed": 0}

    legacy_result = result["results"][0]
    assert legacy_result["mode"] == "legacy"
    assert legacy_result["contract_checks"]["passed"] is True
    assert legacy_result["runtime_checks"]["passed"] is False

    contract_result = result["results"][1]
    assert contract_result["mode"] == "contract-aware"
    assert contract_result["live_verify"] is True
    assert contract_result["contract"]["interaction_family"] == "classification"
    assert contract_result["contract_checks"]["passed"] is True
    assert contract_result["runtime_checks"]["passed"] is True
    assert contract_result["probe_results"] == [{"probe_id": "classification", "status": "pass"}]
    assert contract_result["human_review_required"] is True
    assert contract_result["human_review_reason"] == "Visual signoff pending."
