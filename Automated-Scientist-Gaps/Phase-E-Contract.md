[[reply_to_current]] Perfect. Here’s the **A-now / C-ready contract**:

### 1) Core service boundary (shared, cross-cutting)
Create one orchestrator interface used by any route:

```ts
// src/lib/science/scientific-analysis-service.ts
export interface ScientificAnalysisRequest {
  userId: string;
  pdfBuffer: ArrayBuffer;
  fileName: string;
  context?: { feature: 'hybrid' | 'chat' | 'epistemic'; sessionId?: string };
  options?: { minTableConfidence?: number; runAnalysis?: boolean; skipMarkdown?: boolean };
}
export interface ScientificAnalysisResponse {
  ingestionId: string;
  status: 'completed' | 'partial' | 'failed';
  summary: { tableCount: number; trustedTableCount: number; dataPointCount: number };
  computeRunId?: string;
  reasoningGraph?: unknown;
  warnings: string[];
}
export interface ScientificAnalysisService {
  run(request: ScientificAnalysisRequest): Promise<ScientificAnalysisResponse>;
}
```

### 2) Option A wiring (now)
- In `/api/hybrid-synthesize`, call only `ScientificAnalysisService.run(...)`.
- No extraction/compute logic directly inside Hybrid route.

### 3) Transport contract (stable)
Return a consistent envelope from Hybrid now (so Chat/Epistemic can adopt later without format churn):

```json
{
  "success": true,
  "scientificAnalysis": { "...shared response..." },
  "featureContext": "hybrid"
}
```

### 4) Persistence ownership
- Shared service owns writes to:
  - `document_ingestions`
  - `extracted_tables`
  - `scientific_data_points`
  - `compute_runs`
- Feature routes must not write these tables directly.

### 5) Provenance contract
Every downstream claim/reference must carry:
- `ingestionId`
- `sourceTableId[]`
- `dataPointIds[]`
- `computeRunId`
- `methodVersion`

### 6) Migration path to Option C
When ready:
- add new adapters:
  - `ScientificAnalysisChatAdapter`
  - `ScientificAnalysisEpistemicAdapter`
- reuse same service + same response schema.
- only UI/route wiring changes, not core logic.

### 7) CI guardrails (required now)
- contract test: Hybrid route response includes `scientificAnalysis` envelope
- deterministic snapshot test on compute output
- migration-state check in CI before deploy

If you want, I can scaffold `scientific-analysis-service.ts` + Hybrid adapter file signatures next so your team can implement fast without design drift.