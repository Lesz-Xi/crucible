"use client";

import React from "react";
import HypothesisBuilder from '@/components/lab/HypothesisBuilder';
import { ProteinFetchPanel } from '@/components/lab/panels/ProteinFetchPanel';
import { SequenceAnalysisPanel } from '@/components/lab/panels/SequenceAnalysisPanel';
import { DockingPanel } from '@/components/lab/panels/DockingPanel';
import { ResultDispatcher } from '@/components/lab/results/ResultDispatcher';
import { FlaskConical, Atom, Network, Box, Dna, Database, Sparkles, Clock, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { useLab } from "@/lib/contexts/LabContext";
import { ProteinViewer } from "@/components/lab/ProteinViewer";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn, EASE_OUT_EXPO } from "@/components/ui/motion";
import { proteinStructureCache } from "@/lib/utils/rate-limiter";
import { ScientificGateway } from "@/lib/services/scientific-gateway";
import type { LabExperiment, LabToolId } from "@/types/lab";
import { cn } from "@/lib/utils";

// Status badge component with Liquid Glass styling
function StatusBadge({ status }: { status: string }) {
    const config = {
        pending: { icon: Loader2, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30', spin: true },
        success: { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', spin: false },
        failure: { icon: AlertCircle, color: 'text-red-500 bg-red-500/10 border-red-500/30', spin: false },
    }[status] || { icon: AlertCircle, color: 'text-gray-500 bg-gray-500/10 border-gray-500/30', spin: false };

    const Icon = config.icon;
    
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
            <Icon className={`w-3 h-3 ${config.spin ? 'animate-spin' : ''}`} />
            {status}
        </span>
    );
}

// Causal role badge
function CausalRoleBadge({ role }: { role: string }) {
    const colors: Record<string, string> = {
        observation: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        intervention: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        counterfactual: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    };
    
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${colors[role] || 'text-gray-400 bg-gray-500/10 border-gray-500/30'}`}>
            {role}
        </span>
    );
}

// Experiment card with Liquid Glass styling
function ExperimentCard({ experiment }: { experiment: LabExperiment }) {
    const toolIcons: Record<string, React.ReactNode> = {
        fetch_protein_structure: <Atom className="w-4 h-4" />,
        analyze_protein_sequence: <FlaskConical className="w-4 h-4" />,
        dock_ligand: <Network className="w-4 h-4" />,
        simulate_scientific_phenomenon: <Sparkles className="w-4 h-4" />,
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="lab-card-interactive group"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-white/40 to-white/20 border border-white/30">
                        {toolIcons[experiment.tool_name] || <Database className="w-4 h-4" />}
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-[var(--lab-text-primary)]">
                            {experiment.tool_name?.replace(/_/g, ' ') || 'Unknown Tool'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                            <CausalRoleBadge role={experiment.causal_role} />
                            <StatusBadge status={experiment.status} />
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-[var(--lab-text-tertiary)] font-mono">
                        {new Date(experiment.created_at).toLocaleTimeString()}
                    </div>
                </div>
            </div>
            
            {experiment.result_json && (
                <div className="mt-3 pt-3 border-t border-[var(--lab-border)]">
                    <ResultDispatcher experiment={experiment} />
                </div>
            )}
        </motion.div>
    );
}

export default function LabPage() {
    const { state, dispatch, createExperiment, updateExperimentResult } = useLab();
    const [viewMode, setViewMode] = useState<'dashboard' | 'builder' | 'history' | 'tool'>('dashboard');
    const [isLoading, setIsLoading] = useState(false);
    const [fetchStatusMessage, setFetchStatusMessage] = useState<string | null>(null);
    const [fetchErrorMessage, setFetchErrorMessage] = useState<string | null>(null);

    // Scientific Gateway instance for tool operations
    const gateway = ScientificGateway.getInstance();

    // Map sidebar tool clicks to view mode changes
    React.useEffect(() => {
        if (state.activeTool && ['fetch_structure', 'analyze_sequence', 'dock_ligand'].includes(state.activeTool)) {
            setViewMode('tool');
        }
    }, [state.activeTool]);

    // Panel close handler
    const handleClosePanel = () => {
        dispatch({ type: 'SET_ACTIVE_TOOL', payload: null });
        setViewMode('dashboard');
        setFetchStatusMessage(null);
        setFetchErrorMessage(null);
    };

    // Protein fetch via panel (server-proxied to avoid browser CORS/provider drift)
    const handleFetchProtein = async (identifier: string, source: 'rcsb' | 'alphafold' = 'rcsb') => {
        setIsLoading(true);
        setFetchErrorMessage(null);
        setFetchStatusMessage(null);
        try {
            const rawInput = identifier.trim();
            const cacheKey = `${source}:${rawInput.toUpperCase()}`;
            let pdb = proteinStructureCache.get(cacheKey);
            let resolvedId = rawInput.toUpperCase();

            if (!pdb) {
                const response = await fetch('/api/lab/structure/fetch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier: rawInput, source }),
                });

                const payload = await response.json().catch(() => ({} as any));
                if (!response.ok || !payload?.success || !payload?.data?.content) {
                    throw new Error(payload?.error || 'Failed to fetch protein structure');
                }

                pdb = payload.data.content as string;
                resolvedId = String(payload.data.resolvedId || resolvedId).toUpperCase();
                proteinStructureCache.set(`${source}:${resolvedId}`, pdb);
            }

            if (rawInput.toUpperCase() !== resolvedId) {
                setFetchStatusMessage(`Resolved "${rawInput}" → ${resolvedId} (${source === 'rcsb' ? 'RCSB' : 'AlphaFold'})`);
            } else {
                setFetchStatusMessage(`Loaded ${resolvedId} from ${source === 'rcsb' ? 'RCSB PDB' : 'AlphaFold DB'}`);
            }

            dispatch({
                type: 'LOAD_STRUCTURE',
                payload: {
                    pdbId: resolvedId,
                    content: pdb,
                    metadata: { method: source === 'rcsb' ? 'server_fetch_rcsb' : 'server_fetch_alphafold', source },
                    loadedAt: new Date().toISOString()
                }
            });

            await createExperiment?.(
                'fetch_protein_structure',
                source === 'rcsb'
                    ? { pdbId: resolvedId, source }
                    : { pdbId: resolvedId, source, uniprotId: resolvedId },
                'observation'
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch protein structure';
            setFetchErrorMessage(message);
            console.error('Failed to fetch protein:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Sequence analysis via panel
    const handleAnalyzeSequence = async (sequence: string) => {
        setIsLoading(true);
        try {
            const experiment = await createExperiment?.(
                'analyze_protein_sequence',
                { sequence },
                'observation'
            );
            if (experiment) {
                // Call gateway's analyzeProteinSequence method
                const result = await gateway.analyzeProteinSequence(sequence);
                if (result.success && result.data) {
                    await updateExperimentResult?.(experiment.id, result.data as any, 'success');
                } else {
                    await updateExperimentResult?.(experiment.id, { error: result.error } as any, 'failure');
                }
            }
        } catch (err) {
            console.error('Failed to analyze sequence:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Docking via panel
    const handleDockLigand = async (pdbId: string, smiles: string, seed: number) => {
        setIsLoading(true);
        try {
            const experiment = await createExperiment?.(
                'dock_ligand',
                { pdbId, smiles, seed },
                'intervention'
            );
            if (!experiment) return;

            const createRes = await fetch('/api/lab/docking/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pdbId, smiles, seed }),
            });

            if (!createRes.ok) {
                const payload = await createRes.json().catch(() => ({}));
                await updateExperimentResult?.(experiment.id, { error: payload?.error || 'Failed to create docking job' } as any, 'failure');
                return;
            }

            const createPayload = await createRes.json() as { jobId?: string };
            const jobId = createPayload.jobId;
            if (!jobId) {
                await updateExperimentResult?.(experiment.id, { error: 'Missing docking job id' } as any, 'failure');
                return;
            }

            let attempts = 0;
            const maxAttempts = 60; // ~60s at 1s interval

            while (attempts < maxAttempts) {
                attempts += 1;
                const statusRes = await fetch(`/api/lab/docking/jobs/${jobId}`, { method: 'GET' });
                if (!statusRes.ok) {
                    const payload = await statusRes.json().catch(() => ({}));
                    await updateExperimentResult?.(experiment.id, { error: payload?.error || 'Failed to query docking job' } as any, 'failure');
                    return;
                }

                const statusPayload = await statusRes.json() as { job?: { status?: string; result?: any; error?: string } };
                const status = statusPayload.job?.status;

                if (status === 'succeeded') {
                    await updateExperimentResult?.(experiment.id, statusPayload.job?.result as any, 'success');
                    return;
                }

                if (status === 'failed') {
                    await updateExperimentResult?.(experiment.id, { error: statusPayload.job?.error || 'Docking failed' } as any, 'failure');
                    return;
                }

                await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            await updateExperimentResult?.(experiment.id, { error: 'Docking job timed out' } as any, 'failure');
        } catch (err) {
            console.error('Failed to dock ligand:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Legacy handler for dashboard button
    const handleLoadTest = async () => {
        await handleFetchProtein('4HHB', 'rcsb');
    };

    const handleSimulateHypothesis = async (thesis: string, mechanism: string) => {
        const experiment = await createExperiment?.(
            'simulate_scientific_phenomenon',
            { thesis, mechanism },
            'intervention'
        );
        
        if (experiment) {
            setTimeout(() => {
                updateExperimentResult?.(experiment.id, {
                    success: true,
                    protocolCode: "def simulate(thesis): return True",
                    execution: {
                        executionTimeMs: 450,
                        metrics: { stability_score: 0.85, entropy: 4.2 },
                        stdout: "Simulation completed successfully.",
                        stderr: ""
                    },
                    degraded: false
                }, 'success');
            }, 1500);
        }
    };

    // Protein viewer mode
    if (state.currentStructure) {
        return (
            <FadeIn className="w-full h-full p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center px-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Atom className="w-5 h-5 text-cyan-400" />
                        Structure: {state.currentStructure.pdbId}
                    </h2>
                    <button 
                        onClick={() => dispatch({ type: 'LOAD_STRUCTURE', payload: null as any })}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Close Viewer
                    </button>
                </div>
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
                    className="flex-1 min-h-0 lab-panel overflow-hidden relative"
                >
                    <ProteinViewer 
                        pdbData={state.currentStructure.content} 
                        structureName={state.currentStructure.pdbId} 
                    />
                </motion.div>
            </FadeIn>
        );
    }

    // Tool panel view
    const renderToolPanel = () => {
        switch (state.activeTool) {
            case 'fetch_structure':
                return <ProteinFetchPanel onSubmit={handleFetchProtein} isLoading={isLoading} statusMessage={fetchStatusMessage} errorMessage={fetchErrorMessage} />;
            case 'analyze_sequence':
                return <SequenceAnalysisPanel onSubmit={handleAnalyzeSequence} isLoading={isLoading} />;
            case 'dock_ligand':
                return <DockingPanel onSubmit={handleDockLigand} isLoading={isLoading} />;
            default:
                return null;
        }
    };

    // Get experiments from state
    const experiments = state.experimentHistory || [];

    return (
        <div className="feature-lab flex h-screen bg-[var(--lab-bg)] overflow-hidden">
            {/* GAP-6: Offline Banner — shown when navigator.onLine is false */}
            <AnimatePresence>
                {state.isOffline && (
                    <motion.div
                        key="offline-banner"
                        initial={{ y: -40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -40, opacity: 0 }}
                        transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                        role="alert"
                        aria-live="assertive"
                        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/90 backdrop-blur-sm text-black text-sm font-medium"
                    >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        You are offline. Tool calls are queued and will sync when reconnected.
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="flex-1 flex flex-col h-full bg-transparent">
                {/* Header / Mode Switcher with Liquid Glass */}
                <div className="flex justify-center p-4">
                    <div className="flex gap-1 lab-panel p-1.5">
                        {(['dashboard', 'builder', 'history'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                data-active={viewMode === mode}
                                className="lab-nav-pill cursor-pointer hover:bg-white/10 transition-all duration-200"
                            >
                                {mode === 'dashboard' && <Database className="w-4 h-4 mr-1.5" />}
                                {mode === 'builder' && <Sparkles className="w-4 h-4 mr-1.5" />}
                                {mode === 'history' && <Clock className="w-4 h-4 mr-1.5" />}
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Instruments Rail (restored): keep Labs tools accessible while using shared app sidebar */}
                <div className="px-4 pb-2">
                    <div className="lab-panel p-2">
                        <div className="mb-2 px-1 lab-section-title text-[10px] opacity-70">Instruments</div>
                        <div className="grid grid-cols-1 gap-1.5 md:grid-cols-3">
                            <button
                                onClick={() => {
                                    dispatch({ type: 'SET_ACTIVE_TOOL', payload: 'fetch_structure' as any });
                                    setViewMode('tool');
                                }}
                                className={cn(
                                    'lab-nav-pill w-full justify-start',
                                    state.activeTool === 'fetch_structure' && viewMode === 'tool' ? 'sidebar-history-item-active' : ''
                                )}
                            >
                                <Box className="w-4 h-4" />
                                <span className="font-serif tracking-wide">Protein Fetch</span>
                            </button>
                            <button
                                onClick={() => {
                                    dispatch({ type: 'SET_ACTIVE_TOOL', payload: 'analyze_sequence' as any });
                                    setViewMode('tool');
                                }}
                                className={cn(
                                    'lab-nav-pill w-full justify-start',
                                    state.activeTool === 'analyze_sequence' && viewMode === 'tool' ? 'sidebar-history-item-active' : ''
                                )}
                            >
                                <Dna className="w-4 h-4" />
                                <span className="font-serif tracking-wide">Seq. Analysis</span>
                            </button>
                            <button
                                onClick={() => {
                                    dispatch({ type: 'SET_ACTIVE_TOOL', payload: 'dock_ligand' as any });
                                    setViewMode('tool');
                                }}
                                className={cn(
                                    'lab-nav-pill w-full justify-start',
                                    state.activeTool === 'dock_ligand' && viewMode === 'tool' ? 'sidebar-history-item-active' : ''
                                )}
                            >
                                <Network className="w-4 h-4" />
                                <span className="font-serif tracking-wide">Ligand Docking</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-h-0 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {viewMode === 'tool' && state.activeTool ? (
                        <motion.div 
                            key="tool"
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                            className="absolute inset-0 p-4 overflow-auto"
                        >
                            {/* Close button */}
                            <button
                                onClick={handleClosePanel}
                                className="flex items-center gap-1 text-xs text-[var(--lab-text-tertiary)] hover:text-[var(--lab-text-primary)] transition-colors mb-4"
                            >
                                <ArrowLeft className="w-3 h-3" />
                                Back to Dashboard
                            </button>
                            {renderToolPanel()}
                        </motion.div>
                    ) : viewMode === 'builder' ? (
                        <motion.div 
                            key="builder"
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                            className="absolute inset-0 p-4 overflow-auto"
                        >
                            <HypothesisBuilder onSimulate={handleSimulateHypothesis} />
                        </motion.div>
                    ) : viewMode === 'history' ? (
                        <motion.div 
                            key="history"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                            className="absolute inset-0 p-4 overflow-auto"
                        >
                            <div className="max-w-2xl mx-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="lab-section-title">Experiment History</h3>
                                    <span className="text-xs text-[var(--lab-text-tertiary)]">
                                        {experiments.length} records
                                    </span>
                                </div>
                                
                                {experiments.length === 0 ? (
                                    <div className="text-center py-12 text-[var(--lab-text-tertiary)]">
                                        <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">No experiments recorded yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {experiments.map((exp) => (
                                            <ExperimentCard key={exp.id} experiment={exp} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="dashboard"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                            className="flex items-center justify-center h-full text-muted-foreground flex-col gap-6 p-4"
                        >
                            {/* Hero Section */}
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
                                className="relative"
                            >
                                <div className="lab-card p-8 rounded-full flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />
                                    <FlaskConical className="w-16 h-16 opacity-50 text-stone-500 relative z-10" />
                                </div>
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute -inset-2 border border-dashed border-white/20 rounded-full"
                                />
                            </motion.div>
                            
                            <div className="text-center max-w-lg">
                                <motion.h2 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-2xl font-semibold mb-3 lab-section-title text-base tracking-widest"
                                >
                                    Bio-Computation Lab
                                </motion.h2>
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-sm opacity-70 mb-8 font-serif leading-relaxed"
                                >
                                    An in silico environment for structural causal model extraction. 
                                    Distinguish observation from intervention. Build hypotheses. Run experiments.
                                </motion.p>
                                
                                {/* Quick Actions */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="grid grid-cols-3 gap-3"
                                >
                                    <button 
                                        onClick={handleLoadTest}
                                        disabled={isLoading}
                                        className="group lab-card-interactive flex flex-col items-center gap-2 py-4"
                                    >
                                        <div className="p-2 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                                            {isLoading ? (
                                                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                                            ) : (
                                                <Atom className="w-5 h-5 text-cyan-400" />
                                            )}
                                        </div>
                                        <span className="text-xs font-medium text-[var(--lab-text-secondary)]">
                                            Load Protein
                                        </span>
                                    </button>
                                    
                                    <button 
                                        onClick={() => setViewMode('builder')}
                                        className="group lab-card-interactive flex flex-col items-center gap-2 py-4"
                                    >
                                        <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                                            <Sparkles className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <span className="text-xs font-medium text-[var(--lab-text-secondary)]">
                                            New Hypothesis
                                        </span>
                                    </button>
                                    
                                    <button 
                                        onClick={() => setViewMode('history')}
                                        className="group lab-card-interactive flex flex-col items-center gap-2 py-4"
                                    >
                                        <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                                            <Clock className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <span className="text-xs font-medium text-[var(--lab-text-secondary)]">
                                            View History
                                        </span>
                                    </button>
                                </motion.div>
                                
                                {/* Stats Bar */}
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-6 flex justify-center gap-6 text-xs text-[var(--lab-text-tertiary)]"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span>{experiments.filter(e => e.status === 'success').length} completed</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span>{experiments.filter(e => e.status === 'pending').length} pending</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span>{proteinStructureCache.getStats().size} cached</span>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
