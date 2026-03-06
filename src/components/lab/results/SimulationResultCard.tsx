"use client";

import React, { useState } from "react";
import { Sparkles, Clock, ChevronDown, ChevronUp, Terminal, Code2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SimulationResult } from "@/types/lab";
import { cn } from "@/lib/utils";

interface SimulationResultCardProps {
    result: SimulationResult;
}

function ExpandableSection({ title, icon: Icon, content, defaultOpen = false }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    content: string;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);

    if (!content || content.trim().length === 0) return null;

    return (
        <div className="border border-[var(--lab-border)] rounded-lg overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between bg-[var(--lab-panel-soft)] px-3 py-2 text-xs font-medium text-[var(--lab-text-secondary)] transition-colors hover:bg-[var(--lab-hover-bg)]"
                aria-expanded={open}
                aria-label={`Toggle ${title}`}
            >
                <span className="flex items-center gap-1.5">
                    <Icon className="w-3 h-3" />
                    {title}
                </span>
                {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <pre className="max-h-48 overflow-x-auto overflow-y-auto bg-[color-mix(in_srgb,var(--lab-panel-soft)_86%,transparent)] px-3 py-2 font-mono text-[10px] text-[var(--lab-text-secondary)]">
                            {content}
                        </pre>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function SimulationResultCard({ result }: SimulationResultCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="lab-card p-4"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--lab-accent-rust)]" />
                    <h3 className="text-xs font-semibold text-[var(--lab-text-primary)] font-serif tracking-wide">
                        Simulation Results
                    </h3>
                </div>
                <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                    result.success
                        ? "border-[color-mix(in_srgb,var(--lab-accent-moss)_28%,transparent)] bg-[color-mix(in_srgb,var(--lab-accent-moss)_10%,transparent)] text-[var(--lab-accent-moss)]"
                        : "border-[color-mix(in_srgb,var(--lab-accent-rust)_28%,transparent)] bg-[color-mix(in_srgb,var(--lab-accent-rust)_10%,transparent)] text-[var(--lab-accent-rust)]"
                )}>
                    {result.success ? "Success" : "Failed"}
                </span>
            </div>

            {/* Execution metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg bg-[var(--lab-panel-soft)] p-2">
                    <div className="flex items-center gap-1 text-[10px] text-[var(--lab-text-tertiary)] mb-1">
                        <Clock className="w-3 h-3" />
                        Execution Time
                    </div>
                    <div className="text-sm font-mono font-medium text-[var(--lab-text-primary)]">
                        {result.execution.executionTimeMs}ms
                    </div>
                </div>
                {result.execution.metrics && Object.keys(result.execution.metrics).length > 0 && (
                    <div className="rounded-lg bg-[var(--lab-panel-soft)] p-2">
                        <div className="text-[10px] text-[var(--lab-text-tertiary)] mb-1">Metrics</div>
                        <div className="space-y-0.5">
                            {Object.entries(result.execution.metrics).map(([key, val]) => (
                                <div key={key} className="flex items-center justify-between text-[10px]">
                                    <span className="text-[var(--lab-text-secondary)]">{key}</span>
                                    <span className="font-mono font-medium text-[var(--lab-text-primary)]">
                                        {typeof val === "number" ? (val as number).toFixed(2) : String(val)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Degraded warning */}
            {result.degraded && (
                <div className="mb-3 rounded-lg border border-[color-mix(in_srgb,var(--lab-accent-rust)_20%,transparent)] bg-[color-mix(in_srgb,var(--lab-accent-rust)_10%,transparent)] p-2 text-[11px] text-[var(--lab-accent-rust)]">
                    ⚠ Result computed in degraded mode (accuracy may be reduced)
                </div>
            )}

            {/* Expandable sections */}
            <div className="space-y-2">
                <ExpandableSection
                    title="Protocol Code"
                    icon={Code2}
                    content={result.protocolCode}
                    defaultOpen={false}
                />
                <ExpandableSection
                    title="Standard Output"
                    icon={Terminal}
                    content={result.execution.stdout}
                    defaultOpen={true}
                />
                {result.execution.stderr && (
                    <ExpandableSection
                        title="Standard Error"
                        icon={Terminal}
                        content={result.execution.stderr}
                    />
                )}
                {result.execution.error && (
                    <div className="rounded-lg border border-[color-mix(in_srgb,var(--lab-accent-rust)_24%,transparent)] bg-[color-mix(in_srgb,var(--lab-accent-rust)_10%,transparent)] p-2">
                        <div className="mb-1 text-[10px] font-medium text-[var(--lab-accent-rust)]">Error</div>
                        <pre className="whitespace-pre-wrap font-mono text-[10px] text-[var(--lab-accent-rust)]">
                            {result.execution.error}
                        </pre>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
