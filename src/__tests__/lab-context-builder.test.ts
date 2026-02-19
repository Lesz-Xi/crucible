
import { describe, it, expect } from 'vitest';
import { buildLabContext } from '../lib/services/lab-context-builder';
import type { LabState } from '../types/lab';

describe('Lab Context Builder', () => {
    const mockState: LabState = {
        // Corrected field: currentStructure instead of selectedProtein
        currentStructure: {
            pdbId: '1ABC',
            content: 'HEADER ...',
            loadedAt: '2023-01-01T00:00:00Z',
            metadata: {
                title: 'Test Protein',
                source: 'rcsb',
                method: 'X-RAY DIFFRACTION', // optional but good for testing
            }
        },
        experimentHistory: [
            {
                id: 'exp-1',
                tool_name: 'analyze_protein_sequence',
                status: 'success',
                input_json: { sequence: 'MKTVLQ' },
                result_json: {
                    molecular_weight: 100,
                    isoelectric_point: 7.0,
                    instability_index: 20
                },
                created_at: '2023-01-01T00:00:00Z',
                causal_role: 'observation',
                user_id: 'user-1',
                input_hash: 'hash-1'
            },
            {
                id: 'exp-2',
                tool_name: 'dock_ligand',
                status: 'pending',
                input_json: { pdbId: '1ABC', smiles: 'C1CCCCC1' },
                result_json: undefined,
                created_at: '2023-01-01T00:01:00Z',
                causal_role: 'intervention',
                user_id: 'user-1',
                input_hash: 'hash-2'
            }
        ],
        isLoading: false,

        // Copilot context is not in LabState directly in the types file I saw, 
        // but the builder might accept an extended state or just ignore extra fields.
        // The type definition I saw didn't have copilotContext.
        // Let's remove it to strict type check.
        isOffline: false,
        activeTool: null,
        activePanel: null,
        isSidebarOpen: true,
        isNotebookExpanded: false,
        lastError: null,
        llmConfig: { provider: 'anthropic', model: 'claude-3-5-sonnet' },
        isModelSettingsOpen: false
    };

    it('buildLabContext formats context correctly', () => {
        const { contextString } = buildLabContext(mockState);

        // The implementation uses specific formatting
        expect(contextString).toContain('=== LAB CONTEXT ===');
        expect(contextString).toContain('Structure: 1ABC (rcsb)');
        expect(contextString).toContain('Title: Test Protein');
        expect(contextString).toContain('Recent Experiments:');
        // Check for the presence of tool names in the summary
        expect(contextString).toContain('[analyze_protein_sequence]');
        expect(contextString).toContain('[dock_ligand]');
        // Check for status icons (✓ and ⏳)
        expect(contextString).toContain('✓');
        expect(contextString).toContain('⏳');
    });

    it('buildLabContext handles empty state', () => {
        const emptyState: LabState = {
            currentStructure: null,
            experimentHistory: [],
            isLoading: false,
            isOffline: false,
            activeTool: null,
            activePanel: null,
            isSidebarOpen: true,
            isNotebookExpanded: false,
            lastError: null,
            llmConfig: { provider: 'anthropic', model: 'test' },
            isModelSettingsOpen: false
        };

        const { contextString } = buildLabContext(emptyState);
        expect(contextString).toContain('Structure: none loaded');
        expect(contextString).toContain('Recent Experiments: none');
    });

    it('contextHash generates consistent hashes', () => {
        const { contextHash: hash1 } = buildLabContext(mockState);
        const { contextHash: hash2 } = buildLabContext(mockState);

        expect(hash1).toBe(hash2);
        expect(typeof hash1).toBe('string');
        expect(hash1.length).toBeGreaterThan(0);

        // Changing structure should change hash
        const modifiedState = {
            ...mockState,
            currentStructure: { ...mockState.currentStructure!, pdbId: '2XYZ' }
        };
        const { contextHash: hash3 } = buildLabContext(modifiedState);
        expect(hash3).not.toBe(hash1);
    });
});
