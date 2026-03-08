# Bridge API Contract

## Status (2026-03-08)
- Active route: `/api/bridge/chat-verified`
- Retired route: `/api/bridge/simulate-verified`

## Contract
`/api/bridge/chat-verified` is a telemetry ingestion endpoint.

It is explicitly non-authoritative for causal trust-state decisions and must not be used to infer `verified|heuristic|warning|unknown` classification.

Authoritative trust-state is emitted by report pipeline contracts:
- `HonestFramingService`
- `ReportSynthesizerService`
- `ReportMeta.causalDepth` and `ReportMeta.allowVerified`

## Change Control
Any change that would make bridge endpoints trust-authoritative requires:
1. New ADR approval
2. Type contract update in `src/types/report-analysis.ts`
3. Backward compatibility + migration notes
