# Orchestration MCP Server Spec

## Purpose

A Model Context Protocol server that enforces the 8 guardrails of the Agentic-Spec-Driven-Audit framework as callable tools. Any agent (Gemini, Claude, GPT) can call these tools to validate task headers, check notation compliance, audit claims, track benchmark status, and manage the delegation chain.

- **Project:** MASA — Methods of Automated Scientific Analysis
- **Author:** Rhine Lesther Tague
- **Spec Author:** Claude Opus 4.6
- **Date:** March 13, 2026
- **Classification:** Internal Engineering Document

---

## 1. Server Identity

```yaml
name: "masa-orchestration"
version: "1.0.0"
description: "Guardrail enforcement and delegation management for the MASA multi-agent causal engine build"
transport: "stdio"  # or "sse" for remote agents
runtime: "node"     # TypeScript on Node.js
```

---

## 2. Tool Catalog

### 2.1 `validate_task_header`

**Purpose:** Enforces Guardrail 3 — every task must map to the spec with a complete 7-field header.

**Input:**
```typescript
interface ValidateTaskHeaderInput {
  taskId: string;                    // e.g., "TASK-001"
  taskType: string;                  // "Implementation" | "Testing" | "Integration"
  category: string;                  // Must match one of the core engine categories
  specMapping: string;               // "Causal Engine v1.0 / Section [N]"
  coreOrNonCore: string;             // "Core" | "Non-Core"
  formalArtifactExpected: string;    // Name of the artifact
  benchmarkImpact: string;           // "B1, B2" or "none — infrastructure"
  claimBoundary: string;             // What the task does NOT do
}
```

**Validation Rules:**
- `taskType` must be one of: `Implementation`, `Testing`, `Integration`
- `category` must be one of:
  ```
  variable/model representation
  graph representation
  structural equation representation
  intervention semantics
  graph mutilation execution
  forward solver
  benchmark suite
  validation harness
  query parser
  explanation layer        (non-core)
  orchestration            (non-core)
  documentation            (non-core)
  ```
- `specMapping` must reference a section number between 1 and 13
- `coreOrNonCore` must be `Core` or `Non-Core`
- `claimBoundary` must not be empty
- If `coreOrNonCore` is `Core`, `formalArtifactExpected` must not be empty

**Output:**
```typescript
interface ValidateTaskHeaderOutput {
  valid: boolean;
  errors: string[];           // Empty if valid
  warnings: string[];         // Non-blocking suggestions
  normalizedHeader: object;   // Cleaned/normalized version
}
```

---

### 2.2 `check_notation_compliance`

**Purpose:** Enforces Guardrail 7 (claim discipline) — scans files for forbidden notation patterns.

**Input:**
```typescript
interface CheckNotationInput {
  /** Absolute path to file or directory to scan */
  path: string;
  /** File glob pattern (default: "**/*.ts") */
  glob?: string;
  /** Scope of the check */
  scope: "v1.0-engine" | "v1.1-deferred" | "all";
}
```

**Forbidden Patterns (v1.0-engine scope):**
```yaml
notation_violations:
  - pattern: 'P\(.*\|.*do\('
    severity: "error"
    message: "Distributional notation P(Y|do(X)) forbidden in v1.0. Use Y_{do(X=x)}"

  - pattern: 'causalInference|causal_inference|CausalInference'
    severity: "error"
    message: "Overclaim: use 'intervention_execution' or 'structural_equation_solver'"

  - pattern: '\bestimate[sd]?\b'
    severity: "warning"
    message: "v1.0 computes exact values, not estimates. Consider 'compute' or 'calculate'"
    context_check: true  # Only flag if in engine module, not explanation layer

  - pattern: '\binfer[sr]?\b|\binference\b'
    severity: "warning"
    message: "v1.0 does not infer. Consider 'compute' or 'solve'"
    context_check: true

  - pattern: 'adjustment|backdoor|frontdoor'
    severity: "error"
    message: "Adjustment logic is deferred to v1.1. Not in v1.0 engine scope"

  - pattern: 'identifiab'
    severity: "warning"
    message: "Identifiability is tautological under v1.0 assumptions. Reframe as model completeness validation"

  - pattern: 'counterfactual'
    severity: "error"
    message: "Counterfactual reasoning deferred to v2+. Not in v1.0 scope"
```

