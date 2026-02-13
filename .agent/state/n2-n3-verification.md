# N2/N3 Verification Snapshot

## N2 - Migration Application Status
- Remote status check command: `supabase migration list --workdir /Users/lesz/Documents/Synthetic-Mind/synthesis-engine`
- Result: blocked (`Cannot find project ref. Have you run supabase link?`)
- Local status check command: `supabase migration list --local --workdir /Users/lesz/Documents/Synthetic-Mind/synthesis-engine`
- Result: blocked (`connect: connection refused` on `127.0.0.1:54322`)
- Conclusion: migration application status remains unverified until project linking or local DB startup.

## N3 - Environment Key Coverage
- Required keys discovered from code: 31
- Missing from `.env.local`: 23
- Missing from `.env.example`: 0

### Missing from `.env.local`
- `AI_DEBUG`
- `AUTOPSY_MODE_ENABLED`
- `BENCHMARK_CI_GATE`
- `CAUSAL_LITERACY_ENABLED`
- `CHAT_WEB_GROUNDING_V1`
- `DISAGREEMENT_ENGINE_ENABLED`
- `ENABLE_STATISTICAL_VALIDATION`
- `FORCE_PROVIDER`
- `HYBRID_NOVELTY_PROOF_V1`
- `NEXT_PUBLIC_AUTOSCI_LAYOUT_V2`
- `NODE_ENV`
- `PHENOMENAL_LAYER_ENABLED`
- `PROMOTION_ACTOR_USER_ID`
- `PUBLICATION_YEAR_FALLBACK`
- `SCIENTIFIC_INTEGRITY_GATE_ENABLED`
- `SCIENTIFIC_INTEGRITY_MIN_DETERMINISTIC_COVERAGE`
- `SCIENTIFIC_INTEGRITY_MIN_DETERMINISTIC_TRACES`
- `SCIENTIFIC_INTEGRITY_REQUIRED_FULL_SUITE_RUNS`
- `SCIENTIFIC_INTEGRITY_WINDOW_DAYS`
- `SCM_HYPOTHESIS_ENABLED`
- `SCM_PROMOTION_GUARD_ENABLED`
- `SCM_REGISTRY_ENABLED`
- `TRACE_SIGN_KEY`

### Missing from `.env.example`
- none

## Operator Next Commands
1. `supabase link --project-ref <your-project-ref> --workdir /Users/lesz/Documents/Synthetic-Mind/synthesis-engine`
2. `supabase migration list --workdir /Users/lesz/Documents/Synthetic-Mind/synthesis-engine`
3. `supabase start --workdir /Users/lesz/Documents/Synthetic-Mind/synthesis-engine` (optional local DB)
4. `supabase migration list --local --workdir /Users/lesz/Documents/Synthetic-Mind/synthesis-engine`
