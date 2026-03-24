// =============================================================
// Lab Copilot — Zod Validation Schemas
// Spec: Labs-CoPilot_specv2.md §FR-2, §6
// =============================================================

import { z } from 'zod';

// ── Lab Context ───────────────────────────────────────────────

export const ActiveStructureSchema = z.object({
    id: z.string().min(1),
    source: z.enum(['rcsb', 'alphafold']),
    metadata: z
        .object({
            title: z.string().optional(),
            organism: z.string().optional(),
            resolution: z.number().optional(),
            method: z.string().optional(),
        })
        .optional(),
});

export const RecentExperimentSnapshotSchema = z.object({
    id: z.string(),
    tool_name: z.enum([
        'fetch_protein_structure',
        'analyze_protein_sequence',
        'dock_ligand',
        'simulate_scientific_phenomenon',
    ]),
    status: z.enum(['pending', 'success', 'failure']),
    summary: z.string().optional(), // pre-computed 1-line summary
});

export const LabContextSchema = z.object({
    activeStructure: ActiveStructureSchema.optional(),
    recentExperiments: z.array(RecentExperimentSnapshotSchema).max(3).default([]),
});

// ── Chat Request ──────────────────────────────────────────────

export const CopilotModeSchema = z.enum(['ask', 'run', 'learn']);
export const LearningLevelSchema = z.enum(['beginner', 'intermediate', 'research']);

export const CopilotChatRequestSchema = z.object({
    prompt: z.string().min(1).max(2000),
    mode: CopilotModeSchema.default('ask'),
    learningLevel: LearningLevelSchema.default('intermediate'),
    labContext: LabContextSchema.default({ recentExperiments: [] }),
});

// ── Scientific Answer Schema (FR-2) ───────────────────────────

export const CitationSchema = z.object({
    title: z.string(),
    url: z.string().url().optional(),
    sourceType: z.enum(['database', 'literature', 'preprint', 'tool', 'other']),
});

export const NextStepSchema = z.object({
    action: z.string(),
    params: z.record(z.string(), z.unknown()).optional(),
});

export const CopilotAnswerSchema = z.object({
    observation: z.string(),
    hypothesis: z.string(),
    mechanisticRationale: z.string(),
    testPlan: z.array(z.string()).min(1),
    confidence: z.number().min(0).max(1),
    limitations: z.array(z.string()).min(1),
    nextStep: NextStepSchema,
    citations: z.array(CitationSchema).default([]),
});

// ── Chat Response ─────────────────────────────────────────────

export const CopilotChatResponseSchema = z.object({
    success: z.boolean(),
    answer: CopilotAnswerSchema.optional(),
    messageId: z.string().optional(),
    error: z
        .object({
            code: z.string(),
            message: z.string(),
            retryable: z.boolean().default(false),
        })
        .optional(),
});

// ── Run-Tool Request ──────────────────────────────────────────

export const CopilotToolNameSchema = z.enum([
    'fetch_protein_structure',
    'analyze_protein_sequence',
    'dock_ligand',
    'simulate_scientific_phenomenon',
]);

export const CopilotRunToolRequestSchema = z.object({
    tool: CopilotToolNameSchema,
    params: z.record(z.string(), z.unknown()),
    sourceMessageId: z.string().uuid().optional(),
});

// ── Run-Tool Response ─────────────────────────────────────────

export const CopilotRunToolResponseSchema = z.object({
    success: z.boolean(),
    jobId: z.string().optional(),
    status: z.enum(['running', 'complete', 'failed']).optional(),
    result: z.unknown().optional(),
    error: z
        .object({
            code: z.string(),
            message: z.string(),
            retryable: z.boolean().default(false),
        })
        .optional(),
});

// ── TypeScript Types ──────────────────────────────────────────

export type ActiveStructure = z.infer<typeof ActiveStructureSchema>;
export type LabContext = z.infer<typeof LabContextSchema>;
export type CopilotMode = z.infer<typeof CopilotModeSchema>;
export type LearningLevel = z.infer<typeof LearningLevelSchema>;
export type CopilotChatRequest = z.infer<typeof CopilotChatRequestSchema>;
export type CopilotAnswer = z.infer<typeof CopilotAnswerSchema>;
export type CopilotChatResponse = z.infer<typeof CopilotChatResponseSchema>;
export type CopilotToolName = z.infer<typeof CopilotToolNameSchema>;
export type CopilotRunToolRequest = z.infer<typeof CopilotRunToolRequestSchema>;
export type CopilotRunToolResponse = z.infer<typeof CopilotRunToolResponseSchema>;
export type Citation = z.infer<typeof CitationSchema>;
export type NextStep = z.infer<typeof NextStepSchema>;
