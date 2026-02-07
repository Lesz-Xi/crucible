# Claim Drift Report

- Generated at: 2026-02-07T05:24:51.580Z
- Mode: report
- Strict level: critical
- Duration (ms): 21
- Performance budget (ms): 30000
- Within performance budget: true

## Summary

- Total claims: 12
- Blocking claims: 0
- Overrides applied: 0
- States: ok=12, partial=0, missing=0, contradicted=0

## Claim Results

| Claim | Severity | State | Blocking | Override | Owner |
|---|---|---|---:|---:|---|
| CLM-001 | critical | ok | false | false | @Lesz-Xi |
| CLM-002 | critical | ok | false | false | @Lesz-Xi |
| CLM-003 | critical | ok | false | false | @Lesz-Xi |
| CLM-004 | critical | ok | false | false | @Lesz-Xi |
| CLM-005 | critical | ok | false | false | @Lesz-Xi |
| CLM-006 | critical | ok | false | false | @Lesz-Xi |
| CLM-007 | critical | ok | false | false | @Lesz-Xi |
| CLM-008 | critical | ok | false | false | @Lesz-Xi |
| CLM-009 | critical | ok | false | false | @Lesz-Xi |
| CLM-010 | critical | ok | false | false | @Lesz-Xi |
| CLM-011 | critical | ok | false | false | @Lesz-Xi |
| CLM-012 | critical | ok | false | false | @Lesz-Xi |

## Evidence Details

### CLM-001
- State: ok
- [x] required ast_workflow_step :: Fail if health check failed (/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/m6-health-check.yml)

### CLM-002
- State: ok
- [x] required ast_workflow_step :: Parse health check results (/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/m6-health-check.yml)
- [x] required regex :: /no_op=\$no_op/ (/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/m6-health-check.yml)
- [x] required regex :: /degraded_mode=\$degraded_mode/ (/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/m6-health-check.yml)

### CLM-003
- State: ok
- [x] required ast_workflow_step :: Fail until closeout window is satisfied (/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/m6-closeout-tracker.yml)

### CLM-004
- State: ok
- [x] required ast_function_call :: emitResult (/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/promote-scm-model.ts)
- [x] required regex :: /PROMOTE_RESULT_JSON::/ (/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/promote-scm-model.ts)

### CLM-005
- State: ok
- [x] required ast_function_call :: evaluateSCMPromotionGate (/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/promote-scm-model.ts)

### CLM-006
- State: ok
- [x] required ast_export :: SCMRegistryService (/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scm-registry.ts)

### CLM-007
- State: ok
- [x] required ast_export :: CausalDisagreementEngine (/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/causal-disagreement-engine.ts)

### CLM-008
- State: ok
- [x] required ast_export :: evaluateSCMPromotionGate (/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scm-promotion-governance.ts)

### CLM-009
- State: ok
- [x] required ast_export :: evaluateScientificIntegrity (/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scientific-integrity-service.ts)

### CLM-010
- State: ok
- [x] required ast_export :: ScientificIntegrityService (/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/scientific-integrity-service.ts)

### CLM-011
- State: ok
- [x] required ast_export :: SCMPromotionGate (/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/types/scm.ts)

### CLM-012
- State: ok
- [x] required ast_export :: ScientificIntegrityStatus (/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/types/scm.ts)
