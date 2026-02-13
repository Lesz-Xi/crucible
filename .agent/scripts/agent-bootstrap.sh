#!/usr/bin/env bash

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
STATE_DIR="${WORKSPACE_ROOT}/.agent/state"
TMP_DIR="$(mktemp -d)"
ERRORS_FILE="${TMP_DIR}/errors.txt"
PROVENANCE_FILE="${TMP_DIR}/provenance_commands.txt"

mkdir -p "${STATE_DIR}"

log_error() {
  printf '%s\n' "$1" >> "${ERRORS_FILE}"
}

record_provenance() {
  # record_provenance <label> <status> <command...>
  local label="$1"
  local status="$2"
  shift 2
  printf '%s|%s|%s\n' "${label}" "${status}" "$*" >> "${PROVENANCE_FILE}"
}

run_capture() {
  # run_capture <label> <output-file> <command...>
  local label="$1"
  local outfile="$2"
  shift 2
  if "$@" > "${outfile}" 2>"${outfile}.err"; then
    record_provenance "${label}" "ok" "$@"
  else
    log_error "${label}: $(tr '\n' ' ' < "${outfile}.err" | sed 's/[[:space:]]\+/ /g' | cut -c1-400)"
    record_provenance "${label}" "error" "$@"
    : > "${outfile}"
  fi
}

NOW_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
printf '%s\n' "${NOW_UTC}" > "${TMP_DIR}/generated_at.txt"
printf '%s\n' "${WORKSPACE_ROOT}" > "${TMP_DIR}/workspace_root.txt"
printf '%s\n' "$(pwd)" > "${TMP_DIR}/cwd_detected.txt"

# Determine usable git context
GIT_ROOT="${WORKSPACE_ROOT}"
if ! git -C "${GIT_ROOT}" rev-parse --verify HEAD >/dev/null 2>&1; then
  if git -C "${WORKSPACE_ROOT}/synthesis-engine" rev-parse --verify HEAD >/dev/null 2>&1; then
    GIT_ROOT="${WORKSPACE_ROOT}/synthesis-engine"
  fi
fi
printf '%s\n' "${GIT_ROOT}" > "${TMP_DIR}/git_root.txt"

run_capture "git_branch" "${TMP_DIR}/git_branch.txt" git -C "${GIT_ROOT}" rev-parse --abbrev-ref HEAD
run_capture "git_head_short" "${TMP_DIR}/git_head_short.txt" git -C "${GIT_ROOT}" rev-parse --short HEAD
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
record_provenance "latest_area_commits" "ok" "git log latest area scans"

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
record_provenance "workflow_presence" "ok" "filesystem workflow checks"

# Feature surfaces
FEATURE_SURFACES_FILE="${TMP_DIR}/feature_surfaces.txt"
if command -v rg >/dev/null 2>&1; then
  if rg --files "${WORKSPACE_ROOT}/synthesis-engine/src/app/api" 2>/dev/null \
    | sed "s#${WORKSPACE_ROOT}/##" \
    | sort \
    | head -n 120 > "${FEATURE_SURFACES_FILE}"; then
    record_provenance "feature_surfaces" "ok" "rg --files synthesis-engine/src/app/api"
  else
    : > "${FEATURE_SURFACES_FILE}"
    record_provenance "feature_surfaces" "error" "rg --files synthesis-engine/src/app/api"
    log_error "feature_surfaces: failed to enumerate API files"
  fi
else
  if find "${WORKSPACE_ROOT}/synthesis-engine/src/app/api" -type f 2>/dev/null \
    | sed "s#${WORKSPACE_ROOT}/##" \
    | sort \
    | head -n 120 > "${FEATURE_SURFACES_FILE}"; then
    record_provenance "feature_surfaces" "ok" "find synthesis-engine/src/app/api"
  else
    : > "${FEATURE_SURFACES_FILE}"
    record_provenance "feature_surfaces" "error" "find synthesis-engine/src/app/api"
    log_error "feature_surfaces: failed to enumerate API files"
  fi
fi

