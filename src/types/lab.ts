// =============================================================
// Bio-Computation Lab: Type Definitions
// Phase 1 — Production Foundation
// =============================================================

import { CausalRole } from '../lib/services/scientific-provenance';

// ── Tool Definitions ─────────────────────────────────────────

export type LabToolName =
    | 'fetch_protein_structure'
    | 'analyze_protein_sequence'
    | 'dock_ligand'
    | 'simulate_scientific_phenomenon';

export type LabToolId =
    | 'fetch_structure'
    | 'analyze_sequence'
    | 'dock_ligand';

// ── LLM & BYOK Configuration ─────────────────────────────────

export interface LLMConfig {
    provider: 'anthropic' | 'openai' | 'gemini';
    model: string;
    apiKey?: string; // Legacy/Active consolidated key (runtime only)
    anthropicApiKey?: string;
    openaiApiKey?: string;
    geminiApiKey?: string; // Google Generative AI Key
    temperature?: number;
}

export interface VerificationMetadata {
    model_signature: string; // "provider/model-version"
    input_hash: string;
    timestamp: number;
}


export interface LabTool {
    id: LabToolId;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    causalRole: CausalRole;
}

// ── Input Types ──────────────────────────────────────────────

export interface ProteinFetchInput {
    pdbId: string;
    source?: 'rcsb' | 'alphafold';
    uniprotId?: string;
}

export interface SequenceAnalysisInput {
    sequence: string;
}

export interface DockingInput {
    pdbId: string;
    smiles: string;
    seed?: number;
}

export interface HypothesisSimulationInput {
    thesis: string;
    mechanism: string;
    prediction?: string;
}

export type LabToolInput =
    | ProteinFetchInput
    | SequenceAnalysisInput
    | DockingInput
    | HypothesisSimulationInput;

// ── Result Types ─────────────────────────────────────────────

export interface ProteinFetchResult {
    pdbId: string;
    content: string;
    metadata: {
        resolution?: number;
        method?: string;
        title?: string;
        organism?: string;
        source?: 'rcsb' | 'alphafold';
    };
}

export interface SequenceAnalysisResult {
    molecular_weight: number;
    isoelectric_point: number;
    instability_index: number;
    aromaticity?: number;
    gravy?: number;
    amino_acid_percent?: Record<string, number>;
}

export interface DockingResult {
    affinity_kcal_mol: number;
    rmsd: number;
    poses: Array<{
        rank: number;
        score: number;
        rmsd: number;
    }>;
    engine: string;
    seed?: number;
}

export interface SimulationResult {
    success: boolean;
    protocolCode: string;
    execution: {
        stdout: string;
        stderr: string;
        metrics?: Record<string, unknown>;
        executionTimeMs: number;
        error?: string;
    };
    degraded: boolean;
}

export type LabToolResult =
    | ProteinFetchResult
    | SequenceAnalysisResult
    | DockingResult
    | SimulationResult;

// ── Experiment Record (Extended) ─────────────────────────────

export interface LabExperiment {
    id: string;
    user_id: string;
    tool_name: LabToolName;
    causal_role: CausalRole;
    input_hash: string;
    input_json: LabToolInput;
    result_json?: LabToolResult;
    status: 'pending' | 'success' | 'failure';
    error_message?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at?: string;
}

// ── State Types ──────────────────────────────────────────────

export interface ProteinStructure {
    pdbId: string;
    content: string;
    metadata?: ProteinFetchResult['metadata'];
    loadedAt: string;
}

export interface LabState {
    // Connection State
    isOffline: boolean;
    isLoading: boolean;

    // Tool State
    activeTool: LabToolId | null;
    activePanel: LabToolId | null;

    // Data State
    currentStructure: ProteinStructure | null;
    experimentHistory: LabExperiment[];

    // UI State
    isSidebarOpen: boolean;
    isNotebookExpanded: boolean;

