'use client';

/**
 * SearchResultsPanel Component
 * 
 * Displays OpenClaw search results with causal density indicators
 * 
 * Features:
 * - Grouped by causal density level (L1, L2, L3)
 * - Visual indicators for causal strength
 * - Expandable result cards with detected mechanisms
 * - Confidence scores and evidence details
 */

import { useState, useEffect } from 'react';
import { Search, AlertCircle, TrendingUp, Zap } from 'lucide-react';
import type { SearchResultRecord } from '@/lib/services/openclaw-adapter';

interface SearchResultsPanelProps {
    query?: string;
    autoLoad?: boolean;
}

export function SearchResultsPanel({ query, autoLoad = false }: SearchResultsPanelProps) {
    const [results, setResults] = useState<SearchResultRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState(query || '');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (autoLoad && query) {
            handleSearch(query);
        }
    }, [autoLoad, query]);

    const handleSearch = async (q: string) => {
        if (!q.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/openclaw/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q, numResults: 10 }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Search failed');
            }

            setResults(data.results || []);
        } catch (err: any) {
            setError(err.message);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(searchQuery);
    };

    // Group results by causal density
    const groupedResults = results.reduce((acc, result) => {
        const level = result.causal_density_score;
        if (!acc[level]) acc[level] = [];
        acc[level].push(result);
        return acc;
    }, {} as Record<number, SearchResultRecord[]>);

    const getDensityIcon = (level: number) => {
        switch (level) {
            case 1: return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            case 2: return <TrendingUp className="w-5 h-5 text-blue-500" />;
            case 3: return <Zap className="w-5 h-5 text-purple-500" />;
            default: return null;
        }
    };

    const getDensityColor = (level: number) => {
        switch (level) {
            case 1: return 'border-yellow-500/30 bg-yellow-500/5';
            case 2: return 'border-blue-500/30 bg-blue-500/5';
            case 3: return 'border-purple-500/30 bg-purple-500/5';
            default: return 'border-gray-500/30 bg-gray-500/5';
        }
    };

    const getDensityLabel = (label: string) => {
        const labels: Record<string, string> = {
            'Association': 'L1: Association',
            'Intervention': 'L2: Intervention',
            'Counterfactual': 'L3: Counterfactual',
        };
        return labels[label] || label;
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Search Input */}
            <form onSubmit={onSubmit} className="flex gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for causal evidence..."
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !searchQuery.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {/* Error Message */}
            {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
                    <p className="font-medium">Search Error</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}

            {/* Results */}
            {!loading && results.length === 0 && !error && (
                <div className="text-center py-12 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No results yet. Try searching for something.</p>
                </div>
            )}

            {/* Results grouped by density */}
            {Object.entries(groupedResults)
                .sort(([a], [b]) => parseInt(b) - parseInt(a))
                .map(([level, levelResults]) => (
                    <div key={level} className="space-y-3">
                        <h3 className="flex items-center gap-2 text-lg font-semibold">
                            {getDensityIcon(parseInt(level))}
                            <span>{getDensityLabel(levelResults[0]?.causal_label || '')}</span>
                            <span className="text-sm text-gray-500">({levelResults.length})</span>
                        </h3>

                        {levelResults.map((result) => (
                            <div
                                key={result.id}
                                className={`p-4 rounded-lg border-2 transition-all ${getDensityColor(parseInt(level))}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <a
                                            href={result.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium line-clamp-1"
                                        >
                                            {result.title}
                                        </a>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                            {result.snippet}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <div className="text-xs font-medium text-gray-500">
                                            Confidence: {(result.confidence * 100).toFixed(0)}%
                                        </div>
                                        {result.relevance_score !== undefined && (
                                            <div className="text-xs text-gray-400">
                                                Relevance: {result.relevance_score.toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Detected Mechanisms */}
                                {result.detected_mechanisms && result.detected_mechanisms.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => setExpandedId(expandedId === result.id ? null : result.id)}
                                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                                        >
                                            {expandedId === result.id ? '▼' : '▶'} Detected mechanisms ({result.detected_mechanisms.length})
                                        </button>

                                        {expandedId === result.id && (
                                            <div className="mt-2 space-y-1">
                                                {result.detected_mechanisms.map((mechanism, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
                                                    >
                                                        {mechanism}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
        </div>
    );
}
