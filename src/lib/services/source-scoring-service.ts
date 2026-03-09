/**
 * SourceScoringService — SCM-Grounded Report Analysis
 *
 * Deterministic source quality scoring. Every function is pure — same inputs
 * produce identical outputs. No LLM calls, no network I/O.
 *
 * @version 1.0.0
 * @methodVersion source-scorer-v1.0
 */

import { v4 as uuidv4 } from "uuid";
import { SourceRecord } from "@/types/report-analysis";

export const SOURCE_SCORER_METHOD_VERSION = "source-scorer-v1.0" as const;

// ---------------------------------------------------------------------------
// Domain Tier Registry
// ---------------------------------------------------------------------------

export const SOURCE_DOMAIN_TIERS: Record<string, number> = {
    // Tier A — Institutional / Academic
    "who.int": 0.95,
    "un.org": 0.93,
    "imf.org": 0.92,
    "worldbank.org": 0.92,
    "cia.gov": 0.90,
    "state.gov": 0.88,
    "arxiv.org": 0.88,
    "jstor.org": 0.87,
    "pubmed.ncbi.nlm.nih.gov": 0.92,
    "nature.com": 0.91,
    "science.org": 0.91,
    "iaea.org": 0.93,
    "rand.org": 0.85,
    "brookings.edu": 0.85,
    // Tier B — Reputable journalism / analysis
    "reuters.com": 0.82,
    "apnews.com": 0.82,
    "bbc.com": 0.80,
    "bbc.co.uk": 0.80,
    "ft.com": 0.80,
    "economist.com": 0.79,
    "foreignaffairs.com": 0.80,
    "foreignpolicy.com": 0.77,
    "theguardian.com": 0.76,
    "nytimes.com": 0.76,
    "washingtonpost.com": 0.75,
    "wsj.com": 0.75,
    "politico.com": 0.72,
    "axios.com": 0.72,
};

export const DEFAULT_DOMAIN_SCORE = 0.30;
const RECENCY_DECAY_DAYS = 365;
const UNKNOWN_RECENCY_SCORE = 0.30;

export function computeRecencyScore(publishedAt?: string): number {
    if (!publishedAt) return UNKNOWN_RECENCY_SCORE;

    const published = new Date(publishedAt).getTime();
    if (Number.isNaN(published)) return UNKNOWN_RECENCY_SCORE;

    // Score recency at UTC day granularity so repeated calls with the same
    // input stay deterministic within a run instead of drifting by milliseconds.
    const nowDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const publishedDay = Math.floor(published / (1000 * 60 * 60 * 24));
    const daysOld = nowDay - publishedDay;
    return Math.max(0, Math.min(1, 1 - daysOld / RECENCY_DECAY_DAYS));
}

export function computeCredibilityScore(domain: string): number {
    const normalized = domain.toLowerCase().replace(/^www\./, "");
    return (
        SOURCE_DOMAIN_TIERS[normalized] ??
        SOURCE_DOMAIN_TIERS[domain.toLowerCase()] ??
        DEFAULT_DOMAIN_SCORE
    );
}

export function computeCorroborationScore(overlappingSourceCount: number): number {
    return Math.max(0, Math.min(1, overlappingSourceCount / 3));
}

import type { EvidenceTier } from "@/types/report-analysis";

const EVIDENCE_TIER_WEIGHTS: Record<EvidenceTier, number> = {
    A: 1.0,
    B: 0.6,
    C: 0.3,
    UNKNOWN: 0.1,
};

export function computeClaimConfidence(params: {
    credibilityScore: number;
    corroborationScore: number;
    evidenceTier: EvidenceTier;
}): number {
    const { credibilityScore, corroborationScore, evidenceTier } = params;
    const tierWeight = EVIDENCE_TIER_WEIGHTS[evidenceTier] ?? 0.1;
    const raw =
        0.4 * credibilityScore + 0.3 * corroborationScore + 0.3 * tierWeight;
    return Number(Math.max(0, Math.min(1, raw)).toFixed(4));
}

export function extractDomain(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

export interface ScoreSourceParams {
    url: string;
    publishedAt?: string;
    excerpt: string;
    overlappingSourceCount: number;
    ingestionId: string;
    fetchedAt?: string;
}

export class SourceScoringService {
    // Singleton pattern for DI
    private static instance: SourceScoringService;

    public static getInstance(): SourceScoringService {
        if (!SourceScoringService.instance) {
            SourceScoringService.instance = new SourceScoringService();
        }
        return SourceScoringService.instance;
    }

    scoreSource(params: ScoreSourceParams): SourceRecord {
        const {
            url,
            publishedAt,
            excerpt,
            overlappingSourceCount,
            ingestionId,
            fetchedAt,
        } = params;

        const domain = extractDomain(url);
        const credibilityScore = computeCredibilityScore(domain);
        const recencyScore = computeRecencyScore(publishedAt);
        const corroborationScore = computeCorroborationScore(overlappingSourceCount);

        return {
            sourceId: uuidv4(),
            url,
            domain,
            publishedAt,
            credibilityScore,
            recencyScore,
            corroborationScore,
            excerpt: excerpt.slice(0, 2000),
            fetchedAt: fetchedAt ?? new Date().toISOString(),
            ingestionId,
        };
    }

    scoreSourceBatch(params: Omit<ScoreSourceParams, "overlappingSourceCount">[]): SourceRecord[] {
        const total = params.length;
        return params.map((p) =>
            this.scoreSource({
                ...p,
                overlappingSourceCount: Math.max(0, total - 1),
            })
        );
    }
}
