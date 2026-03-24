#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
APP_DIR="${WORKSPACE_ROOT}/synthesis-engine"
STATE_MD="${WORKSPACE_ROOT}/.agent/state/session-handoff.md"
STATE_JSON="${WORKSPACE_ROOT}/.agent/state/session-handoff.json"

if [[ ! -d "${APP_DIR}" ]]; then
  echo "[Demis] ERROR: app directory not found at ${APP_DIR}"
  exit 1
fi

cd "${APP_DIR}"

echo "[Demis] Session bootstrap"
if [[ -f package.json ]] && command -v jq >/dev/null 2>&1 \
  && jq -e '.scripts["agent:bootstrap"]' package.json >/dev/null 2>&1; then
  npm run agent:bootstrap
else
  bash "${WORKSPACE_ROOT}/.agent/scripts/agent-bootstrap.sh"
fi

echo "[Demis] Handoff check"
if [[ -f "${STATE_MD}" ]]; then
  cat "${STATE_MD}"
else
  echo "WARN: ${STATE_MD} not found"
fi

if [[ -f "${STATE_JSON}" ]] && command -v jq >/dev/null 2>&1; then
  GAP_COUNT="$(jq -r '.critical_gaps.user_action_required | length // 0' "${STATE_JSON}" 2>/dev/null || echo "0")"
  if [[ "${GAP_COUNT}" != "0" ]]; then
    echo
    echo "[Demis] HUMAN FOLLOW-UP REQUIRED (${GAP_COUNT})"
    jq -r '.critical_gaps.user_action_required[]' "${STATE_JSON}" 2>/dev/null || true
  fi
fi

FAILURES=0
run_soft_gate() {
  local label="$1"
  shift
  echo "[Demis] Hard gate: ${label}"
  if "$@"; then
    echo "[Demis] PASS: ${label}"
  else
    echo "[Demis] FAIL: ${label}"
    FAILURES=$((FAILURES + 1))
  fi
}

if [[ "${DEMIS_SKIP_GATES:-0}" == "1" ]]; then
  echo "[Demis] Skipping hard gates (DEMIS_SKIP_GATES=1)"
else
  run_soft_gate "build" npm run build
  run_soft_gate "typecheck" npx tsc --noEmit
  run_soft_gate "tests" npx vitest run
fi

if [[ "${FAILURES}" -gt 0 ]]; then
  echo
  echo "[Demis] Completed with ${FAILURES} failing hard gate(s)."
  exit 0
fi

echo
echo "[Demis] Workflow completed with all startup gates passing."
