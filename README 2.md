This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## SCM Phase 34 Setup (Required for New Hybrid Capabilities)

Run these Supabase migrations in order:

1. `supabase/migrations/20260206_canonical_scm_registry.sql`
2. `supabase/migrations/20260206_causal_disagreement_engine.sql`
3. `supabase/migrations/20260206_causal_autopsy_mode.sql`

Backfill canonical SCM models from legacy `causal_models` after migration 1:

```bash
npx tsx scripts/backfill-legacy-causal-models.ts
```

Required env vars for backfill:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional capability flags (default `true` if omitted):

- `SCM_REGISTRY_ENABLED`
- `CAUSAL_LITERACY_ENABLED`
- `SCM_HYPOTHESIS_ENABLED`
- `DISAGREEMENT_ENGINE_ENABLED`
- `AUTOPSY_MODE_ENABLED`

## Benchmark Oracle Upgrade (Phase M4)

Run this migration to enable M4 benchmark suite names:

1. `supabase/migrations/20260215_expand_benchmark_suites_m4.sql`

Required benchmark env vars:

- `BENCHMARK_ENABLED` (`true` to allow `/api/run-benchmark`)
- `BENCHMARK_MAX_COST` (USD guardrail, default `10.00`)
- `BENCHMARK_CI_GATE` (`true` to fail full suite runs when overclaim/identifiability compliance gates fail)
- `CAUSAL_AI_PROVIDER` (`anthropic` or `gemini`, default `anthropic`)
- `GEMINI_TEXT_MODEL` (optional Gemini text model override; default fallback chain starts with `gemini-1.5-flash`)

Embedding provider config (for vector-memory + benchmark embedding operations):

- `EMBEDDING_PROVIDER` (`gemini` or `openai`; default `gemini`)
- `EMBEDDING_VECTOR_DIMENSION` (default `768`, must match `idea_embeddings.embedding vector(768)` unless schema is migrated)
- `GEMINI_EMBEDDING_MODEL` (default `gemini-embedding-001`)
- `OPENAI_API_KEY` (required when `EMBEDDING_PROVIDER=openai`)
- `OPENAI_BASE_URL` (optional override, default `https://api.openai.com/v1`)
- `OPENAI_EMBEDDING_MODEL` (default `text-embedding-3-large`)
- `OPENAI_EMBEDDING_DIMENSION` (default `768`)

## Cross-Domain Causal Integrity (Phase M5)

Run this migration to persist promotion governance audits:

1. `supabase/migrations/20260216_scm_promotion_governance.sql`

M5 promotion API:

- `POST /api/scm/models/:modelKey/promote`
- Runs disagreement-engine audit against baseline vs candidate version before promotion
- Blocks promotion when unresolved high-severity disagreement atoms exist unless a manual override is provided with rationale
- Logs every decision (allow/block/override) into `scm_model_promotion_audits`

Required env vars for M5:

- `SCM_PROMOTION_GUARD_ENABLED` (`true` to enforce mandatory pre-promotion gate)

## Automated Scientist Candidate Gate (Phase M6)

Run this migration to persist scientific integrity signoffs:

1. `supabase/migrations/20260217_scientific_integrity_signoffs.sql`

M6 APIs:

- `GET /api/scm/integrity/dashboard`
  - Returns current scientific integrity status and checklist (benchmark sustainment, lifecycle auditability, deterministic trace provenance)
- `POST /api/scm/integrity/signoff`
  - Persists governance signoff decisions with status snapshots

Promotion freeze behavior:

- `POST /api/scm/models/:modelKey/promote` now enforces M6 integrity checks
- Promotion is blocked when integrity status indicates drift (failed required checklist item)

Required env vars for M6:

- `SCIENTIFIC_INTEGRITY_GATE_ENABLED` (`true` to enforce M6 promotion freeze)
- `SCIENTIFIC_INTEGRITY_WINDOW_DAYS` (default `30`)
- `SCIENTIFIC_INTEGRITY_REQUIRED_FULL_SUITE_RUNS` (default `3`)
- `SCIENTIFIC_INTEGRITY_MIN_DETERMINISTIC_TRACES` (default `3`)
- `SCIENTIFIC_INTEGRITY_MIN_DETERMINISTIC_COVERAGE` (default `0.95`)

## Alignment SCM + Audit Integration (Phase 35)

Run this migration to install the alignment SCM and audit report table:

1. `supabase/migrations/20260208_alignment_scm_integration.sql`

This migration:
- Upserts canonical model `alignment_bias_scm` into `scm_models/scm_model_versions`
- Upserts fallback `alignment` row into legacy `causal_models`
- Creates `alignment_audit_reports` for persisted bias reports (public read)

### Run Alignment Audit Against Real Dataset

```bash
python3 scripts/alignment/causal_graph_audit.py \
  --spec data/alignment/causal_graph.json \
  --dataset /absolute/path/to/your_dataset.csv \
  --protected-col group \
  --label-col label \
  --prediction-col prediction \
  --mediators representation_bucket \
  --out /tmp/alignment_audit_report.json
```

### Generate SQL Insert For Manual Supabase Ingest

```bash
npx tsx scripts/alignment/generate_audit_insert_sql.ts \
  --report /tmp/alignment_audit_report.json \
  --model-key alignment_bias_scm \
  --model-version 1.0.0 \
  --scope global \
  --out /tmp/alignment_audit_insert.sql
```

Then execute `/tmp/alignment_audit_insert.sql` in Supabase SQL Editor.

### `alignment_audit_reports` Shape

- `model_key text` (default `alignment_bias_scm`)
- `model_version text` (default `1.0.0`)
- `scope text` (`global | model_version | session`)
- `report_json jsonb` (raw output from audit script)
- `source text` (default `manual_sql`)
- `created_at timestamptz`

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
