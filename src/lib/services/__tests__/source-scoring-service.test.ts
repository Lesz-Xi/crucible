import { describe, expect, it, vi } from "vitest";
import {
  computeClaimConfidence,
  computeCredibilityScore,
  computeRecencyScore,
  extractDomain,
  SourceScoringService,
} from "@/lib/services/source-scoring-service";

describe("SourceScoringService", () => {
  it("uses tier scores for known domains and default for unknown domains", () => {
    expect(computeCredibilityScore("reuters.com")).toBeGreaterThan(0.7);
    expect(computeCredibilityScore("totally-unknown.example")).toBe(0.3);
  });

  it("computes deterministic recency score for fixed time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T00:00:00.000Z"));

    const score = computeRecencyScore("2026-03-04T00:00:00.000Z");
    expect(score).toBeGreaterThan(0.99);

    vi.useRealTimers();
  });

  it("extracts domain from URL safely", () => {
    expect(extractDomain("https://www.bbc.com/news")).toBe("www.bbc.com");
    expect(extractDomain("not-a-valid-url")).toBe("not-a-valid-url");
  });

  it("computes deterministic claim confidence", () => {
    const a = computeClaimConfidence({
      credibilityScore: 0.8,
      corroborationScore: 0.6,
      evidenceTier: "A",
    });
    const b = computeClaimConfidence({
      credibilityScore: 0.8,
      corroborationScore: 0.6,
      evidenceTier: "A",
    });

    expect(a).toBe(b);
    expect(a).toBeGreaterThan(0.7);
  });

  it("scores a source batch with stable numeric outputs", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T00:00:00.000Z"));

    const service = SourceScoringService.getInstance();
    const batch = service.scoreSourceBatch([
      {
        url: "https://reuters.com/story",
        publishedAt: "2026-03-01T00:00:00.000Z",
        excerpt: "A".repeat(50),
        ingestionId: "ing-1",
      },
      {
        url: "https://example.com/post",
        publishedAt: "2025-12-01T00:00:00.000Z",
        excerpt: "B".repeat(50),
        ingestionId: "ing-1",
      },
    ]);

    expect(batch).toHaveLength(2);
    expect(batch[0].credibilityScore).toBeGreaterThan(batch[1].credibilityScore);
    expect(batch[0].corroborationScore).toBeGreaterThan(0);

    vi.useRealTimers();
  });
});
