#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

import jsonschema
import yaml


SCRIPT_PATH = Path(__file__).resolve()
SKILL_DIR = SCRIPT_PATH.parent.parent
DEFAULT_SUITE_PATH = SKILL_DIR / "evals" / "eval-suite.yaml"
CHECK_WIDGET_PATH = SKILL_DIR / "scripts" / "check_widget.py"
CONTRACT_SCHEMA_VERSION = "chem-lab.test-contract.v1"
ALLOWED_PHASES = {"predict", "observe", "compare", "explain", "complete"}
ALLOWED_REVEAL_POLICIES = {"immediate", "after-observe", "after-complete"}
REQUIRED_CONTRACT_ROLES = {"stage", "primary-action", "reset", "result"}


class WidgetContractHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.widget_attrs: dict[str, str] = {}
        self.roles: set[str] = set()
        self._capture_contract = False
        self._contract_chunks: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {key: value or "" for key, value in attrs}
        role = attr_map.get("data-role")
        if role:
            self.roles.add(role)
        if not self.widget_attrs and (
            "data-widget-family" in attr_map or "data-phase" in attr_map
        ):
            self.widget_attrs = {
                key: attr_map[key]
                for key in ("data-widget-family", "data-phase")
                if key in attr_map
            }
        if (
            tag == "script"
            and attr_map.get("type") == "application/json"
            and attr_map.get("data-role") == "test-contract"
        ):
            self._capture_contract = True
            self._contract_chunks = []

    def handle_data(self, data: str) -> None:
        if self._capture_contract:
            self._contract_chunks.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._capture_contract:
            self._capture_contract = False

    @property
    def contract_text(self) -> str:
        return "".join(self._contract_chunks).strip()


@dataclass
class CaseResult:
    case_id: str
    design_family: str
    status: str
    expected_verify: str | None
    observed_verify: str | None
    source_type: str
    source_path: str
    mode: str
    live_verify: bool
    contract: dict[str, Any] | None
    contract_checks: dict[str, Any]
    runtime_checks: dict[str, Any]
    probe_results: list[dict[str, Any]]
    human_review_required: bool
    human_review_reason: str | None
    checks: dict[str, Any]
    errors: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "case_id": self.case_id,
            "design_family": self.design_family,
            "status": self.status,
            "expected_verify": self.expected_verify,
            "observed_verify": self.observed_verify,
            "source_type": self.source_type,
            "source_path": self.source_path,
            "mode": self.mode,
            "live_verify": self.live_verify,
            "contract": self.contract,
            "contract_checks": self.contract_checks,
            "runtime_checks": self.runtime_checks,
            "probe_results": self.probe_results,
            "human_review_required": self.human_review_required,
            "human_review_reason": self.human_review_reason,
            "checks": self.checks,
            "errors": self.errors,
        }


def load_yaml(path: Path) -> dict[str, Any]:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"Suite file must decode to an object: {path}")
    return data


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_contract_html(html_text: str) -> dict[str, Any]:
    parser = WidgetContractHTMLParser()
    parser.feed(html_text)
    contract_text = parser.contract_text
    contract: dict[str, Any] | None = None
    contract_error: str | None = None
    if contract_text:
        try:
            loaded = json.loads(contract_text)
            if isinstance(loaded, dict):
                contract = loaded
            else:
                contract_error = "Embedded test-contract must decode to an object."
        except json.JSONDecodeError as exc:
            contract_error = f"Embedded test-contract JSON parse failed: {exc}"
    return {
        "widget_family": parser.widget_attrs.get("data-widget-family"),
        "phase": parser.widget_attrs.get("data-phase"),
        "roles": sorted(parser.roles),
        "contract": contract,
        "contract_error": contract_error,
    }


def resolve_source(skill_dir: Path, case: dict[str, Any]) -> dict[str, Path]:
    source = case["source"]
    source_type = source["type"]
    source_path = (skill_dir / source["path"]).resolve()
    resolved: dict[str, Path] = {"root": source_path}

    if source_type == "output_html":
        resolved["html"] = source_path
        if "verification_result" in source:
            resolved["verification_result"] = (skill_dir / source["verification_result"]).resolve()
        if "eval_record" in source:
            resolved["eval_record"] = (skill_dir / source["eval_record"]).resolve()
        return resolved

    if source_type == "bundle_attempt":
        run_dir = source_path.parents[1]
        resolved["html"] = source_path / "widget.html"
        resolved["validation"] = source_path / "validation.json"
        resolved["verification_result"] = source_path / "verification" / "result.json"
        resolved["request"] = run_dir / "request.json"
        resolved["design_brief"] = run_dir / "design_brief.json"
        resolved["interaction_spec"] = run_dir / "interaction_spec.json"
        resolved["manifest"] = run_dir / "manifest.json"
        eval_record = source_path / "evaluation_record.json"
        if eval_record.exists():
            resolved["eval_record"] = eval_record
        return resolved

    raise ValueError(f"Unsupported source type: {source_type}")


