/**
 * Tests for SourceScoringService
 *
 * Verifies determinism, scoring formulas, boundary conditions, and batch scoring.
 */

import { describe, expect, it, vi } from "vitest";
import {
    computeRecencyScore,
    computeCredibilityScore,
    computeCorroborationScore,
    computeClaimConfidence,
    extractDomain,
    SourceScoringService,
    SOURCE_DOMAIN_TIERS,
    DEFAULT_DOMAIN_SCORE,
    SOURCE_SCORER_METHOD_VERSION,
} from "../source-scoring-service";

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("Determinism — same inputs produce identical outputs", () => {
    it("computeRecencyScore is deterministic for same publishedAt", () => {
        const date = "2025-06-01T00:00:00.000Z";
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-12T00:00:00.000Z"));
        expect(computeRecencyScore(date)).toBe(computeRecencyScore(date));
        vi.useRealTimers();
    });

    it("computeCredibilityScore is deterministic for same domain", () => {
        const domain = "reuters.com";
        expect(computeCredibilityScore(domain)).toBe(computeCredibilityScore(domain));
    });

    it("computeCorroborationScore is deterministic for same count", () => {
        expect(computeCorroborationScore(2)).toBe(computeCorroborationScore(2));
    });

    it("computeClaimConfidence is deterministic for same params", () => {
        const params = { credibilityScore: 0.82, corroborationScore: 0.67, evidenceTier: "A" as const };
        expect(computeClaimConfidence(params)).toBe(computeClaimConfidence(params));
    });
});

// ---------------------------------------------------------------------------
// Recency score
// ---------------------------------------------------------------------------

