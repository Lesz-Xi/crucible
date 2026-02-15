# Chat Density Calibration Report — 2026-02-14

## Scope
Post-patch validation for causal density scoring in chat (`L1/L2/L3`) after counterfactual calibration changes.

## Method
Ran deterministic evaluator checks against representative text cases using `CausalIntegrityService.evaluate(...)` with and without contextual hints (`expectedRung`, `operatorMode`).

## Results Summary

### ✅ Passes
- Clear intervention response with explicit structure ("because/therefore") → **L2 Intervention**
- Clear counterfactual response with necessity/sufficiency framing + structure → **L3 Counterfactual**
- Counterfactual with penalties ("random coincidence", "no causal") correctly degraded to **L1**

### ⚠️ Partial / edge cases
- Intervention text with operator evidence but no structural connective can still land in **L1** unless context hint is present.
- Counterfactual prose without explicit connective/chain marker can still land in **L1**.
- Prompt-style text ("Generate one counterfactual test...") alone remains **L1** unless model output includes richer causal structure.

## Representative Outcomes
- `L1-basic-association` → L1 (50%)
- `L2-intervention-explicit` → L1 base, L2 with context hint
- `L3-counterfactual-prose` → L3 (94%)
- `L3-necessity-sufficiency-no-arrow` → L1 base (false negative)
- `Prompt-style-shortcut` → L1 base, slight confidence bump with context

## Audit Conclusion
Calibration improved high-signal L3 detection and preserved safety degradation, but there are remaining false negatives for concise prose without explicit structural markers.

## Recommended next tuning
1. Expand structure/connective patterns (`indicates`, `supports`, `under assumptions`, `in that world`).
2. Add low-confidence L2 fallback when `operatorEvidence >= 2` and no penalties.
3. Add low-confidence L3 fallback when `counterfactualEvidence >= 3` and no penalties.
4. Surface evaluator evidence hit-counts in Evidence Rail (debug mode) for transparent scoring behavior.