**Output:**
```typescript
interface CheckNotationOutput {
  compliant: boolean;
  totalFiles: number;
  filesScanned: number;
  violations: Array<{
    file: string;
    line: number;
    column: number;
    match: string;
    pattern: string;
    severity: "error" | "warning";
    message: string;
    suggestion: string;
  }>;
  summary: {
    errors: number;
    warnings: number;
  };
}
```

---

### 2.3 `audit_claims`

**Purpose:** Enforces Guardrails 1, 6, 7, 8 — audits code, comments, and documentation for overclaims.

**Input:**
```typescript
interface AuditClaimsInput {
  /** Path to file or directory */
  path: string;
  /** What to audit */
  target: "code-comments" | "function-names" | "variable-names" | "jsdoc" | "all";
  /** Current engine state for context */
  benchmarksPassing: number;  // 0-6
}
```

**Claim Rules:**

| Current State | Allowed Claims | Forbidden Claims |
|--------------|----------------|------------------|
| 0 benchmarks | "types defined", "infrastructure" | "solver works", "engine operational" |
| 1-5 benchmarks | "partially validated", "N/6 benchmarks pass" | "validated", "complete", "production-ready" |
| 6 benchmarks | "all benchmarks pass", "v1.0 complete" | "causal inference engine", "estimates causal effects" |

**Name Audit Rules:**
```yaml
function_names:
  forbidden:
    - pattern: 'infer.*Caus'
      suggestion: 'compute{Variable}UnderIntervention'
    - pattern: 'estimateCausal'
      suggestion: 'computeInterventionResult'
    - pattern: 'causalInference'
      suggestion: 'interventionExecution'
  preferred:
    - 'mutilateGraph'
    - 'forwardSubstitute'
    - 'computeIntervention'
    - 'topologicalSort'
    - 'validateAcyclicity'

variable_names:
  forbidden:
    - pattern: 'causalEffect'
      suggestion: 'interventionResult'
    - pattern: 'inferredValue'
      suggestion: 'computedValue'
  preferred:
    - 'interventionResult'
    - 'mutilatedDag'
    - 'computedValue'
    - 'equationTrace'
```

**Output:**
```typescript
interface AuditClaimsOutput {
  clean: boolean;
  overclaims: Array<{
    file: string;
    line: number;
    type: "function-name" | "variable-name" | "comment" | "jsdoc";
    current: string;
    problem: string;
    suggestion: string;
    severity: "error" | "warning";
  }>;
  trackClassification: {
    trackA_core: string[];       // Files with real engine code
    trackB_support: string[];    // Files with orchestration/explanation
    unclassified: string[];      // Files needing classification
  };
}
```

---

### 2.4 `benchmark_status`

**Purpose:** Enforces Guardrail 4 — tracks benchmark state and prevents premature consolidation.

**Input:**
```typescript
interface BenchmarkStatusInput {
  /** Path to the test directory or test file */
  testPath: string;
  /** Run the tests or just report last known state */
  action: "run" | "report";
}
```

**Output:**
```typescript
interface BenchmarkStatusOutput {
  passing: number;
  failing: number;
  notImplemented: number;
  benchmarks: {
    B1: BenchmarkResult;
    B2: BenchmarkResult;
    B3: BenchmarkResult;
    B4: BenchmarkResult;
    B5: BenchmarkResult;
    B6: BenchmarkResult;
  };
  llmIndependence: "verified" | "violation" | "unchecked";
  notationCompliance: "compliant" | "violation" | "unchecked";
  honestCapabilityStatement: string;  // Auto-generated based on state
  consolidationEligible: boolean;     // True only if all 6 pass + LLM-independent + notation-compliant
}

interface BenchmarkResult {
  status: "passing" | "failing" | "not_implemented" | "broken";
  expectedValue: number;
  actualValue?: number;
  trace?: Record<string, number>;
  errorMessage?: string;
  lastRun?: string;  // ISO timestamp
}
```

