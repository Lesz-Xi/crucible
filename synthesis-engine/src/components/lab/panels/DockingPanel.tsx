"use client";

import React, { useState, useCallback } from "react";
import { Network, Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { ProteinViewerInputSchema, formatValidationErrors } from "@/lib/validations/lab";
import { cn } from "@/lib/utils";

// Basic SMILES validation: non-empty, reasonable character set, balanced brackets
function validateSmiles(smiles: string): string | null {
    if (!smiles.trim()) return null;
    if (smiles.length < 1) return "SMILES string is required";
    if (smiles.length > 2000) return "SMILES string too long (max 2000 characters)";

    // Check for obviously invalid characters
    const validChars = /^[A-Za-z0-9@+\-\[\]\(\)\\\/=#%\.\*:~]+$/;
    if (!validChars.test(smiles)) return "SMILES contains invalid characters";

    // Check balanced brackets
    let parens = 0, brackets = 0;
    for (const ch of smiles) {
        if (ch === "(") parens++;
        if (ch === ")") parens--;
        if (ch === "[") brackets++;
        if (ch === "]") brackets--;
        if (parens < 0 || brackets < 0) return "SMILES has unbalanced brackets";
    }
    if (parens !== 0) return "SMILES has unbalanced parentheses";
    if (brackets !== 0) return "SMILES has unbalanced square brackets";

    return null;
}

interface DockingPanelProps {
    onSubmit: (pdbId: string, smiles: string, seed: number) => Promise<void>;
    isLoading?: boolean;
    disabled?: boolean;
}

export function DockingPanel({ onSubmit, isLoading = false, disabled = false }: DockingPanelProps) {
    const [pdbId, setPdbId] = useState("");
    const [smiles, setSmiles] = useState("");
    const [seed, setSeed] = useState("42");
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validateField = useCallback((field: string, value: string) => {
        let err: string | null = null;
        if (field === "pdbId") {
            if (!value) { err = null; }
            else {
                const result = ProteinViewerInputSchema.safeParse({ pdbId: value });
                if (!result.success) err = formatValidationErrors(result.error)[0] || "Invalid PDB ID";
            }
        } else if (field === "smiles") {
            err = validateSmiles(value);
        } else if (field === "seed") {
            const n = Number(value);
            if (value && (isNaN(n) || !Number.isInteger(n) || n < 0 || n > 999999)) {
                err = "Seed must be an integer between 0 and 999999";
            }
        }
        setErrors(prev => ({ ...prev, [field]: err }));
        return err === null;
    }, []);

    const markTouched = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const pdbValid = pdbId.length === 4 && !errors.pdbId;
    const smilesValid = smiles.trim().length > 0 && !errors.smiles;
    const seedValid = !errors.seed;
    const allValid = pdbValid && smilesValid && seedValid && touched.pdbId && touched.smiles;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ pdbId: true, smiles: true, seed: true });
        const pdbOk = validateField("pdbId", pdbId);
        const smilesOk = validateField("smiles", smiles);
        const seedOk = validateField("seed", seed);
        if (!pdbOk || !smilesOk || !seedOk || isLoading || disabled) return;
        await onSubmit(pdbId, smiles, Number(seed) || 42);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="lab-panel p-6 max-w-md mx-auto"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Network className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-[var(--lab-text-primary)] font-serif tracking-wide">
                        Ligand Docking
                    </h3>
                    <p className="text-[10px] text-[var(--lab-text-tertiary)]">
                        Binding affinity estimation (stub engine)
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* PDB ID */}
                <div>
                    <label htmlFor="dock-pdb-input" className="block text-xs font-medium text-[var(--lab-text-secondary)] mb-1.5">
                        Target Protein (PDB ID)
                    </label>
                    <div className="relative">
                        <input
                            id="dock-pdb-input"
                            data-testid="dock-pdb-input"
                            type="text"
                            value={pdbId}
                            onChange={(e) => { const v = e.target.value.toUpperCase().slice(0, 4); setPdbId(v); if (touched.pdbId) validateField("pdbId", v); }}
                            onBlur={() => { markTouched("pdbId"); validateField("pdbId", pdbId); }}
                            placeholder="e.g. 6LU7"
                            disabled={isLoading || disabled}
                            aria-label="Target protein PDB ID"
                            aria-invalid={!!errors.pdbId && touched.pdbId}
                            className={cn(
                                "w-full px-3 py-2.5 rounded-lg text-sm font-mono tracking-wider",
                                "bg-white/90 dark:bg-white/5 border transition-all duration-200",
                                "focus:outline-none focus:ring-2 focus:ring-offset-1",
                                errors.pdbId && touched.pdbId
                                    ? "border-red-400 focus:ring-red-300/40"
                                    : pdbValid && touched.pdbId
                                        ? "border-emerald-400 focus:ring-emerald-300/40"
                                        : "border-[var(--lab-border)] focus:ring-amber-300/40",
                                (isLoading || disabled) && "opacity-50 cursor-not-allowed"
                            )}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {pdbValid && touched.pdbId && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            {errors.pdbId && touched.pdbId && <AlertCircle className="w-4 h-4 text-red-400" />}
                        </div>
                    </div>
                    {errors.pdbId && touched.pdbId && (
                        <p className="mt-1 text-[11px] text-red-400" role="alert">{errors.pdbId}</p>
                    )}
                </div>

                {/* SMILES */}
                <div>
                    <label htmlFor="dock-smiles-input" className="block text-xs font-medium text-[var(--lab-text-secondary)] mb-1.5">
                        Ligand (SMILES)
                    </label>
                    <div className="relative">
                        <input
                            id="dock-smiles-input"
                            data-testid="dock-smiles-input"
                            type="text"
                            value={smiles}
                            onChange={(e) => { setSmiles(e.target.value); if (touched.smiles) validateField("smiles", e.target.value); }}
                            onBlur={() => { markTouched("smiles"); validateField("smiles", smiles); }}
                            placeholder="e.g. CC(=O)OC1=CC=CC=C1C(=O)O"
                            disabled={isLoading || disabled}
                            aria-label="Ligand SMILES string"
                            aria-invalid={!!errors.smiles && touched.smiles}
                            className={cn(
                                "w-full px-3 py-2.5 rounded-lg text-sm font-mono",
                                "bg-white/90 dark:bg-white/5 border transition-all duration-200",
                                "focus:outline-none focus:ring-2 focus:ring-offset-1",
                                errors.smiles && touched.smiles
                                    ? "border-red-400 focus:ring-red-300/40"
                                    : smilesValid && touched.smiles
                                        ? "border-emerald-400 focus:ring-emerald-300/40"
                                        : "border-[var(--lab-border)] focus:ring-amber-300/40",
                                (isLoading || disabled) && "opacity-50 cursor-not-allowed"
                            )}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {smilesValid && touched.smiles && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            {errors.smiles && touched.smiles && <AlertCircle className="w-4 h-4 text-red-400" />}
                        </div>
                    </div>
                    {errors.smiles && touched.smiles && (
                        <p className="mt-1 text-[11px] text-red-400" role="alert">{errors.smiles}</p>
                    )}
                    <p className="mt-1.5 text-[10px] text-[var(--lab-text-tertiary)]">
                        Simplified Molecular Input Line Entry System notation
                    </p>
                </div>

                {/* Seed */}
                <div>
                    <label htmlFor="dock-seed-input" className="block text-xs font-medium text-[var(--lab-text-secondary)] mb-1.5">
                        Random Seed <span className="text-[var(--lab-text-tertiary)]">(optional)</span>
                    </label>
                    <input
                        id="dock-seed-input"
                        data-testid="dock-seed-input"
                        type="number"
                        value={seed}
                        onChange={(e) => { setSeed(e.target.value); if (touched.seed) validateField("seed", e.target.value); }}
                        onBlur={() => { markTouched("seed"); validateField("seed", seed); }}
                        placeholder="42"
                        disabled={isLoading || disabled}
                        aria-label="Random seed for docking"
                        className={cn(
                            "w-full px-3 py-2.5 rounded-lg text-sm font-mono",
                            "bg-white/90 dark:bg-white/5 border transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-offset-1",
                            errors.seed && touched.seed
                                ? "border-red-400 focus:ring-red-300/40"
                                : "border-[var(--lab-border)] focus:ring-amber-300/40",
                            (isLoading || disabled) && "opacity-50 cursor-not-allowed"
                        )}
                    />
                    {errors.seed && touched.seed && (
                        <p className="mt-1 text-[11px] text-red-400" role="alert">{errors.seed}</p>
                    )}
                </div>

                <button
                    type="submit"
                    data-testid="dock-button"
                    disabled={!allValid || isLoading || disabled}
                    aria-label="Run ligand docking"
                    className={cn(
                        "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                        "transition-all duration-200 border",
                        allValid && !isLoading
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 cursor-pointer"
                            : "bg-white/20 border-white/10 text-stone-400 cursor-not-allowed"
                    )}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Docking…
                        </>
                    ) : (
                        <>
                            <Zap className="w-4 h-4" />
                            Run Docking
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
}
