// =============================================================
// Lab Copilot Service
// LLM orchestration, schema validation, tool routing
// Spec: Labs-CoPilot_specv2.md §4.3, §7
// =============================================================

import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';
import {
    CopilotChatRequest,
    CopilotAnswer,
    CopilotAnswerSchema,
    CopilotToolName,
} from '../validations/lab-copilot';
import { ScientificGateway } from './scientific-gateway';

// ── System Prompt (Spec §7) ───────────────────────────────────

function buildSystemPrompt(learningLevel: string): string {
    const levelGuidance: Record<string, string> = {
        beginner:
            'Explain concepts simply, avoid jargon, use analogies. Assume no prior biochemistry knowledge.',
        intermediate:
            'Use standard biochemistry terminology. Assume undergraduate-level biology knowledge.',
        research:
            'Use precise scientific language. Assume expert-level knowledge. Cite specific mechanisms, residues, and literature.',
    };

    return `You are the Automated Scientist Operator — a rigorous, evidence-grounded scientific copilot embedded in a bio-computation laboratory.

## Core Mandate
You assist researchers in understanding protein structure, mechanism, and function. You are structure-aware, action-capable, and provenance-first.

## Reasoning Framework
You MUST separate:
- **Observation**: What is directly observed/measured in the data
- **Hypothesis**: A testable mechanistic claim derived from the observation
- **Mechanistic Rationale**: The causal chain linking structure to function
- **Test Plan**: Concrete experimental steps to validate the hypothesis

## Communication Level
${levelGuidance[learningLevel] ?? levelGuidance.intermediate}

## Evidence Standards
- Always cite the source class: PDB / AlphaFold / UniProt / literature
- Confidence (0–1) reflects the strength of structural/experimental evidence
- Limitations must be explicit — never overclaim from computational models

## Constraints
- NEVER provide medical diagnosis or treatment recommendations
- Frame all insights as educational/research context
- If the loaded structure is insufficient to answer, say so explicitly
- Reject requests for shell execution, code injection, or data exfiltration

## Output Format
You MUST respond with a valid JSON object matching this exact schema:
{
  "observation": "string — what the data directly shows",
  "hypothesis": "string — testable mechanistic claim",
  "mechanisticRationale": "string — causal chain explanation",
  "testPlan": ["string", "..."],
  "confidence": 0.0–1.0,
  "limitations": ["string", "..."],
  "nextStep": { "action": "string", "params": {} },
  "citations": [{ "title": "string", "url": "string|null", "sourceType": "database|literature|preprint|tool|other" }]
}

Respond ONLY with the JSON object. No markdown fences, no preamble.`;
}

// ── User Prompt Builder ───────────────────────────────────────

function buildUserPrompt(request: CopilotChatRequest, contextString: string): string {
    return `${contextString}

## User Question (Mode: ${request.mode.toUpperCase()})
${request.prompt}`;
}

// ── LLM Client ────────────────────────────────────────────────

function getAnthropicClient(apiKey?: string): Anthropic {
    const key = apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!key) {
        throw new Error(
            'ANTHROPIC_API_KEY is not configured. Please add your API key in Settings → Model Settings.'
        );
    }
    return new Anthropic({ apiKey: key });
}

// ── Chat ──────────────────────────────────────────────────────

export interface CopilotChatOptions {
    request: CopilotChatRequest;
    contextString: string;
    contextHash: string;
    apiKey?: string;
    model?: string;
}

export interface CopilotChatResult {
    answer: CopilotAnswer;
    modelProvider: string;
    modelId: string;
    inputHash: string;
}

