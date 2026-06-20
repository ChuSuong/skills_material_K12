#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: $0 <html-file> [output-json-file]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
HTML_INPUT="$1"
OUTPUT_JSON="${2:-}"

if [[ ! -f "$HTML_INPUT" ]]; then
  echo "HTML file not found: $HTML_INPUT" >&2
  exit 1
fi

HTML_ABS="$(cd "$(dirname "$HTML_INPUT")" && pwd)/$(basename "$HTML_INPUT")"
SLUG="$(basename "${HTML_ABS%.html}")"
TIMESTAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
ARTIFACT_DIR="$SKILL_DIR/evaluations/artifacts/$SLUG/$TIMESTAMP"
RUNNER_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/chemistry-experiment-lab-playwright-runner"

mkdir -p "$ARTIFACT_DIR" "$RUNNER_DIR"

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

RESULT_PATH="$ARTIFACT_DIR/result.json"
(
  cd "$RUNNER_DIR"
  node "./verify-widget.mjs" "$HTML_ABS" "$ARTIFACT_DIR" "$RESULT_PATH"
)

if [[ -n "$OUTPUT_JSON" ]]; then
  mkdir -p "$(dirname "$OUTPUT_JSON")"
  cp "$RESULT_PATH" "$OUTPUT_JSON"
fi

cat "$RESULT_PATH"
