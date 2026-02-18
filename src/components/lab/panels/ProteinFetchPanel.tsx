"use client";

import React, { useState, useCallback } from "react";
import { Box, Loader2, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { motion } from "framer-motion";
import { ProteinViewerInputSchema, formatValidationErrors } from "@/lib/validations/lab";
import { cn } from "@/lib/utils";

type ProteinSource = 'rcsb' | 'alphafold';

interface ProteinFetchPanelProps {
    onSubmit: (identifier: string, source: ProteinSource) => Promise<void>;
    isLoading?: boolean;
    disabled?: boolean;
}

const UNIPROT_ACCESSION_REGEX = /^(?:[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9](?:[A-Z][A-Z0-9]{2}[0-9]){1,2})$/i;

export function ProteinFetchPanel({ onSubmit, isLoading = false, disabled = false }: ProteinFetchPanelProps) {
    const [source, setSource] = useState<ProteinSource>('rcsb');
    const [identifier, setIdentifier] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    const validate = useCallback((value: string, selectedSource: ProteinSource): boolean => {
        if (!value) {
            setError(null);
            return false;
        }

        if (selectedSource === 'rcsb') {
            const result = ProteinViewerInputSchema.safeParse({ pdbId: value });
            if (result.success || value.trim().length >= 3) {
                setError(null);
                return true;
            }
            setError(formatValidationErrors(result.error)[0] || "Enter a PDB ID or protein query");
            return false;
        }

        if (UNIPROT_ACCESSION_REGEX.test(value) || value.trim().length >= 3) {
            setError(null);
            return true;
        }

        setError("Enter a UniProt ID or protein/gene query");
        return false;
    }, []);

    const isValid = identifier.length > 0 && !error && touched;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const val = source === 'rcsb' ? raw.slice(0, 80) : raw.slice(0, 120);
        setIdentifier(val);
        if (touched) validate(val, source);
    };

    const handleBlur = () => {
        setTouched(true);
        if (identifier) validate(identifier, source);
    };

    const handleSourceChange = (next: ProteinSource) => {
        setSource(next);
        setIdentifier("");
        setTouched(false);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (!validate(identifier, source) || isLoading || disabled) return;
        await onSubmit(identifier, source);
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
                        Retrieve structures from RCSB PDB or AlphaFold DB
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        className={cn('lab-nav-pill justify-center', source === 'rcsb' ? 'sidebar-history-item-active' : '')}
                        onClick={() => handleSourceChange('rcsb')}
                    >
                        RCSB PDB
                    </button>
                    <button
                        type="button"
                        className={cn('lab-nav-pill justify-center', source === 'alphafold' ? 'sidebar-history-item-active' : '')}
                        onClick={() => handleSourceChange('alphafold')}
                    >
                        AlphaFold
                    </button>
                </div>

                <div>
                    <label
                        htmlFor="protein-id-input"
                        className="block text-xs font-medium text-[var(--lab-text-secondary)] mb-1.5"
                    >
                        {source === 'rcsb' ? 'PDB Identifier' : 'UniProt Accession'}
                    </label>
                    <div className="relative">
                        <input
                            id="protein-id-input"
                            data-testid="protein-id-input"
                            type="text"
                            value={identifier}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder={source === 'rcsb' ? 'e.g. 4HHB or hemoglobin' : 'e.g. P69905 or HBB human'}
                            disabled={isLoading || disabled}
                            autoComplete="off"
                            aria-label={source === 'rcsb' ? 'PDB ID' : 'UniProt accession'}
                            aria-invalid={!!error && touched}
                            aria-describedby={error ? "protein-id-error" : undefined}
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
                        <p id="protein-id-error" className="mt-1 text-[11px] text-red-400" role="alert">
                            {error}
                        </p>
                    )}
                    <p className="mt-1.5 text-[10px] text-[var(--lab-text-tertiary)]">
                        {source === 'rcsb'
                            ? 'Use PDB ID or a protein query (e.g. 4HHB, 1CRN, hemoglobin).'
                            : 'Use UniProt accession or a protein/gene query (e.g. P69905, Q8WZ42, HBB human).'}
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
