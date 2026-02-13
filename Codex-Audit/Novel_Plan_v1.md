M6.1 Redesign Plan v2: Claim-to-Code Drift Sentinel (Critical-Blocking, Auditable Rollout)
Summary
Implement a governance subsystem that continuously validates architecture/scientific claims against repository reality, with deterministic evidence rules, explicit drift semantics, and CI enforcement that ramps safely over 3 weeks.
This redesign resolves all blockers in Novel_Plan_Audit_v1.md and preserves current M6 stability workflows.

Goals
Eliminate ambiguous claim validation by defining a strict evidence model.
Enforce critical claim integrity in CI without freezing development during bootstrapping.
Provide recoverable workflows for refactors, false positives, and schema evolution.
Keep interaction with existing M6 workflows deterministic and non-conflicting.
Scope
Inputs
Automated-Scientist-Audit-2026-02-05.md
Plan_v2.md
MASA_White_Paper.html
/Users/lesz/Documents/Synthetic-Mind/synthesis-engine codebase
Outputs
Claim ledger schema + versioning rules
Seeded critical claim ledger (v1 bootstrap set)
Drift scanner CLI + reports
CI sentinel workflow (ramped enforcement)
Override and refactor reconciliation process
Governance docs and ownership matrix
Architecture and Interfaces
1) Claim Ledger Data Contract
File
claim-ledger.schema.json
claim-ledger.json
Top-level schema
schema_version: string (required), starts at 1.0.0
generated_at: ISO timestamp
claims: array of ClaimRecord
ClaimRecord fields
claim_id: stable ID (CLM-###)
source_doc: absolute path to source claim doc
claim_text: canonical claim statement
declared_status: enum implemented | partial | planned | deprecated
severity: enum critical | high | medium | low
owner: GitHub handle or team slug (required for critical)
evidence: array of EvidenceSpec
tags: optional string array
EvidenceSpec fields
path: absolute workspace path
matcher_type: enum
ast_export | ast_function_call | ast_route_handler | ast_workflow_step | regex | marker_tag
matcher: string/pattern payload
required: boolean
contradiction: optional ContradictionSpec[]
ContradictionSpec fields
matcher_type: same enum subset (ast_* | regex | marker_tag)
matcher: pattern that indicates contradiction
reason: human-readable rule
2) Evidence Model Specification (Hybrid AST+Tag)
Default behavior
AST/symbol checks are primary.
@claim-evidence:<claim_id> marker tags are fallback only for patterns AST cannot reliably express.
Critical claims must have at least one AST-based required matcher.
Marker encoding
Inline comment format: @claim-evidence:CLM-001
Optional override comment format: @claim-override:CLM-001;<ticket>;<expires=YYYY-MM-DD>;<reason>
Matching semantics
required=true matcher failing contributes to drift.
Optional matcher failing is warning-only.
Matchers are evaluated deterministically and independently.
3) Drift State Semantics
For each claim:

ok: all required evidence matched; no contradiction matched.
partial: at least one required evidence matched, at least one missing; no contradiction matched.
missing: zero required evidence matched.
contradicted: any contradiction matcher matched OR explicit contradictory status pattern found.
Critical fail rule
CI fails when severity=critical and state is missing or contradicted, unless a valid approved override exists.

4) Severity Classification Policy
critical: core scientific integrity claims (identifiability enforcement, deterministic trace provenance, promotion governance)
high: security/data integrity/governance claims
medium: architectural consistency claims
low: documentation/labeling claims
Assignment authority:

