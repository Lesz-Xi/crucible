
---

You are a senior staff engineer. Create a **production-ready implementation plan** for the VCC hardening work based on this audit outcome:

- Current verdict: **PASS-with-gaps**, but **NO-GO** until 4 blockers are resolved in spec and implemented.
- Blocking items:
1. `chat-verified` must **strip/ignore caller-supplied `causalDepth`** (never trust request value).
2. `VerificationPolicyDecision` must include missing DoD gates:
- `gapScoreGrounded: boolean`
- `provenanceLinkageComplete: boolean`
3. Evidence tiering must be explicit and enforceable:
- Tier A/B/C rubric
- `allowVerified=true` requires Tier A
4. `integrityPass` must come from **TTL-cached ScientificIntegrityStatus injected into policy** (no direct hot-path service calls).

Additional must-implement constraints:
- Shared policy layer: `src/lib/services/verification-policy.ts`
- Harden both endpoints:
- `src/app/api/bridge/simulate-verified/route.ts`
- `src/app/api/bridge/chat-verified/route.ts`
- Add structured failure codes:
- `VERIFIED_DOWNGRADED_RUNTIME_GAP`
- `VERIFIED_DOWNGRADED_EVIDENCE_TIER`
- `VERIFIED_DOWNGRADED_REPLAY_FAIL`
- `VERIFIED_DOWNGRADED_INTEGRITY_FAIL`
- `VERIFIED_DOWNGRADED_PROVENANCE_INCOMPLETE`
- `VERIFIED_NOT_EVALUATED`
- `EVIDENCE_TIER_PLACEHOLDER_DETECTED`
- Preserve backward compatibility structurally (additive fields), but explicitly manage **semantic breaking change** (fewer “verified” emissions).
- Add telemetry event sink (`bridge_verification_log`) with fields:
- `trace_id, endpoint, causal_depth_emitted, allow_verified, evidence_tier, replay_pass, integrity_pass, gap_score_grounded, failures[], shadow_mode, evaluated_at`

## Deliverables required in your response

Produce a plan with these sections, in this exact order:

1. **Scope & Assumptions**
- Confirm scope is `synthesis-engine/` only.
- List assumptions and unresolved questions.

2. **Architecture Changes**
- Describe final control flow for `simulate-verified` and `chat-verified`.
- Show where policy evaluation happens and where causalDepth is derived.
- Explain cache/injection boundary for integrity status.

3. **Type & Contract Changes**
- Provide TypeScript interfaces for:
- `VerificationFailureCode`
- `VerificationPolicyDecision`
- Include evidence tier rubric and minimum tier rule.

4. **Implementation Work Breakdown (by file)**
- For each file, list exact modifications and acceptance checks:
- `verification-policy.ts` (new)
- `simulate-verified/route.ts`
- `chat-verified/route.ts`
- any cache utility module
- telemetry/migration files

5. **Rollout Plan (Phase 1→3)**
- Phase 1 shadow mode requirements
- Promotion gates with measurable criteria
- Phase 2 staging enforcement
- Phase 3 production rollout and monitoring

6. **Testing Strategy**
- Unit tests (minimum 8) and integration tests (minimum 6), each with:
- test name
- scenario
- expected result
- Include adversarial tests (caller sends `causalDepth='verified'`).

7. **Risk Register**
- Top risks, likelihood/impact, mitigations, owners.

8. **Definition of Done Checklist**
- Explicit, checkable bullets for engineering + QA + rollout signoff.

9. **Execution Timeline**
- 2-day and 1-week plan with milestones, dependencies, and critical path.

## Output format requirements

- Be concrete and implementation-focused.
- Use Markdown headings + bullet lists.
- Include pseudocode where useful.
- No generic advice; tie everything to the stated files and constraints.
- End with:
- **“GO criteria”**
- **“NO-GO criteria”**
- **“First PR slice recommendation”**

---
