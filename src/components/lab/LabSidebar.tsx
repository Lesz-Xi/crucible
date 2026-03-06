"use client";

import React from "react";
import { useLab } from "@/lib/contexts/LabContext";
import { FlaskConical, Dna, Microscope, Network, Box, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function LabSidebar() {
    const { state, dispatch } = useLab();

    const tools = [
        {
            id: "fetch_structure",
            name: "Protein Fetch",
            icon: Box,
            description: "Retrieve PDB structures"
        },
        {
            id: "analyze_sequence",
            name: "Seq. Analysis",
            icon: Dna,
            description: "Physicochemical props"
        },
        {
            id: "dock_ligand",
            name: "Ligand Docking",
            icon: Network,
            description: "Binding affinity est."
        }
    ];

    return (
        <motion.aside 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="glass-sidebar flex h-full w-64 flex-col border-r border-[var(--lab-border)] lab-panel-elevated"
        >
            <div className="flex items-center gap-2 border-b border-[var(--lab-border)] p-4">
                <FlaskConical className="h-5 w-5 text-[var(--lab-accent-rust)]" />
                <h1 className="lab-section-title text-sm">Bio-Lab Notebook</h1>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <div className="px-4 mb-2 lab-section-title text-[10px] opacity-70">
                    Instruments
                </div>
                <nav className="space-y-1 px-2">
                    <AnimatePresence>
                        {tools.map((tool, index) => (
                            <motion.button
                                key={tool.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => dispatch({ type: "SET_ACTIVE_TOOL", payload: tool.id as any })}
                                className={cn(
                                    "w-full rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all",
                                    state.activeTool === tool.id
                                        ? "border-[var(--lab-border-strong)] bg-[var(--lab-active-bg)] text-[var(--lab-text-primary)] shadow-[var(--lab-shadow-soft)]"
                                        : "border-transparent text-[var(--lab-text-secondary)] hover:bg-[var(--lab-hover-bg)] hover:text-[var(--lab-text-primary)]"
                                )}
                            >
                                <tool.icon className={cn("h-4 w-4", state.activeTool === tool.id ? "text-[var(--lab-accent-rust)]" : "opacity-70")} />
                                <div>
                                    <div className="leading-none font-serif tracking-wide">{tool.name}</div>
                                    <div className="mt-0.5 font-sans text-[10px] text-[var(--lab-text-tertiary)]">{tool.description}</div>
                                </div>
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </nav>
            </div>

            <div className="space-y-3 border-t border-[var(--lab-border)] p-4">

                <div className="flex items-center gap-2 px-2 text-xs">
                    <div className={cn("h-2 w-2 rounded-full", state.isOffline ? "bg-[var(--lab-accent-rust)]" : "bg-[var(--lab-accent-moss)]")} />
                    <span className="text-[var(--lab-text-secondary)]">{state.isOffline ? "Offline Mode" : "System Online"}</span>
                </div>
            </div>
        </motion.aside>
    );
}
