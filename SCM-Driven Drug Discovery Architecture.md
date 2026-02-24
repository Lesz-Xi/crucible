# SCM-Driven Advanced Drug Discovery Architecture: Comprehensive Blueprint

## Pillar 1: SCM-Driven "Automated Scientist" Orchestration

### From Stochastic ReAct to Causal Agent Loops

The standard ReAct (Reasoning + Acting) pattern operates as a stochastic cycle: the LLM reasons about what to do, selects a tool, observes results, and loops until convergence. This is fundamentally correlational — the LLM selects actions based on surface-level pattern matching from its training distribution, not from a principled understanding of *why* one experiment follows another. For drug discovery, this is dangerous: an LLM might skip toxicity screening because training data correlated high binding affinity with "good results," ignoring the causal chain that toxicity is a confounding variable.[^1]

The CausalAgent paradigm formalizes the solution: every agent-environment interaction is modeled as an SCM equation, with agent state, memory, observation, and action variables. Interventions are carried out via the do-operator \( do(X = x) \), enabling formal causal queries, counterfactuals, and sensitivity analysis. In practice for Synthetic-Mind, this means replacing the flat "pick-next-tool" decision with a structured graph query.[^2]

### Architecture: The CausalPlan Pattern Applied to Chemistry

The CausalPlan framework (Nguyen et al., 2025) provides the most directly implementable pattern. It operates in two phases:[^3]

**Phase 1 — Causal Action Structure Learning**: Collect trajectory data from domain-expert workflows (e.g., medicinal chemists running hit-to-lead campaigns). Factorize molecular pipeline states into binary vectors: \( s_t \in \{0,1\}^S \) (e.g., `has_SMILES`, `docking_complete`, `ADMET_passed`, `toxicity_flagged`). Train a Structural Causal Action (SCA) model:

\[ a_i = f_i(\text{Pa}_{\mathcal{G}}(a_i), \varepsilon_{a_i}) \]

where \( f_i \) is a neural network parameterized by \( \delta \), and \( \eta_{ji} \) encodes binary adjacency indicators for causal edges. The output is a **Causal Action Matrix** \( \mathcal{M} \in \mathbb{R}^{A \times (S+A)} \) that encodes the causal score of selecting each pipeline action given the current state and past actions.[^3]