Initial assignment by governance authors
Approval required from CODEOWNERS for critical severity changes
5) Scanner CLI Contract
File
scan-claim-drift.ts
Command
npm run governance:claim-drift -- --ledger <path> --format json,md --mode report|enforce --strict critical
Outputs
claim-drift-report.json
claim-drift-report.md
Exit codes
0: no blocking drift
2: blocking critical drift found
3: invalid ledger/schema
4: runtime scanner error
Performance budget
Must complete in <30s for 100 claims on CI runner baseline.
6) CI Workflow Design and Interaction Matrix
New workflow
claim-drift-sentinel.yml
Triggers: pull_request, push (main), workflow_dispatch, nightly schedule
Existing workflows
m6-health-check.yml
m6-closeout-tracker.yml
Interaction matrix
claim-drift-sentinel = fail, m6-health-check = pass
Action: governance failure; merge blocked (critical drift).
claim-drift-sentinel = pass, m6-health-check = fail
Action: runtime/path failure; merge blocked by M6 policy.
both fail
Action: blocked; treat independently, do not short-circuit.
both pass
Action: healthy.
Scheduling
Keep sentinel schedule offset from M6 health by at least 15 minutes to reduce concurrent noise.
No workflow depends on the other; both produce independent status checks.
7) Bootstrapping and Rollout (3-Week Ramp)
Week 1 (Report-only)
Seed ledger with minimum 12 critical claims (not 10).
Run scanner in report mode on PR/main/nightly.
Collect false positives and missing matchers.
Week 2 (PR critical-block)
Enable enforce mode for PR checks only.
Main/nightly still report-only.
Week 3+ (PR + main critical-block)
Enforce mode on PR and main.
Nightly remains enforce + artifact upload.
8) Ownership and Override Governance
Ownership matrix file
claim-ownership-matrix.md
Every critical claim mapped to owner team/individual.
Override policy
Only CODEOWNERS-approved overrides accepted.
Override required fields: claim ID, ticket, reason, expiry date.
Max TTL default: 14 days.
Expired overrides automatically ignored by scanner.
9) Refactor Reconciliation Workflow (CG-7)
Tooling
Add helper command:
npm run governance:claim-reconcile -- --old <path> --new <path>
This updates candidate ledger paths and opens a review diff (no silent auto-commit).
Process
Run reconcile command after file move/rename.
Review diff in PR.
Require CODEOWNERS approval for critical-claim path changes.
10) Schema Versioning and Migration
Version rule
schema_version semantic versioning.
Minor version: backward-compatible fields.
Major version: breaking schema changes.
Migration support
Add migrate-claim-ledger.ts
Support v1 -> v2 migration path with dry-run output.
Implementation Work Breakdown (Decision-Complete)
Author schema + policy docs.
Seed v1 ledger with 12+ critical claims from audit/spec.
Implement scanner core (AST + tag fallback + contradiction detection + overrides).
Add report writers (JSON/Markdown).
Add npm scripts in package.json:
governance:claim-drift
governance:claim-reconcile
governance:claim-migrate
Add CI sentinel workflow with ramp toggles via env flags.
Add ownership matrix and initial assignments.
Validate interaction with M6 workflows and branch protection checks.
Promote ramp stages week-by-week.
Important Changes to Public APIs / Interfaces / Types
New governance JSON schema interface (claim-ledger.schema.json).
New CLI contracts for scan/reconcile/migrate scripts.
New CI status check: Claim Drift Sentinel.
No runtime app endpoint/API contract changes.
Test Cases and Scenarios
Evidence model tests
AST match success, tag fallback success, mixed matcher handling.
Drift-state tests
ok, partial, missing, contradicted classification coverage.
Severity enforcement tests
Critical missing/contradicted fails CI; non-critical drift warns only.
Override tests
Valid approved non-expired override suppresses block.
Expired override does not suppress block.
Refactor tests
Renamed governed file fails before reconcile, passes after approved reconcile.
Performance test
100-claim ledger scanned under 30s in CI.
Schema migration tests
v1 ledger migrates to v2 deterministically.
Workflow interaction tests
Simulate pass/fail combinations with M6 workflows and verify independent statuses.
Acceptance Criteria
Scanner deterministically classifies all ledger claims with artifacts on each run.
CI blocks only critical missing/contradicted claims (after ramp stage activation).
Evidence model and contradiction semantics are documented with examples.
Ownership assigned for all critical claims in matrix.
At least 12 critical claims in v1 ledger.
Performance budget met (<30s / 100 claims).
Schema migration path exists and is tested.
M6 workflows remain independently green/failable without sentinel coupling.
Assumptions and Defaults
Enforcement mode target: Block on Critical.
Evidence approach: Hybrid AST+Tag.
Rollout: 3-week ramp (report-only -> PR block -> PR+main block).
Override governance: CODEOWNERS + expiry required.
No DB migrations required for this phase.
Timeline anchor for initial status labels: February 6, 2026.