**Honest Capability Statement Generation:**
```yaml
rules:
  - passing == 0 AND no_code: "No computation implemented. The engine does not yet exist."
  - passing == 0 AND code_exists: "Engine code exists but no benchmarks pass. Unvalidated prototype."
  - passing > 0 AND passing < 6: "Partially validated: {N}/6 benchmarks pass ({list})."
  - passing == 6 AND llm_independent AND notation_compliant: "v1.0 complete: deterministic intervention executor, all 6 benchmarks pass."
  - passing == 6 AND NOT llm_independent: "WARNING: All benchmarks pass but LLM is in the computation path. Not a real engine."
```

---

### 2.5 `llm_independence_check`

**Purpose:** Enforces Guardrail 2 — the LLM cannot be the hidden reasoner.

**Input:**
```typescript
interface LLMIndependenceInput {
  /** Path to the engine source directory */
  enginePath: string;
  /** Directories to exclude (e.g., explanation layer) */
  excludePaths?: string[];
}
```

**Detection Patterns:**
```yaml
llm_api_calls:
  - pattern: 'openai|OpenAI|anthropic|Anthropic|GoogleGenerativeAI|gemini'
    location: "import statements"
    severity: "error"

  - pattern: 'createChatCompletion|messages\.create|generateContent'
    location: "function calls"
    severity: "error"

  - pattern: 'generateDoPrompt|buildPrompt|promptTemplate'
    location: "prompt construction in engine modules"
    severity: "error"
    note: "Allowed in explanation layer, forbidden in engine core"

  - pattern: 'fetch.*api\.openai|fetch.*api\.anthropic|fetch.*generativelanguage'
    location: "direct API calls"
    severity: "error"
```

**Output:**
```typescript
interface LLMIndependenceOutput {
  independent: boolean;
  violations: Array<{
    file: string;
    line: number;
    pattern: string;
    context: string;       // Surrounding code
    inEnginePath: boolean;  // true = violation, false = acceptable (explanation layer)
  }>;
  engineFiles: string[];          // Files classified as engine core
  explanationFiles: string[];     // Files classified as explanation layer
  unclassifiedFiles: string[];    // Files needing manual classification
}
```

---

### 2.6 `delegation_chain_state`

**Purpose:** Tracks the Observe → Think → Act delegation pipeline state.

**Input:**
```typescript
interface DelegationStateInput {
  action: "get" | "update";
  /** For updates: */
  taskId?: string;
  newStatus?: "delegated" | "in_review" | "approved" | "in_progress" | "delivered" | "verified" | "rejected";
  agent?: "gemini" | "claude" | "gpt";
  notes?: string;
}
```

**State Machine:**
```
                Gemini                Claude                GPT                 Gemini
[new task] → [delegated:think] → [in_review] → [approved] → [delegated:act] → [in_progress]
                                      ↓                                              ↓
                                  [blocked]                                     [delivered]
                                                                                     ↓
                                                                              [verified] or [rejected]
                                                                                     ↓           ↓
                                                                            [consolidated]   [rework]
```

**Output:**
```typescript
interface DelegationStateOutput {
  tasks: Array<{
    taskId: string;
    taskType: string;
    currentStatus: string;
    currentAgent: string;
    history: Array<{
      status: string;
      agent: string;
      timestamp: string;
      notes: string;
    }>;
  }>;
  pipeline: {
    thinkQueue: string[];      // Tasks waiting for Claude
    actQueue: string[];        // Tasks waiting for GPT
    verifyQueue: string[];     // Deliverables waiting for Gemini verification
  };
  blockers: string[];          // Tasks that are blocked with reasons
}
```

**Persistence:** State stored in `Agentic-Spec-Driven-Audit/.orchestration-state.json`

---

### 2.7 `generate_consolidation`

**Purpose:** Enforces Guardrail 6 — produces Gemini's consolidation statement from verified data, not narrative.

**Input:**
```typescript
interface GenerateConsolidationInput {
  cycleNumber: number;
  /** The tool gathers the rest from benchmark_status + delegation_chain_state + check_notation */
}
```

**Output:**
```typescript
interface GenerateConsolidationOutput {
  consolidationStatement: string;  // Full formatted statement
  classification: "validated_core" | "unvalidated_prototype" | "non_core_support" | "research_conceptual" | "speculative";
  benchmarkEvidence: {
    passing: string[];
    failing: string[];
    notImplemented: string[];
  };
  overclaims: string[];
  blockers: string[];
  honestCapabilityStatement: string;
}
```