**Phase 2 — Agent Planning with Causal Knowledge**: At each step, the LLM (Claude 3.5 Sonnet) proposes candidate actions \( \mathcal{A}' \). These are reweighted using causal scores:

\[ p_f(a'_m) = \gamma \cdot p_a(a'_m) + (1 - \gamma) \cdot p_c(a'_m) \]

where \( \gamma \in [0.4, 0.7] \) controls the balance between LLM confidence and causal prior. If the LLM hallucinates an invalid action (e.g., proposing retrosynthesis before target validation), the **Causal Backup Action** module takes over with a greedy fallback: \( a_t = \arg\max_{a \in \mathcal{A}} p_c(a) \).[^3]

### Embedding the Drug Discovery DAG

For Synthetic-Mind, the causal graph for a standard hit-to-lead pipeline would encode nodes and directed edges such as:

```
Target_Validation → Library_Enumeration → Virtual_Screening →
  ADMET_Prediction → Molecular_Docking → Toxicity_Assessment →
  Lead_Optimization → Selectivity_Panel
```

Critical confounding variables must be made explicit:

- **Solubility** confounds both **Binding Affinity** and **Bioavailability** — the LLM must condition on solubility before interpreting docking scores.
- **Lipophilicity** (logP) confounds **Membrane Permeability** and **Metabolic Stability** — the do-calculus query \( P(\text{Bioavailability} \mid do(\text{logP} = x)) \) determines whether a lipophilicity change causally improves or merely correlates with improved absorption.[^4][^5]

### Single-Turn JSON vs. Native Tool-Calling

The comparison is decisive:

| Dimension | Single-Turn JSON Schema | Native Tool-Calling (LangGraph ReAct) | SCM-Governed Tool-Calling |
|---|---|---|---|
| **Autonomy** | User triggers each step manually | LLM autonomously loops until done | LLM loops, but constrained by \( \mathcal{M} \) |
| **Provenance** | None — steps are disconnected | Trace of tool calls exists but is correlational | Each action traceable to SCM node + causal score |
| **Error Recovery** | Manual rollback | LLM may hallucinate recovery | Causal Backup Action module provides principled fallback[^3] |
| **Confounding** | Ignored entirely | Addressed only if LLM spontaneously reasons about it | Explicitly modeled in DAG; LLM *must* condition on confounders[^2] |

For the workflow "Generate 100 ligands → Run ADMET → Dock top 10 → Score," the SCM-governed approach enforces: (1) ADMET filtering is a causal prerequisite to docking (not optional), (2) docking scores are only interpreted conditional on ADMET-predicted solubility, and (3) if ADMET returns all failures, the causal graph triggers backtracking to library enumeration rather than proceeding with empty inputs.

### Implementation Stack

- **LangGraph** (Python): Production-grade graph-based agent orchestration. Supports stateful nodes, conditional edges, human-in-the-loop interrupts, and time-travel debugging. Each node in the graph maps to an SCM variable.[^6][^7]
- **DoWhy / CausalNex** (Python): For constructing and querying the causal DAG. DoWhy implements Pearl's do-calculus and provides identification, estimation, and refutation of causal effects.
- **Anthropic Tool Use API**: Claude 3.5 Sonnet natively supports tool calling with structured JSON schemas. AstraZeneca's evaluation found Claude-3.5-Sonnet outperforms alternatives for orchestrating chemistry tools.[^8]

***

## Pillar 2: The Scientific Compute Engine (HPC & Microservices)

### The Vercel Boundary Problem

Vercel serverless functions have a maximum timeout of 5 minutes (Pro plan) and are optimized for I/O-bound interactive workloads, not GPU-heavy scientific compute. A single AutoDock Vina run on a flexible ligand takes 10–60 minutes; an OpenMM molecular dynamics trajectory runs for hours. The solution: **Vercel handles the frontend and API gateway only**. All scientific compute is externalized to a dedicated backend.[^9][^10][^11]

### Reference Architecture

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND (Vercel)                                  │
│  Next.js App Router → React Server Components       │
│  ↕ WebSocket/SSE for streaming progress             │
│  ↕ REST/gRPC to Compute API                         │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  ORCHESTRATION LAYER                                │
│  Python FastAPI (API Gateway)                       │
│  Temporal.io (Workflow Engine)                      │
│  ↕ Task queues per compute type                     │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  COMPUTE WORKERS (GPU Cluster)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ AutoDock │  │ OpenMM   │  │ RDKit    │         │
│  │ Vina GPU │  │ MD Sim   │  │ ADMET    │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│  Each worker: Docker container + NVIDIA GPU         │
│  Managed via Kubernetes + NVIDIA MPS                │
└─────────────────────────────────────────────────────┘
```

### Temporal.io for Durable Scientific Workflows

Temporal is the preferred orchestration engine for drug discovery pipelines. **Eli Lilly transformed a monolithic Django application into Temporal-orchestrated microservices**, reducing antibody sequence analysis from days to hours. Temporal provides:[^12]

- **Exactly-once execution semantics**: Critical for reproducing scientific results. If a docking worker crashes mid-computation, Temporal replays the workflow from the last checkpoint — not from scratch.[^13]
- **Event-sourcing architecture**: Every state transition is logged as a durable event, providing complete provenance by default.[^14]
- **Long-running workflow support**: Workflows can run for hours/days with heartbeat-based liveness checks, unlike Celery which requires manual timeout management.[^13]

A Temporal workflow for virtual screening:

```python
@workflow.defn
class VirtualScreeningWorkflow:
    @workflow.run
    async def run(self, target_pdb: str, library_id: str) -> ScreeningResult:
        # Step 1: Library enumeration (CPU-bound, ~minutes)
        compounds = await workflow.execute_activity(
            enumerate_library, library_id,
            start_to_close_timeout=timedelta(minutes=30)
        )
        # Step 2: ADMET filtering (CPU-bound, ~minutes)
        filtered = await workflow.execute_activity(
            run_admet_filter, compounds,
            start_to_close_timeout=timedelta(minutes=60)
        )
        # Step 3: Molecular docking (GPU-bound, ~hours)
        docking_results = await workflow.execute_activity(
            run_autodock_vina_batch, target_pdb, filtered,
            start_to_close_timeout=timedelta(hours=4),
            heartbeat_timeout=timedelta(minutes=5)
        )
        return ScreeningResult(hits=rank_by_affinity(docking_results))
```

### GPU Worker Implementation

Each compute tool runs as a containerized Temporal Activity:

- **AutoDock-GPU**: The GPU-accelerated fork of AutoDock4 runs on Kubernetes with NVIDIA MPS (Multi-Process Service) to maximize GPU utilization. Benchmarks show running multiple small docking jobs concurrently on a single GPU via MPS improves throughput significantly over serial execution.[^15][^16]
- **OpenMM**: GPU-accelerated molecular dynamics with a Python API. Version 8.4.0 (Oct 2025) supports CUDA and OpenCL. For cloud deployment, solutions like Fovus provide serverless HPC that auto-selects optimal CPU-GPU configurations.[^17][^18]
- **RDKit (Python)**: For SMILES parsing, fingerprinting, conformer generation, descriptor calculation, and ADMET property prediction. Runs on CPU workers.[^19]

### Handling Large Payloads

PDB trajectories (100s of MB) and SDF libraries (GBs) must not flow through the LLM context or the Vercel frontend:

1. **Object Storage (S3/Supabase Storage)**: All large files are stored in S3-compatible storage. Workers receive presigned URLs, not raw payloads.
2. **Signed URL Pattern**: FastAPI generates a presigned upload URL → the client uploads directly to S3 → the worker downloads from S3 using the same signed URL → results are uploaded back to S3 → the frontend receives only a result summary + download URL.
3. **Streaming Progress**: WebSocket connections from the Next.js client to FastAPI relay real-time progress (e.g., "Docking compound 47/100, current best: -9.2 kcal/mol").

***

## Pillar 3: Small Molecule State & UI Architecture

### React/Web Ecosystem for Chemistry

| Library | Purpose | Format | Integration Notes |
|---|---|---|---|
| **RDKit.js** | Full cheminformatics: SMILES parsing, substructure search, fingerprinting, 2D depiction | WASM (C++ compiled to WebAssembly) | Official RDKit JS distribution. Renders to SVG or HTML5 Canvas. Supports highlighting, stereo[^20] |
| **SmilesDrawer** | Lightweight SMILES → 2D structure rendering | Pure JS, zero dependencies | Renders thousands of molecules fast. Ideal for compound tables/grids[^21] |
| **3Dmol.js** | WebGL 3D molecular visualization | JS, WebGL | Supports PDB, SDF, MOL2, XYZ, CIF. Sphere, stick, cartoon, surface styles. Interactive picking and labels[^22] |
| **Mol\*** (Molstar) | Production-grade macromolecular 3D viewer | TypeScript, React-based UI, WebGL | Primary viewer for RCSB PDB and PDBe. Handles huge structures (cell-level models), MD trajectories, density maps. Has `react-molstar-wrapper` npm package[^23][^24][^25] |
| **NGL Viewer** | Legacy 3D viewer | JS, WebGL | **Deprecated by RCSB in favor of Mol\***. Avoid for new projects[^26] |

**Recommended Stack for Synthetic-Mind**:
- **Compound tables/lists**: SmilesDrawer (fast 2D rendering of hundreds of structures)
- **Single compound detail view**: RDKit.js (full cheminformatics: substructure highlighting, descriptor calculation client-side)
- **Protein-ligand complex 3D viewer**: Mol* via `react-molstar-wrapper` (production-grade, handles AlphaFold structures natively)[^24]
- **Quick ligand 3D inspection**: 3Dmol.js (lightweight, easy to embed)[^22]

### PostgreSQL/Supabase Schema for Chemical Libraries

The **RDKit PostgreSQL cartridge** is the industry standard for chemical database operations. It is supported on Amazon Aurora PostgreSQL and can be installed on any PostgreSQL instance including Supabase (via custom extensions). It provides native `mol`, `qmol`, `sfp`, and `bfp` data types.[^27][^28]

#### Core Schema

```sql
-- Enable RDKit extension
CREATE EXTENSION IF NOT EXISTS rdkit;

-- Compounds table
CREATE TABLE compounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    smiles TEXT NOT NULL,
    canonical_smiles TEXT GENERATED ALWAYS AS (mol_to_smiles(mol_from_smiles(smiles))) STORED,
    mol MOL GENERATED ALWAYS AS (mol_from_smiles(smiles)) STORED,
    morgan_fp BFP GENERATED ALWAYS AS (morganbv_fp(mol_from_smiles(smiles))) STORED,
    inchi TEXT,
    inchi_key TEXT,
    molecular_weight FLOAT GENERATED ALWAYS AS (mol_amw(mol_from_smiles(smiles))) STORED,
    logp FLOAT,
    source_library TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- GiST index for substructure search
CREATE INDEX idx_compounds_mol ON compounds USING gist(mol);
-- GiST index for similarity search
CREATE INDEX idx_compounds_fp ON compounds USING gist(morgan_fp);

-- 3D Conformers table (one compound → many conformers)
CREATE TABLE conformers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compound_id UUID REFERENCES compounds(id),
    conformer_index INT,
    energy FLOAT,
    mol_block TEXT NOT NULL,  -- SDF/MOL block with 3D coordinates
    source TEXT,  -- 'rdkit_etkdg', 'openmm_minimized', etc.
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Experiments table (provenance-first)
CREATE TABLE experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_type TEXT NOT NULL,  -- 'docking', 'admet', 'md_simulation'
    scm_node_id TEXT NOT NULL,  -- Links to SCM causal graph node
    parent_experiment_id UUID REFERENCES experiments(id),
    input_compounds UUID[] NOT NULL,
    parameters JSONB NOT NULL,
    tool_version TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    result_summary JSONB,
    result_artifact_url TEXT,  -- S3 presigned URL for large outputs
    trace_hash TEXT  -- SHA-256 of (parameters + input_hashes + tool_version)
);
```

#### Chemical Search Queries

```sql
-- Substructure search: find all compounds containing a benzimidazole core
SELECT id, smiles, molecular_weight
FROM compounds
WHERE mol @> 'c1ccc2[nH]cnc2c1'::qmol;

-- Tanimoto similarity search: find compounds similar to a query (threshold 0.7)
SET rdkit.tanimoto_threshold = 0.7;
SELECT id, smiles,
       tanimoto_sml(morgan_fp, morganbv_fp(mol_from_smiles('CCOc1ccc(NC(=O)c2ccccc2)cc1'))) AS similarity
FROM compounds
WHERE morgan_fp % morganbv_fp(mol_from_smiles('CCOc1ccc(NC(=O)c2ccccc2)cc1'))
ORDER BY similarity DESC
LIMIT 20;
```

The RDKit cartridge processes ~1 million compounds/sec for similarity searches on a single CPU.[^29][^30]

***

## Pillar 4: The Isomorphic Labs / AlphaFold 3 Synthesis

### AlphaFold 3's Architectural Philosophy

AlphaFold 3 represents a fundamental philosophical shift: **from physics-based simulation to generative AI for structure prediction**. Its architecture has three core components:[^31][^32]

1. **Improved Evoformer / Pairformer**: A custom Transformer with triangular attention that processes evolutionary (MSA) and pairwise relationship information. The Pairformer simplification removes MSA representation entirely, focusing on pair and single representations for efficiency.[^31]
2. **Diffusion Module**: The defining innovation. Starting from a "cloud of atoms" (random 3D coordinates), the model iteratively denoises over many steps to converge on the most accurate molecular structure. This directly outputs raw atom coordinates, eliminating complex rotational adjustments needed by AF2.[^33][^31]
3. **Iterative Refinement ("Recycling")**: Outputs are recursively fed back into the network for continuous refinement.[^31]

AlphaFold 3 is the **first AI system to outperform physics-based tools** for biomolecular structure prediction, achieving 50% better accuracy than traditional docking methods on the PoseBusters benchmark. It models proteins, DNA, RNA, small molecule ligands, ions, and chemical modifications as a unified system.[^32][^31]

### What Isomorphic Labs Actually Does

Isomorphic Labs uses AlphaFold 3 as one component within a broader AI-powered platform. Their public approach reveals several key principles:[^32]

- **Structure-based drug design at speed**: AF3 generates binding mode predictions in seconds versus months for experimental crystallography. Their TIM-3 case study demonstrated AF3 could predict a novel ligand binding pocket with no prior structural data in the training set.[^32]
- **Beyond structure alone**: Isomorphic combines AF3 with "other proprietary AI models" for understanding "properties, function, and dynamics of molecular systems". This implies separate models for binding affinity prediction, ADME properties, and molecular dynamics — not a single monolithic model.[^32]
- **The hallucination risk**: The diffusion approach introduces a risk of generating "plausible but non-existent molecular structures." This is acknowledged as an open problem requiring empirical verification.[^31]

### Bridging the Gap for Synthetic-Mind

Synthetic-Mind cannot replicate the billions in compute and proprietary data that powers Isomorphic Labs. But it can adopt architectural principles that bridge API-calling and genuine mechanistic reasoning:

**Level 1 — API Integration (Immediate)**:
- Call the AlphaFold Server API for structure predictions (free for non-commercial use).
- Use Chai-1 or ESMFold as open-source alternatives for protein structure prediction.
- Run OpenMM for physics-based molecular dynamics validation of predicted poses.

**Level 2 — Hybrid AI + Physics (Medium-term)**:
- **Use AF3 predictions as starting conformations for physics-based MD simulations**. The AI provides a fast initial guess; OpenMM/GROMACS provides physically grounded free energy calculations.
- Implement **MM/PBSA or MM/GBSA** rescoring of docking poses — these physics-based methods account for solvation effects that pure ML models miss.
- The SCM framework from Pillar 1 explicitly models: \( \text{AF3\_Prediction} \rightarrow \text{MD\_Validation} \rightarrow \text{FreeEnergy\_Estimate} \), with the causal graph enforcing that no binding affinity claim is made without physics-based validation.

**Level 3 — Causal Mechanistic Reasoning (Long-term)**:
- Train domain-specific causal models that capture *why* a structural change affects binding: "Removing the methyl group at position 4 → reduces steric clash with Phe142 → opens hydrogen bond donor access to Asp148 → increases binding affinity by ~1.2 kcal/mol."
- The DrugR framework (2026) demonstrates this with explicit ADMET reasoning: LLM generates optimization rationales connecting structural edits to ADMET property changes through mechanistic mediators.[^34]
- This converges with Isomorphic's approach of treating structure as just one input to a broader understanding of molecular behavior.

***

## Pillar 5: Causal Provenance & Deterministic Trace Integrity

### The Provenance Problem in Drug Discovery Pipelines

In a distributed pipeline where an LLM proposes hypotheses, GPU workers run simulations, and results flow through multiple microservices, traceability is non-negotiable. A docking score of -9.8 kcal/mol is meaningless if you cannot prove: (1) which exact PDB structure was used, (2) which AutoDock-GPU version with which parameters, (3) which conformer of the ligand, and (4) whether the LLM recommended this compound based on legitimate causal reasoning or stochastic pattern matching.

### W3C PROV + ProvONE for Scientific Workflows

The W3C PROV data model provides a domain-agnostic foundation with three core concepts: **Entities** (data artifacts), **Activities** (computations), and **Agents** (responsible parties, including LLM agents). ProvONE extends PROV specifically for scientific workflows by adding concepts for workflow specification alongside execution traces, enabling both prospective (planned) and retrospective (actual) provenance.[^35][^36]

Emerging frameworks for agentic workflows — including Graphectory, PROV-AGENT, and AdProv — extend these classical models with semantic traversals, process-centric metrics, and agent/prompt-level metadata. These are directly applicable to LLM-orchestrated scientific pipelines.[^37]

### PostgreSQL Schema for Scientific Traces

```sql
-- Provenance entities (W3C PROV: Entity)
CREATE TABLE prov_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,  -- 'compound', 'pdb_structure', 'docking_result', 'llm_hypothesis'
    content_hash TEXT NOT NULL,  -- SHA-256 of the artifact
    storage_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Provenance activities (W3C PROV: Activity)
CREATE TABLE prov_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type TEXT NOT NULL,  -- 'autodock_vina', 'admet_prediction', 'llm_reasoning'
    scm_node_id TEXT NOT NULL,  -- Links to causal graph node
    causal_score FLOAT,  -- From Causal Action Matrix M
    tool_name TEXT NOT NULL,
    tool_version TEXT NOT NULL,
    parameters_hash TEXT NOT NULL,  -- SHA-256 of frozen parameter dict
    parameters JSONB NOT NULL,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    status TEXT DEFAULT 'running',
    temporal_workflow_id TEXT,  -- Temporal's durable execution ID
    temporal_run_id TEXT
);

-- Provenance derivations (W3C PROV: wasDerivedFrom)
CREATE TABLE prov_derivations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generated_entity_id UUID REFERENCES prov_entities(id),
    used_entity_id UUID REFERENCES prov_entities(id),
    activity_id UUID REFERENCES prov_activities(id),
    derivation_type TEXT  -- 'primary_source', 'revision', 'quotation'
);

