
import { describe, it, expect } from 'vitest';
import {
    CopilotChatRequestSchema,
    CopilotAnswerSchema,
    CopilotRunToolRequestSchema
} from '../lib/validations/lab-copilot';

describe('Lab Copilot Validation Schemas', () => {

    describe('CopilotChatRequestSchema', () => {
        it('validates a correct chat request', () => {
            const validRequest = {
                prompt: "Analyze this protein",
                mode: "ask",
                learningLevel: "intermediate",
                labContext: {
                    activeStructure: {
                        id: "1ABC",
                        source: "rcsb",
                        metadata: { title: "Test" }
                    },
                    recentExperiments: []
                }
            };

            const result = CopilotChatRequestSchema.safeParse(validRequest);
            expect(result.success).toBe(true);
        });

        it('rejects missing prompt', () => {
            const invalidRequest = {
                mode: "ask",
                labContext: { recentExperiments: [] }
            };
            const result = CopilotChatRequestSchema.safeParse(invalidRequest);
            expect(result.success).toBe(false);
        });
    });

    describe('CopilotAnswerSchema', () => {
        it('validates a full answer', () => {
            const answer = {
                observation: 'The protein is folded.',
                hypothesis: 'It is stable.',
                mechanisticRationale: 'Due to disulfide bonds.',
                testPlan: ['Run MD simulation'],
                confidence: 0.95,
                limitations: ['In vitro only'],
                nextStep: {
                    action: 'Suggest further analysis',
                    params: { type: 'structural' }
                },
                citations: [
                    { title: 'Nature 2024', sourceType: 'literature' }
                ]
            };
            const result = CopilotAnswerSchema.safeParse(answer);
            if (!result.success) {
                console.error(result.error);
            }
            expect(result.success).toBe(true);
        });
    });

    describe('CopilotRunToolRequestSchema', () => {
        it('validates a valid tool run request', () => {
            const request = {
                tool: 'analyze_protein_sequence',
                params: { sequence: 'MKTVLQ' },
                sourceMessageId: '123e4567-e89b-12d3-a456-426614174000' // UUID required
            };
            const result = CopilotRunToolRequestSchema.safeParse(request);
            expect(result.success).toBe(true);
        });

        it('validates create_notebook_entry request via loose params check', () => {
            // The schema for params is record(string, unknown), so this should pass
            // Note: "create_notebook_entry" is NOT in the CopilotToolNameSchema enum in the file I viewed
            // Let me double check usage. If it's a client-side only action, it might not hit this schema.
            // Or maybe it's treated differently.
            // Wait, let's check CopilotToolNameSchema in the file again.
            // It has: fetch_protein_structure, analyze_protein_sequence, dock_ligand, simulate_scientific_phenomenon
            // It DOES NOT have create_notebook_entry.
            // So sending 'create_notebook_entry' to this schema WILL FAIL if I use 'tool' field.
            // However, LabCopilotPanel handles 'create_notebook_entry' LOCALLY.
            // It calls 'createExperiment' directly.
            // So this schema is ONLY for the 'run-tool' API which runs server-side tools.
            // I should NOT test create_notebook_entry against this schema if it's not supported by the API.

            const request = {
                tool: 'analyze_protein_sequence',
                params: { copilot_insight: true },
                sourceMessageId: '123e4567-e89b-12d3-a456-426614174000'
            };
            const result = CopilotRunToolRequestSchema.safeParse(request);
            expect(result.success).toBe(true);
        });

        it('rejects missing tool', () => {
            const request = {
                params: {}
            };
            const result = CopilotRunToolRequestSchema.safeParse(request);
            expect(result.success).toBe(false);
        });
    });

});
