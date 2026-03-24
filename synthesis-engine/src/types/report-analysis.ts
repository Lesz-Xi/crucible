/**
 * SCM-Grounded Report Analysis — Core Type Contracts
 *
 * Ported from crucible to synthesis-engine (2026-03-05).
 * Audit blockers addressed:
 *   C1: All LLM-generated artifacts carry M6.2 ComputeProvenance
 *   M1: Unified ClaimClass + SCMEdgeSupport taxonomy
 *   M3: SCMGroundedReport is the authoritative JSON schema anchor
 *
 * @version 1.0.0
 * @methodVersion scm-grounded-report-v1
 */

// ---------------------------------------------------------------------------
// Unified taxonomies (resolves audit M1: ClaimClass vs SCM edge type mismatch)
// ---------------------------------------------------------------------------

/**
 * Claim classification — single source of truth used by both the
 * HonestFramingService and the SCM mapper.
 *
 * Ordered from highest to lowest epistemic confidence.
 */
export type ClaimClass =
    | "IDENTIFIED_CAUSAL"      // Backdoor/front-door identifiable, ≥2 corroborating sources, mechanism specified
    | "INFERRED_CAUSAL"        // Plausible mechanism, <2 corroborating sources, no blocking confounders
    | "ASSOCIATIONAL_ONLY"     // Correlation only; confounders uncontrolled or mechanism absent
    | "INSUFFICIENT_EVIDENCE"; // <1 corroborating source OR directly contradictory evidence

/**
 * SCM edge support level — maps deterministically to ClaimClass.
 *   observed     → IDENTIFIED_CAUSAL
 *   inferred     → INFERRED_CAUSAL
 *   speculative  → ASSOCIATIONAL_ONLY | INSUFFICIENT_EVIDENCE
 */
export type SCMEdgeSupport = "observed" | "inferred" | "speculative";

/** Evidence tier for source quality classification. */
export type EvidenceTier = "A" | "B" | "C" | "UNKNOWN";

/**
 * Report-level trust state.
 * Only "verified" is gated — all other states degrade from it.
 */
export type HonestFramingState =
    | "verified"   // All framing gates pass
    | "heuristic"  // At least one gate failed; report must not overclaim
    | "warning"    // Active warning codes present; label shown to user
    | "unknown";   // Evaluation was not run

/** Structured warning codes — never expose raw enums in UI; humanize via WARNING_CODE_LABELS. */
export type WarningCode =
    | "VERIFIED_DOWNGRADED_RUNTIME_GAP"
    | "VERIFIED_DOWNGRADED_EVIDENCE_TIER"
    | "VERIFIED_DOWNGRADED_PROVENANCE_INCOMPLETE"
    | "VERIFIED_NOT_EVALUATED"
    | "UNKNOWN_VERIFICATION_STATE";

export const WARNING_CODE_LABELS: Record<WarningCode, string> = {
    VERIFIED_DOWNGRADED_RUNTIME_GAP:
        "Analysis was limited by missing real-time data during this pipeline run.",
    VERIFIED_DOWNGRADED_EVIDENCE_TIER:
        "One or more sources could not meet Tier A evidence standards; conclusions are preliminary.",
    VERIFIED_DOWNGRADED_PROVENANCE_INCOMPLETE:
        "Source provenance is incomplete; citation chain cannot be fully verified.",
    VERIFIED_NOT_EVALUATED:
        "This claim has not yet been evaluated against the verification policy.",
    UNKNOWN_VERIFICATION_STATE:
        "Verification state is unknown; treat all conclusions as exploratory.",
};

// ---------------------------------------------------------------------------
// M6.2 Trace Provenance (resolves audit C1)
// ---------------------------------------------------------------------------

/**
 * Required on every LLM-generated artifact.
 * Satisfies M6.2 Deterministic Trace Integrity: seed, model_version, input_hash.
 *
 * Note: computeRunId ties into synthesis-engine's TraceIntegrityService.createTrace()
 * for full provenance lineage.
 */
