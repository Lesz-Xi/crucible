"use client";

import React from "react";
import { Dna, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import type { SequenceAnalysisResult } from "@/types/lab";
import { cn } from "@/lib/utils";

interface SequenceResultCardProps {
    result: SequenceAnalysisResult;
}

function MetricRow({ label, value, unit, indicator }: {
    label: string;
    value: number | string;
    unit?: string;
    indicator?: "good" | "warning" | "neutral";
}) {
    const colors = {
        good: "text-emerald-500",
        warning: "text-amber-500",
        neutral: "text-[var(--lab-text-secondary)]",
    };

    return (
        <div className="flex items-center justify-between py-2 border-b border-[var(--lab-border)] last:border-0">
            <span className="text-xs text-[var(--lab-text-secondary)]">{label}</span>
            <span className={cn("text-sm font-mono font-medium", colors[indicator || "neutral"])}>
                {typeof value === "number" ? value.toFixed(2) : value}
                {unit && <span className="text-[10px] ml-1 opacity-60">{unit}</span>}
            </span>
        </div>
    );
}

function AminoAcidBar({ composition }: { composition: Record<string, number> }) {
    const entries = Object.entries(composition)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) return null;

    const maxVal = Math.max(...entries.map(([, v]) => v));

    // Color palette for amino acids
    const aaColors: Record<string, string> = {
        A: "#3b82f6", R: "#ef4444", N: "#22c55e", D: "#f59e0b",
        C: "#a855f7", E: "#ec4899", Q: "#14b8a6", G: "#6366f1",
        H: "#f97316", I: "#06b6d4", L: "#8b5cf6", K: "#ef4444",
        M: "#eab308", F: "#d946ef", P: "#10b981", S: "#0ea5e9",
        T: "#84cc16", W: "#f43f5e", Y: "#a3e635", V: "#7c3aed",
    };

    return (
        <div className="mt-4">
            <h4 className="text-[10px] font-medium text-[var(--lab-text-tertiary)] uppercase tracking-wider mb-2">
                Amino Acid Composition
            </h4>
            <div className="space-y-1">
                {entries.slice(0, 10).map(([aa, pct]) => (
                    <div key={aa} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono w-4 text-center font-bold" style={{ color: aaColors[aa] || "#888" }}>
                            {aa}
                        </span>
                        <div className="flex-1 h-3 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(pct / maxVal) * 100}%` }}
                                transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: aaColors[aa] || "#888", opacity: 0.7 }}
                            />
                        </div>
                        <span className="text-[10px] font-mono text-[var(--lab-text-tertiary)] w-12 text-right">
                            {pct.toFixed(1)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function SequenceResultCard({ result }: SequenceResultCardProps) {
    const instabilityIndicator = result.instability_index > 40 ? "warning" : "good";

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="lab-card p-4"
        >
            <div className="flex items-center gap-2 mb-3">
                <Dna className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-semibold text-[var(--lab-text-primary)] font-serif tracking-wide">
                    Sequence Analysis Results
                </h3>
            </div>

            <div className="divide-y divide-[var(--lab-border)]">
                <MetricRow
                    label="Molecular Weight"
                    value={result.molecular_weight}
                    unit="Da"
                    indicator="neutral"
                />
                <MetricRow
                    label="Isoelectric Point (pI)"
                    value={result.isoelectric_point}
                    indicator="neutral"
                />
                <MetricRow
                    label="Instability Index"
                    value={result.instability_index}
                    indicator={instabilityIndicator}
                />
                {result.aromaticity !== undefined && (
                    <MetricRow
                        label="Aromaticity"
                        value={result.aromaticity}
                        indicator="neutral"
                    />
                )}
                {result.gravy !== undefined && (
                    <MetricRow
                        label="GRAVY (Hydropathicity)"
                        value={result.gravy}
                        indicator="neutral"
                    />
                )}
            </div>

            {/* Stability interpretation */}
            <div className="mt-3 p-2 rounded-lg bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-1.5 text-[11px]">
                    {result.instability_index > 40 ? (
                        <>
                            <TrendingDown className="w-3 h-3 text-amber-500" />
                            <span className="text-amber-600 dark:text-amber-400">
                                Predicted unstable (index &gt; 40)
                            </span>
                        </>
                    ) : (
                        <>
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">
                                Predicted stable (index ≤ 40)
                            </span>
                        </>
                    )}
                </div>
            </div>

            {result.amino_acid_percent && (
                <AminoAcidBar composition={result.amino_acid_percent} />
            )}
        </motion.div>
    );
}
