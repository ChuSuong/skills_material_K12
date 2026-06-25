#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: $0 <html-file-or-attempt-dir> [output-json-file]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_INPUT="$1"
OUTPUT_JSON="${2:-}"
TIMESTAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"

if [[ -d "$TARGET_INPUT" && -f "$TARGET_INPUT/widget.html" ]]; then
  ATTEMPT_DIR="$(cd "$TARGET_INPUT" && pwd)"
  HTML_ABS="$ATTEMPT_DIR/widget.html"
  ARTIFACT_DIR="$ATTEMPT_DIR/artifacts/verification/$TIMESTAMP"
  RESULT_PATH="${OUTPUT_JSON:-$ATTEMPT_DIR/verification/result.json}"
else
  if [[ ! -f "$TARGET_INPUT" ]]; then
    echo "Target not found: $TARGET_INPUT" >&2
    exit 1
  fi
  HTML_ABS="$(cd "$(dirname "$TARGET_INPUT")" && pwd)/$(basename "$TARGET_INPUT")"
  SLUG="$(basename "${HTML_ABS%.html}")"
  ARTIFACT_DIR="$SKILL_DIR/evaluations/artifacts/$SLUG/$TIMESTAMP"
  RESULT_PATH="${OUTPUT_JSON:-$ARTIFACT_DIR/result.json}"
fi

RUNNER_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/chemistry-experiment-lab-playwright-runner"

mkdir -p "$ARTIFACT_DIR" "$(dirname "$RESULT_PATH")" "$RUNNER_DIR"

if [[ ! -f "$RUNNER_DIR/package.json" ]]; then
  cat > "$RUNNER_DIR/package.json" <<'PKG'
{"name":"chemistry-experiment-lab-playwright-runner","private":true,"type":"module"}
PKG
fi

if [[ ! -d "$RUNNER_DIR/node_modules/playwright" ]]; then
  echo "Installing Playwright runner dependencies into $RUNNER_DIR ..." >&2
  (
    cd "$RUNNER_DIR"
    npm install playwright >/dev/null
    npx playwright install chromium >/dev/null
  )
fi

cp "$SCRIPT_DIR/verify-widget.mjs" "$RUNNER_DIR/verify-widget.mjs"

(
  cd "$RUNNER_DIR"
  node "./verify-widget.mjs" "$HTML_ABS" "$ARTIFACT_DIR" "$RESULT_PATH"
)

cat "$RESULT_PATH"
