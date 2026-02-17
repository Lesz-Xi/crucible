/**
 * Zod Validation Schemas for Bio-Computation Lab
 * 
 * Provides runtime type validation for all lab tool inputs and outputs.
 * Aligned with Demis Workflow: deterministic validation, provenance tracking.
 */

import { z } from 'zod';

// ── Base Schemas ─────────────────────────────────────────────────────────────

/**
 * Causal role classification for experiments
 */
export const CausalRoleSchema = z.enum(['observation', 'intervention', 'hybrid']);

/**
 * Lab tool names
 */
export const LabToolNameSchema = z.enum([
    'protein_viewer',
    'hypothesis_builder',
    'experiment_runner',
    'data_analyzer',
    'literature_search',
]);

/**
 * LLM Provider options
 */
export const LLMProviderSchema = z.enum(['openai', 'anthropic', 'gemini', 'google', 'local']).transform((provider) =>
    provider === 'google' ? 'gemini' : provider
);

/**
 * LLM Configuration
 */
export const LLMConfigSchema = z.object({
    provider: LLMProviderSchema,
    model: z.string().min(1, 'Model name is required'),
    apiKey: z.string().optional(),
    baseUrl: z.string().url().optional(),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().int().positive().default(4096),
});

// ── Tool Input Schemas ───────────────────────────────────────────────────────

/**
 * Protein Viewer Input
 */
export const ProteinViewerInputSchema = z.object({
    pdbId: z.string()
        .length(4, 'PDB ID must be exactly 4 characters')
        .regex(/^[A-Z0-9]{4}$/i, 'PDB ID must contain only alphanumeric characters'),
    options: z.object({
        showWater: z.boolean().default(false),
        showLigands: z.boolean().default(true),
        showHydrogens: z.boolean().default(false),
        colorScheme: z.enum(['chain', 'element', 'residue', 'secondary']).default('chain'),
        representation: z.enum(['cartoon', 'ball-stick', 'surface', 'ribbon']).default('cartoon'),
    }).optional(),
});

/**
 * Hypothesis Builder Input
 */
export const HypothesisBuilderInputSchema = z.object({
    hypothesis: z.string()
        .min(10, 'Hypothesis must be at least 10 characters')
        .max(2000, 'Hypothesis must not exceed 2000 characters'),
    variables: z.array(z.object({
        name: z.string().min(1),
        type: z.enum(['independent', 'dependent', 'control', 'confounder']),
        description: z.string().optional(),
    })).min(1, 'At least one variable is required'),
    context: z.object({
        domain: z.string().optional(),
        priorKnowledge: z.array(z.string()).optional(),
        constraints: z.array(z.string()).optional(),
    }).optional(),
});

/**
 * Experiment Runner Input
 */
export const ExperimentRunnerInputSchema = z.object({
    experimentId: z.string().uuid().optional(),
    hypothesisId: z.string().uuid(),
    parameters: z.record(
        z.string(),
        z.union([
            z.string(),
            z.number(),
            z.boolean(),
            z.array(z.union([z.string(), z.number(), z.boolean()])),
        ])
    ),
    expectedOutcome: z.string().optional(),
    timeout: z.number().int().positive().max(3600000).default(60000), // Max 1 hour
});

/**
 * Data Analyzer Input
 */
export const DataAnalyzerInputSchema = z.object({
    data: z.array(
        z.record(z.string(), z.union([
            z.string(),
            z.number(),
            z.boolean(),
            z.null(),
        ]))
    ).min(1, 'At least one data point is required'),
    analysis: z.object({
        type: z.enum(['descriptive', 'inferential', 'causal', 'predictive']),
        methods: z.array(z.string()).min(1, 'At least one analysis method is required'),
        significanceLevel: z.number().min(0).max(1).default(0.05),
    }),
    variables: z.object({
        independent: z.array(z.string()).optional(),
        dependent: z.array(z.string()).min(1, 'At least one dependent variable is required'),
        control: z.array(z.string()).optional(),
    }),
});

/**
 * Literature Search Input
 */
export const LiteratureSearchInputSchema = z.object({
    query: z.string().min(3, 'Query must be at least 3 characters'),
    filters: z.object({
        dateRange: z.object({
            start: z.string().datetime().optional(),
            end: z.string().datetime().optional(),
        }).optional(),
        sources: z.array(z.enum(['pubmed', 'arxiv', 'semantic_scholar', 'crossref'])).optional(),
        maxResults: z.number().int().min(1).max(100).default(20),
        includeAbstracts: z.boolean().default(true),
    }).optional(),
});

