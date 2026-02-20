[[reply_to_current]] Love this. Here’s the full spec, Chief.

---

# Lab Copilot — Full Implementation Spec (v1)

## 0) Goal

Build a **contextual, tool-grounded scientific copilot** inside Labs that helps users understand protein structure/mechanism and execute reproducible experiments aligned with the **Automated Scientist** vision.

Not a generic chat.  
It must be: **structure-aware, action-capable, provenance-first**.

---

## 1) Product Scope (v1)

### In scope
- “Ask the Structure” panel in Labs
- Copilot aware of current lab context:
  - selected structure (PDB/AlphaFold)
  - source + resolved ID
  - latest sequence analysis
  - latest docking result/job
- Copilot answers in a strict scientific format
- Copilot can trigger existing lab tools (fetch, sequence, docking, simulate)
- Every exchange and action recorded in Lab Notebook provenance

### Out of scope (v1)
- Full autonomous multi-step planning
- External wet-lab protocol generation
- New compute-heavy models on-device
- Multi-user collaboration features

---

## 2) UX / Interaction Design

## 2.1 Placement
- Labs main view gains right rail/card: **Lab Copilot**
- Optional floating open/close toggle
- Preserve current notebook panel + instruments strip

## 2.2 Modes
- **Ask**: Q&A about loaded structure/mechanism
- **Run**: user asks copilot to run tool(s)
- **Learn**: explanation level (Beginner / Intermediate / Research)

## 2.3 Response Template (required)
Assistant responses rendered in sections:
1. Observation  
2. Hypothesis  
3. Mechanistic Rationale  
4. Test Plan  
5. Confidence + Limitations  
6. Suggested Next Step (actionable)

## 2.4 Quick action chips
Under each response:
- `Run Sequence Analysis`
- `Run Docking`
- `Fetch Related Structure`
- `Create Notebook Entry`
- `Ask Follow-up`

---

## 3) Functional Requirements

## FR-1: Structure Context Injection
Copilot requests must include:
- `activeStructure.id`
- `activeStructure.source` (`rcsb|alphafold`)
- `activeStructure.metadata`
- latest experiment snapshots (sequence/docking/sim)

## FR-2: Scientific Answer Schema
Backend enforces JSON-schema output with fields:
- `observation: string`
- `hypothesis: string`
- `mechanisticRationale: string`
- `testPlan: string[]`
- `confidence: number (0..1)`
- `limitations: string[]`
- `nextStep: { action: string, params?: object }`
- `citations: {title,url,sourceType}[]`

## FR-3: Tool Invocation (guarded)
Copilot can request tool calls:
- `fetch_protein_structure`
- `analyze_protein_sequence`
- `dock_ligand`
- `simulate_scientific_phenomenon`

All tool calls:
- require explicit user-initiated turn
- log input/result/error in provenance
- return structured status

## FR-4: Provenance Logging
Persist:
- user prompt
- context hash
- assistant structured output
- tool calls + results
- model/provider metadata

## FR-5: Failure UX
If provider key/credits/tool failure:
- show human-readable guidance
- never fail silently
- include retry path/suggested provider switch

---

## 4) Technical Architecture

## 4.1 Frontend Components
Add:
- `src/components/lab/LabCopilotPanel.tsx`
- `src/components/lab/LabCopilotMessage.tsx`
- `src/components/lab/LabCopilotActions.tsx`

Update:
- `src/app/lab/page.tsx` (mount panel + pass lab context)
- `src/components/lab/LabNotebook.tsx` (copilot entries tag)

## 4.2 Backend Routes
Add:
- `POST /api/lab/copilot/chat`
  - input: user prompt + lab context
  - output: structured scientific response
- `POST /api/lab/copilot/run-tool`
  - input: tool name + params
  - output: execution status/result/job reference

Reuse:
- `/api/lab/structure/fetch`
- `/api/lab/docking/jobs` + polling endpoint