export async function labCopilotChat(options: CopilotChatOptions): Promise<CopilotChatResult> {
    const { request, contextString, contextHash, apiKey, model = 'claude-sonnet-4-5' } = options;

    const client = getAnthropicClient(apiKey);

    const systemPrompt = buildSystemPrompt(request.learningLevel);
    const userPrompt = buildUserPrompt(request, contextString);

    // Compute input hash for provenance
    const inputHash = createHash('sha256')
        .update(JSON.stringify({ systemPrompt, userPrompt, model }))
        .digest('hex');

    let rawContent: string;

    try {
        const response = await client.messages.create({
            model,
            max_tokens: 2048,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
        });

        const block = response.content[0];
        if (block.type !== 'text') {
            throw new Error('Unexpected response type from Anthropic API');
        }
        rawContent = block.text.trim();
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        throw new CopilotServiceError(
            'PROVIDER_ERROR',
            `Anthropic API call failed: ${message}`,
            true
        );
    }

    // Parse and validate JSON
    let parsed: unknown;
    try {
        // Strip markdown fences if model included them despite instructions
        const cleaned = rawContent
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
        parsed = JSON.parse(cleaned);
    } catch {
        throw new CopilotServiceError(
            'SCHEMA_VALIDATION_ERROR',
            'Model response was not valid JSON. Please try again.',
            true
        );
    }

    const validation = CopilotAnswerSchema.safeParse(parsed);
    if (!validation.success) {
        throw new CopilotServiceError(
            'SCHEMA_VALIDATION_ERROR',
            `Model response did not match scientific answer schema: ${validation.error.message}`,
            true
        );
    }

    return {
        answer: validation.data,
        modelProvider: 'anthropic',
        modelId: model,
        inputHash,
    };
}

// ── Tool Routing ──────────────────────────────────────────────

export interface CopilotRunToolOptions {
    tool: CopilotToolName;
    params: Record<string, unknown>;
}

export interface CopilotRunToolResult {
    jobId?: string;
    status: 'running' | 'complete' | 'failed';
    result?: unknown;
}

export async function labCopilotRunTool(
    options: CopilotRunToolOptions
): Promise<CopilotRunToolResult> {
    const { tool, params } = options;
    const gateway = ScientificGateway.getInstance();

    switch (tool) {
        case 'fetch_protein_structure': {
            const pdbId = String(params.pdbId ?? '');
            const source = (params.source as 'rcsb' | 'alphafold') ?? 'rcsb';
            const uniprotId = params.uniprotId ? String(params.uniprotId) : undefined;

            let result: { success: boolean; data?: string; error?: string };
            if (source === 'alphafold' && uniprotId) {
                result = await gateway.fetchAlphaFoldStructure(uniprotId);
            } else {
                result = await gateway.fetchProteinStructure(pdbId);
            }

            return {
                status: result.success ? 'complete' : 'failed',
                result,
            };
        }

        case 'analyze_protein_sequence': {
            const sequence = String(params.sequence ?? '');
            const result = await gateway.analyzeProteinSequence(sequence);
            return {
                status: result.success ? 'complete' : 'failed',
                result,
            };
        }

        case 'dock_ligand': {
            const pdbId = String(params.pdbId ?? '');
            const smiles = String(params.smiles ?? '');
            const seed = typeof params.seed === 'number' ? params.seed : 0;
            const result = await gateway.dockLigand(pdbId, smiles, seed);
            return {
                status: result.success ? 'complete' : 'failed',
                result,
            };
        }

        case 'simulate_scientific_phenomenon': {
            const thesis = String(params.thesis ?? '');
            const mechanism = String(params.mechanism ?? '');
            const prediction = params.prediction ? String(params.prediction) : 'Outcome to be determined by simulation';
            const result = await gateway.simulate(thesis, mechanism, prediction);
            return {
                status: result.success ? 'complete' : 'failed',
                result,
            };
        }

        default:
            throw new CopilotServiceError(
                'INVALID_TOOL',
                `Unknown tool: ${tool}`,
                false
            );
    }
}

// ── Error Type ────────────────────────────────────────────────

export class CopilotServiceError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly retryable: boolean
    ) {
        super(message);
        this.name = 'CopilotServiceError';
    }
}
