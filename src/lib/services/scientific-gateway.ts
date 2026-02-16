
import { validateProtocol, ValidationResult } from './protocol-validator';
import { ExperimentGenerator } from '../ai/experiment-generator';
import { StructuralCausalModel } from '../ai/causal-blueprint';
import {
    linearRegression,
    runFullAnalysis
} from '../compute/scientific-compute-engine';
import { ScientificDataPoint } from '../../types/scientific-data';
import { NovelIdea } from '../../types';
import { mean, std } from 'mathjs';

// ── Interfaces ────────────────────────────────────────────────

export interface SimulationResult {
    success: boolean;
    protocolCode: string;
    execution: {
        stdout: string;
        stderr: string;
        metrics?: any;
        executionTimeMs: number;
        error?: string;
    };
    degraded: boolean; // True if we fell back to text-mode
}

export interface CalculationResult {
    success: boolean;
    operation: string;
    result?: any; // Can be number or object
    data?: any;
    error?: string;
}

export interface VerificationResult {
    valid: boolean;
    violations: {
        constraint: string;
        description: string;
        severity: string;
    }[];
    passedConstraints: string[];
}

/**
 * The Scientific Gateway (Agentic Bridge)
 * 
 * Orchestrates the "Vital Tools" of the Automated Scientist:
 * 1. Simulator (ProtocolValidator/Pyodide)
 * 2. Solver (ScientificComputeEngine/mathjs)
 * 3. Critic (StructuralCausalModel/Laws)
 * 
 * This service allows the Chat API to access these capabilities.
 */
export class ScientificGateway {
    private static instance: ScientificGateway;

    private experimentGenerator: ExperimentGenerator;

    private constructor() {
        this.experimentGenerator = new ExperimentGenerator();
    }

    public static getInstance(): ScientificGateway {
        if (!ScientificGateway.instance) {
            ScientificGateway.instance = new ScientificGateway();
        }
        return ScientificGateway.instance;
    }

    /**
     * Run a "Thought Experiment" by generating and executing Python code.
     * used when: User asks "What happens if..." or "Simulate X"
     */
    async simulate(
        thesis: string,
        mechanism: string,
        prediction: string
    ): Promise<SimulationResult> {
        const startTime = Date.now();

        try {
            // 1. Generate Protocol Code (The "Thought")
            // We pass stub values for scores as they are not needed for simulation-only requests
            const experiment = await this.experimentGenerator.generate({
                id: "sim-" + Date.now(),
                thesis,
                description: "Ephemeral simulation request",
                bridgedConcepts: [],
                confidence: 0,
                noveltyAssessment: "N/A",
                mechanism,
                prediction,
                noveltyScore: 0
            } as unknown as NovelIdea); // Cast because we might be missing some optional fields but have required ones

            // 2. Validate & Execute (The "Experiment")
            const validation = await validateProtocol(experiment.protocolCode);

            return {
                success: validation.success,
                protocolCode: experiment.protocolCode,
                execution: {
                    stdout: validation.stdout,
                    stderr: validation.stderr,
                    metrics: validation.metrics,
                    executionTimeMs: validation.executionTimeMs,
                    error: validation.error
                },
                degraded: !validation.success && (validation.error?.includes('Pyodide') || validation.error?.includes('timeout')) ? true : false
            };

        } catch (error) {
            return {
                success: false,
                protocolCode: "",
                execution: {
                    stdout: "",
                    stderr: String(error),
                    executionTimeMs: Date.now() - startTime,
                    error: String(error)
                },
                degraded: true
            };
        }
    }