def latest_eval_record(skill_dir: Path, slug: str) -> Path | None:
    run_dir = skill_dir / "eval-runs" / slug
    if not run_dir.exists():
        return None
    candidates = sorted(run_dir.glob("*.json"))
    return candidates[-1] if candidates else None


def validate_schema(instance_path: Path, schema_path: Path) -> str | None:
    try:
        instance = load_json(instance_path)
        schema = load_json(schema_path)
        jsonschema.validate(instance=instance, schema=schema)
        return None
    except Exception as exc:  # pragma: no cover - collapsed for readable CLI output
        return f"{instance_path.name} failed schema validation against {schema_path.name}: {exc}"


def find_text_expectations(html_text: str, phrases: list[str]) -> list[str]:
    missing = []
    haystack = html_text.casefold()
    for phrase in phrases:
        if phrase.casefold() not in haystack:
            missing.append(phrase)
    return missing


def find_forbidden_shortcuts(html_text: str, phrases: list[str]) -> list[str]:
    haystack = html_text.casefold()
    return [phrase for phrase in phrases if phrase.casefold() in haystack]


def verify_status_ok(observed: str | None, expected: str | None) -> bool:
    if expected is None:
        return True
    return observed == expected


def verify_controls_ok(html_text: str, controls: list[str]) -> list[str]:
    missing = []
    haystack = html_text.casefold()
    for control in controls:
        if control.casefold() not in haystack:
            missing.append(control)
    return missing


def run_live_verify(target: Path) -> tuple[dict[str, Any] | None, str | None]:
    if not CHECK_WIDGET_PATH.exists():
        return None, f"Live verify unavailable: missing script {CHECK_WIDGET_PATH}"
    with tempfile.TemporaryDirectory(prefix="chem-lab-eval-") as temp_dir:
        output_path = Path(temp_dir) / "verification-result.json"
        command = [sys.executable, str(CHECK_WIDGET_PATH), str(target), str(output_path)]
        completed = subprocess.run(command, capture_output=True, text=True, check=False)
        if output_path.exists():
            try:
                return load_json(output_path), None
            except Exception as exc:  # pragma: no cover - defensive CLI path
                return None, f"Live verify produced unreadable JSON: {exc}"
        stderr = completed.stderr.strip()
        stdout = completed.stdout.strip()
        message = stderr or stdout or f"Live verify exited with code {completed.returncode}"
        return None, message


def infer_mode(
    verification: dict[str, Any] | None,
    html_info: dict[str, Any],
) -> str:
    mode = (verification or {}).get("mode")
    if mode in {"legacy", "contract-aware"}:
        return mode
    if isinstance((verification or {}).get("contract"), dict):
        return "contract-aware"
    if isinstance(html_info.get("contract"), dict):
        return "contract-aware"
    return "legacy"


def summarize_runtime_checks(
    verification: dict[str, Any] | None,
    source_live_verify: bool,
) -> dict[str, Any]:
    runtime_checks = dict((verification or {}).get("runtime_checks") or {})
    if verification:
        runtime_checks.setdefault("final_status", verification.get("final_status"))
        runtime_checks.setdefault("blockers", list(verification.get("blockers", [])))
        runtime_checks.setdefault("warnings", list(verification.get("warnings", [])))
        invariants = ((verification.get("verification") or {}).get("invariants") or {})
        if invariants:
            runtime_checks.setdefault("invariants", invariants)
        static_checks = (verification.get("checks") or {}).get("static")
        if static_checks:
            runtime_checks.setdefault("static", static_checks)
    runtime_checks.setdefault("live_verify", source_live_verify)
    runtime_checks["passed"] = runtime_checks.get("final_status") in {"pass", "pass-with-warnings"}
    return runtime_checks