**Classification Logic:**
```yaml
validated_core:
  requires: benchmarks_passing > 0 AND llm_independent AND notation_compliant AND formal_artifact_exists
unvalidated_prototype:
  requires: code_exists AND (benchmarks_passing == 0 OR NOT llm_independent)
non_core_support:
  requires: deliverable_is_infrastructure OR deliverable_is_documentation
research_conceptual:
  requires: deliverable_is_analysis_only
speculative:
  default: true  # If none of the above match
```

---

### 2.8 `validate_assumption_envelope`

**Purpose:** Enforces the v1.0 assumption boundary — catches scope creep.

**Input:**
```typescript
interface ValidateEnvelopeInput {
  /** Path to file or directory to check */
  path: string;
}
```

**Detection Patterns:**
```yaml
envelope_violations:
  hidden_confounders:
    patterns: ['hidden.*confounder', 'unobserved.*cause', 'latent.*variable', 'U_[A-Z](?!_i\s*=\s*0)']
    severity: "error"
    message: "Hidden confounders are outside v1.0 scope"

  nonlinear_equations:
    patterns: ['Math\.pow', 'Math\.exp', 'Math\.log', '\*\*\s*\d', 'polynomial', 'nonlinear']
    severity: "warning"
    message: "Nonlinear equations deferred to v1.1. v1.0 is linear only."
    context_check: true  # Don't flag in comments about future work

  distributional:
    patterns: ['noise', 'random', 'stochastic', 'sample\(', 'distribution', 'variance']
    severity: "error"
    message: "Distributional/stochastic computation deferred to v2+. v1.0 is deterministic."

  cyclic:
    patterns: ['feedback.*loop', 'cyclic.*graph', 'bidirectional.*cause']
    severity: "error"
    message: "Cyclic graphs are outside v1.0 scope. DAGs only."

  semi_markovian:
    patterns: ['semi.?[Mm]arkov', 'bidirected.*edge', 'ADMG']
    severity: "error"
    message: "Semi-Markovian models are outside scope entirely."
```

**Output:**
```typescript
interface ValidateEnvelopeOutput {
  withinEnvelope: boolean;
  violations: Array<{
    file: string;
    line: number;
    category: "hidden_confounders" | "nonlinear" | "distributional" | "cyclic" | "semi_markovian";
    match: string;
    severity: "error" | "warning";
    message: string;
    recommendation: string;  // "move to v1.1 deferred" or "remove from v1.0 scope"
  }>;
}
```

---

## 3. Server Architecture

```
masa-orchestration/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                        # MCP server entry point (stdio transport)
│   ├── server.ts                       # Tool registration and dispatch
│   ├── tools/
│   │   ├── validate-task-header.ts     # Tool 2.1
│   │   ├── check-notation.ts           # Tool 2.2
│   │   ├── audit-claims.ts             # Tool 2.3
│   │   ├── benchmark-status.ts         # Tool 2.4
│   │   ├── llm-independence.ts         # Tool 2.5
│   │   ├── delegation-state.ts         # Tool 2.6
│   │   ├── generate-consolidation.ts   # Tool 2.7
│   │   └── validate-envelope.ts        # Tool 2.8
│   ├── patterns/
│   │   ├── notation-patterns.ts        # Forbidden/allowed notation regex
│   │   ├── naming-patterns.ts          # Function/variable name rules
│   │   ├── envelope-patterns.ts        # Assumption boundary patterns
│   │   └── llm-patterns.ts             # LLM API detection patterns
│   ├── state/
│   │   └── delegation-store.ts         # JSON file-backed state management
│   └── utils/
│       ├── file-scanner.ts             # Glob + grep over codebase
│       └── capability-statement.ts     # Auto-generates honest capability string
├── tests/
│   ├── validate-task-header.test.ts
│   ├── check-notation.test.ts
│   ├── audit-claims.test.ts
│   ├── benchmark-status.test.ts
│   ├── llm-independence.test.ts
│   ├── delegation-state.test.ts
│   ├── generate-consolidation.test.ts
│   └── validate-envelope.test.ts
└── config/
    ├── guardrails.json                 # The 8 guardrails as structured data
    ├── engine-categories.json          # Valid core engine categories
    └── notation-rules.json             # All forbidden/allowed patterns
```

