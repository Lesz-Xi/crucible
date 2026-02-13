#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/lesz/Documents/Synthetic-Mind"
JSON_FILE="${ROOT}/.agent/state/session-handoff.json"
MD_FILE="${ROOT}/.agent/state/session-handoff.md"
SUMMARY_FILE="${ROOT}/.agent/state/session-handoff.summary.md"

if [[ ! -f "${JSON_FILE}" ]]; then
  echo "FAIL: missing ${JSON_FILE}"
  exit 1
fi
if [[ ! -f "${MD_FILE}" ]]; then
  echo "FAIL: missing ${MD_FILE}"
  exit 1
fi
if [[ ! -f "${SUMMARY_FILE}" ]]; then
  echo "FAIL: missing ${SUMMARY_FILE}"
  exit 1
fi

python3 - <<'PY'
import json
import pathlib
import re
import subprocess
import sys

root = pathlib.Path('/Users/lesz/Documents/Synthetic-Mind')
json_path = root / '.agent/state/session-handoff.json'
md_path = root / '.agent/state/session-handoff.md'
summary_path = root / '.agent/state/session-handoff.summary.md'

errors = []

def fail(msg):
    errors.append(msg)

obj = json.loads(json_path.read_text(encoding='utf-8'))

for key in ('schema_version', 'run_id', 'next_tasks'):
    if key not in obj:
        fail(f'missing required key: {key}')

if obj.get('schema_version') != '1.1.0':
    fail(f"unexpected schema_version: {obj.get('schema_version')}")

run_id = obj.get('run_id', '')
summary_text = summary_path.read_text(encoding='utf-8')
if run_id and run_id not in summary_text:
    fail('summary does not reference JSON run_id')

# redaction check: no .env values, only env key names in required_env_keys
if re.search(r'(?i)api[_-]?key\s*[:=]\s*sk-', json_path.read_text(encoding='utf-8')):
    fail('possible secret token pattern found in JSON')

for item in obj.get('critical_gaps', {}).get('classified_user_actions', []):
    for req in ('path', 'line', 'matched_text_excerpt', 'match_hash'):
        if req not in item:
            fail(f'classified_user_actions entry missing {req}')

for item in obj.get('reference_evidence', []):
    for req in ('path', 'line', 'matched_text_excerpt', 'match_hash'):
        if req not in item:
            fail(f'reference_evidence entry missing {req}')

# Determinism check: run bootstrap twice and compare semantic payload excluding run_id/generated_at
cmd = ['bash', str(root / '.agent/scripts/agent-bootstrap.sh')]
subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
obj1 = json.loads(json_path.read_text(encoding='utf-8'))
subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
obj2 = json.loads(json_path.read_text(encoding='utf-8'))

for o in (obj1, obj2):
    o.pop('generated_at', None)
    o.pop('run_id', None)

if obj1 != obj2:
    fail('determinism check failed: semantic JSON changed between consecutive runs')

if errors:
    print('FAIL')
    for e in errors:
        print(f'- {e}')
    sys.exit(1)

print('PASS: session handoff validation succeeded')
PY