def summarize_contract_checks(
    mode: str,
    verification: dict[str, Any] | None,
    html_info: dict[str, Any],
) -> tuple[dict[str, Any] | None, dict[str, Any]]:
    contract = (verification or {}).get("contract")
    if not isinstance(contract, dict):
        contract = html_info.get("contract")
    roles = set(html_info.get("roles") or [])
    missing_roles = sorted(REQUIRED_CONTRACT_ROLES - roles)
    contract_checks = dict((verification or {}).get("contract_checks") or {})
    contract_checks.setdefault("contract_present", isinstance(contract, dict))
    contract_checks.setdefault("contract_parse_ok", html_info.get("contract_error") is None)
    contract_checks.setdefault("widget_family_present", bool(html_info.get("widget_family")))
    contract_checks.setdefault("phase_present", bool(html_info.get("phase")))
    contract_checks.setdefault("phase_valid", html_info.get("phase") in ALLOWED_PHASES)
    contract_checks.setdefault("required_roles_present", not missing_roles)
    contract_checks.setdefault("missing_roles", missing_roles)
    if isinstance(contract, dict):
        contract_checks.setdefault(
            "schema_version_ok",
            contract.get("schema_version") == CONTRACT_SCHEMA_VERSION,
        )
        contract_checks.setdefault(
            "interaction_family_present",
            isinstance(contract.get("interaction_family"), str)
            and bool(contract.get("interaction_family")),
        )
        contract_checks.setdefault(
            "answer_reveal_policy_valid",
            contract.get("answer_reveal_policy") in ALLOWED_REVEAL_POLICIES,
        )
        contract_checks.setdefault(
            "supports_reset_declared",
            isinstance(contract.get("supports_reset"), bool),
        )
    else:
        contract_checks.setdefault("schema_version_ok", False)
        contract_checks.setdefault("interaction_family_present", False)
        contract_checks.setdefault("answer_reveal_policy_valid", False)
        contract_checks.setdefault("supports_reset_declared", False)
    if mode == "legacy":
        contract_checks["passed"] = True
        contract_checks.setdefault("legacy_allowed_missing_contract", True)
    else:
        contract_checks["passed"] = all(
            bool(contract_checks.get(key))
            for key in (
                "contract_present",
                "contract_parse_ok",
                "widget_family_present",
                "phase_present",
                "phase_valid",
                "required_roles_present",
                "schema_version_ok",
                "interaction_family_present",
                "answer_reveal_policy_valid",
                "supports_reset_declared",
            )
        )
    return contract, contract_checks


def normalize_probe_results(
    verification: dict[str, Any] | None,
    required_probe_ids: list[str],
) -> list[dict[str, Any]]:
    raw = (verification or {}).get("probe_results")
    normalized: list[dict[str, Any]] = []
    if isinstance(raw, list):
        for item in raw:
            if isinstance(item, dict):
                probe_id = str(item.get("probe_id") or item.get("name") or "unknown")
                status = str(item.get("status") or "unknown")
                normalized.append({"probe_id": probe_id, **item, "status": status})
    elif isinstance(raw, dict):
        for probe_id, payload in raw.items():
            if isinstance(payload, dict):
                status = str(payload.get("status") or "unknown")
                normalized.append({"probe_id": str(probe_id), **payload, "status": status})
    if not required_probe_ids:
        return normalized
    by_id = {item["probe_id"]: item for item in normalized}
    for probe_id in required_probe_ids:
        by_id.setdefault(probe_id, {"probe_id": probe_id, "status": "missing"})
    return [by_id[key] for key in sorted(by_id)]


def probe_requirements_satisfied(probe_results: list[dict[str, Any]], required_probe_ids: list[str]) -> bool:
    if not required_probe_ids:
        return True
    by_id = {item["probe_id"]: item.get("status") for item in probe_results}
    return all(by_id.get(probe_id) == "pass" for probe_id in required_probe_ids)


def summarize_human_review(
    mode: str,
    verification: dict[str, Any] | None,
) -> tuple[bool, str | None]:
    if isinstance((verification or {}).get("human_review_required"), bool):
        return verification["human_review_required"], verification.get("human_review_reason")
    if mode == "contract-aware":
        return True, "Visual signoff is still required for contract-aware widgets."
    return False, None