# Pending migrations (manual status unknown; list existing migration files)
PENDING_MIGRATIONS_FILE="${TMP_DIR}/pending_migrations.txt"
if [ -d "${WORKSPACE_ROOT}/synthesis-engine/supabase/migrations" ]; then
  if find "${WORKSPACE_ROOT}/synthesis-engine/supabase/migrations" -type f -name '*.sql' \
    | sed "s#${WORKSPACE_ROOT}/##" \
    | sort \
    | tail -n 80 > "${PENDING_MIGRATIONS_FILE}"; then
    record_provenance "pending_migrations" "ok" "find synthesis-engine/supabase/migrations/*.sql"
  else
    : > "${PENDING_MIGRATIONS_FILE}"
    record_provenance "pending_migrations" "error" "find synthesis-engine/supabase/migrations/*.sql"
    log_error "pending_migrations: failed to scan migration files"
  fi
else
  : > "${PENDING_MIGRATIONS_FILE}"
  record_provenance "pending_migrations" "ok" "migrations dir absent"
fi

# Env dependencies by key only (never values)
ENV_KEYS_FILE="${TMP_DIR}/required_env_keys.txt"
if command -v rg >/dev/null 2>&1; then
  if rg -o -N "process\\.env\\.[A-Z0-9_]+" "${WORKSPACE_ROOT}/synthesis-engine" \
    -g '!node_modules' -g '!.next' -g '!dist' -g '!coverage' \
    | sed -E 's/.*process\.env\.//' \
    | grep -E '^[A-Z0-9_]+$' \
    | sort -u \
    | head -n 200 > "${ENV_KEYS_FILE}"; then
    record_provenance "required_env_keys" "ok" "rg process.env.*"
  else
    : > "${ENV_KEYS_FILE}"
    record_provenance "required_env_keys" "error" "rg process.env.*"
    log_error "required_env_keys: failed to scan process.env keys"
  fi
else
  : > "${ENV_KEYS_FILE}"
  record_provenance "required_env_keys" "error" "rg missing"
  log_error "required_env_keys: rg is unavailable"
fi

# Critical marker scan with aliases
MARKERS_FILE="${TMP_DIR}/critical_markers.txt"
if command -v rg >/dev/null 2>&1; then
  if rg -n "USER ACTION REQUIRED|HUMAN FOLLOW-UP REQUIRED|MANUAL OPERATOR STEP" \
    "${WORKSPACE_ROOT}/MASA-Theoretical-Foundation" \
    "${WORKSPACE_ROOT}/Codex-Audit" \
    "${WORKSPACE_ROOT}/synthesis-engine/docs" \
    "${WORKSPACE_ROOT}/.agent/workflows" \
    -g '*.md' -g '!node_modules' -g '!.next' \
    | sed "s#${WORKSPACE_ROOT}/##" \
    | sort \
    | head -n 120 > "${MARKERS_FILE}"; then
    record_provenance "critical_markers" "ok" "rg marker scan"
  else
    : > "${MARKERS_FILE}"
    record_provenance "critical_markers" "error" "rg marker scan"
    log_error "critical_markers: failed to scan marker aliases"
  fi
else
  : > "${MARKERS_FILE}"
  record_provenance "critical_markers" "error" "rg missing"
  log_error "critical_markers: rg is unavailable"
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
record_provenance "latest_docs" "ok" "latest docs scan"

# Build JSON and Markdown outputs
JSON_OUT="${STATE_DIR}/session-handoff.json"
MD_OUT="${STATE_DIR}/session-handoff.md"
SUMMARY_OUT="${STATE_DIR}/session-handoff.summary.md"

python3 - "$TMP_DIR" "$JSON_OUT" "$MD_OUT" "$SUMMARY_OUT" <<'PY'
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone


tmp_dir, json_out, md_out, summary_out = sys.argv[1:5]


def read_lines(name):
    path = os.path.join(tmp_dir, name)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return [line.rstrip("\n") for line in f if line.rstrip("\n")]


def read_one(name, default=""):
    lines = read_lines(name)
    return lines[0] if lines else default


def confidence_for_count(count):
    if count == 0:
        return "high"
    if count <= 5:
        return "medium"
    return "low"