    // Error State
    // Error State
    lastError: LabError | null;

    // LLM Config
    llmConfig: LLMConfig;
    isModelSettingsOpen: boolean;
}

export interface LabError {
    code: LabErrorCode;
    message: string;
    details?: unknown;
    timestamp: string;
    recoverable: boolean;
}

export enum LabErrorCode {
    // Initialization Errors
    INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
    NOT_INITIALIZED = 'NOT_INITIALIZED',

    // Network Errors
    NETWORK_ERROR = 'NETWORK_ERROR',
    API_UNAVAILABLE = 'API_UNAVAILABLE',
    TIMEOUT = 'TIMEOUT',

    // Validation Errors
    INVALID_PDB_ID = 'INVALID_PDB_ID',
    INVALID_SEQUENCE = 'INVALID_SEQUENCE',
    INVALID_SMILES = 'INVALID_SMILES',
    INVALID_INPUT = 'INVALID_INPUT',

    // Execution Errors
    EXECUTION_FAILED = 'EXECUTION_FAILED',
    PYODIDE_ERROR = 'PYODIDE_ERROR',
    NGL_LOAD_ERROR = 'NGL_LOAD_ERROR',

    // Persistence Errors
    SAVE_FAILED = 'SAVE_FAILED',
    LOAD_FAILED = 'LOAD_FAILED',
    DELETE_FAILED = 'DELETE_FAILED',

    // Auth Errors
    UNAUTHORIZED = 'UNAUTHORIZED',
    SESSION_EXPIRED = 'SESSION_EXPIRED',

    // Unknown
    UNKNOWN = 'UNKNOWN',
}

// ── Action Types ─────────────────────────────────────────────

export type LabAction =
    | { type: 'SET_OFFLINE'; payload: boolean }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ACTIVE_TOOL'; payload: LabToolId | null }
    | { type: 'SET_ACTIVE_PANEL'; payload: LabToolId | null }
    | { type: 'LOAD_STRUCTURE'; payload: ProteinStructure | null }
    | { type: 'ADD_EXPERIMENT'; payload: LabExperiment }
    | { type: 'UPDATE_EXPERIMENT'; payload: { id: string; updates: Partial<LabExperiment> } }
    | { type: 'SET_EXPERIMENT_HISTORY'; payload: LabExperiment[] }
    | { type: 'TOGGLE_SIDEBAR' }
    | { type: 'TOGGLE_NOTEBOOK' }
    | { type: 'SET_ERROR'; payload: LabError | null }
    | { type: 'CLEAR_ERROR' }
    | { type: 'SET_LLM_CONFIG'; payload: Partial<LLMConfig> }
    | { type: 'SET_MODEL_SETTINGS_OPEN'; payload: boolean };

// ── Persistence Types ────────────────────────────────────────

export interface LabPersistenceConfig {
    autoSave: boolean;
    syncInterval: number;
    maxRetries: number;
    offlineQueueSize: number;
}

export interface OfflineQueueItem {
    id: string;
    action: 'create' | 'update';
    data: Partial<LabExperiment>;
    timestamp: string;
    retryCount: number;
}

// ── Validation Types ─────────────────────────────────────────

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

export interface ValidationError {
    field: string;
    code: string;
    message: string;
}

// ── API Response Types ───────────────────────────────────────

export interface LabApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: LabErrorCode;
        message: string;
    };
    traceId?: string;
}

// ── Hook Return Types ────────────────────────────────────────

export interface UseLabExperimentReturn {
    experiment: LabExperiment | null;
    isLoading: boolean;
    error: LabError | null;
    execute: (input: LabToolInput) => Promise<void>;
    retry: () => Promise<void>;
    cancel: () => void;
}

export interface UseProteinStructureReturn {
    structure: ProteinStructure | null;
    isLoading: boolean;
    error: LabError | null;
    fetch: (pdbId: string) => Promise<void>;
    clear: () => void;
}
