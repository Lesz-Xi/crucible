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
            className="w-64 border-r border-white/10 lab-panel-elevated h-full flex flex-col glass-sidebar"
        >
            <div className="p-4 border-b border-white/10 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-stone-600 dark:text-stone-300" />
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
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left border border-transparent",
                                    state.activeTool === tool.id
                                        ? "bg-white/40 shadow-sm border-white/20 text-stone-800 dark:text-stone-100 dark:bg-white/10"
                                        : "hover:bg-white/20 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                                )}
                            >
                                <tool.icon className={cn("w-4 h-4", state.activeTool === tool.id ? "text-amber-600/80 dark:text-amber-400/80" : "opacity-70")} />
                                <div>
                                    <div className="leading-none font-serif tracking-wide">{tool.name}</div>
                                    <div className="text-[10px] opacity-60 font-sans mt-0.5">{tool.description}</div>
                                </div>
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </nav>
            </div>

            <div className="p-4 border-t border-border space-y-3">

                <div className="flex items-center gap-2 text-xs px-2">
                    <div className={cn("w-2 h-2 rounded-full", state.isOffline ? "bg-red-500" : "bg-green-500")} />
                    <span className="text-muted-foreground">{state.isOffline ? "Offline Mode" : "System Online"}</span>
                </div>
            </div>
        </motion.aside>
    );
}
