Executive Summary
AUDIT VERDICT: ⚠️ CONDITIONALLY APPROVED with 7 Critical Gaps, 4 High-Risk Items, and 3 Recommended Enhancements.

The plan is architecturally sound but operationally underspecified. The core concept (claim ledger → drift scanner → CI gate) is valid, but the specification lacks sufficient detail for unambiguous implementation.

🔴 CRITICAL GAPS (Blockers)
CG-1: Evidence Model is Undefined
Location: "Implementation Plan → Step 3: Build drift scanner CLI"
Issue: The plan states "validate evidence markers (imports, symbol names, route handlers, workflow gates)" but provides no specification for:

What constitutes a valid "evidence marker"?
How are markers encoded in code? (Comments? Decorators? Exports?)
What is the matching algorithm? (Regex? AST traversal? Static analysis?)
Impact: Without this, two engineers could implement incompatible scanners.

Required: Add an "Evidence Marker Specification" appendix with examples:
// Example: How does a claim map to code?
// Claim: "M6 gate enforces identifiability"
// Expected Evidence:
//   - File: src/lib/services/benchmark-service.ts
//   - Marker: export function enforceIdentifiability() { ... }
//   - Or: // @claim-evidence: identifiability-gate


CG-2: Severity Classification is Ambiguous
Location: "claim-ledger.schema.json → severity field"
Issue: Plan mentions "critical vs non-critical" but doesn't define:

What makes a claim "critical"?
Is severity: critical | high | medium | low?
Who assigns severity during ledger creation?
Impact: Subjective severity assignment → inconsistent enforcement.

Required: Define severity levels with explicit criteria:
critical: Core scientific claims (e.g., "Causal inference uses do-calculus")
high: Security/data integrity claims
medium: Architectural patterns
low: Documentation/naming conventions

CG-3: "Contradicted" State is Undefined
Location: "scan-claim-drift.ts → Classify drift as ok | partial | missing | contradicted"
Issue: What does "contradicted" mean in code analysis?

A file exists but contains conflicting logic? (How detected?)
A marker exists but is commented out?
A type signature mismatches the claim?
Impact: Scanners cannot be built without operational semantics for "contradicted".

Required: Specify detection logic for each drift state with examples.

CG-4: Claim Ledger Bootstrapping Strategy Missing
Location: "Step 2: Seed initial claim ledger"
Issue: Plan says "include first tranche of critical claims" but doesn't specify:

Who extracts claims from audit docs?
How are claims translated into structured JSON?
What is the acceptance threshold for ledger v1? (Plan says "at least 10" but why 10?)
Impact: Ledger creation becomes a manual, error-prone process.

Required: Either:

Provide a semi-automated extraction script, OR
Specify a manual claim extraction workflow with review gates


CG-5: CI Workflow Interaction with M6 Health Check Undefined
Location: "Add CI workflow gate → claim-drift-sentinel.yml"
Issue: You just implemented 
m6-health-check.yml
 (nightly run). This plan adds another workflow. No analysis of interaction:

Do they run in parallel?
Does claim-drift block M6 health check?
What if claim-drift fails but M6 passes?
Impact: Could create contradictory CI states or circular dependencies.

Required: Specify workflow dependency graph and failure interaction matrix.

CG-6: Transition Period Not Addressed
Location: Entire spec
Issue: Plan assumes "claim ledger exists → scanner runs → CI enforces" but doesn't address:

What happens during ledger seeding? (Is CI blocked until ledger is complete?)
How do you prevent false positives during the first 2 weeks?
Is there a "grace period" mode?
Impact: Could halt all development during bootstrapping.

Required: Add a phased rollout plan:

Week 1: Scanner runs but doesn't block CI (report-only mode)
Week 2: Block on critical claims only
Week 3+: Full enforcement

CG-7: File Rename/Refactor Regression Test Missing
Location: "Test Cases → Regression"
Issue: Plan mentions "renaming a governed file without ledger update causes deterministic fail" but this is stated as the problem, not the solution.

Question: How does the system recover from this? Is there a:

CLI command to auto-update paths in ledger?
Allowlist for expected refactors?
Manual reconciliation workflow?
Impact: Every refactor becomes a governance update task → velocity tax.

Required: Specify either:

Auto-path-update mechanism, OR
Explicit reconciliation workflow with examples

HIGH-RISK ITEMS (Must Address Before Implementation)
HR-1: No Performance Budget
Issue: Large codebases → scanner could take minutes → CI timeout.
Required: Specify max execution time (e.g., <30s for 100 claims).

HR-2: No Schema Versioning
Issue: claim-ledger.schema.json will evolve. How are schema migrations handled?
Required: Add schema_version field and migration strategy.

HR-3: Claim Ownership Assignment Deferred to User (Resolved)
Issue (historical): Earlier drafts deferred ownership designation without a template or guide.
Resolution: Ownership matrix template and seeded assignments are now available at `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/claim-ownership-matrix.md` (mirrored in `crucible/docs/governance/claim-ownership-matrix.md`).

HR-4: No False Positive Mitigation
Issue: Static analysis is brittle. What if a claim is satisfied but the scanner can't detect it?
Required: Add an override mechanism (e.g., @claim-override: <justification>).

 STRENGTHS (What Works Well)
Clear Scope Boundary: Inputs/outputs are well-defined.
Phased Implementation: 5-step plan is logical and sequential.
Separation of Concerns: Ledger, scanner, and CI gate are decoupled.
Explicit Non-Goals: "No DB migration" is clearly stated.
Test Case Coverage: Positive, partial, critical fail, and regression cases identified.

RECOMMENDED ENHANCEMENTS (Nice-to-Have)
RE-1: Add Claim Provenance Tracking
Track which audit doc lineage each claim came from (e.g., source_commit, audit_date).

RE-2: Drift Trend Visualization
Emit historical drift metrics for dashboarding (e.g., "Critical claim coverage: 87% → 92%").

RE-3: Auto-Generate Stub Ledger from Code
Reverse mode: Scan code to generate candidate claims for human review.


CORRECTED ACCEPTANCE CRITERIA
The plan's acceptance criteria are necessary but insufficient. Add:

✅ Scanner runs in <30s for 100 claims (performance gate)
✅ Schema version migration tested (v1 → v2 path exists)
✅ At least 1 false positive override example documented
✅ Workflow interaction matrix with M6 health check verified
✅ Claim ownership assigned for all critical claims (not deferred)


 IMPLEMENTATION BLOCKERS
You CANNOT start implementation until:

CG-1 (Evidence Model) is resolved
CG-2 (Severity Classification) is resolved
CG-5 (M6 Workflow Interaction) is analyzed
CG-6 (Transition Plan) is specified


FINAL RECOMMENDATION
Status: ⚠️ RETURN TO SPECIFYING MODE

This plan is a strong directional vision but is not yet an executable specification. It needs:

Evidence model formalization (CG-1)
Drift classification semantics (CG-3)
Rollout strategy (CG-6)