export interface ComputeProvenance {
    /** UUIDv7 — all artifacts from the same pipeline run share this ID. */
    computeRunId: string;
    /** Fully qualified model identifier, e.g. "gemini-2.5-flash". */
    model: string;
    /** Prompt template version, e.g. "claim-extractor-v1.0". */
    promptVersion: string;
    /** SHA-256 hex of the input text that produced this artifact. */
    inputHash: string;
    /**
     * Overall pipeline method version.
     * Increment when scoring formula, identifiability rules, or prompts change.
     */
    methodVersion: string;
    /** ID tying back to the original source ingestion batch (Demis contract). */
    ingestionId?: string;
    /** Array of source table IDs used (Demis contract). */
    sourceTableIds?: string[];
}

// ---------------------------------------------------------------------------
// Source Records
// ---------------------------------------------------------------------------

export interface SourceRecord {
    /** UUIDv7. */
    sourceId: string;
    url: string;
    domain: string;
    /** ISO 8601. Undefined if article lacks a published date. */
    publishedAt?: string;
    /**
     * 0..1  Weighted by domain tier (see SOURCE_DOMAIN_TIERS in SourceScoringService).
     * methodVersion: "source-scorer-v1.0"
     */
    credibilityScore: number;
    /**
     * 0..1  Linear decay over 365 days from publishedAt.
     * 0.3 penalty applied when publishedAt is absent.
     */
    recencyScore: number;
    /**
     * 0..1  clamp(overlappingSourceCount / 3, 0, 1)
     */
    corroborationScore: number;
    /** Raw excerpt — max 2 000 chars. */
    excerpt: string;
    /** ISO 8601 — when the URL was fetched by the pipeline. */
    fetchedAt: string;
    /** UUIDv7 — ties to the retrieval batch (ingestion run). */
    ingestionId: string;
}

// ---------------------------------------------------------------------------
// Claim Records
// ---------------------------------------------------------------------------

export interface ClaimRecord {
    /** UUIDv7. */
    claimId: string;
    text: string;
    /** Named entities referenced in the claim. */
    entities: string[];
    /** ISO 8601 event timestamp, if the claim refers to a specific event. */
    eventTime?: string;
    /** References SourceRecord.sourceId values that support this claim. */
    sourceIds: string[];
    evidenceTier: EvidenceTier;
    claimClass: ClaimClass;
    /** SCM edge support — bridges ClaimClass to SCM graph representation. */
    scmEdgeSupport: SCMEdgeSupport;
    /**
     * 0..1  Composite confidence score.
     * confidence = (0.4 × credibilityScore) + (0.3 × corroborationScore)
     *            + (0.3 × (A=1 | B=0.6 | C=0.3 | UNKNOWN=0.1))
     */
    confidence: number;
    warningCodes: WarningCode[];
    /**
     * Required when: confidence > 0.6 OR claimClass === "IDENTIFIED_CAUSAL".
     * Tests must be falsifiable and time-bounded ("7d" or "30d").
     */
    falsifierTests: string[];
    /** M6.2 provenance — who extracted this claim and under which conditions. */
    provenance: ComputeProvenance;
}

// ---------------------------------------------------------------------------
// Report Metadata (resolves audit C1 on ReportMeta)
// ---------------------------------------------------------------------------

export interface PipelineConfig {
    queryFamilyCount: number;
    /** Results pulled per query family. Default: 8. Max: 15. */
    kResultsPerQuery: number;
    maxExcerptChars: number;
    braveDomain: string;
}

export interface ReportMeta {
    /** UUIDv7. */
    reportId: string;
    /** Monotonic integer incremented on re-analysis of the same query. */
    reportVersion: number;
    /** UUIDv7 — matches ComputeProvenance.computeRunId for all claims in this report. */
    computeRunId: string;
    /** SHA-256 hex of (query + sorted sourceIds[]). */
    inputHash: string;
    query: string;
    causalDepth: HonestFramingState;
    /** True only if all framing gates passed. */
    allowVerified: boolean;
    /** Human-readable descriptions of failed gates. */
    verificationFailures: string[];
    /** Open questions this report cannot answer. */
    unknowns: string[];
    /** ISO 8601. */
    generatedAt: string;
    /** Overall pipeline version, e.g. "scm-grounded-report-v1". */
    methodVersion: string;
    pipelineConfig: PipelineConfig;
}