---

## 4. Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "glob": "^10.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0"
  }
}
```

**No other dependencies.** The server is a validation/scanning tool, not a computation engine. Keep it minimal.

---

## 5. MCP Configuration

To register with Claude Code, add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "masa-orchestration": {
      "command": "node",
      "args": ["path/to/masa-orchestration/dist/index.js"],
      "env": {
        "AUDIT_ROOT": "/Users/lesz/Documents/Synthetic-Mind/Agentic-Spec-Driven-Audit",
        "ENGINE_ROOT": "/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src"
      }
    }
  }
}
```

For Gemini (remote transport via SSE):
```json
{
  "transport": "sse",
  "url": "http://localhost:3100/mcp"
}
```

---

## 6. Tool-to-Guardrail Mapping

| Tool | Guardrails Enforced | Primary User |
|------|-------------------|--------------|
| `validate_task_header` | G3 (spec mapping) | Gemini (before delegation) |
| `check_notation_compliance` | G7 (claim discipline) | Claude (audits), Gemini (verifies) |
| `audit_claims` | G1, G6, G7, G8 (artifacts, track separation, claims, narrow truth) | Claude (primary), Gemini (verification) |
| `benchmark_status` | G4 (benchmark before consolidation) | Gemini (verification), GPT (self-check) |
| `llm_independence_check` | G2 (LLM not hidden reasoner) | Claude (pre-review), Gemini (verification) |
| `delegation_chain_state` | All (workflow management) | Gemini (primary), all agents (read) |
| `generate_consolidation` | G4, G5, G6 (benchmark, reflection, track separation) | Gemini (exclusive) |
| `validate_assumption_envelope` | G8 (narrow truth), spec compliance | Claude (spec audits), Gemini (verification) |

---

## 7. Example Tool Calls

### Gemini validates a task header before delegating to GPT:
```json
{
  "tool": "validate_task_header",
  "input": {
    "taskId": "TASK-001",
    "taskType": "Implementation",
    "category": "variable/model representation",
    "specMapping": "Causal Engine v1.0 / Section 4",
    "coreOrNonCore": "Core",
    "formalArtifactExpected": "TypedSCM, StructuralEquation, CausalQuery, CausalResult interfaces",
    "benchmarkImpact": "none — infrastructure enabling B1-B6",
    "claimBoundary": "Types only. No computation, no graph operations, no solver."
  }
}
```

### Claude checks notation after GPT delivers code:
```json
{
  "tool": "check_notation_compliance",
  "input": {
    "path": "/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/types/scm.ts",
    "scope": "v1.0-engine"
  }
}
```

### Gemini runs full benchmark verification:
```json
{
  "tool": "benchmark_status",
  "input": {
    "testPath": "/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/src/__tests__/causal-engine",
    "action": "run"
  }
}
```

### Gemini generates consolidation after a cycle:
```json
{
  "tool": "generate_consolidation",
  "input": {
    "cycleNumber": 1
  }
}
```

---

## 8. Testing Strategy

Every tool gets tests that verify:

1. **Happy path** — Valid input produces correct output
2. **Validation failures** — Invalid input returns descriptive errors
3. **Edge cases** — Empty files, missing directories, partial state
4. **Pattern accuracy** — Each regex pattern has positive and negative test cases
5. **State consistency** — Delegation state survives restarts (file-backed)

**Critical test: The notation check must not produce false positives.** For example:
- `// This will be P(Y|do(X)) in v2+` → warning (in a comment about future work, flag but don't error)
- `const result = P_Y_do_X` → error (used as a variable name)
- `// v1.0 uses Y_{do(X=x)} notation` → no flag (correct notation mentioned)

---

## 9. Claim Boundary

This spec defines a **validation and workflow management server**. It:
- Scans code for pattern violations
- Tracks delegation state
- Generates consolidation reports from verified data
- Enforces naming and notation rules

It does **not**:
- Compute causal effects (that's the engine)
- Make architectural decisions (that's Claude)
- Write code (that's GPT)
- Determine project strategy (that's Gemini)

The server is a tool, not an agent. It answers questions about compliance. Agents decide what to do with the answers.
