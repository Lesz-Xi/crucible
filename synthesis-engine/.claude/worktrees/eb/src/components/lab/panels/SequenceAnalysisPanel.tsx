"use client";

import React, { useState, useCallback } from "react";
import { Dna, Loader2, CheckCircle2, AlertCircle, Play } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Simple sequence validation — accepts standard amino acid one-letter codes
const AMINO_ACID_REGEX = /^[ACDEFGHIKLMNPQRSTVWY\s]+$/i;
const MIN_SEQUENCE_LENGTH = 10;
const MAX_SEQUENCE_LENGTH = 50000;

function validateSequence(seq: string): string | null {
    const cleaned = seq.replace(/\s+/g, "");
    if (!cleaned) return null;
    if (cleaned.length < MIN_SEQUENCE_LENGTH) return `Sequence must be at least ${MIN_SEQUENCE_LENGTH} residues`;
    if (cleaned.length > MAX_SEQUENCE_LENGTH) return `Sequence must not exceed ${MAX_SEQUENCE_LENGTH} residues`;
    if (!AMINO_ACID_REGEX.test(cleaned)) return "Sequence contains invalid characters (use standard amino acid one-letter codes)";
    return null; // valid
}

interface SequenceAnalysisPanelProps {
    onSubmit: (sequence: string) => Promise<void>;
    isLoading?: boolean;
    disabled?: boolean;
}

export function SequenceAnalysisPanel({ onSubmit, isLoading = false, disabled = false }: SequenceAnalysisPanelProps) {
    const [sequence, setSequence] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    const validate = useCallback((value: string): boolean => {
        const err = validateSequence(value);
        setError(err);
        return err === null && value.replace(/\s+/g, "").length >= MIN_SEQUENCE_LENGTH;
    }, []);

    const cleanedLength = sequence.replace(/\s+/g, "").length;
    const isValid = cleanedLength >= MIN_SEQUENCE_LENGTH && !error && touched;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value.toUpperCase();
        setSequence(val);
        if (touched) validate(val);
    };

    const handleBlur = () => {
        setTouched(true);
        if (sequence) validate(sequence);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (!validate(sequence) || isLoading || disabled) return;
        await onSubmit(sequence.replace(/\s+/g, ""));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="lab-panel sequence-panel p-6 max-w-md mx-auto"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Dna className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-[var(--lab-text-primary)] font-serif tracking-wide">
                        Sequence Analysis
                    </h3>
                    <p className="text-[10px] text-[var(--lab-text-secondary)]">
                        Physicochemical properties via Biopython
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label
                            htmlFor="sequence-input"
                            className="text-xs font-medium text-[var(--lab-text-secondary)]"
                        >
                            Amino Acid Sequence
                        </label>
                        <span className="text-[10px] text-[var(--lab-text-secondary)] font-mono">
                            {cleanedLength} residues
                        </span>
                    </div>
                    <div className="relative">
                        <textarea
                            id="sequence-input"
                            data-testid="sequence-input"
                            value={sequence}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSH..."
                            disabled={isLoading || disabled}
                            rows={5}
                            aria-label="Amino acid sequence"
                            aria-invalid={!!error && touched}
                            aria-describedby={error ? "sequence-error" : undefined}
                            className={cn(
                                "w-full px-3 py-2.5 rounded-lg text-xs font-mono leading-relaxed resize-y",
                                "bg-white/90 dark:bg-white/5 border transition-all duration-200",
                                "placeholder:text-stone-400 placeholder:font-mono",
                                "focus:outline-none focus:ring-2 focus:ring-offset-1",
                                error && touched
                                    ? "border-red-400 focus:ring-red-300/40"
                                    : isValid
                                        ? "border-emerald-400 focus:ring-emerald-300/40"
                                        : "border-[var(--lab-border)] focus:ring-amber-300/40",
                                (isLoading || disabled) && "opacity-50 cursor-not-allowed"
                            )}
                        />
                        <div className="absolute right-3 top-3">
                            {isValid && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            {error && touched && <AlertCircle className="w-4 h-4 text-red-400" />}
                        </div>
                    </div>
                    {error && touched && (
                        <p id="sequence-error" className="mt-1 text-[11px] text-red-400" role="alert">
                            {error}
                        </p>
                    )}
                    <p className="mt-1.5 text-[10px] text-[var(--lab-text-tertiary)]">
                        Standard one-letter amino acid codes (A, C, D, E, F, G, H, I, K, L, M, N, P, Q, R, S, T, V, W, Y)
                    </p>
                </div>

                <button
                    type="submit"
                    data-testid="analyze-button"
                    disabled={!isValid || isLoading || disabled}
                    aria-label="Analyze protein sequence"
                    className={cn(
                        "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                        "transition-all duration-200 border",
                        isValid && !isLoading
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
                            : "bg-white/20 border-white/10 text-stone-400 cursor-not-allowed"
                    )}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing…
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4" />
                            Analyze Sequence
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
}
