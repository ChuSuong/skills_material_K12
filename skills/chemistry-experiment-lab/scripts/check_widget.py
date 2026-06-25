#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCRIPT_PATH = Path(__file__).resolve()
SCRIPT_DIR = SCRIPT_PATH.parent
SKILL_DIR = SCRIPT_DIR.parent

COLOR_WORD_PATTERN = re.compile(
    r"(?:đỏ|vàng|tím|xanh|lục|lam|cam|nâu|trắng|đen|crimson|gold|lilac|jade|brick)",
    re.IGNORECASE,
)
ION_COLOR_SPOILER_PATTERN = re.compile(
    r"(?:^|[\s(])(?:[A-Z][a-z]?(?:\d+)?\+?)\s*[:\-]\s*[^.\n]{0,40}?"
    r"(?:đỏ|vàng|tím|xanh|lục|lam|cam|nâu|trắng|đen|crimson|gold|lilac|jade|brick)",
    re.IGNORECASE,
)
EARLY_RESULT_PATTERN = re.compile(
    r"(màu quan sát\s*:|khớp dự đoán|cần sửa dự đoán|đáp án đúng|kết quả đúng)",
    re.IGNORECASE,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run combined static + runtime checks for a chemistry lab widget."
    )
    parser.add_argument("target", help="HTML file path or attempt directory containing widget.html")
    parser.add_argument(
        "output_json",
        nargs="?",
        help="Optional output JSON path. Defaults to bundle verification result or a timestamped artifact result.",
    )
    return parser.parse_args()


def resolve_target(target: Path, output_json: str | None) -> tuple[Path, Path]:
    if target.is_dir() and (target / "widget.html").exists():
        html_path = (target / "widget.html").resolve()
        result_path = Path(output_json).resolve() if output_json else (target / "verification" / "result.json")
        return html_path, result_path

    if not target.is_file():
        raise FileNotFoundError(f"Target not found: {target}")

    html_path = target.resolve()
    if output_json:
        return html_path, Path(output_json).resolve()

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    slug = html_path.stem
    result_path = SKILL_DIR / "evaluations" / "artifacts" / slug / timestamp / "result.json"
    return html_path, result_path


def strip_visible_html_text(html_text: str) -> str:
    text = re.sub(r"<style\b[^>]*>.*?</style>", " ", html_text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def audit_static_html(html_path: Path) -> dict[str, Any]:
    raw = html_path.read_text(encoding="utf-8", errors="ignore")
    pre_script = raw.split("<script", 1)[0]
    visible = strip_visible_html_text(pre_script)

    blockers: list[str] = []
    warnings: list[str] = []

    spoiler_mapping_found = bool(ION_COLOR_SPOILER_PATTERN.search(visible))
    early_result_found = bool(EARLY_RESULT_PATTERN.search(visible))
    document_query_found = bool(
        re.search(r"document\.querySelector(?:All)?\s*\(", raw)
    )
    unpinned_cdn_found = bool(
        re.search(r"https?://[^\s\"']+/(latest|next)(?:[/?#\"'])", raw, flags=re.IGNORECASE)
    )

    if spoiler_mapping_found:
        blockers.append("Static spoiler detected: visible HTML maps a label directly to an answer-like color/result before interaction.")
    if early_result_found:
        blockers.append("Static spoiler detected: visible HTML exposes answer/result wording before the learner completes the main observation step.")
    if document_query_found:
        warnings.append("Found document.querySelector usage; confirm selectors are scoped to the widget root where possible.")
    if unpinned_cdn_found:
        warnings.append("Found CDN URL using latest/next instead of a pinned version.")

    return {
        "visible_text_length_before_script": len(visible),
        "spoiler_mapping_found": spoiler_mapping_found,
        "early_result_found": early_result_found,
        "document_query_found": document_query_found,
        "unpinned_cdn_found": unpinned_cdn_found,
        "blockers": blockers,
        "warnings": warnings,
    }


def merge_static_checks(runtime_result: dict[str, Any], static: dict[str, Any]) -> dict[str, Any]:
    mode = runtime_result.get("mode", "legacy")
    blockers = list(runtime_result.get("blockers", []))
    warnings = list(runtime_result.get("warnings", []))
    static_blockers = list(static["blockers"])
    static_warnings = list(static["warnings"])

    if mode == "contract-aware" and static_blockers:
        static_warnings.extend(
            f"Legacy heuristic only: {item}" for item in static_blockers
        )
        static_blockers = []

    blockers.extend(static_blockers)
    warnings.extend(static_warnings)

    seen = set()
    blockers = [item for item in blockers if not (item in seen or seen.add(item))]
    seen.clear()
    warnings = [item for item in warnings if not (item in seen or seen.add(item))]

    runtime_result["blockers"] = blockers
    runtime_result["warnings"] = warnings

    invariants = runtime_result.setdefault("verification", {}).setdefault("invariants", {})
    invariants["static_audit_pass"] = not static["blockers"]
    invariants["spoiler_ui_pass"] = not (static["spoiler_mapping_found"] or static["early_result_found"])
    invariants["scoped_query_pass"] = not static["document_query_found"]

    checks = runtime_result.setdefault("checks", {})
    checks["static"] = {
        key: value for key, value in static.items() if key not in {"blockers", "warnings"}
    }

    if blockers:
        runtime_result["final_status"] = "fail"
    elif warnings:
        runtime_result["final_status"] = "pass-with-warnings"
    else:
        runtime_result["final_status"] = "pass"
    return runtime_result


def run_runtime_verify(target: Path, result_path: Path) -> dict[str, Any]:
    result_path.parent.mkdir(parents=True, exist_ok=True)
    command = [
        str(SCRIPT_DIR / "verify-widget.sh"),
        str(target),
        str(result_path),
    ]
    subprocess.run(command, check=True, capture_output=True, text=True)
    return json.loads(result_path.read_text(encoding="utf-8"))


def main() -> int:
    args = parse_args()
    target = Path(args.target)
    html_path, result_path = resolve_target(target, args.output_json)
    runtime_result = run_runtime_verify(target, result_path)
    static = audit_static_html(html_path)
    final_result = merge_static_checks(runtime_result, static)
    result_path.write_text(json.dumps(final_result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(final_result, indent=2, ensure_ascii=False))
    return 0 if final_result["final_status"] != "fail" else 1


if __name__ == "__main__":
    raise SystemExit(main())
