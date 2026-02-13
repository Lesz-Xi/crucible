# Domain Profile Schema + Domain Classifier Mapping v1.0
**Date:** 2026-02-11  
**Repository:** `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine`  
**Classifier Source:** `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/domain-classifier.ts`

---

## 1) Purpose
Define a canonical domain profile contract for multi-domain SCM governance, then map all currently supported classifier domains into that contract.

---

## 2) Canonical Schema (JSON)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "DomainProfile",
  "type": "object",
  "required": [
    "domain_id",
    "display_name",
    "status",
    "scm_model_key",
    "ontology_version",
    "query_intents_supported",
    "method_policy",
    "intervention_capabilities",
    "identifiability_policy",
    "uncertainty_policy",
    "safety_policy",
    "falsification_policy",
    "benchmark_packs",
    "governance"
  ],
  "properties": {
    "domain_id": { "type": "string" },
    "display_name": { "type": "string" },
    "status": { "type": "string", "enum": ["active", "draft", "deprecated"] },
    "scm_model_key": { "type": "string" },
    "default_version": { "type": "string" },
    "ontology_version": { "type": "string" },
    "query_intents_supported": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "discover_structure",
          "estimate_intervention_effect",
          "find_invariant_predictors",
          "adjudicate_model_disagreement",
          "counterfactual_necessity"
        ]
      }
    },
    "method_policy": {
      "type": "object",
      "required": ["primary_order", "fallback_order", "disqualifiers"],
      "properties": {
        "primary_order": { "type": "array", "items": { "type": "string" } },
        "fallback_order": { "type": "array", "items": { "type": "string" } },
        "disqualifiers": { "type": "array", "items": { "type": "string" } }
      }
    },
    "intervention_capabilities": {
      "type": "object",
      "required": ["hard_do", "soft_do", "known_targets_required"],
      "properties": {
        "hard_do": { "type": "boolean" },
        "soft_do": { "type": "boolean" },
        "known_targets_required": { "type": "boolean" },
        "max_intervention_arity": { "type": "integer", "minimum": 1 }
      }
    },
    "identifiability_policy": {
      "type": "object",
      "required": ["required_assumptions", "block_on_not_identified"],
      "properties": {
        "required_assumptions": { "type": "array", "items": { "type": "string" } },
        "block_on_not_identified": { "type": "boolean" },
        "max_unknown_confounders": { "type": "integer", "minimum": 0 }
      }
    },
    "uncertainty_policy": {
      "type": "object",
      "required": ["ece_id_max", "ece_ood_max", "ood_confidence_risk_max"],
      "properties": {
        "ece_id_max": { "type": "number" },
        "ece_ood_max": { "type": "number" },
        "ood_confidence_risk_max": { "type": "number" },
        "confidence_suppression_on_fail": { "type": "boolean" }
      }
    },
    "safety_policy": {
      "type": "object",
      "required": ["preflight_required", "forbidden_actions"],
      "properties": {
        "preflight_required": { "type": "boolean" },
        "forbidden_actions": { "type": "array", "items": { "type": "string" } }
      }
    },
    "falsification_policy": {
      "type": "object",
      "required": ["required_for_promotion", "min_discriminative_tests"],
      "properties": {
        "required_for_promotion": { "type": "boolean" },
        "min_discriminative_tests": { "type": "integer", "minimum": 1 }
      }
    },
    "benchmark_packs": { "type": "array", "items": { "type": "string" } },
    "governance": {
      "type": "object",
      "required": ["owner", "codeowners_group", "override_ttl_days_max"],
      "properties": {
        "owner": { "type": "string" },
        "codeowners_group": { "type": "string" },
        "override_ttl_days_max": { "type": "integer", "minimum": 1 }
      }
    }
  }
}
```

---

## 3) `domain-classifier.ts` Mapping (Current Supported Domains)

Mapped from:
`/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/lib/services/domain-classifier.ts`

1. `alignment`
2. `theoretical_neuroscience`
3. `neuroscience`
4. `legal`
5. `education`
6. `iml`
7. `scaling_laws`
8. `cognitive_psychology`
9. `evolutionary_biology`
10. `ecology`
11. `physics`
12. `abstract` (LLM fallback/default)

---

## 4) Domain Mapping Table (Classifier -> Profile)

| Classifier Domain | Profile `domain_id` | Required Profile Status |
|---|---|---|
| alignment | alignment | required |
| theoretical_neuroscience | theoretical_neuroscience | required |
| neuroscience | neuroscience | required |
| legal | legal | required |
| education | education | required |
| iml | iml | required |
| scaling_laws | scaling_laws | required |
| cognitive_psychology | cognitive_psychology | required |
| evolutionary_biology | evolutionary_biology | required |
| ecology | ecology | required |
| physics | physics | required |
| abstract | abstract | required |

---

## 5) Compatibility Rules

1. Every classifier domain must have exactly one profile.
2. Unknown classifier outputs route to `abstract`.
3. Profile absence is a governance error.
4. Domain selection must be logged with:
- classifier confidence
- selected profile id
- profile version
- method policy used

---

## 6) Proposed Companion JSON Artifact

File target:
`/Users/lesz/Documents/Synthetic-Mind/MASA-Theoretical-Foundation/domain-profiles.v1.json`

Contains one `DomainProfile` object per mapped domain above.

---

## 7) Validation Checklist

1. Schema validates all domain profiles.
2. No unmapped classifier domains.
3. No duplicate `domain_id`.
4. Each domain has governance owner and override TTL.
5. Each domain has explicit method policy and identifiability policy.
