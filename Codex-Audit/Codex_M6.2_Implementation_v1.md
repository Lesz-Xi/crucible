Implemented. M6.2 trace-governance patch is now wired and validated.

**What I added**
- New workflow: `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/workflows/trace-integrity-sentinel.yml`
  - Triggers: PR, main push, dispatch, nightly
  - Rollout gating: `week1` report-only, `week2` PR enforce, `week3` PR+main enforce
  - Source mode: hybrid (Supabase with fixture fallback)
  - Artifact upload + step summary
- New npm scripts in `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/package.json`
  - `governance:trace-integrity`
  - `governance:trace-fixtures:generate`
  - `governance:trace-migrate`
- CODEOWNERS updates in `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/.github/CODEOWNERS`
  - Added ownership for trace scripts + sentinel workflow
- Scanner hardening in `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/scan-trace-integrity.ts`
  - Deterministic classification + blocking exit codes
  - Override governance checks (approver allowlist, expiry, TTL max, malformed override rejection)
  - Hybrid fallback behavior + trend CSV output
- Trace governance assets (already present, now validated)
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/trace-integrity-policy.json`
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/trace-integrity.schema.json`
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/trace-overrides.json`
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/trace-ownership-matrix.md`
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/docs/governance/trace-fixtures.v1.json`
- Utility scripts (already present, now validated)
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/generate-trace-fixtures.ts`
  - `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/scripts/migrate-trace-schema.ts`

**Validation run**
- `npm run governance:trace-fixtures:generate -- --output docs/governance/trace-fixtures.v1.json` ✅
- `npm run governance:trace-integrity -- --mode report --source fixture --strict critical --rollout-stage week1` ✅
- `npm run governance:trace-integrity -- --mode enforce --source fixture --strict critical --rollout-stage week3` ❌ expected (exit `2`, blocking)
- `npm run governance:trace-integrity -- --mode report --source hybrid --strict critical --rollout-stage week1` ✅
- `npm run governance:trace-migrate -- --input docs/governance/trace-fixtures.v1.json --to 2.0.0` ✅
- `npm run governance:trace-migrate -- --input docs/governance/trace-fixtures.v1.json --to 2.0.0 --output artifacts/trace-fixtures.v2.json --write` ✅

Artifacts produced:
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/trace-integrity-report.json`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/trace-integrity-report.md`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/trace-integrity-trend.csv`
- `/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/artifacts/trace-fixtures.v2.json`

**Critical gap to keep in mind**
- For real Supabase sampling in CI (instead of fallback fixtures), repo secrets must include `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

Next step I recommend: run the governance exercise PR (intentional trace violation) to prove sentinel blocking behavior end-to-end.