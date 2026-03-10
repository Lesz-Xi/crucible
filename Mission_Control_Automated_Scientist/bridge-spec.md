Perfect. Here’s a **drop-in `bridge-spec.md` template** you can place in both repos (`synthesis-engine` and `mission-control-standalone`) as the integration contract.

```md
# Bridge Spec — Synthesis Engine ↔ Mission Control

**Status:** Draft / Active / Deprecated
**Version:** v0.1.0
**Last Updated:** YYYY-MM-DD
**Owners:** [Automated Scientist owner], [Mission Control owner]

---

## 1) Purpose

Define the stable contract between:

- **Automated Scientist** (`synthesis-engine`) — intelligence/runtime layer
- **Mission Control** (`mission-control-standalone`) — orchestration/observability/governance layer

This spec is the single source of truth for:
- API interfaces
- schema/versioning
- evidence/provenance guarantees
- reliability/SLO expectations
- cross-repo compatibility checks

---

## 2) Repo Boundaries

## Automated Scientist owns
- Inference/reasoning/simulation execution
- Causal-depth evaluation (`heuristic` / `verified`)
- Evidence extraction + attribution
- Confidence/uncertainty outputs

## Mission Control owns
- Operator workflows (Ask/Simulate/Calibrate UX)
- Decision/audit timeline views
- Policy overlays and governance controls
- Cross-run monitoring, alerting, and intervention tracking

## Shared responsibilities
- Contract versioning
- Traceability IDs
- Error taxonomy alignment
- Backward compatibility tests

---

## 3) Interface Overview

| Capability | Caller | Provider | Endpoint | Notes |
|---|---|---|---|---|
| Verified Ask | Mission Control | Synthesis Engine | `POST /api/bridge/chat-verified` | Streaming optional |
| Verified Simulate | Mission Control | Synthesis Engine | `POST /api/bridge/simulate-verified` | Returns causal depth + class |
| Health Check | Mission Control | Synthesis Engine | `GET /api/bridge/health` | Liveness/readiness |

Base URLs by env:
- local: `http://localhost:<PORT>`
- staging: `<TBD>`
- prod: `<TBD>`

---

## 4) Request/Response Contracts

## 4.1 `POST /api/bridge/chat-verified`

### Request (example)
```json
{
"requestId": "req_123",
"traceId": "trace_abc",
"sessionId": "sess_456",
"query": "What intervention should we prioritize?",
"context": {
"projectId": "mission-control-command-center",
"constraints": ["budget_cap", "timebox_30d"]
},
"options": {
"causalDepthRequired": "verified",
"stream": true
}
}
```

### Response (example)
```json
{
"requestId": "req_123",
"traceId": "trace_abc",
"answer": "Prioritize intervention X...",
"causalDepth": "verified",
"confidence": 0.78,
"evidence": [
{
"sourceId": "src_1",
"title": "Experiment #42",
"uri": "internal://...",
"snippet": "..."
}
],
"assumptions": ["Assumption A"],
"uncertainty": ["Unknown B"],
"classification": "intervention_supported",
"timingsMs": {
"total": 1840
}
}
```

---

## 4.2 `POST /api/bridge/simulate-verified`

### Request (example)
```json
{
"requestId": "req_789",
"traceId": "trace_xyz",
"scenario": {
"name": "Pricing change Q2",
"interventions": ["raise_price_8pct"],
"constraints": ["churn_lt_5pct"]
},
"options": {
"causalDepthRequired": "verified"
}
}
```

### Response (example)
```json
{
"requestId": "req_789",
"traceId": "trace_xyz",
"causalDepth": "verified",
"resultClass": "intervention_supported",
"projectedOutcomes": [
{"metric": "revenue", "direction": "up", "effectSize": 0.12}
],
"confidence": 0.72,
"evidence": [],
"assumptions": [],
"uncertainty": []
}
```

---

## 5) Error Taxonomy

All errors return:
```json
{
"error": {
"code": "BRIDGE_SCHEMA_MISMATCH",
"message": "Human-readable summary",
"retryable": false,
"details": {}
},
"requestId": "req_x",
"traceId": "trace_y"
}
```

Standard codes:
- `BRIDGE_UNAUTHORIZED`
- `BRIDGE_FORBIDDEN`
- `BRIDGE_INVALID_INPUT`
- `BRIDGE_SCHEMA_MISMATCH`
- `BRIDGE_UPSTREAM_UNAVAILABLE`
- `BRIDGE_TIMEOUT`
- `BRIDGE_INTERNAL`

---

## 6) Versioning Policy

- Contract version format: `MAJOR.MINOR.PATCH`
- Breaking changes ⇒ MAJOR bump
- Backward-compatible additions ⇒ MINOR bump
- Fixes/docs ⇒ PATCH bump

Rules:
1. Mission Control must support N and N-1 bridge versions in production.
2. Deprecation notice period: minimum 14 days.
3. Remove deprecated fields only after compatibility tests pass in staging.

---

## 7) AuthN/AuthZ

- Service-to-service auth: [JWT/mTLS/API key] (choose one)
- Required headers:
- `Authorization: Bearer <token>`
- `X-Request-Id`
- `X-Trace-Id`
- Scope examples:
- `bridge.chat_verified:write`
- `bridge.simulate_verified:write`
- `bridge.health:read`

---

## 8) Evidence & Provenance Requirements

Every verified response must include:
- `traceId`
- `causalDepth`
- `confidence`
- `evidence[]` with source identifiers
- `assumptions[]`
- `uncertainty[]`

Mission Control must render:
- Evidence links
- Confidence and causal depth label
- “Why this recommendation” panel
- “What could invalidate this” panel

---

## 9) Observability & SLOs

Required telemetry:
- Request count, latency p50/p95/p99
- Error rate by error code
- Verified vs heuristic ratio
- Evidence completeness ratio

Initial SLO targets:
- Availability: 99.5%
- p95 latency: < 3s (`chat-verified`), < 5s (`simulate-verified`)
- Error rate: < 1% (excluding client input errors)

---

## 10) Compatibility Test Checklist (Cross-Repo)

- [ ] Contract tests pass on both repos
- [ ] JSON schema validation pass/fail cases covered
- [ ] N/N-1 version interoperability verified
- [ ] Error taxonomy parity validated
- [ ] Trace ID propagation verified end-to-end
- [ ] Evidence fields present for verified paths
- [ ] Rollback drill completed (provider rollback, caller still stable)

---

## 11) Release Train & Rollback

Release flow:
1. Publish schema/package tag
2. Deploy Synthesis Engine (provider) to staging
3. Run Mission Control integration suite
4. Deploy Mission Control
5. Canary in prod

Rollback rule:
- If provider regresses, Mission Control must degrade gracefully:
- show degraded mode banner
- fallback to heuristic where policy allows
- preserve audit trail of fallback reason

---

## 12) Open Questions / Decisions

- [ ] Final auth mechanism?
- [ ] Streaming protocol standard (SSE vs WebSocket)?
- [ ] Schema package location?
- [ ] SLO thresholds after baseline measurement?
```

