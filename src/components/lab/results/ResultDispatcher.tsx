"use client";

import React from "react";
import { Database } from "lucide-react";
import { motion } from "framer-motion";
import type { LabExperiment, SequenceAnalysisResult, DockingResult, SimulationResult } from "@/types/lab";
import { SequenceResultCard } from "./SequenceResultCard";
import { DockingResultCard } from "./DockingResultCard";
import { SimulationResultCard } from "./SimulationResultCard";

interface ResultDispatcherProps {
    experiment: LabExperiment;
}

/**
 * Routes experiment results to the appropriate visualization card
 * based on the tool_name. Falls back to raw JSON for unknown types.
 */
export function ResultDispatcher({ experiment }: ResultDispatcherProps) {
    if (!experiment.result_json) {
        return (
            <div className="text-[10px] text-[var(--lab-text-tertiary)] italic">
                No results available
            </div>
        );
    }

    switch (experiment.tool_name) {
        case "analyze_protein_sequence":
            return <SequenceResultCard result={experiment.result_json as SequenceAnalysisResult} />;

        case "dock_ligand":
            return <DockingResultCard result={experiment.result_json as DockingResult} />;

        case "simulate_scientific_phenomenon":
            return <SimulationResultCard result={experiment.result_json as SimulationResult} />;

        case "fetch_protein_structure":
            // Protein fetch results are displayed in the 3D viewer, not a card.
            // Show a minimal summary here.
            return (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="lab-card p-3"
                >
                    <div className="flex items-center gap-2 text-xs text-[var(--lab-text-secondary)]">
                        <Database className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Structure loaded — view in 3D Viewer</span>
                    </div>
                </motion.div>
            );

        default:
            // Fallback: render raw JSON with better formatting
            return (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="lab-card p-3"
                >
                    <div className="text-[10px] font-medium text-[var(--lab-text-tertiary)] mb-1">
                        Raw Result ({experiment.tool_name})
                    </div>
                    <pre className="text-[10px] font-mono text-[var(--lab-text-secondary)] bg-black/5 dark:bg-white/5 rounded-lg p-2 overflow-x-auto max-h-48 overflow-y-auto">
                        {JSON.stringify(experiment.result_json, null, 2)}
                    </pre>
                </motion.div>
            );
    }
}
