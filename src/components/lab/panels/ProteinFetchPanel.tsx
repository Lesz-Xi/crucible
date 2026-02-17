"use client";

import React, { useState, useCallback } from "react";
import { Box, Loader2, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { motion } from "framer-motion";
import { ProteinViewerInputSchema, formatValidationErrors } from "@/lib/validations/lab";
import { cn } from "@/lib/utils";

interface ProteinFetchPanelProps {
    onSubmit: (pdbId: string) => Promise<void>;
    isLoading?: boolean;
    disabled?: boolean;
}

export function ProteinFetchPanel({ onSubmit, isLoading = false, disabled = false }: ProteinFetchPanelProps) {
    const [pdbId, setPdbId] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    const validate = useCallback((value: string): boolean => {
        if (!value) {
            setError(null);
            return false;
        }
        const result = ProteinViewerInputSchema.safeParse({ pdbId: value });
        if (result.success) {
            setError(null);
            return true;
        }
        setError(formatValidationErrors(result.error)[0] || "Invalid PDB ID");
        return false;
    }, []);

    const isValid = pdbId.length > 0 && !error && touched;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase().slice(0, 4);
        setPdbId(val);
        if (touched) validate(val);
    };

    const handleBlur = () => {
        setTouched(true);
        if (pdbId) validate(pdbId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (!validate(pdbId) || isLoading || disabled) return;
        await onSubmit(pdbId);
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
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <Box className="w-5 h-5 text-cyan-500" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-[var(--lab-text-primary)] font-serif tracking-wide">
                        Protein Structure Fetch
                    </h3>
                    <p className="text-[10px] text-[var(--lab-text-tertiary)]">
                        Retrieve structures from RCSB PDB
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="pdb-id-input"
                        className="block text-xs font-medium text-[var(--lab-text-secondary)] mb-1.5"
                    >
                        PDB Identifier
                    </label>
                    <div className="relative">
                        <input
                            id="pdb-id-input"
                            data-testid="pdb-id-input"
                            type="text"
                            value={pdbId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="e.g. 4HHB"
                            disabled={isLoading || disabled}
                            autoComplete="off"
                            aria-label="PDB ID"
                            aria-invalid={!!error && touched}
                            aria-describedby={error ? "pdb-id-error" : undefined}
                            className={cn(
                                "w-full px-3 py-2.5 rounded-lg text-sm font-mono tracking-wider",
                                "bg-white/90 dark:bg-white/5 border transition-all duration-200",
                                "placeholder:text-stone-400 placeholder:font-sans placeholder:tracking-normal",
                                "focus:outline-none focus:ring-2 focus:ring-offset-1",
                                error && touched
                                    ? "border-red-400 focus:ring-red-300/40"
                                    : isValid
                                        ? "border-emerald-400 focus:ring-emerald-300/40"
                                        : "border-[var(--lab-border)] focus:ring-amber-300/40",
                                (isLoading || disabled) && "opacity-50 cursor-not-allowed"
                            )}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isValid && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            {error && touched && <AlertCircle className="w-4 h-4 text-red-400" />}
                        </div>
                    </div>
                    {error && touched && (
                        <p id="pdb-id-error" className="mt-1 text-[11px] text-red-400" role="alert">
                            {error}
                        </p>
                    )}
                    <p className="mt-1.5 text-[10px] text-[var(--lab-text-tertiary)]">
                        4-character alphanumeric identifier (e.g. 4HHB, 1CRN, 6LU7)
                    </p>
                </div>

                <button
                    type="submit"
                    data-testid="fetch-button"
                    disabled={!isValid || isLoading || disabled}
                    aria-label="Fetch protein structure"
                    className={cn(
                        "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                        "transition-all duration-200 border",
                        isValid && !isLoading
                            ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 cursor-pointer"
                            : "bg-white/20 border-white/10 text-stone-400 cursor-not-allowed"
                    )}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Fetching…
                        </>
                    ) : (
                        <>
                            <Search className="w-4 h-4" />
                            Fetch Structure
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
}
