// =============================================================
// Lab Context Builder
// Normalizes LabState into a compact, token-efficient context
// for the Lab Copilot LLM prompt.
// Spec: Labs-CoPilot_specv2.md §FR-1, §4.3
// =============================================================

import { createHash } from 'crypto';
import { LabState, LabExperiment } from '../../types/lab';
import { LabContext, ActiveStructure } from '../validations/lab-copilot';

// ── Types ─────────────────────────────────────────────────────

export interface CompactLabContext {
    contextString: string;   // Token-efficient string for LLM injection
    contextHash: string;     // SHA-256 of serialized context
    labContext: LabContext;  // Structured context for API transport
}

// ── Helpers ───────────────────────────────────────────────────

function summarizeExperiment(exp: LabExperiment): string {
    const statusIcon = exp.status === 'success' ? '✓' : exp.status === 'failure' ? '✗' : '⏳';
    const inputSummary = summarizeInput(exp);
    return `${statusIcon} [${exp.tool_name}] ${inputSummary} (${exp.causal_role})`;
}

function summarizeInput(exp: LabExperiment): string {
    const input = exp.input_json as unknown as Record<string, unknown>;
    if ('pdbId' in input) return `pdbId=${input.pdbId}`;
    if ('sequence' in input) {
        const seq = String(input.sequence ?? '');
        return `seq=${seq.slice(0, 20)}${seq.length > 20 ? '…' : ''}`;
    }
    if ('smiles' in input) return `smiles=${input.smiles}`;
    if ('thesis' in input) {
        const thesis = String(input.thesis ?? '');
        return `thesis="${thesis.slice(0, 40)}${thesis.length > 40 ? '…' : ''}"`;
    }
    return JSON.stringify(input).slice(0, 60);
}

function buildActiveStructure(state: LabState): ActiveStructure | undefined {
    if (!state.currentStructure) return undefined;
    const { pdbId, metadata } = state.currentStructure;

    // Determine source from metadata or default to rcsb
    const source: 'rcsb' | 'alphafold' =
        (metadata?.source as 'rcsb' | 'alphafold' | undefined) ?? 'rcsb';

    return {
        id: pdbId,
        source,
        metadata: {
            title: metadata?.title,
            organism: metadata?.organism,
            resolution: metadata?.resolution,
            method: metadata?.method,
        },
    };
}

// ── Main Builder ──────────────────────────────────────────────

/**
 * Builds a compact lab context from LabState.
 * Caps at last 3 experiments to stay within token budget.
 */
export function buildLabContext(state: LabState): CompactLabContext {
    const activeStructure = buildActiveStructure(state);

    // Take the last 3 experiments (most recent first)
    const recentExps = [...state.experimentHistory]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);

    const recentExperiments = recentExps.map((exp) => ({
        id: exp.id,
        tool_name: exp.tool_name,
        status: exp.status,
        summary: summarizeExperiment(exp),
    }));

    const labContext: LabContext = {
        activeStructure,
        recentExperiments,
    };

    // Build token-efficient context string for LLM injection
    const lines: string[] = ['=== LAB CONTEXT ==='];

    if (activeStructure) {
        lines.push(`Structure: ${activeStructure.id} (${activeStructure.source})`);
        if (activeStructure.metadata?.title) {
            lines.push(`Title: ${activeStructure.metadata.title}`);
        }
        if (activeStructure.metadata?.organism) {
            lines.push(`Organism: ${activeStructure.metadata.organism}`);
        }
        if (activeStructure.metadata?.resolution) {
            lines.push(`Resolution: ${activeStructure.metadata.resolution}Å`);
        }
        if (activeStructure.metadata?.method) {
            lines.push(`Method: ${activeStructure.metadata.method}`);
        }
    } else {
        lines.push('Structure: none loaded');
    }

    if (recentExperiments.length > 0) {
        lines.push('Recent Experiments:');
        recentExperiments.forEach((exp) => {
            lines.push(`  ${exp.summary ?? `[${exp.tool_name}] ${exp.status}`}`);
        });
    } else {
        lines.push('Recent Experiments: none');
    }

    lines.push('===================');

    const contextString = lines.join('\n');

    // SHA-256 of the serialized context for provenance
    const contextHash = createHash('sha256')
        .update(JSON.stringify(labContext))
        .digest('hex');

    return { contextString, contextHash, labContext };
}
