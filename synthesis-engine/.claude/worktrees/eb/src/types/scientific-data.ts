// =============================================================
// Automated Scientist: Scientific Data Pipeline Types
// Phase A — Data Foundations
// =============================================================

// ── Ingestion Lifecycle ──────────────────────────────────────

export type IngestionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DocumentIngestion {
    id: string;
    userId: string;
    fileName: string;
    fileHashSha256: string;
    fileSizeBytes?: number;
    status: IngestionStatus;
    ingestionVersion: number;
    errorMessage?: string;
    pageCount?: number;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface CreateIngestionInput {
    fileName: string;
    fileHashSha256: string;
    fileSizeBytes?: number;
    pageCount?: number;
    metadata?: Record<string, unknown>;
}

// ── Extracted Tables ─────────────────────────────────────────

export type ParseStatus = 'parsed' | 'partial' | 'failed';

export interface ExtractedTable {
    id: string;
    ingestionId: string;
    pageNumber: number;
    tableIndex: number;
    headers: string[];
    rows: string[][];
    confidence: number;
    parseStatus: ParseStatus;
    qaFlags: string[];
    createdAt: string;
}

export interface CreateExtractedTableInput {
    ingestionId: string;
    pageNumber: number;
    tableIndex: number;
    headers: string[];
    rows: string[][];
    confidence: number;
    parseStatus: ParseStatus;
    qaFlags?: string[];
}

// ── Scientific Data Points ───────────────────────────────────

export interface ScientificDataPoint {
    id: string;
    ingestionId?: string;
    sourceTableId?: string;
    variableXName: string;
    variableYName: string;
    xValue: number;
    yValue: number;
    unitX?: string;
    unitY?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

export interface CreateDataPointInput {
    ingestionId?: string;
    sourceTableId?: string;
    variableXName: string;
    variableYName: string;
    xValue: number;
    yValue: number;
    unitX?: string;
    unitY?: string;
    metadata?: Record<string, unknown>;
}

// ── Compute Runs ─────────────────────────────────────────────

export interface ComputeRun {
    id: string;
    ingestionId?: string;
    method: string;
    methodVersion: string;
    params: Record<string, unknown>;
    result: Record<string, unknown>;
    deterministicHash: string;
    createdBy?: string;
    createdAt: string;
}

export interface CreateComputeRunInput {
    ingestionId?: string;
    method: string;
    methodVersion: string;
    params: Record<string, unknown>;
    result: Record<string, unknown>;
    deterministicHash: string;
}

// ── Computation Results (in-memory, not directly persisted) ──

export interface RegressionResult {
    method: string;              // e.g. "linear_regression"
    methodVersion: string;       // e.g. "1.0.0"
    slope: number;
    intercept: number;
    rSquared: number;
    standardError?: number;
    pValue?: number;
    n: number;                   // sample count
    equation: string;            // e.g. "y = 2.05x + 0.12"
}

export interface TrendAnalysisResult {
    trend: 'increasing' | 'decreasing' | 'flat' | 'non-monotonic';
    slope: number;
    rSquared: number;
    changePercent: number;
    description: string;
}

export interface AnomalyResult {
    pointIndex: number;
    dataPoint: ScientificDataPoint;
    zScore: number;
    reason: string;
}

// ── Document Metadata (extracted from PDF) ───────────────────

export interface DocumentMetadata {
    title?: string;
    authors?: string[];
    doi?: string;
    journal?: string;
    publicationDate?: string;
    abstract?: string;
    keywords?: string[];
    pageCount?: number;
}

// ── Phase E: Provenance Reference (Contract §5) ─────────────

export interface ProvenanceReference {
    ingestionId: string;
    sourceTableIds: string[];
    dataPointIds: string[];
    computeRunId?: string;
    methodVersion: string;
}
