#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

import jsonschema


SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
RUNS_DIR = SKILL_DIR / "runs"
OUTPUTS_DIR = SKILL_DIR / "outputs"
EVAL_RUNS_DIR = SKILL_DIR / "eval-runs"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return utc_now().isoformat().replace("+00:00", "Z")


def timestamp_slug() -> str:
    return utc_now().strftime("%Y-%m-%dT%H-%M-%SZ")


def atomic_write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        handle.write(content)
        temp_path = Path(handle.name)
    temp_path.replace(path)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    atomic_write_text(path, json.dumps(payload, indent=2, ensure_ascii=False) + "\n")


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_against_schema(payload: dict[str, Any], schema_name: str) -> None:
    schema_path = SKILL_DIR / "templates" / schema_name
    schema = read_json(schema_path)
    jsonschema.validate(instance=payload, schema=schema)


def relative_to_skill(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(SKILL_DIR.resolve()))
    except ValueError:
        return str(path.resolve())


@dataclass
class RunPaths:
    run_dir: Path
    manifest_path: Path
    attempts_dir: Path


class RunBundle:
    def __init__(self, run_dir: Path):
        self.paths = RunPaths(
            run_dir=run_dir,
            manifest_path=run_dir / "manifest.json",
            attempts_dir=run_dir / "attempts",
        )
        if not run_dir.exists():
            raise FileNotFoundError(f"Run directory does not exist: {run_dir}")

    @property
    def run_dir(self) -> Path:
        return self.paths.run_dir

    @property
    def manifest(self) -> dict[str, Any]:
        return read_json(self.paths.manifest_path)

    def save_manifest(self, manifest: dict[str, Any]) -> None:
        validate_against_schema(manifest, "manifest.schema.json")
        write_json(self.paths.manifest_path, manifest)

    @classmethod
    def init_run(
        cls,
        slug: str,
        request: dict[str, Any],
        design_brief: dict[str, Any],
        interaction_spec: dict[str, Any],
        *,
        run_id: str | None = None,
        exemplar_refs: list[str] | None = None,
    ) -> "RunBundle":
        RUNS_DIR.mkdir(parents=True, exist_ok=True)
        run_id = run_id or f"{timestamp_slug()}-{slug}"
        run_dir = RUNS_DIR / run_id
        run_dir.mkdir(parents=True, exist_ok=False)
        (run_dir / "attempts").mkdir()
        if request.get("slug") != slug:
            raise ValueError("Request slug must match init-run slug.")
        validate_against_schema(request, "request.schema.json")
        validate_against_schema(design_brief, "design-brief.schema.json")
        validate_against_schema(interaction_spec, "interaction-spec.schema.json")
        manifest = {
            "schema_version": "chem-lab.run-manifest.v2",
            "run_id": run_id,
            "slug": slug,
            "created_at": iso_now(),
            "status": "initialized",
            "current_attempt": None,
            "published_attempt": None,
            "published_output": None,
            "attempts": [],
            "legacy_mirrors": [],
            "exemplar_refs": exemplar_refs or [],
        }
        write_json(run_dir / "request.json", request)
        write_json(run_dir / "design_brief.json", design_brief)
        write_json(run_dir / "interaction_spec.json", interaction_spec)
        write_json(run_dir / "manifest.json", manifest)
        return cls(run_dir)

    def attempt_dir(self, attempt_id: str) -> Path:
        return self.paths.attempts_dir / attempt_id

    def create_attempt(self, *, kind: str = "attempt", base_attempt: str | None = None) -> Path:
        manifest = self.manifest
        attempts = manifest["attempts"]
        if kind == "attempt":
            if attempts:
                raise ValueError("attempt_0 already exists; use a repair attempt instead.")
            attempt_id = "attempt_0"
        elif kind == "repair":
            repair_index = sum(1 for item in attempts if item["kind"] == "repair") + 1
            attempt_id = f"repair_{repair_index}"
            if base_attempt is None:
                base_attempt = manifest["current_attempt"] or (attempts[-1]["attempt_id"] if attempts else None)
        else:
            raise ValueError(f"Unsupported attempt kind: {kind}")

        attempt_dir = self.attempt_dir(attempt_id)
        attempt_dir.mkdir(parents=True, exist_ok=False)
        (attempt_dir / "verification").mkdir()
        (attempt_dir / "artifacts").mkdir()

        if base_attempt:
            source_html = self.attempt_dir(base_attempt) / "widget.html"
            if source_html.exists():
                shutil.copy2(source_html, attempt_dir / "widget.html")

        attempts.append(
            {
                "attempt_id": attempt_id,
                "kind": kind,
                "status": "created",
                "created_at": iso_now(),
                "path": relative_to_skill(attempt_dir),
                "base_attempt": base_attempt,
                "validation_status": None,
                "verification_status": None,
                "published_at": None,
            }
        )
        manifest["current_attempt"] = attempt_id
        manifest["status"] = "generated" if kind == "attempt" else "needs-repair"
        self.save_manifest(manifest)
        return attempt_dir

    def publish_attempt(
        self,
        attempt_id: str,
        *,
        outputs_dir: Path | None = None,
        legacy_eval_root: Path | None = None,
    ) -> dict[str, Any]:
        outputs_dir = outputs_dir or OUTPUTS_DIR
        legacy_eval_root = legacy_eval_root or EVAL_RUNS_DIR
        manifest = self.manifest
        slug = manifest["slug"]
        attempt_dir = self.attempt_dir(attempt_id)
        html_path = attempt_dir / "widget.html"
        validation_path = attempt_dir / "validation.json"
        verification_path = attempt_dir / "verification" / "result.json"
        evaluation_record_path = attempt_dir / "evaluation_record.json"

        if not html_path.exists():
            raise FileNotFoundError(f"Missing widget artifact: {html_path}")
        validation = read_json(validation_path)
        verification = read_json(verification_path)
        validate_against_schema(validation, "validation.schema.json")
        validate_against_schema(verification, "verification-result.schema.json")

        if validation.get("status") != "pass":
            raise ValueError("Cannot publish attempt with failed validation.")
        if verification.get("final_status") not in {"pass", "pass-with-warnings"}:
            raise ValueError("Cannot publish attempt with failed verification.")

        outputs_dir.mkdir(parents=True, exist_ok=True)
        published_output = outputs_dir / f"{slug}.html"
        atomic_write_text(published_output, html_path.read_text(encoding="utf-8"))

        record = read_json(evaluation_record_path) if evaluation_record_path.exists() else self._synthesize_eval_record(
            html_path=published_output,
            validation=validation,
            verification=verification,
        )
        validate_against_schema(record, "evaluation-record.schema.json")

        mirror_entry = {
            "attempt_id": attempt_id,
            "path": "",
            "status": "ok"
        }
        try:
            created_at = record.get("created_at") or iso_now()
            mirror_name = created_at.replace(":", "-")
            legacy_path = legacy_eval_root / slug / f"{mirror_name}.json"
            write_json(legacy_path, record)
            mirror_entry["path"] = relative_to_skill(legacy_path)
            manifest["status"] = "published"
        except Exception as exc:
            mirror_entry["status"] = "error"
            mirror_entry["error"] = str(exc)
            mirror_entry["path"] = relative_to_skill(legacy_eval_root / slug)
            manifest["status"] = "published-with-mirror-error"

        manifest["published_attempt"] = attempt_id
        manifest["current_attempt"] = attempt_id
        manifest["published_output"] = relative_to_skill(published_output)
        manifest["legacy_mirrors"].append(mirror_entry)

        for item in manifest["attempts"]:
            if item["attempt_id"] == attempt_id:
                item["status"] = "published"
                item["validation_status"] = validation.get("status")
                item["verification_status"] = verification.get("final_status")
                item["published_at"] = iso_now()
                break
        self.save_manifest(manifest)
        return manifest

    def _synthesize_eval_record(
        self,
        *,
        html_path: Path,
        validation: dict[str, Any],
        verification: dict[str, Any],
    ) -> dict[str, Any]:
        manifest = self.manifest
        design_brief = read_json(self.run_dir / "design_brief.json")
        interaction_spec = read_json(self.run_dir / "interaction_spec.json")
        dependency_rows = []
        for entry in interaction_spec.get("dependencies", []):
            if isinstance(entry, str):
                dependency_rows.append({"name": entry, "version": "unspecified", "role": "dependency"})
            else:
                dependency_rows.append(
                    {
                        "name": entry.get("name", "unknown"),
                        "version": entry.get("version", "unspecified"),
                        "role": entry.get("role", "dependency")
                    }
                )
        verify_status = verification.get("final_status")
        total_score = 100 if verify_status == "pass" else 85
        return {
            "slug": manifest["slug"],
            "output_file": relative_to_skill(html_path),
            "experiment": {
                "title": design_brief.get("goal", manifest["slug"]),
                "grade": design_brief.get("grade", "unknown"),
                "learning_goal": design_brief.get("goal", manifest["slug"]),
                "learning_loop": design_brief.get("learning_loop", {})
            },
            "interaction_pattern": interaction_spec.get("layout_family", "stage-first"),
            "libraries": dependency_rows,
            "model_fidelity": design_brief.get("model_fidelity", "qualitative"),
            "validation_results": validation.get("checks", {"status": validation.get("status")}),
            "scores": {"total": total_score},
            "blockers": verification.get("blockers", []),
            "warnings": verification.get("warnings", []),
            "design_family": design_brief.get("design_family"),
            "verification": verification.get("verification", {}),
            "artifacts": verification.get("artifacts", {}),
            "promoted_as_baseline": False,
            "final_status": verify_status,
            "created_at": verification.get("created_at", iso_now()),
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Manage chemistry-experiment-lab run bundles.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    init_parser = subparsers.add_parser("init-run")
    init_parser.add_argument("--slug", required=True)
    init_parser.add_argument("--request", required=True)
    init_parser.add_argument("--design-brief", required=True)
    init_parser.add_argument("--interaction-spec", required=True)
    init_parser.add_argument("--run-id")

    attempt_parser = subparsers.add_parser("create-attempt")
    attempt_parser.add_argument("run_dir")
    attempt_parser.add_argument("--kind", choices=["attempt", "repair"], default="attempt")
    attempt_parser.add_argument("--base-attempt")

    publish_parser = subparsers.add_parser("publish")
    publish_parser.add_argument("run_dir")
    publish_parser.add_argument("attempt_id")

    show_parser = subparsers.add_parser("show")
    show_parser.add_argument("run_dir")

    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.command == "init-run":
        bundle = RunBundle.init_run(
            slug=args.slug,
            request=read_json(Path(args.request)),
            design_brief=read_json(Path(args.design_brief)),
            interaction_spec=read_json(Path(args.interaction_spec)),
            run_id=args.run_id,
        )
        print(bundle.run_dir)
        return 0
    if args.command == "create-attempt":
        bundle = RunBundle(Path(args.run_dir))
        print(bundle.create_attempt(kind=args.kind, base_attempt=args.base_attempt))
        return 0
    if args.command == "publish":
        bundle = RunBundle(Path(args.run_dir))
        print(json.dumps(bundle.publish_attempt(args.attempt_id), indent=2, ensure_ascii=False))
        return 0
    if args.command == "show":
        bundle = RunBundle(Path(args.run_dir))
        print(json.dumps(bundle.manifest, indent=2, ensure_ascii=False))
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
