"use client";

import React from "react";
import { useLab } from "@/lib/contexts/LabContext";
import { FlaskConical, Dna, Microscope, Network, Box } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <aside className="w-64 border-r border-border bg-card/30 backdrop-blur-md h-full flex flex-col">
            <div className="p-4 border-b border-border flex items-center gap-2">
                <FlaskConical className="w-6 h-6 text-primary" />
                <h1 className="font-bold text-lg">Bio-Lab</h1>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <div className="px-4 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Instruments
                </div>
                <nav className="space-y-1 px-2">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => dispatch({ type: "SET_ACTIVE_TOOL", payload: tool.id as any })}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left",
                                state.activeTool === tool.id
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                            )}
                        >
                            <tool.icon className="w-4 h-4" />
                            <div>
                                <div className="leading-none">{tool.name}</div>
                                <div className="text-[10px] opacity-70 font-normal mt-0.5">{tool.description}</div>
                            </div>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs">
                    <div className={cn("w-2 h-2 rounded-full", state.isOffline ? "bg-red-500" : "bg-green-500")} />
                    <span className="text-muted-foreground">{state.isOffline ? "Offline Mode" : "System Online"}</span>
                </div>
            </div>
        </aside>
    );
}
