#!/usr/bin/env bash

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
STATE_DIR="${WORKSPACE_ROOT}/.agent/state"
TMP_DIR="$(mktemp -d)"
ERRORS_FILE="${TMP_DIR}/errors.txt"

mkdir -p "${STATE_DIR}"

log_error() {
  printf '%s\n' "$1" >> "${ERRORS_FILE}"
}

run_capture() {
  # run_capture <label> <output-file> <command...>
  local label="$1"
  local outfile="$2"
  shift 2
  if "$@" > "${outfile}" 2>"${outfile}.err"; then
    :
  else
    log_error "${label}: $(tr '\n' ' ' < "${outfile}.err" | sed 's/[[:space:]]\+/ /g' | cut -c1-400)"
    : > "${outfile}"
  fi
}

NOW_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "${NOW_UTC}" > "${TMP_DIR}/generated_at.txt"
echo "${WORKSPACE_ROOT}" > "${TMP_DIR}/workspace_root.txt"

# Determine usable git context
GIT_ROOT="${WORKSPACE_ROOT}"
if ! git -C "${GIT_ROOT}" rev-parse --verify HEAD >/dev/null 2>&1; then
  if git -C "${WORKSPACE_ROOT}/synthesis-engine" rev-parse --verify HEAD >/dev/null 2>&1; then
    GIT_ROOT="${WORKSPACE_ROOT}/synthesis-engine"
  fi
fi
echo "${GIT_ROOT}" > "${TMP_DIR}/git_root.txt"

run_capture "git_branch" "${TMP_DIR}/git_branch.txt" git -C "${GIT_ROOT}" rev-parse --abbrev-ref HEAD
run_capture "git_status" "${TMP_DIR}/git_status.txt" git -C "${GIT_ROOT}" status --short
run_capture "recent_commits" "${TMP_DIR}/recent_commits.txt" git -C "${GIT_ROOT}" log -n 10 --date=iso-strict --pretty=format:%H'|'%ad'|'%s

# Dirty summary counts
STATUS_FILE="${TMP_DIR}/git_status.txt"
STAGED_COUNT="$(awk 'substr($0,1,1)!=" " && substr($0,1,1)!="?" {c++} END {print c+0}' "${STATUS_FILE}")"
MODIFIED_COUNT="$(awk 'substr($0,1,1)!="?" && substr($0,2,1)!=" " {c++} END {print c+0}' "${STATUS_FILE}")"
UNTRACKED_COUNT="$(awk 'substr($0,1,1)=="?" {c++} END {print c+0}' "${STATUS_FILE}")"
printf '%s\n' "${STAGED_COUNT}" > "${TMP_DIR}/staged_count.txt"
printf '%s\n' "${MODIFIED_COUNT}" > "${TMP_DIR}/modified_count.txt"
printf '%s\n' "${UNTRACKED_COUNT}" > "${TMP_DIR}/untracked_count.txt"