describe("computeRecencyScore", () => {
    it("returns UNKNOWN_RECENCY_SCORE (0.30) when publishedAt is undefined", () => {
        expect(computeRecencyScore(undefined)).toBe(0.30);
    });

    it("returns UNKNOWN_RECENCY_SCORE for invalid date string", () => {
        expect(computeRecencyScore("not-a-date")).toBe(0.30);
    });

    it("returns 0 for a date more than 365 days ago", () => {
        const old = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
        expect(computeRecencyScore(old)).toBe(0);
    });

    it("returns close to 1.0 for a very recent date", () => {
        const recent = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
        expect(computeRecencyScore(recent)).toBeGreaterThan(0.99);
    });

    it("is clamped to [0, 1]", () => {
        const future = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString();
        expect(computeRecencyScore(future)).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// Credibility score
// ---------------------------------------------------------------------------

describe("computeCredibilityScore", () => {
    it("returns correct tier score for known institutional domains", () => {
        expect(computeCredibilityScore("who.int")).toBe(0.95);
        expect(computeCredibilityScore("reuters.com")).toBe(0.82);
        expect(computeCredibilityScore("bbc.com")).toBe(0.80);
    });

    it("strips www. prefix before lookup", () => {
        expect(computeCredibilityScore("www.reuters.com")).toBe(0.82);
        expect(computeCredibilityScore("www.bbc.com")).toBe(0.80);
    });

    it("returns DEFAULT_DOMAIN_SCORE (0.30) for unknown domain", () => {
        expect(computeCredibilityScore("unknownnewssite123.net")).toBe(DEFAULT_DOMAIN_SCORE);
        expect(computeCredibilityScore("random-blog.io")).toBe(DEFAULT_DOMAIN_SCORE);
    });

    it("all tiers in SOURCE_DOMAIN_TIERS are between 0 and 1", () => {
        for (const [domain, score] of Object.entries(SOURCE_DOMAIN_TIERS)) {
            expect(score, `Domain ${domain} score is out of range`).toBeGreaterThan(0);
            expect(score, `Domain ${domain} score is out of range`).toBeLessThanOrEqual(1);
        }
    });
});

// ---------------------------------------------------------------------------
// Corroboration score
// ---------------------------------------------------------------------------

describe("computeCorroborationScore", () => {
    it("returns 0 for 0 overlapping sources", () => {
        expect(computeCorroborationScore(0)).toBe(0);
    });

    it("saturates at 1 for 3 or more overlapping sources", () => {
        expect(computeCorroborationScore(3)).toBe(1);
        expect(computeCorroborationScore(10)).toBe(1);
    });

    it("returns proportional score for intermediate counts", () => {
        expect(computeCorroborationScore(1)).toBeCloseTo(0.333, 2);
        expect(computeCorroborationScore(2)).toBeCloseTo(0.667, 2);
    });

    it("clamps to [0, 1] even for negative inputs", () => {
        expect(computeCorroborationScore(-5)).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// Composite confidence
// ---------------------------------------------------------------------------

describe("computeClaimConfidence", () => {
    it("returns a value in [0, 1]", () => {
        const confidence = computeClaimConfidence({ credibilityScore: 0.82, corroborationScore: 0.67, evidenceTier: "A" });
        expect(confidence).toBeGreaterThanOrEqual(0);
        expect(confidence).toBeLessThanOrEqual(1);
    });

    it("returns a higher score for Tier A vs Tier C with same credibility/corroboration", () => {
        const tierA = computeClaimConfidence({ credibilityScore: 0.82, corroborationScore: 0.67, evidenceTier: "A" });
        const tierC = computeClaimConfidence({ credibilityScore: 0.82, corroborationScore: 0.67, evidenceTier: "C" });
        expect(tierA).toBeGreaterThan(tierC);
    });

    it("computes the formula correctly: (0.4 × cred) + (0.3 × corr) + (0.3 × tier)", () => {
        // credibilityScore=0.80, corroborationScore=0.67, evidenceTier=B (weight=0.6)
        // = (0.4 × 0.80) + (0.3 × 0.67) + (0.3 × 0.6) = 0.32 + 0.201 + 0.18 = 0.701
        const result = computeClaimConfidence({ credibilityScore: 0.80, corroborationScore: 0.67, evidenceTier: "B" });
        expect(result).toBeCloseTo(0.701, 2);
    });

    it("rounds to 4 decimal places for determinism", () => {
        const result = computeClaimConfidence({ credibilityScore: 0.82, corroborationScore: 0.67, evidenceTier: "A" });
        const decimals = result.toString().split(".")[1]?.length ?? 0;
        expect(decimals).toBeLessThanOrEqual(4);
    });
});

// ---------------------------------------------------------------------------
// Domain extraction
// ---------------------------------------------------------------------------

describe("extractDomain", () => {
    it("extracts hostname from a full URL", () => {
        expect(extractDomain("https://www.reuters.com/world/article")).toBe("www.reuters.com");
    });

    it("returns the raw string on an invalid URL", () => {
        expect(extractDomain("not-a-url")).toBe("not-a-url");
    });
});

// ---------------------------------------------------------------------------
// SourceScoringService
// ---------------------------------------------------------------------------

describe("SourceScoringService.scoreSource", () => {
    const service = new SourceScoringService();
    const BASE_PARAMS = {
        url: "https://reuters.com/world/test-article",
        publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        excerpt: "Test excerpt content.",
        overlappingSourceCount: 2,
        ingestionId: "01950000-0000-7000-8000-000000000010",
    };

    it("produces a SourceRecord with correct domain", () => {
        const record = service.scoreSource(BASE_PARAMS);
        expect(record.domain).toBe("reuters.com");
    });

    it("truncates excerpt to 2000 chars", () => {
        const longExcerpt = "x".repeat(5000);
        const record = service.scoreSource({ ...BASE_PARAMS, excerpt: longExcerpt });
        expect(record.excerpt.length).toBe(2000);
    });

    it("produces credibilityScore of 0.82 for reuters.com", () => {
        const record = service.scoreSource(BASE_PARAMS);
        expect(record.credibilityScore).toBe(0.82);
    });

    it("produces corroborationScore of 0.67 for 2 overlapping sources", () => {
        const record = service.scoreSource(BASE_PARAMS);
        expect(record.corroborationScore).toBeCloseTo(0.667, 2);
    });
});

describe("SourceScoringService.scoreSourceBatch", () => {
    const service = new SourceScoringService();

    it("returns the same count of records as inputs", () => {
        const params = [
            { url: "https://reuters.com/a", excerpt: "A", ingestionId: "i-1" },
            { url: "https://bbc.com/b", excerpt: "B", ingestionId: "i-1" },
            { url: "https://ft.com/c", excerpt: "C", ingestionId: "i-1" },
        ];
        const records = service.scoreSourceBatch(params);
        expect(records).toHaveLength(3);
    });

    it("each record's corroboration score reflects batch size (total - 1)", () => {
        const params = [
            { url: "https://reuters.com/a", excerpt: "A", ingestionId: "i-1" },
            { url: "https://bbc.com/b", excerpt: "B", ingestionId: "i-1" },
        ];
        const records = service.scoreSourceBatch(params);
        // overlappingSourceCount = 1 for a batch of 2 → score = 1/3
        for (const r of records) {
            expect(r.corroborationScore).toBeCloseTo(0.333, 2);
        }
    });
});

// ---------------------------------------------------------------------------
// Method version constant
// ---------------------------------------------------------------------------

describe("SOURCE_SCORER_METHOD_VERSION", () => {
    it("is a non-empty string (version is pinned)", () => {
        expect(SOURCE_SCORER_METHOD_VERSION).toBeTruthy();
        expect(typeof SOURCE_SCORER_METHOD_VERSION).toBe("string");
    });
});
