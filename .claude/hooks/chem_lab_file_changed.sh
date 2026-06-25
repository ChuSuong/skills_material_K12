#!/usr/bin/env bash
set -euo pipefail

payload="$(cat)"

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
skill_dir="$project_dir/skills/chemistry-experiment-lab"

if [[ ! -d "$skill_dir" ]]; then
  exit 0
fi

changed_paths="$(HOOK_PAYLOAD="$payload" python3 - <<'PY'
import json, os
try:
    data = json.loads(os.environ.get("HOOK_PAYLOAD", "{}"))
except Exception:
    print("")
    raise SystemExit(0)

paths = []
for key in ("changedFiles", "files", "paths"):
    v = data.get(key)
    if isinstance(v, list):
        paths = [str(x) for x in v if x is not None]
        break

if not paths:
    v = data.get("file")
    if isinstance(v, str):
        paths = [v]

print("\n".join(paths))
PY
)"

if [[ -z "$changed_paths" ]]; then
  exit 0
fi

if ! echo "$changed_paths" | grep -E -q '^skills/chemistry-experiment-lab/'; then
  exit 0
fi

run_check_widget=0
run_eval_suite=0
run_bundle=0

if echo "$changed_paths" | grep -E -q '^skills/chemistry-experiment-lab/scripts/check_widget\.py$'; then
  run_check_widget=1
fi
if echo "$changed_paths" | grep -E -q '^skills/chemistry-experiment-lab/scripts/eval_suite\.py$|^skills/chemistry-experiment-lab/evals/eval-suite\.yaml$'; then
  run_eval_suite=1
fi
if echo "$changed_paths" | grep -E -q '^skills/chemistry-experiment-lab/scripts/run_bundle\.py$'; then
  run_bundle=1
fi

echo "[chem-lab hooks] chemistry-experiment-lab changed; running quick checks..." >&2

if [[ $run_check_widget -eq 1 ]]; then
  python3 -m pytest "$skill_dir/tests/test_check_widget.py"
fi
if [[ $run_eval_suite -eq 1 ]]; then
  python3 -m pytest "$skill_dir/tests/test_eval_suite.py"
fi
if [[ $run_bundle -eq 1 ]]; then
  python3 -m pytest "$skill_dir/tests/test_run_bundle.py"
fi

stamp_dir="$project_dir/.claude/.chem-lab"
mkdir -p "$stamp_dir"
date -u +%s > "$stamp_dir/last_tests_epoch"
