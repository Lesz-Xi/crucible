# VCC v2: MASA-Aligned Trust Contract (Report Pipeline Authoritative)

**Status:** Active  
**Date:** 2026-03-08  
**Scope:** `synthesis-engine` only  
**Supersedes:**
- `/Users/lesz/Documents/Synthetic-Mind/Digital-Twin-Gaps/hybrid-verified-closure-spec-2026-03-03.md`
- `/Users/lesz/.gemini/antigravity/brain/d11c9ba7-4dd5-4def-8fc2-a70c623ac56c/vcc-state-of-system-2026-03-05.md.resolved`

## 1. Purpose
This specification replaces the outdated bridge-centric VCC model with the current MASA-aligned architecture: trust-state classification is authoritative only when produced by report-pipeline policy evaluation.

## 2. Authoritative Trust Path
Trust-state (`verified|heuristic|warning|unknown`) is derived only from:
- `src/lib/services/honest-framing-service.ts`
- `src/lib/services/report-synthesizer-service.ts`
- `src/types/report-analysis.ts`

`ReportMeta.causalDepth` and `ReportMeta.allowVerified` are the canonical report-level trust outputs.

## 3. Bridge Contract Classification
`/api/bridge/chat-verified` is telemetry ingress only:
- Persists audit/telemetry payloads to `bridge_verification_log`
- Must not compute or emit authoritative trust-state decisions
- Must not be treated as a replacement for report trust contracts

`/api/bridge/simulate-verified` is retired and not part of the active route surface.

## 4. Gate-to-Code Contract
| Gate | Type field | WarningCode | User-facing meaning |
|---|---|---|---|
| Provenance completeness | `HonestFramingResult.gates.provenanceComplete` | `VERIFIED_DOWNGRADED_PROVENANCE_INCOMPLETE` | Provenance chain is incomplete; traceability is degraded. |
| Evidence tier sufficiency | `HonestFramingResult.gates.evidenceTierSufficient` | `VERIFIED_DOWNGRADED_EVIDENCE_TIER` | Source tier is below trust threshold for verified claims. |
| Runtime grounding | `HonestFramingResult.gates.noRuntimeGap` | `VERIFIED_DOWNGRADED_RUNTIME_GAP` | Pipeline ran with a runtime retrieval/data gap. |
| High-impact falsifier evaluation | `HonestFramingResult.gates.falsifiersPresent` | `VERIFIED_NOT_EVALUATED` | High-impact claim has missing falsifier coverage. |
| Aggregate unknown state | Report aggregation (`deriveReportFramingState`) | `UNKNOWN_VERIFICATION_STATE` | Verification state is unknown; treat as exploratory. |

## 5. MASA Layer Mapping
- Layer A (Interface): report UI displays trust-state + warning labels
- Layer B (Causal logic): Honest Framing policy gates and report synthesis enforcement
- Layer C (Governance): warning-code traceability, audit logs, and signoff process
- Layer D (Truth store): `scm_reports` report payloads + `bridge_verification_log` telemetry persistence

## 6. Compatibility and Deprecation
- Additive compatibility guarantee: report payloads preserve trust fields and can add non-breaking metadata.
- Semantic authority rule: downstream consumers must source trust from report outputs, not bridge ingestion responses.
- Legacy endpoint deprecation: `simulate-verified` is retired; do not reintroduce without new ADR.

## 7. Acceptance Criteria
1. No active spec claims bridge endpoints are trust-authoritative.
2. Active spec explicitly identifies retired `simulate-verified`.
3. Report trust-state contract is single-source and MASA-layer-mapped.
4. Tests cover gate-to-warning determinism and report-level aggregation behavior.
5. Consumer migration notes are published.

## Appendix A: Staleness Corrections (2026-03-08)
The superseded 2026-03-05 resolved state report is stale against repo truth as of 2026-03-08.

| Stale claim | Current repo reality |
|---|---|
| `verification-policy.ts` exists | File absent |
| `integrity-status-cache.ts` exists | File absent |
| `simulate-verified` route exists | Route absent |
| `verification-policy.test.ts` exists | File absent |
| bridge migration file is `20260304000000_...` | Actual file is `20260305_bridge_verification_log.sql` |
| bridge endpoint computes verification policy decisions | Bridge endpoint is telemetry ingestion only |

## Appendix B: Operational Query Anchors
Bridge ingest telemetry:
```sql
select source, verdict, count(*) as total
from public.bridge_verification_log
group by source, verdict
order by total desc;
```

Report downgrade trend (verification failure reasons):
```sql
select failure_reason, count(*) as total
from (
  select unnest(verification_failures) as failure_reason
  from public.scm_reports
  where generated_at >= now() - interval '7 days'
) t
group by failure_reason
order by total desc;
```