// ── Tool Result Schemas ──────────────────────────────────────────────────────

/**
 * Protein Structure Result
 */
export const ProteinStructureResultSchema = z.object({
    pdbId: z.string(),
    pdbData: z.string(),
    metadata: z.object({
        title: z.string(),
        organism: z.string().optional(),
        resolution: z.number().optional(),
        method: z.string().optional(),
        chains: z.number(),
        atoms: z.number(),
    }),
    fetchedAt: z.string().datetime(),
});

/**
 * Hypothesis Result
 */
export const HypothesisResultSchema = z.object({
    id: z.string().uuid(),
    hypothesis: z.string(),
    variables: z.array(z.object({
        name: z.string(),
        type: z.enum(['independent', 'dependent', 'control', 'confounder']),
        description: z.string().optional(),
    })),
    causalGraph: z.object({
        nodes: z.array(z.string()),
        edges: z.array(z.object({
            from: z.string(),
            to: z.string(),
            type: z.enum(['causes', 'inhibits', 'correlates', 'confounds']),
        })),
    }).optional(),
    confidence: z.number().min(0).max(1),
    createdAt: z.string().datetime(),
});

/**
 * Experiment Result
 */
export const ExperimentResultSchema = z.object({
    experimentId: z.string().uuid(),
    status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
    results: z.record(z.string(), z.any()).optional(),
    metrics: z.object({
        runtimeMs: z.number(),
        memoryUsedMB: z.number().optional(),
        cpuPercent: z.number().optional(),
    }).optional(),
    error: z.string().optional(),
    completedAt: z.string().datetime().optional(),
});

// ── Experiment Record Schema ─────────────────────────────────────────────────

/**
 * Lab Experiment Record (for persistence)
 */
export const LabExperimentSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    toolName: LabToolNameSchema,
    causalRole: CausalRoleSchema,
    inputJson: z.record(z.string(), z.any()),
    resultJson: z.record(z.string(), z.any()).nullable(),
    inputHash: z.string(),
    metadata: z.object({
        traceId: z.string().optional(),
        actionHash: z.string().optional(),
        parentExperimentId: z.string().uuid().optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
    }).optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

// ── Validation Helpers ───────────────────────────────────────────────────────

/**
 * Validation result type
 */
export type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; error: z.ZodError };

/**
 * Validate input against schema with detailed error messages
 */
export function validateInput<T>(
    schema: z.ZodSchema<T>,
    input: unknown
): ValidationResult<T> {
    const result = schema.safeParse(input);

    if (result.success) {
        return { success: true, data: result.data };
    }

    return { success: false, error: result.error };
}

/**
 * Format Zod errors for display
 */
export function formatValidationErrors(error: z.ZodError): string[] {
    return error.issues.map(issue => {
        const path = issue.path.join('.');
        return `${path ? `${path}: ` : ''}${issue.message}`;
    });
}

/**
 * Create a validated version of a function
 */
export function withValidation<TInput, TOutput>(
    schema: z.ZodSchema<TInput>,
    fn: (input: TInput) => Promise<TOutput>
): (input: unknown) => Promise<TOutput> {
    return async (input: unknown) => {
        const result = schema.parse(input);
        return fn(result);
    };
}

// ── Type Exports ─────────────────────────────────────────────────────────────

export type CausalRole = z.infer<typeof CausalRoleSchema>;
export type LabToolName = z.infer<typeof LabToolNameSchema>;
export type LLMProvider = z.infer<typeof LLMProviderSchema>;
export type LLMConfig = z.infer<typeof LLMConfigSchema>;

export type ProteinViewerInput = z.infer<typeof ProteinViewerInputSchema>;
export type HypothesisBuilderInput = z.infer<typeof HypothesisBuilderInputSchema>;
export type ExperimentRunnerInput = z.infer<typeof ExperimentRunnerInputSchema>;
export type DataAnalyzerInput = z.infer<typeof DataAnalyzerInputSchema>;
export type LiteratureSearchInput = z.infer<typeof LiteratureSearchInputSchema>;

export type ProteinStructureResult = z.infer<typeof ProteinStructureResultSchema>;
export type HypothesisResult = z.infer<typeof HypothesisResultSchema>;
export type ExperimentResult = z.infer<typeof ExperimentResultSchema>;
export type LabExperiment = z.infer<typeof LabExperimentSchema>;