    /**
     * Perform deterministic calculation on data.
     * used when: User asks for statistics, trends, or specific math.
     */
    async calculate(
        operation: 'mean' | 'std' | 'regression' | 'full_analysis',
        data: number[] | ScientificDataPoint[]
    ): Promise<CalculationResult> {
        try {
            let result: any;

            switch (operation) {
                case 'mean':
                    if (this.isNumberArray(data)) {
                        result = mean(data);
                    } else {
                        throw new Error("Operation 'mean' requires number[]");
                    }
                    break;

                case 'std':
                    if (this.isNumberArray(data)) {
                        result = std(data);
                    } else {
                        throw new Error("Operation 'std' requires number[]");
                    }
                    break;

                case 'regression':
                    if (this.isPointArray(data)) {
                        const x = data.map(p => p.xValue);
                        const y = data.map(p => p.yValue);
                        result = linearRegression(x, y);
                    } else {
                        throw new Error("Operation 'regression' requires ScientificDataPoint[]");
                    }
                    break;

                case 'full_analysis':
                    if (this.isPointArray(data)) {
                        result = await runFullAnalysis(data);
                    } else {
                        throw new Error("Operation 'full_analysis' requires ScientificDataPoint[]");
                    }
                    break;

                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            return {
                success: true,
                operation,
                result: result,
            };

        } catch (error) {
            return {
                success: false,
                operation,
                error: String(error)
            };
        }
    }

    /**
     * Validate a claim against physical laws.
     * used when: Generating the final answer to ensure Grounding.
     */
    async verify(
        claim: string
    ): Promise<VerificationResult> {
        // Ephemeral SCM for validation (stateless check against Universal Laws)
        const scm = new StructuralCausalModel("validation-gate");

        // Check against Tier 1 Constraints (Conservation of Energy, etc.)
        const result = await scm.validateMechanism(claim);

        return {
            valid: result.valid,
            violations: result.violations.map(v => ({
                constraint: v.constraint,
                description: v.description,
                severity: v.severity
            })),
            passedConstraints: result.passedConstraints
        };
    }

    // Type Guards
    private isNumberArray(data: any): data is number[] {
        return Array.isArray(data) && data.every(item => typeof item === 'number');
    }

    private isPointArray(data: any): data is ScientificDataPoint[] {
        return Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && 'xValue' in data[0] && 'yValue' in data[0];
    }

    public getTools(): any[] {
        return [
            {
                name: "simulate_scientific_phenomenon",
                description: "Simulate a scientific phenomenon by generating and executing a Python protocol. Use this when the user asks 'What happens if...' or 'Simulate X'. Returns execution results, metrics, and potential errors.",
                input_schema: {
                    type: "object",
                    properties: {
                        thesis: { type: "string", description: "The scientific hypothesis or question to simulate." },
                        mechanism: { type: "string", description: "The core mechanism to test." },
                        prediction: { type: "string", description: "Expected outcome." }
                    },
                    required: ["thesis", "mechanism", "prediction"]
                }
            },
            {
                name: "perform_mathematical_analysis",
                description: "Perform precise deterministic calculations or statistical analysis on data. Use for mean, std, regression, or full dataset analysis.",
                input_schema: {
                    type: "object",
                    properties: {
                        operation: { type: "string", enum: ["mean", "std", "regression", "full_analysis"], description: "The type of analysis to perform." },
                        data: {
                            type: "array",
                            items: {
                                oneOf: [
                                    { type: "number" },
                                    {
                                        type: "object",
                                        properties: {
                                            xValue: { type: "number" },
                                            yValue: { type: "number" },
                                            id: { type: "string" },
                                            timestamp: { type: "number" }
                                        },
                                        required: ["xValue", "yValue"]
                                    }
                                ]
                            },
                            description: "Array of numbers for mean/std, or array of data points for regression/full_analysis."
                        }
                    },
                    required: ["operation", "data"]
                }
            },
            {
                name: "verify_law_compliance",
                description: "Check if a scientific claim violates fundamental physical laws (Conservation of Energy, Thermodynamics, etc.). Use this to validate any generated scientific claims.",
                input_schema: {
                    type: "object",
                    properties: {
                        claim: { type: "string", description: "The scientific claim to verify." }
                    },
                    required: ["claim"]
                }
            }
        ];
    }
}
