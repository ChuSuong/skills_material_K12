#!/usr/bin/env bash
set -euo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
skill_dir="$project_dir/skills/chemistry-experiment-lab"
feedback_dir="$skill_dir/evaluations/agent-feedback"
summary_file="$feedback_dir/summary.json"
lessons_file="$skill_dir/evaluations/feedback-lessons.md"

if [[ ! -d "$feedback_dir" ]]; then
  exit 0
fi

python3 - <<'PY2' "$feedback_dir" "$summary_file" "$lessons_file"
import json
import sys
from collections import Counter, defaultdict
from datetime import datetime, UTC
from pathlib import Path

feedback_dir = Path(sys.argv[1])
summary_file = Path(sys.argv[2])
lessons_file = Path(sys.argv[3])
feedback_files = sorted(
    [
        p
        for p in feedback_dir.glob('*.json')
        if p.name != 'summary.json' and p.stat().st_size > 0
    ],
    key=lambda p: p.stat().st_mtime,
)

records = []
for path in feedback_files:
    try:
        payload = json.loads(path.read_text(encoding='utf-8'))
    except Exception:
        continue
    if not payload.get('selected_feedback'):
        continue
    payload['_file'] = path.name
    records.append(payload)

if not records:
    if summary_file.exists():
        summary_file.unlink()
    if lessons_file.exists():
        lessons_file.unlink()
    raise SystemExit(0)

signal_counter = Counter()
family_counter = Counter()
by_signal = defaultdict(list)

for record in records:
    for signal in record.get('signals', []):
        signal_counter[signal] += 1
        by_signal[signal].append(record)
    family = record.get('output_family')
    if family:
        family_counter[family] += 1

local_fixes = []
candidate_patterns = []
do_not_promote = []

for record in records:
    signals = sorted(set(record.get('signals', [])))
    family = record.get('output_family')
    family_repeats = family_counter.get(family, 0) if family else 0
    repeated_signals = [s for s in signals if signal_counter[s] > 1]
    source_feedback_files = [record['_file']]

    if repeated_signals and (family_repeats > 1 or len(repeated_signals) > 1):
        source_feedback_files = sorted({r['_file'] for s in repeated_signals for r in by_signal[s]})
        candidate_patterns.append({
            'status': 'candidate-pattern',
            'scope': 'family defect' if family_repeats > 1 else 'global invariant',
            'reason': 'Repeated signal family suggests a reusable invariant to evaluate manually.',
            'signals': repeated_signals,
            'suggested_next_action': 'Compare at least one more widget in the same family before proposing a shared guardrail.',
            'source_feedback_files': source_feedback_files,
            'output_family': family,
            'source_file': record.get('source_file'),
        })
        continue

    if record.get('classification', {}).get('scope') == 'file-local':
        local_fixes.append({
            'status': 'local-only',
            'scope': 'local defect',
            'reason': 'Evidence currently points to a single output/run, so fix the current artifact first.',
            'signals': signals,
            'suggested_next_action': record.get('suggested_next_action') or 'Fix the current output and rerun verification.',
            'source_feedback_files': source_feedback_files,
            'output_family': family,
            'source_file': record.get('source_file'),
        })
        continue

    do_not_promote.append({
        'status': 'not-actionable',
        'scope': 'needs more evidence',
        'reason': 'Weak or isolated evidence; do not promote into a general rule yet.',
        'signals': signals,
        'suggested_next_action': 'Collect more evidence before changing shared rules or templates.',
        'source_feedback_files': source_feedback_files,
        'output_family': family,
        'source_file': record.get('source_file'),
    })

summary = {
    'generated_at': datetime.now(UTC).strftime('%Y-%m-%dT%H:%M:%SZ'),
    'selection_policy': 'Mirror SKILL.md feedback filter: prioritize current-output fixes, only elevate repeated reusable patterns.',
    'record_count': len(records),
    'signal_counts': dict(sorted(signal_counter.items())),
    'local_fixes': local_fixes,
    'candidate_patterns': candidate_patterns,
    'do_not_promote': do_not_promote,
    'evidence': [
        {
            'file': record['_file'],
            'signals': record.get('signals', []),
            'output_family': record.get('output_family'),
            'source_file': record.get('source_file'),
        }
        for record in records
    ],
}

summary_file.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')

def fmt_list(values):
    return ', '.join(values) if values else 'none'

def build_section(title, items):
    lines = [f'## {title}', '']
    if not items:
        lines.append('- None.')
        lines.append('')
        return lines

    for idx, item in enumerate(items, start=1):
        signals = fmt_list(item.get('signals', []))
        evidence = fmt_list(item.get('source_feedback_files', []))
        output_family = item.get('output_family') or 'unknown'
        source_file = item.get('source_file') or 'unknown'
        decision = item.get('reason', '')
        next_action = item.get('suggested_next_action', '')
        lines.extend([
            f'### Lesson {idx}',
            f'- Scope: `{item.get("scope", "unknown")}`',
            f'- Signals: `{signals}`',
            f'- Evidence: `{evidence}`',
            f'- Output family: `{output_family}`',
            f'- Source: `{source_file}`',
            f'- Decision: {decision}',
            f'- Next action: {next_action}',
            '',
        ])
    return lines

lines = [
    '# Feedback Lessons',
    '',
    f'- Generated at: `{summary["generated_at"]}`',
    f'- Selected feedback records: `{summary["record_count"]}`',
    f'- Signal counts: `{fmt_list([f"{k}={v}" for k, v in summary["signal_counts"].items()])}`',
    '- Rule: fix the current output first; only promote repeated verified patterns into checklist/SKILL/template.',
    '',
]
lines.extend(build_section('Local Defects', local_fixes))
lines.extend(build_section('Candidate Patterns', candidate_patterns))
lines.extend(build_section('Needs More Evidence', do_not_promote))

lessons_file.write_text("\n".join(lines).rstrip() + "\n", encoding='utf-8')
PY2

echo "[chem-lab hooks] summarized selected feedback into $summary_file and $lessons_file" >&2