generated_at = read_one("generated_at.txt", datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
workspace_root = read_one("workspace_root.txt", "")
git_root = read_one("git_root.txt", workspace_root)
cwd_detected = read_one("cwd_detected.txt", "")
branch = read_one("git_branch.txt", "unknown")
short_sha = read_one("git_head_short.txt", "nogit")
staged = int(read_one("staged_count.txt", "0") or 0)
modified = int(read_one("modified_count.txt", "0") or 0)
untracked = int(read_one("untracked_count.txt", "0") or 0)

run_seed = f"{generated_at}|{short_sha}|{branch}|{workspace_root}"
run_hash = hashlib.sha256(run_seed.encode("utf-8")).hexdigest()[:8]
run_id = f"{generated_at.replace(':', '').replace('-', '')}-{short_sha}-{run_hash}"

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
    if len(parts) >= 4:
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
errors = read_lines("errors.txt")

provenance = []
for line in read_lines("provenance_commands.txt"):
    parts = line.split("|", 2)
    if len(parts) == 3:
        provenance.append({
            "label": parts[0],
            "status": parts[1],
            "command": parts[2],
        })

marker_lines = read_lines("critical_markers.txt")
classified_user_actions = []
reference_evidence = []
user_action_required = []

marker_re = re.compile(r"^(?P<path>.+?):(?P<line>\d+):(?P<text>.*)$")
for raw in marker_lines:
    m = marker_re.match(raw)
    if not m:
        continue
    path = m.group("path")
    line = int(m.group("line"))
    text = m.group("text").strip()
    upper = text.upper()

    if "USER ACTION REQUIRED" in upper:
        severity = "blocking"
        reason = "Explicit USER ACTION REQUIRED marker"
    elif "HUMAN FOLLOW-UP REQUIRED" in upper:
        severity = "blocking"
        reason = "Explicit HUMAN FOLLOW-UP REQUIRED marker"
    elif "MANUAL OPERATOR STEP" in upper:
        severity = "advisory"
        reason = "Manual operator step marker"
    else:
        severity = "advisory"
        reason = "General marker match"

    excerpt = text[:120]
    match_hash = hashlib.sha256(f"{path}|{excerpt}".encode("utf-8")).hexdigest()

    evidence_item = {
        "path": path,
        "line": line,
        "matched_text_excerpt": excerpt,
        "match_hash": match_hash,
    }
    reference_evidence.append(evidence_item)

    action = {
        "path": path,
        "line": line,
        "severity": severity,
        "reason": reason,
        "matched_text_excerpt": excerpt,
        "match_hash": match_hash,
    }
    classified_user_actions.append(action)

    if severity == "blocking":
        user_action_required.append(f"{path}:{line}")

# de-dup by hash while preserving order
def dedupe(items, key):
    seen = set()
    out = []
    for item in items:
        k = item[key]
        if k in seen:
            continue
        seen.add(k)
        out.append(item)
    return out

reference_evidence = dedupe(reference_evidence, "match_hash")
classified_user_actions = dedupe(classified_user_actions, "match_hash")
user_action_required = list(dict.fromkeys(user_action_required))

scan_confidence = {
    "user_action_required": confidence_for_count(len(classified_user_actions)),
    "pending_migrations": confidence_for_count(len(pending_migrations)),
    "required_env_keys": confidence_for_count(len(required_env_keys)),
}

next_tasks = []
if user_action_required:
    next_tasks.append({
        "id": "N1",
        "task": "Resolve explicit blocking markers before execution.",
        "reason": f"{len(user_action_required)} blocking marker(s) detected.",
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

cwd_package = os.path.join(cwd_detected, "package.json") if cwd_detected else ""
npm_script_available_here = False
if cwd_package and os.path.exists(cwd_package):
    try:
        with open(cwd_package, "r", encoding="utf-8") as f:
            pkg = json.load(f)
            npm_script_available_here = "agent:bootstrap" in (pkg.get("scripts") or {})
    except Exception:
        npm_script_available_here = False


doc = {
    "schema_version": "1.1.0",
    "version": "1.1.0",
    "run_id": run_id,
    "generated_at": generated_at,
    "workspace_root": workspace_root,
    "cwd_detected": cwd_detected,
    "npm_script_available_here": npm_script_available_here,
    "git": {
        "root": git_root,
        "branch": branch,
        "dirty_summary": {
            "modified": modified,
            "untracked": untracked,
            "staged": staged,
        },
        "recent_commits": recent_commits,
    },
    "scan_confidence": scan_confidence,
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
        "classified_user_actions": classified_user_actions,
    },
    "reference_evidence": reference_evidence,
    "provenance": {
        "commands": provenance,
    },
    "next_tasks": next_tasks[:3],
    "assumptions": [
        "Migration runtime apply status is not auto-detectable from repo scan alone.",
        "Environment key presence is inferred from code references, not secret value inspection.",
        "Marker references are stabilized with excerpt hash and line for operator convenience.",
    ],
    "errors": errors,
}

with open(json_out, "w", encoding="utf-8") as f:
    json.dump(doc, f, indent=2)
    f.write("\n")


def yn(v):
    return "yes" if v else "no"

# Compatibility digest
md_lines = []
md_lines.append("# MASA Session Handoff")
md_lines.append(f"Generated: {generated_at}")
md_lines.append(f"Run ID: `{run_id}`")
md_lines.append("")
md_lines.append("_Compatibility note: this file is the human digest; machine-authoritative contract is `session-handoff.json` (v1.1.0)._")
md_lines.append("")
md_lines.append("## 1. Current Branch + Repo Health")
md_lines.append(f"- Git root: `{git_root}`")
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
md_lines.append("- `bash /Users/lesz/Documents/Synthetic-Mind/scripts/agent-bootstrap.sh`")
md_lines.append(f"- `git -C {git_root} status --short`")
md_lines.append(f"- `git -C {git_root} log -n 10 --oneline`")
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

# Precision summary
summary = []
summary.append("# MASA Session Handoff Summary")
summary.append(f"Run ID: `{run_id}`")
summary.append(f"Generated: {generated_at}")
summary.append(f"Git root/branch: `{git_root}` / `{branch}`")
summary.append("")
summary.append("## 1. Snapshot")
summary.append(f"- cwd_detected: `{cwd_detected}`")
summary.append(f"- npm_script_available_here: `{str(npm_script_available_here).lower()}`")
summary.append(f"- dirty_summary: modified={modified}, untracked={untracked}, staged={staged}")
summary.append("")
summary.append("## 2. Precision State")
summary.append("| Signal | Confidence | Count |")
summary.append("|---|---|---:|")
summary.append(f"| user_action_required | {scan_confidence['user_action_required']} | {len(user_action_required)} |")
summary.append(f"| pending_migrations | {scan_confidence['pending_migrations']} | {len(pending_migrations)} |")
summary.append(f"| required_env_keys | {scan_confidence['required_env_keys']} | {len(required_env_keys)} |")
summary.append("")
summary.append("## 3. Critical Gaps (Evidence-Backed)")
if classified_user_actions:
    for item in classified_user_actions[:20]:
        summary.append(
            f"- [{item['severity']}] `{item['path']}:{item['line']}` — {item['reason']} "
            f"(hash: `{item['match_hash'][:12]}`)"
        )
        summary.append(f"  - excerpt: `{item['matched_text_excerpt']}`")
else:
    summary.append("- none")
summary.append("")
summary.append("## 4. Top Priorities")
for task in next_tasks[:3]:
    summary.append(f"- {task['id']} [{task['priority']}]: {task['task']} — {task['reason']}")
summary.append("")
summary.append("## 5. Safe Next Commands")
summary.append("- `bash /Users/lesz/Documents/Synthetic-Mind/scripts/agent-bootstrap.sh`")
summary.append("- `cd /Users/lesz/Documents/Synthetic-Mind/synthesis-engine && npm run agent:bootstrap`")
summary.append(f"- `git -C {git_root} status --short`")
summary.append("")
summary.append("## 6. Failures / Warnings")
if errors:
    for e in errors[:20]:
        summary.append(f"- {e}")
else:
    summary.append("- none")

with open(summary_out, "w", encoding="utf-8") as f:
    f.write("\n".join(summary).rstrip() + "\n")
PY

rm -rf "${TMP_DIR}"

echo "Context:"
echo "  cwd_detected: $(pwd)"
if [ -f "$(pwd)/package.json" ] && command -v rg >/dev/null 2>&1 && rg -q '"agent:bootstrap"' "$(pwd)/package.json"; then
  echo "  npm_script_available_here: true"
else
  echo "  npm_script_available_here: false"
fi

echo "Wrote:"
echo "  ${JSON_OUT}"
echo "  ${MD_OUT}"
echo "  ${SUMMARY_OUT}"
