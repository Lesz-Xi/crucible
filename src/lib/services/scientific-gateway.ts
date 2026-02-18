
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
                description: "Check if a scientific claim violates fundamental physical laws (Conservation of Energy, Thermodynamics, etc.). Use this to verify any scientific claim.",
                input_schema: {
                    type: "object",
                    properties: {
                        claim: { type: "string", description: "The scientific claim to verify." }
                    },
                    required: ["claim"]
                }
            },
            {
                name: "fetch_protein_structure",
                description: "Fetch a protein structure (PDB format) from the RCSB Polymer Data Bank. Use this to visualize biomolecules. Returns the raw PDB string.",
                input_schema: {
                    type: "object",
                    properties: {
                        pdbId: { type: "string", description: "The 4-character PDB ID (e.g., '1CRN', '4HHB')." }
                    },
                    required: ["pdbId"]
                }
            },
            {
                name: "analyze_protein_sequence",
                description: "Calculate physicochemical properties of a protein sequence using Biopython. Returns Molecular Weight, Isoelectric Point, and Instability Index.",
                input_schema: {
                    type: "object",
                    properties: {
                        sequence: { type: "string", description: "The amino acid sequence (e.g., 'MVLSPADKT...')." }
                    },
                    required: ["sequence"]
                }
            },
            {
                name: "dock_ligand",
                description: "Perform a molecular docking simulation to estimate the binding affinity of a ligand (SMILES) to a receptor (PDB). Returns a deterministic affinity score (kcal/mol) based on the seed. Phase 2 Stub.",
                input_schema: {
                    type: "object",
                    properties: {
                        pdbId: { type: "string", description: "The PDB ID of the receptor." },
                        smiles: { type: "string", description: "The SMILES string of the ligand." },
                        seed: { type: "number", description: "Random seed for deterministic reproduction." }
                    },
                    required: ["pdbId", "smiles", "seed"]
                }
            }
        ];
    }

    /**
     * Fetch a protein structure from RCSB.
     * used when: User asks to see/visualize a protein.
     */
    async fetchProteinStructure(pdbId: string): Promise<{ success: boolean; data?: string; error?: string }> {
        try {
            const response = await fetch(`https://files.rcsb.org/download/${pdbId.toUpperCase()}.pdb`);
            if (!response.ok) {
                throw new Error(`Failed to fetch PDB ${pdbId}: ${response.statusText}`);
            }
            const data = await response.text();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    /**
     * Analyze a protein sequence using Biopython (via Pyodide).
     * used when: User asks for properties of a sequence.
     */
    async analyzeProteinSequence(sequence: string): Promise<{ success: boolean; data?: any; error?: string }> {
        // Sanitize sequence (remove whitespace, newlines)
        const cleanSeq = sequence.replace(/\s+/g, '').toUpperCase();

        // Python script to run in Pyodide
        const pythonCode = `
from Bio.SeqUtils import molecular_weight
from Bio.SeqUtils.ProtParam import ProteinAnalysis
import json
import sys

try:
    seq_str = "${cleanSeq}"
    analysed_seq = ProteinAnalysis(seq_str)

    result = {
        "molecular_weight": molecular_weight(seq_str, seq_type="protein"),
        "aromaticity": analysed_seq.aromaticity(),
        "instability_index": analysed_seq.instability_index(),
        "isoelectric_point": analysed_seq.isoelectric_point(),
        "gravy": analysed_seq.gravy(),
        "amino_acid_percent": analysed_seq.get_amino_acids_percent()
    }

    print(json.dumps(result))
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
`;

        const validation = await validateProtocol(pythonCode);

        if (validation.success && validation.stdout) {
            try {
                // Parse the JSON output from Python
                // Find the JSON object in stdout (in case of other prints)
                const jsonMatch = validation.stdout.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[0]);
                    return { success: true, data };
                } else {
                    return { success: false, error: "Failed to parse Python output" };
                }
            } catch (e) {
                return { success: false, error: "Invalid JSON from Python execution" };
            }
        } else {
            return { success: false, error: validation.error || validation.stderr || "Pyodide execution failed" };
        }
    }


    /**
     * Resolve a free-text query to a likely UniProt accession.
     */
    async resolveUniProtAccession(query: string): Promise<{ success: boolean; accession?: string; error?: string }> {
        try {
            const q = encodeURIComponent(query.trim());
            const url = `https://rest.uniprot.org/uniprotkb/search?query=${q}&fields=accession,protein_name,organism_name&format=json&size=1`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`UniProt search failed: ${res.statusText}`);
            const json = await res.json() as any;
            const accession = json?.results?.[0]?.primaryAccession;
            if (!accession) return { success: false, error: `No UniProt match for "${query}"` };
            return { success: true, accession };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    /**
     * Resolve a free-text query to a likely RCSB PDB ID.
     */
    async resolvePdbId(query: string): Promise<{ success: boolean; pdbId?: string; error?: string }> {
        try {
            const body = {
                query: {
                    type: 'terminal',
                    service: 'full_text',
                    parameters: { value: query.trim() }
                },
                return_type: 'entry',
                request_options: { pager: { start: 0, rows: 1 } }
            };

            const res = await fetch('https://search.rcsb.org/rcsbsearch/v2/query?json=' + encodeURIComponent(JSON.stringify(body)));
            if (!res.ok) throw new Error(`RCSB search failed: ${res.statusText}`);
            const json = await res.json() as any;
            const pdbId = json?.result_set?.[0]?.identifier;
            if (!pdbId) return { success: false, error: `No PDB match for "${query}"` };
            return { success: true, pdbId: String(pdbId).toUpperCase() };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    /**
     * Fetch a predicted protein structure from AlphaFold DB by UniProt accession.
     */
    async fetchAlphaFoldStructure(uniprotId: string): Promise<{ success: boolean; data?: string; error?: string }> {
        const accession = uniprotId.trim().toUpperCase();
        const versions = ['v4', 'v3', 'v2', 'v1'];

        try {
            let lastError: string | undefined;

            for (const version of versions) {
                const url = `https://alphafold.ebi.ac.uk/files/AF-${accession}-F1-model_${version}.pdb`;
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.text();
                    return { success: true, data };
                }
                lastError = `${response.status} ${response.statusText}`;
            }

            return { success: false, error: `No AlphaFold model found for ${accession}${lastError ? ` (${lastError})` : ''}` };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    /**
     * Deterministic Docking Stub (Phase 2)
     * used when: User asks to dock a ligand.
     */
    async dockLigand(pdbId: string, smiles: string, seed: number): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            // 1. Deterministic Calculation (Hash)
            const inputString = `${pdbId}-${smiles}-${seed}`;
            let hash = 0;
            for (let i = 0; i < inputString.length; i++) {
                const char = inputString.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }

            // 2. Map hash to scientific range (-5.0 to -12.0 kcal/mol)
            // Normalize hash to 0-1
            const normalized = (Math.abs(hash) % 1000) / 1000;
            const affinity = -5.0 - (normalized * 7.0); // Range: -5.0 to -12.0
            const rmsd = (normalized * 2.5).toFixed(2); // Range: 0.0 to 2.5

            // 3. Fake Poses (just metadata for now)
            const result = {
                affinity_kcal_mol: parseFloat(affinity.toFixed(2)),
                rmsd: parseFloat(rmsd),
                poses: [
                    { rank: 1, score: affinity.toFixed(2), rmsd: 0 },
                    { rank: 2, score: (affinity + 0.5).toFixed(2), rmsd: rmsd }
                ],
                engine: "Vina-Stub-v1 (Deterministic)",
                seed: seed
            };

            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }
}
