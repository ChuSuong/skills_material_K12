#!/usr/bin/env bash
set -euo pipefail

payload="$(cat)"
project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
skill_dir="$project_dir/skills/chemistry-experiment-lab"
feedback_dir="$skill_dir/evaluations/agent-feedback"
mkdir -p "$feedback_dir"

timestamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
out_file="$feedback_dir/$timestamp.json"
tmp_file="$(mktemp "$feedback_dir/.capture.XXXXXX.json")"

if HOOK_PAYLOAD="$payload" python3 - <<'PY' > "$tmp_file"
import json, os, re, sys
from datetime import datetime, UTC

payload = os.environ.get("HOOK_PAYLOAD", "{}")
try:
    data = json.loads(payload)
except Exception:
    data = {"raw": payload}

command = data.get("command") or data.get("cmd") or ""
stdout = data.get("stdout") or ""
stderr = data.get("stderr") or ""
combined = "\n".join(part for part in [stdout, stderr] if part)
exit_code = data.get("exit_code")

warning_hits = []
for pattern, label in [
    (r"pass-with-warnings", "runtime"),
    (r"warning", "runtime"),
    (r"spoiler", "spoiler-ui"),
    (r"legacy heuristic", "contract"),
    (r"human review", "pedagogy"),
    (r"layout|viewport|stage", "layout"),
    (r"failed|error|traceback", "runtime"),
]:
    if re.search(pattern, combined, re.IGNORECASE):
        warning_hits.append(label)

source_file = ""
output_family = None
for pattern in [r"outputs/([^\s]+)\.html", r"outputs/([^\s]+)\.jsx"]:
    match = re.search(pattern, command)
    if match:
        source_file = match.group(0)
        slug = match.group(1)
        if slug.startswith("lab-"):
            family_hint = slug.split("-")[1:3]
            output_family = "-".join(family_hint) if family_hint else slug
        else:
            output_family = slug
        break

if not source_file:
    bundle_match = re.search(r"runs/[^\s]+/attempts/[^\s]+", command)
    if bundle_match:
        source_file = bundle_match.group(0)
        output_family = "bundle-attempt"

signal_counts = {signal: warning_hits.count(signal) for signal in sorted(set(warning_hits))}
reason = []
if isinstance(exit_code, int) and exit_code != 0:
    reason.append("non-zero-exit")
reason.extend(sorted(set(warning_hits)))
selection_reason = ", ".join(reason) if reason else "selected-by-warning-signal"
should_record = bool(signal_counts) or (isinstance(exit_code, int) and exit_code != 0)

reproducible = should_record
local_scope = bool(source_file)
reusable_invariant = any(signal in {"spoiler-ui", "contract", "runtime", "pedagogy"} for signal in signal_counts)
classification = {
    "reproducible_on_current_output": reproducible,
    "scope": "file-local" if local_scope else "unknown",
    "candidate_for_generalization": reusable_invariant and len(signal_counts) > 0,
    "selection_reason": selection_reason,
}

suggested_next_action = "Fix current output and rerun verification before considering any shared rule."
if classification["candidate_for_generalization"] and not local_scope:
    suggested_next_action = "Collect another confirming run before proposing a shared guardrail."
if classification["candidate_for_generalization"] and local_scope:
    suggested_next_action = "Fix the current output first, then compare with another widget in the same family before promoting to a rule."

family_evidence = [output_family] if output_family else []

summary = {
    "captured_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "event": "PostToolUse",
    "tool_name": data.get("tool_name") or data.get("tool") or "Bash",
    "command": command,
    "exit_code": exit_code,
    "selected_feedback": should_record,
    "signals": sorted(set(warning_hits)),
    "signal_counts": signal_counts,
    "source_file": source_file,
    "output_family": output_family,
    "classification": classification,
    "family_evidence": family_evidence,
    "suggested_next_action": suggested_next_action,
    "stdout_excerpt": stdout[:1200],
    "stderr_excerpt": stderr[:1200],
    "selection_rule": "Record only failed runs or runs with reusable warnings/quality signals."
}

json.dump(summary, sys.stdout, ensure_ascii=False, indent=2)
raise SystemExit(0 if should_record else 1)
PY
then
  mv "$tmp_file" "$out_file"
  echo "[chem-lab hooks] captured selected skill feedback to $out_file" >&2
  summarize_hook="$project_dir/.claude/hooks/chem_lab_summarize_feedback.sh"
  if [[ -x "$summarize_hook" ]]; then
    CLAUDE_PROJECT_DIR="$project_dir" "$summarize_hook"
  else
    echo "[chem-lab hooks] summarize hook missing or not executable: $summarize_hook" >&2
  fi
else
  rm -f "$tmp_file"
  echo "[chem-lab hooks] skipped non-reusable skill feedback" >&2
fi

rm -f "$feedback_dir"/.capture.*.json

exit 0