def build_lane_summary(results: list[CaseResult]) -> dict[str, Any]:
    mode_counts = {"legacy": 0, "contract-aware": 0}
    live_run = {"requested": 0, "passed": 0, "failed": 0}
    contract = {"passed": 0, "failed": 0}
    runtime = {"passed": 0, "failed": 0}
    probes = {"required": 0, "passed": 0, "failed": 0}
    for result in results:
        mode_counts[result.mode] = mode_counts.get(result.mode, 0) + 1
        if result.live_verify:
            live_run["requested"] += 1
            if result.runtime_checks.get("passed"):
                live_run["passed"] += 1
            else:
                live_run["failed"] += 1
        if result.contract_checks.get("passed"):
            contract["passed"] += 1
        else:
            contract["failed"] += 1
        if result.runtime_checks.get("passed"):
            runtime["passed"] += 1
        else:
            runtime["failed"] += 1
        required_probe_count = sum(item.get("status") == "missing" for item in result.probe_results)
        if required_probe_count or result.probe_results:
            probes["required"] += len(result.probe_results)
            for item in result.probe_results:
                if item.get("status") == "pass":
                    probes["passed"] += 1
                elif item.get("status") in {"fail", "missing"}:
                    probes["failed"] += 1
    return {
        "modes": mode_counts,
        "live_run": live_run,
        "contract_checks": contract,
        "runtime_checks": runtime,
        "probe_checks": probes,
    }


def evaluate_case(skill_dir: Path, case: dict[str, Any]) -> CaseResult:
    case_id = case["id"]
    design_family = case["design_family"]
    resolved = resolve_source(skill_dir, case)
    source = case["source"]
    source_type = source["type"]
    live_verify = bool(source.get("live_verify"))
    expected_verify = case.get("expected_verify")
    required_probe_ids = list(case.get("required_probes") or [])
    errors: list[str] = []
    checks: dict[str, Any] = {}
    templates_dir = skill_dir / "templates"

    html_path = resolved["html"]
    checks["html_exists"] = html_path.exists()
    if not html_path.exists():
        errors.append(f"Missing HTML artifact: {html_path}")
        return CaseResult(
            case_id=case_id,
            design_family=design_family,
            status="fail",
            expected_verify=expected_verify,
            observed_verify=None,
            source_type=source_type,
            source_path=str(source["path"]),
            mode="legacy",
            live_verify=live_verify,
            contract=None,
            contract_checks={"passed": True, "legacy_allowed_missing_contract": True},
            runtime_checks={"passed": False, "live_verify": live_verify},
            probe_results=[],
            human_review_required=False,
            human_review_reason=None,
            checks=checks,
            errors=errors,
        )

    html_text = html_path.read_text(encoding="utf-8", errors="ignore")
    html_info = parse_contract_html(html_text)

    verification_path = resolved.get("verification_result")
    observed_verify: str | None = None
    verification: dict[str, Any] | None = None
    if live_verify:
        live_target = resolved["root"] if source_type == "bundle_attempt" else html_path
        verification, live_error = run_live_verify(live_target)
        checks["verification_result_exists"] = verification is not None
        checks["live_verify_requested"] = True
        if live_error:
            errors.append(f"Live verify failed: {live_error}")
    elif verification_path and verification_path.exists():
        verification = load_json(verification_path)
        observed_verify = verification.get("final_status")
        checks["verification_result_exists"] = True
        error = validate_schema(verification_path, templates_dir / "verification-result.schema.json")
        checks["verification_schema_ok"] = error is None
        if error:
            errors.append(error)
    else:
        checks["verification_result_exists"] = False
    if verification:
        observed_verify = verification.get("final_status")
        if live_verify:
            checks["verification_schema_ok"] = True

    if "validation" in resolved:
        validation_path = resolved["validation"]
        checks["validation_exists"] = validation_path.exists()
        if validation_path.exists():
            validation_schema = templates_dir / "validation.schema.json"
            if validation_schema.exists():
                error = validate_schema(validation_path, validation_schema)
                checks["validation_schema_ok"] = error is None
                if error:
                    errors.append(error)
        else:
            errors.append(f"Missing validation artifact: {validation_path}")

    eval_record_path = resolved.get("eval_record")
    if not eval_record_path and "slug" in case:
        eval_record_path = latest_eval_record(skill_dir, case["slug"])
    checks["eval_record_exists"] = bool(eval_record_path and eval_record_path.exists())
    if eval_record_path and eval_record_path.exists():
        error = validate_schema(eval_record_path, templates_dir / "evaluation-record.schema.json")
        checks["eval_record_schema_ok"] = error is None
        if error:
            errors.append(error)

    for artifact_name, schema_name in {
        "request": "request.schema.json",
        "design_brief": "design-brief.schema.json",
        "interaction_spec": "interaction-spec.schema.json",
        "manifest": "manifest.schema.json",
    }.items():
        artifact_path = resolved.get(artifact_name)
        if artifact_path is None:
            continue
        exists_key = f"{artifact_name}_exists"
        schema_key = f"{artifact_name}_schema_ok"
        checks[exists_key] = artifact_path.exists()
        if not artifact_path.exists():
            errors.append(f"Missing {artifact_name} artifact: {artifact_path}")
            continue
        error = validate_schema(artifact_path, templates_dir / schema_name)
        checks[schema_key] = error is None
        if error:
            errors.append(error)

    must_show_missing = find_text_expectations(html_text, case.get("must_show", []))
    checks["must_show_ok"] = not must_show_missing
    if must_show_missing:
        errors.append(f"Missing required phrases: {must_show_missing}")

    must_control_missing = verify_controls_ok(html_text, case.get("must_control", []))
    checks["must_control_ok"] = not must_control_missing
    if must_control_missing:
        errors.append(f"Missing required controls: {must_control_missing}")

    forbidden_hits = find_forbidden_shortcuts(html_text, case.get("forbidden_shortcuts", []))
    checks["forbidden_shortcuts_ok"] = not forbidden_hits
    if forbidden_hits:
        errors.append(f"Found forbidden shortcuts: {forbidden_hits}")

    mode = infer_mode(verification, html_info)
    contract, contract_checks = summarize_contract_checks(mode, verification, html_info)
    runtime_checks = summarize_runtime_checks(verification, live_verify)
    probe_results = normalize_probe_results(verification, required_probe_ids)
    human_review_required, human_review_reason = summarize_human_review(mode, verification)

    checks["mode"] = mode
    checks["contract_checks_ok"] = contract_checks.get("passed")
    checks["runtime_checks_ok"] = runtime_checks.get("passed")
    checks["probe_checks_ok"] = probe_requirements_satisfied(probe_results, required_probe_ids)

    checks["verification_status_ok"] = verify_status_ok(observed_verify, expected_verify)
    if not checks["verification_status_ok"]:
        errors.append(
            f"Verification status mismatch: expected {expected_verify!r}, observed {observed_verify!r}"
        )
    if mode == "contract-aware" and not contract_checks["passed"]:
        errors.append("Contract-aware widget failed contract checks.")
    if mode == "contract-aware" and not runtime_checks["passed"]:
        errors.append("Contract-aware widget failed runtime checks.")
    if mode == "contract-aware" and required_probe_ids and not checks["probe_checks_ok"]:
        errors.append(f"Required probes did not pass: {required_probe_ids}")

    status = "pass" if not errors else "fail"
    return CaseResult(
        case_id=case_id,
        design_family=design_family,
        status=status,
        expected_verify=expected_verify,
        observed_verify=observed_verify,
        source_type=source_type,
        source_path=str(source["path"]),
        mode=mode,
        live_verify=live_verify,
        contract=contract,
        contract_checks=contract_checks,
        runtime_checks=runtime_checks,
        probe_results=probe_results,
        human_review_required=human_review_required,
        human_review_reason=human_review_reason,
        checks=checks,
        errors=errors,
    )


