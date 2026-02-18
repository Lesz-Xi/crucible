"use client";

import React, { useEffect, useState } from "react";
import { useLab } from "@/lib/contexts/LabContext";
import { BookOpen, CheckCircle, AlertTriangle, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const NOTEBOOK_COLLAPSED_KEY = "lab-notebook-collapsed";

export function LabNotebook() {
    const { state } = useLab();
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(NOTEBOOK_COLLAPSED_KEY);
            if (stored === "1") setCollapsed(true);
        } catch {
            // ignore storage errors
        }
    }, []);

    const toggleCollapsed = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                window.localStorage.setItem(NOTEBOOK_COLLAPSED_KEY, next ? "1" : "0");
            } catch {
                // ignore storage errors
            }
            return next;
        });
    };

    return (
        <div className={cn(
            "border-t border-border bg-card/20 backdrop-blur-sm flex flex-col transition-[height] duration-200",
            collapsed ? "h-12" : "h-64"
        )}>
            <div className="p-2 border-b border-border flex items-center gap-2 bg-card/40">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lab Notebook (Provenance Log)</span>
                <button
                    type="button"
                    onClick={toggleCollapsed}
                    className="ml-auto inline-flex items-center gap-1 rounded-md border border-[var(--lab-border)] px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--lab-text-secondary)] hover:bg-white/10"
                    title={collapsed ? "Open notebook" : "Close notebook"}
                    aria-label={collapsed ? "Open notebook" : "Close notebook"}
                >
                    {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {collapsed ? "Open" : "Close"}
                </button>
            </div>

            {!collapsed ? (
                <div className="flex-1 p-4 overflow-y-auto">
                    {state.experimentHistory.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm py-8 opacity-50">
                            No experiments recorded in this session.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {state.experimentHistory.map((log) => (
                                <div key={log.id} className="flex gap-3 text-sm group">
                                    <div className="mt-0.5">
                                        {log.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                        {log.status === 'failure' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                        {log.status === 'pending' && <Clock className="w-4 h-4 text-amber-500 animate-pulse" />}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                                {log.tool_name}
                                            </span>
                                            <span className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-widest font-semibold",
                                                log.causal_role === 'intervention' ? "border-purple-500/30 text-purple-500 bg-purple-500/5" :
                                                log.causal_role === 'observation' ? "border-blue-500/30 text-blue-500 bg-blue-500/5" :
                                                "border-gray-500/30 text-gray-500"
                                            )}>
                                                {log.causal_role === 'intervention' ? 'DO(X)' :
                                                 log.causal_role === 'observation' ? 'OBS(Y)' : 'CF'}
                                            </span>
                                            <span className="text-xs text-muted-foreground ml-auto font-mono">
                                                {new Date(log.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>

                                        <pre className="text-xs text-muted-foreground bg-muted/30 p-2 rounded overflow-x-auto font-mono custom-scrollbar">
                                            {JSON.stringify(log.input_json, null, 2)}
                                        </pre>

                                        {log.status === 'success' && log.result_json && (
                                            <div className="mt-2 text-xs border-l-2 border-emerald-500/30 pl-2">
                                                <span className="text-[10px] uppercase text-emerald-500 font-semibold mb-1 block">Result</span>
                                                <pre className="text-muted-foreground overflow-x-auto font-mono custom-scrollbar">
                                                    {JSON.stringify(log.result_json, null, 2)}
                                                </pre>
                                            </div>
                                        )}

                                        {log.error_message && (
                                            <div className="text-xs text-red-400 bg-red-900/10 p-2 rounded border border-red-500/20">
                                                Error: {log.error_message}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