# Latest changed key areas (last commit touching each area)
AREAS_FILE="${TMP_DIR}/areas_latest.txt"
: > "${AREAS_FILE}"
areas=(
  ".agent/workflows/"
  "MASA-Theoretical-Foundation/"
  "Codex-Audit/"
  "synthesis-engine/src/app/api/"
  "synthesis-engine/.github/workflows/"
)
for area in "${areas[@]}"; do
  if [ "${GIT_ROOT}" = "${WORKSPACE_ROOT}" ] || [[ "${area}" == synthesis-engine/* ]]; then
    local_area="${area}"
  else
    printf '%s|none|none|outside current git context\n' "${area}" >> "${AREAS_FILE}"
    continue
  fi

  if out="$(git -C "${GIT_ROOT}" log -n 1 --date=iso-strict --pretty=format:%H'|'%ad'|'%s -- "${local_area}" 2>/dev/null)"; then
    if [ -n "${out}" ]; then
      printf '%s|%s\n' "${area}" "${out}" >> "${AREAS_FILE}"
    else
      printf '%s|none|none|no commits found\n' "${area}" >> "${AREAS_FILE}"
    fi
  else
    log_error "git_log_area_${area}"
    printf '%s|error|error|failed to inspect area\n' "${area}" >> "${AREAS_FILE}"
  fi
done

# Known governance workflow presence
WORKFLOW_PRESENCE_FILE="${TMP_DIR}/workflow_presence.txt"
: > "${WORKFLOW_PRESENCE_FILE}"
check_workflow() {
  local name="$1"
  local path="$2"
  if [ -f "${WORKSPACE_ROOT}/${path}" ]; then
    printf '%s|true|%s\n' "${name}" "${path}" >> "${WORKFLOW_PRESENCE_FILE}"
  else
    printf '%s|false|%s\n' "${name}" "${path}" >> "${WORKFLOW_PRESENCE_FILE}"
  fi
}
check_workflow "claim_drift_sentinel" "synthesis-engine/.github/workflows/claim-drift-sentinel.yml"
check_workflow "m6_health_check" "synthesis-engine/.github/workflows/m6-health-check.yml"
check_workflow "m6_closeout_tracker" "synthesis-engine/.github/workflows/m6-closeout-tracker.yml"
check_workflow "hybrid_novelty_proof_sentinel" "synthesis-engine/.github/workflows/hybrid-novelty-proof-sentinel.yml"

# Feature surfaces
FEATURE_SURFACES_FILE="${TMP_DIR}/feature_surfaces.txt"
if command -v rg >/dev/null 2>&1; then
  rg --files "${WORKSPACE_ROOT}/synthesis-engine/src/app/api" 2>/dev/null \
    | sed "s#${WORKSPACE_ROOT}/##" \
    | head -n 120 > "${FEATURE_SURFACES_FILE}" || : > "${FEATURE_SURFACES_FILE}"
else
  find "${WORKSPACE_ROOT}/synthesis-engine/src/app/api" -type f 2>/dev/null \
    | sed "s#${WORKSPACE_ROOT}/##" \
    | head -n 120 > "${FEATURE_SURFACES_FILE}" || : > "${FEATURE_SURFACES_FILE}"
fi

# Pending migrations (manual status unknown; list existing migration files)
PENDING_MIGRATIONS_FILE="${TMP_DIR}/pending_migrations.txt"
if [ -d "${WORKSPACE_ROOT}/synthesis-engine/supabase/migrations" ]; then
  find "${WORKSPACE_ROOT}/synthesis-engine/supabase/migrations" -type f -name '*.sql' \
    | sed "s#${WORKSPACE_ROOT}/##" \
    | sort \
    | tail -n 80 > "${PENDING_MIGRATIONS_FILE}" || : > "${PENDING_MIGRATIONS_FILE}"
else
  : > "${PENDING_MIGRATIONS_FILE}"
fi

# Env dependencies by key only (never values)
ENV_KEYS_FILE="${TMP_DIR}/required_env_keys.txt"
if command -v rg >/dev/null 2>&1; then
  rg -o -N -h "process\\.env\\.([A-Z0-9_]+)" "${WORKSPACE_ROOT}/synthesis-engine" \
    -g '!node_modules' -g '!.next' -g '!dist' -g '!coverage' \
    | sed -E 's/.*process\\.env\\.([A-Z0-9_]+).*/\1/' \
    | sort -u \
    | head -n 200 > "${ENV_KEYS_FILE}" || : > "${ENV_KEYS_FILE}"
else
  : > "${ENV_KEYS_FILE}"
fi

# USER ACTION REQUIRED markers in docs
USER_ACTION_FILE="${TMP_DIR}/user_action_required.txt"
if command -v rg >/dev/null 2>&1; then
  rg -n "USER ACTION REQUIRED" \
    "${WORKSPACE_ROOT}/MASA-Theoretical-Foundation" \
    "${WORKSPACE_ROOT}/Codex-Audit" \
    "${WORKSPACE_ROOT}/synthesis-engine/docs" \
    "${WORKSPACE_ROOT}/.agent/workflows" \
    -g '*.md' -g '!node_modules' -g '!.next' \
    | sed "s#${WORKSPACE_ROOT}/##" \
    | head -n 80 > "${USER_ACTION_FILE}" || : > "${USER_ACTION_FILE}"
else
  : > "${USER_ACTION_FILE}"
fi

# Newest docs (active objective hints)
LATEST_DOCS_FILE="${TMP_DIR}/latest_docs.txt"
: > "${LATEST_DOCS_FILE}"
append_latest_docs() {
  local dir="$1"
  local label="$2"
  if [ -d "${WORKSPACE_ROOT}/${dir}" ]; then
    find "${WORKSPACE_ROOT}/${dir}" -type f -name '*.md' -exec stat -f '%m|%N' {} \; 2>/dev/null \
      | sort -nr \
      | head -n 5 \
      | while IFS='|' read -r mtime path; do
          rel="${path#"${WORKSPACE_ROOT}/"}"
          printf '%s|%s|%s\n' "${label}" "${mtime}" "${rel}" >> "${LATEST_DOCS_FILE}"
        done
  else
    log_error "latest_docs_missing_dir_${dir}"
  fi
}
append_latest_docs "MASA-Theoretical-Foundation" "MASA-Theoretical-Foundation"
append_latest_docs "Codex-Audit" "Codex-Audit"

# Build JSON and Markdown outputs
JSON_OUT="${STATE_DIR}/session-handoff.json"
MD_OUT="${STATE_DIR}/session-handoff.md"

python3 - "$TMP_DIR" "$JSON_OUT" "$MD_OUT" <<'PY'
import json
import os
import sys
from datetime import datetime, timezone

tmp_dir, json_out, md_out = sys.argv[1:4]

def read_lines(name):
    path = os.path.join(tmp_dir, name)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return [line.rstrip("\n") for line in f if line.rstrip("\n")]

def read_one(name, default=""):
    lines = read_lines(name)
    return lines[0] if lines else default

generated_at = read_one("generated_at.txt", datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
workspace_root = read_one("workspace_root.txt", "")
branch = read_one("git_branch.txt", "unknown")
staged = int(read_one("staged_count.txt", "0") or 0)
modified = int(read_one("modified_count.txt", "0") or 0)
untracked = int(read_one("untracked_count.txt", "0") or 0)

recent_commits = []
for line in read_lines("recent_commits.txt"):
    parts = line.split("|", 2)
    if len(parts) == 3:
        recent_commits.append({"hash": parts[0], "date": parts[1], "message": parts[2]})

workflows_present = []
for line in read_lines("workflow_presence.txt"):
    parts = line.split("|", 2)
    if len(parts) == 3:
        workflows_present.append({
            "name": parts[0],
            "present": parts[1].lower() == "true",
            "path": parts[2],
        })

feature_surfaces = [{"path": x} for x in read_lines("feature_surfaces.txt")]

latest_area_commits = []
for line in read_lines("areas_latest.txt"):
    parts = line.split("|", 4)
    if len(parts) >= 5:
        latest_area_commits.append({
            "area": parts[0],
            "hash": parts[1],
            "date": parts[2],
            "message": parts[3],
        })

latest_docs = []
for line in read_lines("latest_docs.txt"):
    parts = line.split("|", 2)
    if len(parts) == 3:
        latest_docs.append({
            "group": parts[0],
            "mtime_epoch": int(parts[1]),
            "path": parts[2],
        })

pending_migrations = read_lines("pending_migrations.txt")
required_env_keys = read_lines("required_env_keys.txt")
user_action_required = read_lines("user_action_required.txt")
errors = read_lines("errors.txt")

next_tasks = []
if user_action_required:
    next_tasks.append({
        "id": "N1",
        "task": "Resolve explicit USER ACTION REQUIRED items first.",
        "reason": f"{len(user_action_required)} unresolved marker(s) detected in docs.",
        "priority": "high",
    })
if pending_migrations:
    next_tasks.append({
        "id": "N2",
        "task": "Confirm migration application status in Supabase for latest SQL files.",
        "reason": f"{len(pending_migrations)} migration file(s) found; runtime apply status is manual.",
        "priority": "high",
    })
if required_env_keys:
    next_tasks.append({
        "id": "N3",
        "task": "Verify required environment keys exist in deployment and local envs.",
        "reason": f"{len(required_env_keys)} unique process.env key(s) detected.",
        "priority": "medium",
    })
if not next_tasks:
    next_tasks.append({
        "id": "N1",
        "task": "No blockers detected; proceed with active implementation slice.",
        "reason": "Bootstrap scan found no critical gaps.",
        "priority": "low",
    })

doc = {
    "version": "1.0.0",
    "generated_at": generated_at,
    "workspace_root": workspace_root,
    "git": {
        "branch": branch,
        "dirty_summary": {
            "modified": modified,
            "untracked": untracked,
            "staged": staged,
        },
        "recent_commits": recent_commits,
    },
    "architecture_state": {
        "workflows_present": workflows_present,
        "feature_surfaces": feature_surfaces,
        "latest_area_commits": latest_area_commits,
        "latest_docs": latest_docs,
    },
    "critical_gaps": {
        "pending_migrations": pending_migrations,
        "required_env_keys": required_env_keys,
        "user_action_required": user_action_required,
    },
    "next_tasks": next_tasks[:3],
    "assumptions": [
        "Migration runtime apply status is not auto-detectable from repo scan alone.",
        "Environment key presence is inferred from code references, not secret value inspection.",
    ],
    "errors": errors,
}

with open(json_out, "w", encoding="utf-8") as f:
    json.dump(doc, f, indent=2)
    f.write("\n")

def yn(v): return "yes" if v else "no"

md_lines = []
md_lines.append("# MASA Session Handoff")
md_lines.append(f"Generated: {generated_at}")
md_lines.append("")
md_lines.append("## 1. Current Branch + Repo Health")
md_lines.append(f"- Branch: `{branch}`")
md_lines.append(f"- Dirty summary: modified={modified}, untracked={untracked}, staged={staged}")
md_lines.append("")
md_lines.append("Recent commits:")
if recent_commits:
    for c in recent_commits[:10]:
        md_lines.append(f"- `{c['hash'][:8]}` {c['message']} ({c['date']})")
else:
    md_lines.append("- none")
md_lines.append("")

md_lines.append("## 2. Latest Architectural Movement")
md_lines.append("Workflow presence:")
for w in workflows_present:
    md_lines.append(f"- {w['name']}: {yn(w['present'])} (`{w['path']}`)")
md_lines.append("")
md_lines.append("Newest docs:")
if latest_docs:
    for d in latest_docs[:10]:
        md_lines.append(f"- {d['group']}: `{d['path']}`")
else:
    md_lines.append("- none")
md_lines.append("")

md_lines.append("## 3. Critical Gaps (User Action Required)")
if user_action_required:
    for item in user_action_required[:30]:
        md_lines.append(f"- {item}")
else:
    md_lines.append("- none")
md_lines.append("")
md_lines.append(f"Pending migration files detected: {len(pending_migrations)}")
if pending_migrations:
    for m in pending_migrations[-10:]:
        md_lines.append(f"- `{m}`")
md_lines.append("")

md_lines.append("## 4. Active Priorities (Top 3)")
for t in next_tasks[:3]:
    md_lines.append(f"- {t['id']} [{t['priority']}]: {t['task']} — {t['reason']}")
md_lines.append("")

md_lines.append("## 5. Safe Next Commands")
md_lines.append("- `bash /Users/lesz/Documents/Synthetic-Mind/.agent/scripts/agent-bootstrap.sh`")
md_lines.append("- `git -C /Users/lesz/Documents/Synthetic-Mind status --short`")
md_lines.append("- `git -C /Users/lesz/Documents/Synthetic-Mind/synthesis-engine status --short`")
md_lines.append("")

md_lines.append("## 6. Notes/Assumptions")
for a in doc["assumptions"]:
    md_lines.append(f"- {a}")
if errors:
    md_lines.append("")
    md_lines.append("Bootstrap warnings:")
    for e in errors[:20]:
        md_lines.append(f"- {e}")

with open(md_out, "w", encoding="utf-8") as f:
    f.write("\n".join(md_lines).rstrip() + "\n")
PY

rm -rf "${TMP_DIR}"
echo "Wrote:"
echo "  ${JSON_OUT}"
echo "  ${MD_OUT}"
