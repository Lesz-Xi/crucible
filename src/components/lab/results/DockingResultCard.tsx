"use client";

import React from "react";
import { Network, Cpu, Hash } from "lucide-react";
import { motion } from "framer-motion";
import type { DockingResult } from "@/types/lab";
import { cn } from "@/lib/utils";

interface DockingResultCardProps {
    result: DockingResult;
}

function AffinityGauge({ value }: { value: number }) {
    // Affinity typically ranges from -5 to -12 kcal/mol
    // More negative = stronger binding
    const normalized = Math.min(1, Math.max(0, (Math.abs(value) - 5) / 7));
    const color = normalized > 0.6 ? "text-emerald-500" : normalized > 0.3 ? "text-amber-500" : "text-red-400";
    const label = normalized > 0.6 ? "Strong" : normalized > 0.3 ? "Moderate" : "Weak";

    return (
        <div className="text-center">
            <div className={cn("text-3xl font-mono font-bold", color)}>
                {value.toFixed(2)}
            </div>
            <div className="text-[10px] text-[var(--lab-text-tertiary)] mt-0.5">kcal/mol</div>
            <div className={cn("text-[10px] font-medium mt-1 px-2 py-0.5 rounded-full inline-block", 
                normalized > 0.6 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                normalized > 0.3 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                "bg-red-500/10 text-red-500"
            )}>
                {label} binding
            </div>
        </div>
    );
}

export function DockingResultCard({ result }: DockingResultCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="lab-card p-4"
        >
            <div className="flex items-center gap-2 mb-4">
                <Network className="w-4 h-4 text-purple-500" />
                <h3 className="text-xs font-semibold text-[var(--lab-text-primary)] font-serif tracking-wide">
                    Docking Results
                </h3>
            </div>

            {/* Main affinity display */}
            <div className="flex items-center justify-center py-4 mb-4 rounded-lg bg-gradient-to-br from-purple-500/5 to-transparent border border-purple-500/10">
                <AffinityGauge value={result.affinity_kcal_mol} />
            </div>

            {/* RMSD */}
            <div className="flex items-center justify-between py-2 border-b border-[var(--lab-border)]">
                <span className="text-xs text-[var(--lab-text-secondary)]">RMSD</span>
                <span className="text-sm font-mono font-medium text-[var(--lab-text-primary)]">
                    {result.rmsd.toFixed(2)} <span className="text-[10px] opacity-60">Å</span>
                </span>
            </div>

            {/* Poses table */}
            {result.poses && result.poses.length > 0 && (
                <div className="mt-3">
                    <h4 className="text-[10px] font-medium text-[var(--lab-text-tertiary)] uppercase tracking-wider mb-2">
                        Docking Poses
                    </h4>
                    <div className="rounded-lg border border-[var(--lab-border)] overflow-hidden">
                        <table className="w-full text-[11px]">
                            <thead>
                                <tr className="bg-black/5 dark:bg-white/5">
                                    <th className="px-3 py-1.5 text-left font-medium text-[var(--lab-text-tertiary)]">Rank</th>
                                    <th className="px-3 py-1.5 text-right font-medium text-[var(--lab-text-tertiary)]">Score</th>
                                    <th className="px-3 py-1.5 text-right font-medium text-[var(--lab-text-tertiary)]">RMSD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.poses.map((pose, i) => (
                                    <motion.tr
                                        key={pose.rank}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="border-t border-[var(--lab-border)]"
                                    >
                                        <td className="px-3 py-1.5 font-mono text-[var(--lab-text-secondary)]">
                                            #{pose.rank}
                                        </td>
                                        <td className="px-3 py-1.5 text-right font-mono font-medium text-[var(--lab-text-primary)]">
                                            {typeof pose.score === 'number' ? pose.score.toFixed(2) : pose.score}
                                        </td>
                                        <td className="px-3 py-1.5 text-right font-mono text-[var(--lab-text-secondary)]">
                                            {typeof pose.rmsd === 'number' ? pose.rmsd.toFixed(2) : pose.rmsd}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Engine badge */}
            <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--lab-text-tertiary)]">
                <Cpu className="w-3 h-3" />
                <span>{result.engine}</span>
                {result.seed !== undefined && (
                    <>
                        <Hash className="w-3 h-3 ml-2" />
                        <span>seed: {result.seed}</span>
                    </>
                )}
            </div>
        </motion.div>
    );
}