## 4.3 Services
Add:
- `src/lib/services/lab-copilot-service.ts`
  - prompt orchestration
  - schema validation
  - tool routing
- `src/lib/services/lab-context-builder.ts`
  - normalize current structure + experiments into compact context
- `src/lib/validations/lab-copilot.ts`
  - zod schemas for input/output/tool intents

---

## 5) Data Model / Persistence

## 5.1 New table (suggested)
`lab_copilot_messages`
- `id uuid pk`
- `user_id uuid`
- `session_id uuid` (lab session/thread)
- `role text` (`user|assistant|tool`)
- `content_json jsonb` (structured response/tool result)
- `context_hash text`
- `model_provider text`
- `model_id text`
- `created_at timestamptz`

## 5.2 Notebook integration
- Add notebook entry type:
  - `entry_type: "copilot_insight" | "tool_execution"`
- link to source message id

---

## 6) API Contract (v1)

## POST /api/lab/copilot/chat
### Request
```json
{
  "prompt": "Why does P04637 have disordered regions?",
  "mode": "ask",
  "learningLevel": "intermediate",
  "labContext": {
    "activeStructure": {"id":"P04637","source":"alphafold"},
    "recentExperiments": []
  }
}
```

### Response
```json
{
  "success": true,
  "answer": {
    "observation": "...",
    "hypothesis": "...",
    "mechanisticRationale": "...",
    "testPlan": ["..."],
    "confidence": 0.78,
    "limitations": ["..."],
    "nextStep": {"action":"run_sequence_analysis","params":{"sequence":"..."}},
    "citations": [{"title":"...","url":"...","sourceType":"database"}]
  }
}
```

## POST /api/lab/copilot/run-tool
### Request
```json
{
  "tool": "dock_ligand",
  "params": {"pdbId":"4HHB","smiles":"CCO","seed":42}
}
```

### Response
```json
{
  "success": true,
  "jobId": "uuid",
  "status": "running"
}
```

---

## 7) Prompting / Model Policy

- System prompt: “Automated Scientist Operator”
- Must separate:
  - observation vs intervention vs counterfactual
- Must avoid overclaiming:
  - always include limitations/confidence
- Must reference evidence source class:
  - PDB / AlphaFold / UniProt / literature
- Reject medical diagnosis framing; provide educational/research framing

---

## 8) Security / Safety

- Auth required on all copilot routes
- Validate tool params with zod
- rate-limit copilot endpoints per user
- max prompt/context size caps
- sanitize markdown output
- no shell execution from copilot path
- explicit provider-key handling (BYOK/server key)

---

## 9) Observability

Track:
- copilot request count
- tool-call success/failure rate
- avg response time
- schema validation failures
- user action follow-through rate (`nextStep` executed)

---

## 10) Acceptance Criteria (must pass)

1. User asks protein question with loaded structure → structured answer returned with confidence + limitations  
2. User asks “run docking” → job created and result appears in notebook  
3. Copilot responses always valid against schema  
4. Provider/key errors shown with actionable UI guidance  
5. All copilot messages persisted and reloadable  
6. No silent failures in UI  
7. Unit + integration tests green

---

## 11) Test Plan

- Unit:
  - context builder
  - schema validators
  - tool intent parser
- API:
  - unauthorized = 401
  - invalid payload = 400
  - valid structured response = 200
- Integration:
  - ask -> response render
  - run-tool -> job poll -> notebook entry
- Regression:
  - existing Labs fetch/sequence/docking still work

---

## 12) Delivery Plan

### Phase C1 (2–3 days)
- UI panel + `/copilot/chat` + structured responses + persistence

### Phase C2 (2 days)
- tool-action bridge + notebook linking + action chips

### Phase C3 (1–2 days)
- polish, tests, error UX, docs/signoff

---

If you want, I’ll now turn this into an actual repo artifact:
- `docs/specs/LAB-COPILOT-IMPLEMENTATION-SPEC.md`
- plus checklist file for execution tracking.