from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "check_widget.py"
SPEC = importlib.util.spec_from_file_location("chem_check_widget", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def test_audit_static_html_detects_visible_ion_color_spoiler(tmp_path: Path) -> None:
    html_path = tmp_path / "spoiler.html"
    html_path.write_text(
        """
<!doctype html>
<html lang="vi">
<body>
  <div id="chem-exp-demo">
    <div>Li+: đỏ carmine</div>
    <div>Na+: vàng mạnh</div>
  </div>
</body>
</html>
""".strip(),
        encoding="utf-8",
    )

    result = MODULE.audit_static_html(html_path)

    assert result["spoiler_mapping_found"] is True
    assert result["blockers"]


def test_merge_static_checks_promotes_runtime_pass_to_fail_on_spoiler() -> None:
    runtime = {
        "final_status": "pass",
        "mode": "legacy",
        "blockers": [],
        "warnings": [],
        "verification": {"invariants": {}},
        "checks": {},
    }
    static = {
        "visible_text_length_before_script": 120,
        "spoiler_mapping_found": True,
        "early_result_found": False,
        "document_query_found": False,
        "unpinned_cdn_found": False,
        "blockers": ["Static spoiler detected."],
        "warnings": [],
    }

    merged = MODULE.merge_static_checks(runtime, static)

    assert merged["final_status"] == "fail"
    assert merged["verification"]["invariants"]["spoiler_ui_pass"] is False
    assert merged["checks"]["static"]["spoiler_mapping_found"] is True


def test_merge_static_checks_downgrades_legacy_heuristics_for_contract_aware_widget() -> None:
    runtime = {
        "final_status": "pass",
        "mode": "contract-aware",
        "blockers": [],
        "warnings": [],
        "verification": {"invariants": {}},
        "checks": {},
    }
    static = {
        "visible_text_length_before_script": 120,
        "spoiler_mapping_found": True,
        "early_result_found": False,
        "document_query_found": False,
        "unpinned_cdn_found": False,
        "blockers": ["Static spoiler detected."],
        "warnings": [],
    }

    merged = MODULE.merge_static_checks(runtime, static)

    assert merged["final_status"] == "pass-with-warnings"
    assert merged["blockers"] == []
    assert any(item.startswith("Legacy heuristic only:") for item in merged["warnings"])


def test_resolve_target_defaults_attempt_dir_to_bundle_verification_result(tmp_path: Path) -> None:
    attempt_dir = tmp_path / "attempt_0"
    attempt_dir.mkdir()
    (attempt_dir / "widget.html").write_text("<html></html>", encoding="utf-8")

    html_path, result_path = MODULE.resolve_target(attempt_dir, None)

    assert html_path == (attempt_dir / "widget.html").resolve()
    assert result_path == attempt_dir / "verification" / "result.json"