def evaluate_suite(skill_dir: Path, suite_path: Path) -> dict[str, Any]:
    suite = load_yaml(suite_path)
    cases = suite.get("cases") or []
    results = [evaluate_case(skill_dir, case) for case in cases]
    passed = sum(result.status == "pass" for result in results)
    failed = len(results) - passed
    return {
        "suite_id": suite.get("suite_id", "chemistry-experiment-lab-v2"),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total": len(results),
            "passed": passed,
            "failed": failed,
            "status": "pass" if failed == 0 else "fail",
        },
        "lane_summary": build_lane_summary(results),
        "results": [result.to_dict() for result in results],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run chemistry-experiment-lab regression suite.")
    parser.add_argument(
        "--suite",
        default=str(DEFAULT_SUITE_PATH),
        help="Path to eval-suite YAML file.",
    )
    parser.add_argument(
        "--output",
        help="Optional path to write machine-readable summary JSON.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    suite_path = Path(args.suite).resolve()
    result = evaluate_suite(SKILL_DIR, suite_path)
    rendered = json.dumps(result, indent=2, ensure_ascii=False)
    if args.output:
        output_path = Path(args.output).resolve()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(rendered + "\n", encoding="utf-8")
    print(rendered)
    return 0 if result["summary"]["failed"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
