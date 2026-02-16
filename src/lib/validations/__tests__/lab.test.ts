import { describe, it, expect } from 'vitest';
import {
    ProteinViewerInputSchema,
    HypothesisBuilderInputSchema,
    ExperimentRunnerInputSchema,
    DataAnalyzerInputSchema,
    LiteratureSearchInputSchema,
    LLMConfigSchema,
    CausalRoleSchema,
    LabToolNameSchema,
    validateInput,
    formatValidationErrors,
} from '../lab';

describe('Lab Validation Schemas', () => {
    describe('CausalRoleSchema', () => {
        it('should accept valid causal roles', () => {
            expect(CausalRoleSchema.parse('observation')).toBe('observation');
            expect(CausalRoleSchema.parse('intervention')).toBe('intervention');
            expect(CausalRoleSchema.parse('hybrid')).toBe('hybrid');
        });

        it('should reject invalid causal roles', () => {
            expect(() => CausalRoleSchema.parse('invalid')).toThrow();
        });
    });

    describe('LabToolNameSchema', () => {
        it('should accept valid tool names', () => {
            expect(LabToolNameSchema.parse('protein_viewer')).toBe('protein_viewer');
            expect(LabToolNameSchema.parse('hypothesis_builder')).toBe('hypothesis_builder');
            expect(LabToolNameSchema.parse('experiment_runner')).toBe('experiment_runner');
        });

        it('should reject invalid tool names', () => {
            expect(() => LabToolNameSchema.parse('invalid_tool')).toThrow();
        });
    });

    describe('LLMConfigSchema', () => {
        it('should accept valid LLM config', () => {
            const config = {
                provider: 'openai',
                model: 'gpt-4',
                temperature: 0.7,
                maxTokens: 4096,
            };
            const result = LLMConfigSchema.parse(config);
            expect(result.provider).toBe('openai');
            expect(result.model).toBe('gpt-4');
        });

        it('should apply defaults for optional fields', () => {
            const config = {
                provider: 'anthropic',
                model: 'claude-3',
            };
            const result = LLMConfigSchema.parse(config);
            expect(result.temperature).toBe(0.7);
            expect(result.maxTokens).toBe(4096);
        });

        it('should reject invalid temperature', () => {
            const config = {
                provider: 'openai',
                model: 'gpt-4',
                temperature: 3, // Invalid: > 2
            };
            expect(() => LLMConfigSchema.parse(config)).toThrow();
        });

        it('should reject missing required fields', () => {
            const config = {
                provider: 'openai',
                // missing model
            };
            expect(() => LLMConfigSchema.parse(config)).toThrow();
        });
    });

    describe('ProteinViewerInputSchema', () => {
        it('should accept valid PDB ID', () => {
            const input = { pdbId: '1CRN' };
            const result = ProteinViewerInputSchema.parse(input);
            expect(result.pdbId).toBe('1CRN');
        });

        it('should accept valid options', () => {
            const input = {
                pdbId: '4HHB',
                options: {
                    showWater: true,
                    colorScheme: 'element',
                    representation: 'surface',
                },
            };
            const result = ProteinViewerInputSchema.parse(input);
            expect(result.options?.showWater).toBe(true);
            expect(result.options?.colorScheme).toBe('element');
        });

        it('should reject invalid PDB ID length', () => {
            const input = { pdbId: 'TOOLONG' };
            expect(() => ProteinViewerInputSchema.parse(input)).toThrow();
        });

        it('should reject PDB ID with special characters', () => {
            const input = { pdbId: '1CR!' };
            expect(() => ProteinViewerInputSchema.parse(input)).toThrow();
        });
    });

    describe('HypothesisBuilderInputSchema', () => {
        it('should accept valid hypothesis input', () => {
            const input = {
                hypothesis: 'Increasing temperature will accelerate the reaction rate',
                variables: [
                    { name: 'temperature', type: 'independent' },
                    { name: 'reaction_rate', type: 'dependent' },
                ],
            };
            const result = HypothesisBuilderInputSchema.parse(input);
            expect(result.hypothesis).toBe('Increasing temperature will accelerate the reaction rate');
            expect(result.variables).toHaveLength(2);
        });

        it('should reject hypothesis that is too short', () => {
            const input = {
                hypothesis: 'Too short', // Less than 10 characters
                variables: [{ name: 'x', type: 'independent' }],
            };
            expect(() => HypothesisBuilderInputSchema.parse(input)).toThrow();
        });

        it('should reject empty variables array', () => {
            const input = {
                hypothesis: 'A valid hypothesis text here',
                variables: [],
            };
            expect(() => HypothesisBuilderInputSchema.parse(input)).toThrow();
        });

        it('should reject invalid variable type', () => {
            const input = {
                hypothesis: 'A valid hypothesis text here',
                variables: [{ name: 'x', type: 'invalid_type' }],
            };
            expect(() => HypothesisBuilderInputSchema.parse(input)).toThrow();
        });
    });

    describe('ExperimentRunnerInputSchema', () => {
        it('should accept valid experiment input', () => {
            const input = {
                hypothesisId: '123e4567-e89b-12d3-a456-426614174000',
                parameters: {
                    temperature: 25,
                    duration: 60,
                    solvent: 'water',
                },
            };
            const result = ExperimentRunnerInputSchema.parse(input);
            expect(result.hypothesisId).toBe('123e4567-e89b-12d3-a456-426614174000');
            expect(result.parameters.temperature).toBe(25);
        });

        it('should apply default timeout', () => {
            const input = {
                hypothesisId: '123e4567-e89b-12d3-a456-426614174000',
                parameters: {},
            };
            const result = ExperimentRunnerInputSchema.parse(input);
            expect(result.timeout).toBe(60000);
        });

        it('should reject invalid UUID', () => {
            const input = {
                hypothesisId: 'not-a-uuid',
                parameters: {},
            };
            expect(() => ExperimentRunnerInputSchema.parse(input)).toThrow();
        });

        it('should reject timeout exceeding maximum', () => {
            const input = {
                hypothesisId: '123e4567-e89b-12d3-a456-426614174000',
                parameters: {},
                timeout: 5000000, // > 3600000
            };
            expect(() => ExperimentRunnerInputSchema.parse(input)).toThrow();
        });
    });

    describe('DataAnalyzerInputSchema', () => {
        it('should accept valid data analyzer input', () => {
            const input = {
                data: [
                    { x: 1, y: 2 },
                    { x: 2, y: 4 },
                    { x: 3, y: 6 },
                ],
                analysis: {
                    type: 'descriptive',
                    methods: ['mean', 'std'],
                },
                variables: {
                    dependent: ['y'],
                },
            };
            const result = DataAnalyzerInputSchema.parse(input);
            expect(result.data).toHaveLength(3);
            expect(result.analysis.type).toBe('descriptive');
        });

        it('should apply default significance level', () => {
            const input = {
                data: [{ x: 1 }],
                analysis: {
                    type: 'inferential',
                    methods: ['t-test'],
                },
                variables: {
                    dependent: ['x'],
                },
            };
            const result = DataAnalyzerInputSchema.parse(input);
            expect(result.analysis.significanceLevel).toBe(0.05);
        });

        it('should reject empty data array', () => {
            const input = {
                data: [],
                analysis: {
                    type: 'descriptive',
                    methods: ['mean'],
                },
                variables: {
                    dependent: ['x'],
                },
            };
            expect(() => DataAnalyzerInputSchema.parse(input)).toThrow();
        });

        it('should reject empty dependent variables', () => {
            const input = {
                data: [{ x: 1 }],
                analysis: {
                    type: 'descriptive',
                    methods: ['mean'],
                },
                variables: {
                    dependent: [],
                },
            };
            expect(() => DataAnalyzerInputSchema.parse(input)).toThrow();
        });
    });

    describe('LiteratureSearchInputSchema', () => {
        it('should accept valid search input', () => {
            const input = {
                query: 'protein folding mechanisms',
            };
            const result = LiteratureSearchInputSchema.parse(input);
            expect(result.query).toBe('protein folding mechanisms');
        });

        it('should accept filters', () => {
            const input = {
                query: 'machine learning',
                filters: {
                    sources: ['pubmed', 'arxiv'],
                    maxResults: 50,
                },
            };
            const result = LiteratureSearchInputSchema.parse(input);
            expect(result.filters?.sources).toContain('pubmed');
            expect(result.filters?.maxResults).toBe(50);
        });

        it('should reject query that is too short', () => {
            const input = { query: 'ab' }; // Less than 3 characters
            expect(() => LiteratureSearchInputSchema.parse(input)).toThrow();
        });

        it('should reject maxResults exceeding limit', () => {
            const input = {
                query: 'test query',
                filters: {
                    maxResults: 200, // > 100
                },
            };
            expect(() => LiteratureSearchInputSchema.parse(input)).toThrow();
        });
    });

    describe('validateInput helper', () => {
        it('should return success for valid input', () => {
            const result = validateInput(ProteinViewerInputSchema, { pdbId: '1CRN' });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.pdbId).toBe('1CRN');
            }
        });

        it('should return error for invalid input', () => {
            const result = validateInput(ProteinViewerInputSchema, { pdbId: 'INVALID' });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeDefined();
            }
        });
    });

    describe('formatValidationErrors helper', () => {
        it('should format errors into readable strings', () => {
            const result = validateInput(HypothesisBuilderInputSchema, {
                hypothesis: 'short',
                variables: [],
            });

            if (!result.success) {
                const formatted = formatValidationErrors(result.error);
                expect(formatted.length).toBeGreaterThan(0);
                expect(formatted.some(e => e.includes('hypothesis') || e.includes('variables'))).toBe(true);
            }
        });
    });
});