-- LLM-specific provenance
CREATE TABLE llm_traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES prov_activities(id),
    model_name TEXT NOT NULL,  -- 'claude-3-5-sonnet-20241022'
    prompt_hash TEXT NOT NULL,  -- SHA-256 of full prompt
    prompt_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    response_hash TEXT NOT NULL,
    token_count INT,
    temperature FLOAT,
    tool_calls JSONB,  -- Array of tool calls made
    causal_justification JSONB,  -- Which SCM nodes justified this action
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Governance sentinel checks
CREATE TABLE governance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES prov_activities(id),
    check_type TEXT NOT NULL,  -- 'reproducibility', 'causal_validity', 'hallucination_detection'
    passed BOOLEAN NOT NULL,
    details JSONB,
    checked_at TIMESTAMPTZ DEFAULT now()
);
```

### Deterministic Trace Integrity: The Hash Chain

Every computation produces a **trace hash** that chains inputs → parameters → tool version → outputs:

```
trace_hash = SHA256(
    input_entity_hashes[] +
    parameters_hash +
    tool_name + tool_version +
    output_content_hash
)
```

This creates an immutable, auditable chain. If any upstream input changes, all downstream trace hashes invalidate — making it impossible to claim a result is from a specific pipeline without exact reproduction.[^38]

### Governance Sentinels

Governance Sentinels are automated checks that run after each pipeline activity:

1. **Reproducibility Sentinel**: Re-executes a random sample of compute activities and verifies output hashes match. Flags non-deterministic tools (e.g., stochastic docking) and logs acceptable variance bounds.
2. **Causal Validity Sentinel**: Verifies that the SCM node ordering was respected — e.g., no docking activity was performed without a preceding ADMET activity on the same compound set. Queries the `prov_derivations` graph to enforce DAG constraints.
3. **Hallucination Sentinel**: For LLM traces, cross-references the `causal_justification` field against the actual Causal Action Matrix scores. Flags cases where the LLM's stated reasoning diverges from the causal prior by more than a configurable threshold.
4. **Data Integrity Sentinel**: Verifies all `content_hash` values by recomputing hashes on stored artifacts. Detects storage corruption or unauthorized modification.

These sentinels write their results to the `governance_checks` table, creating an audit trail of the audit trail itself.

### Temporal Integration for Built-in Provenance

Temporal's event-sourcing architecture provides provenance as a side effect of execution. Every Temporal workflow execution produces a complete event history (WorkflowExecutionStarted, ActivityTaskScheduled, ActivityTaskCompleted, etc.) that can be replayed deterministically. By storing the `temporal_workflow_id` and `temporal_run_id` in `prov_activities`, you can reconstruct the exact sequence of events for any experiment at any time, even years after execution.[^14]

***

## Summary Architecture Topology

```
┌─────────────────────────────────────────────────────────┐
│                    USER LAYER                           │
│  Next.js App Router (Vercel)                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐   │
│  │SmilesDrawer│ │ RDKit.js │ │ Mol* (react-wrapper) │   │
│  │ 2D grids │ │ details  │ │ 3D protein-ligand    │   │
│  └──────────┘ └──────────┘ └──────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │ REST/WebSocket
┌───────────────────────▼─────────────────────────────────┐
│                 INTELLIGENCE LAYER                       │
│  FastAPI Gateway                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Claude 3.5 Sonnet (Anthropic Tool Use)          │   │
│  │ ↕ CausalPlan: Causal Action Matrix M            │   │
│  │ ↕ LangGraph: Stateful agent orchestration       │   │
│  │ ↕ DoWhy: Causal DAG queries + do-calculus       │   │
│  └─────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │ Temporal Workflows
┌───────────────────────▼─────────────────────────────────┐
│                  COMPUTE LAYER                          │
│  Temporal.io + Kubernetes + NVIDIA GPUs                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐   │
│  │AutoDock│ │ OpenMM │ │ RDKit  │ │ ADMET Models │   │
│  │  GPU   │ │  MD    │ │ ADMET  │ │ (ADMETLab)   │   │
│  └────────┘ └────────┘ └────────┘ └──────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                   DATA LAYER                            │
│  Supabase (PostgreSQL + RDKit Cartridge)                │
│  ┌────────────┐ ┌────────────┐ ┌───────────────────┐  │
│  │ compounds  │ │experiments │ │ prov_entities/     │  │
│  │ conformers │ │ results    │ │ prov_activities/   │  │
│  │ (mol, bfp) │ │            │ │ llm_traces/        │  │
│  └────────────┘ └────────────┘ │ governance_checks  │  │
│  S3-compatible Object Storage   └───────────────────┘  │
│  (PDB files, SDF libraries, MD trajectories)           │
└─────────────────────────────────────────────────────────┘
```

### Key Technology Decisions

| Component | Recommended Technology | Rationale |
|---|---|---|
| Frontend | Next.js 15 App Router on Vercel | Server Components for initial load; Client Components for interactive viewers |
| LLM | Claude 3.5 Sonnet (Anthropic) | Best tool-calling for chemistry agents[^8] |
| Agent Framework | LangGraph (Python) | Stateful graph orchestration, human-in-the-loop, time-travel debugging[^6] |
| Causal Engine | DoWhy + custom SCA model | Pearl's do-calculus implementation + learned causal action matrix[^3] |
| Workflow Orchestration | Temporal.io (Python SDK) | Exactly-once execution, event sourcing, proven in pharma (Eli Lilly)[^12] |
| Compute API | FastAPI (Python) | Async, typed, OpenAPI docs, GPU worker management |
| GPU Workers | Docker + Kubernetes + NVIDIA MPS | Multi-job GPU sharing for docking[^16] |
| Database | Supabase (PostgreSQL) + RDKit cartridge | Chemical search (substructure, Tanimoto) at 1M compounds/sec[^29][^27] |
| 2D Chemistry UI | RDKit.js + SmilesDrawer | Full cheminformatics + fast grid rendering[^20][^21] |
| 3D Viewer | Mol* (react-molstar-wrapper) | Production-grade, PDB/AlphaFold native[^24][^23] |
| Object Storage | S3-compatible (Supabase Storage) | Large file handling (PDB, SDF, trajectories) |
| Provenance | W3C PROV schema in PostgreSQL + Temporal event history | Full audit trail with hash chain integrity[^36][^35] |

---

## References

1. [The Hidden Superpower Behind Modern AI Agents: The ReAct ...](https://www.hexstream.com/tech-corner/the-hidden-superpower-behind-modern-ai-agents-the-react-pattern-and-why-langgraph-changes-everything) - Agents solve this by orchestrating LLMs with memory, tools, environment feedback, and multi-step wor...

2. [CausalAgent: Causal Systems in AI - Emergent Mind](https://www.emergentmind.com/topics/causalagent) - Structural Causal Model (SCM) View: A CausalAgent comprises (i) a perception–action loop formalized ...

3. [CausalPlan: Empowering Efficient LLM Multi-Agent Collaboration ...](https://arxiv.org/html/2508.13721v1) - An SCM can be identified through causal discovery, which learns both the graph structure—captured by...

4. [Causal relationships between diseases mined from the literature ...](https://academic.oup.com/bioinformatics/article/40/11/btae639/7845254) - We automatically mined statements asserting a causal relation between diseases from the scientific l...

5. [Structural Causal Models: A Primer - Emergent Mind](https://www.emergentmind.com/topics/structural-causal-models-scm) - Marginalization over latent endogenous variables preserves SCM semantics under unique solvability, a...

6. [LangChain AI Agents: Complete Implementation Guide 2025](https://www.digitalapplied.com/blog/langchain-ai-agents-guide-2025) - Interact with external systems to retrieve or modify data autonomously; Break down complex problems ...

7. [LangGraph](https://www.langchain.com/langgraph) - Guide, moderate, and control your agent with human-in-the-loop. Prevent agents from veering off cour...

8. [Exploring Modularity of Agentic Systems for Drug Discovery - arXiv](https://arxiv.org/html/2506.22189v1) - We compare the performance of different large language models (LLMs) and the effectiveness of tool-c...

9. [How to run functions that take more than 10s on Vercel?](https://stackoverflow.com/questions/73839916/how-to-run-functions-that-take-more-than-10s-on-vercel) - This is because Vercel allows up to 10s limit execution for functions. How can I run this function? ...

10. [Efficient serverless Node.js with in-function concurrency - Vercel](https://vercel.com/blog/serverless-servers-node-js-with-in-function-concurrency) - It's a serverless product optimized specifically for interactive workloads such as server-rendering ...

11. [The Ultimate Guide to Software Architecture in Next.js](https://dev.to/shayan_saed/the-ultimate-guide-to-software-architecture-in-nextjs-from-monolith-to-microservices-i2c) - In this guide, we'll walk through various architecture patterns that can be implemented in Next.js —...

12. [Eli Lilly at Replay 2025 | From Monolith to Durable Microservices for ...](https://www.youtube.com/watch?v=pNHBcf7xTYI) - ... io/courses Support forum: https://community.temporal.io. ... Eli Lilly at Replay 2025 | From Mon...

13. [Temporal vs Airflow: Agent Orchestration Showdown 2025 - Sparkco](https://sparkco.ai/blog/temporal-vs-airflow-agent-orchestration-showdown-2025) - Temporal is optimal for state-centric workflows demanding precision and durability, while Airflow re...

14. [Agentic AI Workflows: Why Orchestration with Temporal is Key](https://intuitionlabs.ai/articles/agentic-ai-temporal-orchestration) - Agentic AI projects face high failure rates. Learn the challenges of multi-agent workflows and why d...

15. [A GPU-accelerated Molecular Docking Workflow with Kubernetes ...](https://arxiv.org/html/2410.10634v1) - In this work, we explore using Apache Airflow workflow management software to support a molecular do...

16. [Maximizing OpenMM MD Throughput - NVIDIA Multi-Process Service](https://developer.nvidia.com/blog/maximizing-openmm-molecular-dynamics-throughput-with-nvidia-multi-process-service/) - To maximize GPU utilization and improve throughput, running multiple simulations concurrently on the...

17. [Fovus Delivers OpenMM Molecular Dynamics Simulations for as ...](https://fovus.co/2025/05/02/fovus-delivers-openmm-molecular-dynamics-simulations-for-as-low-as-6-59-%C2%B5s-as-fast-as-3359-ns-day/) - Known for its flexibility, GPU acceleration, and Python interface, OpenMM makes it easy to prototype...

18. [OpenMM is a toolkit for molecular simulation using high ...](https://github.com/openmm/openmm) - OpenMM is a toolkit for molecular simulation. It can be used either as a stand-alone application for...

19. [rdkit.Chem.Draw package — The RDKit 2025.09.5 documentation](https://www.rdkit.org/docs/source/rdkit.Chem.Draw.html) - Creates a mol grid image from a nested data structure (where each data substructure represents a row...

20. [RDKit.js - JavaScript Example](https://www.rdkitjs.com) - Welcome to RDKit.js, the official JavaScript distribution of cheminformatics functionality from the ...

21. [SmilesDrawer: Parsing and Drawing SMILES-Encoded Molecular ...](https://pubmed.ncbi.nlm.nih.gov/29257869/) - Here we present SmilesDrawer, a dependency-free JavaScript component capable of both parsing and dra...

22. [3dmol - NPM](https://www.npmjs.com/package/3dmol) - 3Dmol.js is an object-oriented, WebGL accelerated JavaScript library for online molecular visualizat...

23. [Mol* Viewer: modern web app for 3D visualization and analysis of ...](https://academic.oup.com/nar/article/49/W1/W431/6270780) - It is the primary 3D structure viewer used by PDBe and RCSB PDB. It can be easily integrated into th...

24. [react-molstar-wrapper 0.0.7 on npm - Libraries.io](https://libraries.io/npm/react-molstar-wrapper) - Molecular Visualization - Display 3D molecular structures using the Mol* visualization engine; React...

25. [molstar - NPM](https://www.npmjs.com/package/molstar?activeTab=readme) - The goal of Mol* (/'mol-star/) is to provide a technology stack that serves as a basis for the next-...

26. [NGL to Mol* UI Migration Guide - RCSB PDB](https://www.rcsb.org/docs/3d-viewers/ngl-to-mol*-ui-migration-guide) - The visualization tool NGL, is no longer available as a molecular viewer option from RCSB.org Struct...

27. [RDKit - Nile Documentation - TheNile.DEV](https://thenile.dev/docs/extensions/rdkit) - The RDKit PostgreSQL extension adds support for: Chemical structure storage and retrieval; Substruct...

28. [Amazon Aurora PostgreSQL supports rdkit extension - AWS](https://aws.amazon.com/about-aws/whats-new/2020/09/amazon-aurora-postgresql-supports-rdkit-extension/) - The RDKit extension allows cheminformatics to deal with manipulation of chemical structures, fingerp...

29. [[PDF] RDKit, PostgreSQL, and Knime: Open-source cheminformatics in big ...](http://www.rdkit.org/MIOSS.May2011.distrib.pdf) - What is it? • Cheminformatics toolkit useable from C++, Python, Java. • Postgresql cartridge for sub...

30. [The RDKit database cartridge — The RDKit 2025.09.5 documentation](https://www.rdkit.org/docs/Cartridge.html) - Similarity search¶​​ # : operator used for similarity searches using Dice similarity. Returns whethe...

31. [Review of AlphaFold 3: Transformative Advances in Drug Design ...](https://pmc.ncbi.nlm.nih.gov/articles/PMC11292590/) - The model employs a diffusion network process, starting with a cloud of atoms and iteratively conver...

32. [Rational drug design with AlphaFold 3 - Isomorphic Labs](https://www.isomorphiclabs.com/articles/rational-drug-design-with-alphafold-3) - AlphaFold 3 is an AI model that allows a scientist to input a description of a biomolecular complex ...

33. [AlphaFold 3 predicts the structure and interactions of all of life's ...](https://www.isomorphiclabs.com/articles/alphafold-3-predicts-the-structure-and-interactions-of-all-of-lifes-molecules) - After processing the inputs, AlphaFold 3 assembles its predictions using a diffusion network, akin t...

34. [Optimizing Molecular Drugs through LLM-based Explicit Reasoning](https://arxiv.org/html/2602.08213v1) - This framework enables DrugR to effectively improve key ADMET properties while preserving the origin...

35. [The ProvONE Data Model for Scientific Workflow Provenance](https://purl.dataone.org/provone-v1-dev) - Data provenance is an important form of metadata that explains how a particular data product was gen...

36. [PROV-DM: The PROV Data Model - W3C](https://www.w3.org/TR/prov-dm/) - This document introduces the provenance concepts found in PROV and defines PROV-DM types and relatio...

37. [Provenance Tracking in Agentic Workflows - Emergent Mind](https://www.emergentmind.com/topics/provenance-tracking-in-agentic-workflows) - Explore how agentic workflows embed rigorous, graph-based provenance tracking to enable auditability...

38. [Versioning, Provenance, and Reproducibility - mlip-cmu](https://mlip-cmu.github.io/book/24-versioning-provenance-and-reproducibility.html) - Determinism in machine-learning pipelines can be tested by executing the pipeline repeatedly and on ...