// ---------------------------------------------------------------------------
// Honest Framing Evaluation (intermediate type used by HonestFramingService)
// ---------------------------------------------------------------------------

export interface HonestFramingResult {
    framingState: HonestFramingState;
    warningCodes: WarningCode[];
    /** Human-readable explanation of why the state is not "verified". */
    downgradeReasons: string[];
    /** Gate-level diagnostics for the "Why downgraded?" drawer in ReportCanvas. */
    gates: {
        provenanceComplete: boolean;
        evidenceTierSufficient: boolean;
        noRuntimeGap: boolean;
        falsifiersPresent: boolean;
    };
}

// ---------------------------------------------------------------------------
// Full Report Output Contract
// ---------------------------------------------------------------------------

export interface HypothesisEntry {
    text: string;
    confidence: number;
    claimClass: ClaimClass;
    /** Claim IDs that back this hypothesis. */
    supportingClaimIds: string[];
}

export interface CounterHypothesisEntry {
    text: string;
    rationale: string;
    /** Claim IDs that back the counter-narrative. */
    supportingClaimIds: string[];
}

export interface FalsifierChecklistItem {
    claimId: string;
    test: string;
    window: "7d" | "30d";
}

export interface SCMNotes {
    /** Links that pass identifiability criterion. */
    identifiableLinks: string[];
    /** Links supported by mechanism but not fully identifiable. */
    inferredLinks: string[];
    /** Known or suspected confounders that cannot be controlled. */
    latentConfounders: string[];
}

export interface DecisionGuidance {
    /** What it is epistemically safe to conclude right now. */
    safeConclude: string[];
    /** What cannot be concluded with current evidence. */
    notSafeConclude: string[];
}

/**
 * The canonical JSON output contract for SCM-Grounded Report Analysis.
 * This interface is the authoritative schema for export integrity tests (audit M3).
 */
export interface SCMGroundedReport {
    meta: ReportMeta;
    sources: SourceRecord[];
    claims: ClaimRecord[];
    /** 5–7 bullet points. */
    executiveSummary: string[];
    /** Ranked by confidence descending. */
    primaryHypotheses: HypothesisEntry[];
    counterHypotheses: CounterHypothesisEntry[];
    scmNotes: SCMNotes;
    falsifierChecklist: FalsifierChecklistItem[];
    unknownsAndGaps: string[];
    decisionGuidance: DecisionGuidance;
}

// ---------------------------------------------------------------------------
// API Request / Response Contracts (resolves audit C3)
// ---------------------------------------------------------------------------

export type QueryFamilyType =
    | "direct"
    | "historical"
    | "opposing"
    | "data"
    | "falsifier";

export interface AnalyzeReportRequest {
    query: string;
    k?: number;
    queryFamilies?: QueryFamilyType[];
    domainHint?: string;
}

// SSE event payloads — additive-only contract (Demis SSE/Event Contract §5)
export interface PipelineStartEvent {
    computeRunId: string;
    estimatedSteps: number;
}

export interface StageProgressEvent {
    stage: number;
    label: string;
    detail?: string;
}

export interface ReportHeartbeatEvent {
    /** Elapsed milliseconds since pipeline_start. */
    elapsedMs: number;
    stage: number;
}

export interface PipelineErrorEvent {
    stage: number;
    error: string;
    warningCode: WarningCode;
}

/**
 * Stable SSE event names — additive-only, never rename or remove.
 * Discrimination happens on the `event` key inside the JSON data object,
 * consistent with synthesis-engine's StreamingEventEmitter data:{ event } pattern.
 */
export type PipelineEventName =
    | "report_pipeline_start"
    | "report_stage_progress"
    | "report_heartbeat"
    | "report_complete"
    | "report_pipeline_error";

export interface GetReportResponse {
    success: true;
    report: SCMGroundedReport;
}

export interface ExportReportRequest {
    format: "markdown" | "json";
}

export type AnalyzeErrorCode =
    | "INVALID_QUERY"
    | "BRAVE_UNAVAILABLE"
    | "FEATURE_DISABLED"
    | "RATE_LIMIT"
    | "INTERNAL";

export interface AnalyzeErrorResponse {
    success: false;
    error: string;
    code: AnalyzeErrorCode;
}
