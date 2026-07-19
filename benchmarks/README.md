# Benchmarks

This directory holds versioned, reviewable **research benchmark instruments** — not application runtime code.

An instrument here is expected to carry, at minimum:

- immutable inputs and isolated (not merely secret) answer keys;
- a deterministic, arm-neutral scoring path;
- dry, no-model verification that the instrument itself is internally consistent;
- an explicit provenance and claim-boundary document (what running it would and would not establish);
- a stated boundary for any future execution runner — never implied to exist before it does.

Instruments in this directory are not automatically wired into `src/` application code, API routes, or `scripts/governance:*` automation. A benchmark instrument earns that integration only after its execution contract (model/provider choice, run budget, and any statistical margin charter) has been explicitly signed off and its results have been produced and reviewed — never by default at transfer time.

## Instruments

- [`p1-typed-warrant/`](p1-typed-warrant/) — Stage 0 pilot benchmark for the P1 typed-warrant-advantage experiment (BTEC research arc). See [`docs/specs/p1-typed-warrant/README.md`](../docs/specs/p1-typed-warrant/README.md) for provenance, current readiness state, and the claim boundary.
