# P1 Typed-Warrant Advantage — Crucible Integration Note

**Relocated into Crucible:** 2026-07-19
**Source workspace:** `~/.twin-sparrow/agent/memory/Sol & Fable Workspace/Godel's Theorem and Bayes/Workspace for Sol & Fable/`
**Authors of the underlying research:** Sol & Fable (Twin-Sparrow agent collaboration), directed by Chief

## What this is

This folder holds the exact, byte-preserved specification and implementation-readiness reports for **P1**, the first designed experiment of the BTEC (Boundary-Typed Epistemic Control) research arc — a theory about keeping "proved" and "credent" epistemic warrant typed and non-substitutable rather than silently collapsed into one scalar confidence.

- **`O-2-benchmark-spec.md`** — the preregisterable three-arm (A / A+ / B) benchmark specification and execution contract. sha256 `b39f67bd11a3834f2602f78ddc372e37aa069bad2e5aeb236827e5fb0ad9c010`.
- **`O-3-implementation-report.md`** — the implementation-readiness report for the actual benchmark instrument built from that spec. sha256 `0a81c3b69106932d7a7027a3cfddf0402b0b2b0b1ad8233a3499fa81ccde5b62`.

The executable instrument itself lives at [`../../benchmarks/p1-typed-warrant/`](../../../benchmarks/p1-typed-warrant/) — an exact byte-for-byte copy of the source workspace's `p1-benchmark/` directory, unchanged and unported.

## Provenance and integrity

Both documents above are copied verbatim — same bytes, same hashes as the versions jointly approved in the source workspace's `T-2 Coms` / `T-3 Coms` review rounds. Nothing was re-authored, summarized, or "cleaned up" during this transfer. If you need the original discussion trace (why a design decision was made, what defects were caught in review), it lives in the source workspace's Coms folders, not here.

## Current readiness state (as of transfer)

**Conditionally ready — no model has been run, no comparative outcome exists, nothing here is evidence for or against BTEC.** Per O-3 §1/§6, three things gate execution:

1. **Model/provider and run-budget selection** — Chief's choice, not yet made.
2. **Margin-charter values and signature** (`benchmarks/p1-typed-warrant/margin-charter-TEMPLATE.json`) — null value slots block comparative-outcome *unblinding*; nulls are never read as zero.
3. **Prompt + infrastructure freeze** (O-2 §6.4) — Sol & Fable's job, after (1) is decided.

## Claim boundary

What this transfer establishes: the instrument is *relocated and verifiably intact* inside Crucible. What it does **not** establish: that the instrument has been run, wired into any Crucible API route or execution runner, or that any result — comparative or otherwise — exists. See `benchmarks/README.md` for the general boundary this repository holds for all benchmark instruments, and O-3 §5 ("Claim Boundary") for the research-level boundary.

## What was deliberately not done in this transfer

Per the Crucible T-1 Coms integration contract (Sol & Fable, 2026-07-19):

- No UI, API route, database migration, or execution runner was added.
- The Python scorer/validators/test suites were preserved as the approved research implementation — not ported to TypeScript, not rewritten. A TypeScript port remains explicit future work, gated on proving behavioral equivalence via shared fixtures.
- No model API call, `.env*` edit, or margin-charter value was filled in.
- Nothing in this transfer was staged, committed, or pushed — that remains Chief's call.

Node-native structural/integrity verification (`npm run benchmark:p1:verify`) and the full canonical Python suite runner (`npm run benchmark:p1:test`) are added separately by Sol; see their respective `package.json` entries once landed.
