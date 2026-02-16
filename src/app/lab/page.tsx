"use client";

import React from "react";
import HypothesisBuilder from '@/components/lab/HypothesisBuilder';
import { FlaskConical, Atom, Network } from "lucide-react";
import { useLab } from "@/lib/contexts/LabContext";
import { ProteinViewer } from "@/components/lab/ProteinViewer";
import { useState } from "react";

export default function LabPage() {
    const { state, dispatch } = useLab();
    const [viewMode, setViewMode] = useState<'dashboard' | 'builder'>('dashboard');

    // Manual Verification Trigger (Phase 8 Level 3)
    const handleLoadTest = async () => {
        try {
            const res = await fetch('https://files.rcsb.org/download/4HHB.pdb');
            if (!res.ok) throw new Error("Failed to fetch PDB");
            const pdb = await res.text();
            
            dispatch({ 
                type: 'LOAD_STRUCTURE', 
                payload: { 
                    pdbId: '4HHB', 
                    content: pdb, 
                    metadata: { method: 'manual_verification' },
                    loadedAt: new Date().toISOString()
                } 
            });
            
            dispatch({
                type: 'ADD_EXPERIMENT',
                payload: {
                   id: crypto.randomUUID(),
                   user_id: 'manual-test',
                   tool_name: 'fetch_protein_structure',
                   causal_role: 'observation',
                   input_hash: 'manual-hash',
                   input_json: { pdbId: '4HHB' },
                   status: 'success',
                   created_at: new Date().toISOString()
                }
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSimulateHypothesis = (thesis: string, mechanism: string) => {
        const id = crypto.randomUUID();
        // 1. Log Pending
        dispatch({
            type: 'ADD_EXPERIMENT',
            payload: {
                id,
                user_id: 'manual-test',
                tool_name: 'simulate_scientific_phenomenon',
                causal_role: 'intervention',
                input_hash: crypto.randomUUID(),
                input_json: { thesis, mechanism },
                status: 'pending',
                created_at: new Date().toISOString()
            }
        });

        // 2. Mock Execution (Level 5 Verification Stub)
        setTimeout(() => {
             dispatch({
                type: 'ADD_EXPERIMENT',
                payload: {
                    id: crypto.randomUUID(), 
                    user_id: 'manual-test',
                    tool_name: 'simulate_scientific_phenomenon',
                    causal_role: 'intervention',
                    input_hash: 'result-hash',
                    // Use valid input type
                    input_json: { thesis, mechanism }, 
                    metadata: { note: "Result of simulation " + id },
                    status: 'success',
                    result_json: { 
                        success: true,
                        protocolCode: "def simulate(thesis): return True",
                        execution: {
                            executionTimeMs: 450,
                            metrics: { stability_score: 0.85, entropy: 4.2 },
                            stdout: "Simulation completed successfully. No violations found.",
                            stderr: ""
                        },
                        degraded: false
                    },
                    created_at: new Date().toISOString()
                }
            });
        }, 1500);
    };

    if (state.currentStructure) {
        return (
            <div className="w-full h-full p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center px-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Atom className="w-5 h-5 text-cyan-400" />
                        Structure: {state.currentStructure.pdbId}
                    </h2>
                    <button 
                         onClick={() => dispatch({ type: 'LOAD_STRUCTURE', payload: null as any })}
                         className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        Close Viewer
                    </button>
                </div>
                <div className="flex-1 min-h-0 lab-panel overflow-hidden relative">
                     <ProteinViewer 
                        pdbData={state.currentStructure.content} 
                        structureName={state.currentStructure.pdbId} 
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header / Mode Switcher */}
            <div className="flex justify-center p-4">
                <div className="flex gap-2 lab-panel p-1">
                    <button
                        onClick={() => setViewMode('dashboard')}
                        data-active={viewMode === 'dashboard'}
                        className="lab-nav-pill cursor-pointer hover:bg-white/10"
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setViewMode('builder')}
                        data-active={viewMode === 'builder'}
                        className="lab-nav-pill cursor-pointer hover:bg-white/10"
                    >
                        Hypothesis Builder
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 relative">
                {viewMode === 'builder' ? (
                     <div className="absolute inset-0 p-4">
                        <HypothesisBuilder onSimulate={handleSimulateHypothesis} />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-4">
                        <div className="lab-card p-8 rounded-full flex items-center justify-center">
                            <FlaskConical className="w-16 h-16 opacity-50 text-stone-500" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-semibold mb-2 lab-section-title text-lg">Bio-Computation Lab</h2>
                            <p className="max-w-md mx-auto text-sm opacity-70 mb-6 font-serif">
                                Select an instrument from the sidebar or use the Hypothesis Builder.
                                All actions are logged to the provenance notebook below.
                            </p>
                            
                            <div className="flex gap-2 justify-center">
                                <button 
                                    onClick={handleLoadTest}
                                    className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs rounded border border-cyan-500/30 transition-colors flex items-center gap-2"
                                >
                                    <Atom className="w-3 h-3" />
                                    [DEV] Load 4HHB
                                </button>
                                <button 
                                    onClick={() => dispatch({
                                        type: 'ADD_EXPERIMENT',
                                        payload: {
                                           id: crypto.randomUUID(),
                                           user_id: 'manual-test',
                                           tool_name: 'analyze_protein_sequence',
                                           causal_role: 'observation',
                                           input_hash: 'manual-hash-seq',
                                           input_json: { sequence: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR' },
                                           status: 'success',
                                           result_json: { molecular_weight: 15126.4, isoelectric_point: 8.7, instability_index: 32.5 },
                                           created_at: new Date().toISOString()
                                        }
                                    })}
                                    className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs rounded border border-purple-500/30 transition-colors flex items-center gap-2"
                                >
                                    <FlaskConical className="w-3 h-3" />
                                    [DEV] Analyze Seq
                                </button>
                                <button 
                                    onClick={() => {
                                        const id = crypto.randomUUID();
                                        dispatch({
                                            type: 'ADD_EXPERIMENT',
                                            payload: {
                                                id,
                                                user_id: 'manual-test',
                                                tool_name: 'dock_ligand',
                                                causal_role: 'intervention',
                                                input_hash: 'manual-hash-dock',
                                                input_json: { pdbId: '4HHB', smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O' },
                                                status: 'pending',
                                                created_at: new Date().toISOString()
                                            }
                                        });

                                        setTimeout(() => {
                                             dispatch({
                                                type: 'ADD_EXPERIMENT',
                                                payload: {
                                                    id: crypto.randomUUID(),
                                                    user_id: 'manual-test',
                                                    tool_name: 'dock_ligand',
                                                    causal_role: 'intervention',
                                                    input_hash: 'manual-hash-dock',
                                                    input_json: { pdbId: '4HHB', smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O' },
                                                    status: 'success',
                                                    result_json: { 
                                                        affinity_kcal_mol: -7.2,
                                                        rmsd: 1.05,
                                                        poses: [{ rank: 1, score: -7.2, rmsd: 0 }],
                                                        engine: "Vina-Stub-v1 (Deterministic UI)"
                                                    },
                                                    created_at: new Date().toISOString()
                                                }
                                            });
                                        }, 1500);
                                    }}
                                    className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30 transition-colors flex items-center gap-2"
                                >
                                    <Network className="w-3 h-3" />
                                    [DEV] Dock Aspirin
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
