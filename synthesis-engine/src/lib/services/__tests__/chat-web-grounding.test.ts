import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assessFactualConfidence, buildQueries, searchChatGrounding, searchChatGroundingDetailed } from "../chat-web-grounding";

describe("chat-web-grounding", () => {
  const originalApiKey = process.env.SERPER_API_KEY;

  beforeEach(() => {
    process.env.SERPER_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env.SERPER_API_KEY = originalApiKey;
    vi.restoreAllMocks();
  });

  it("builds topic-preserving queries without founder/creator expansion", () => {
    const queries = buildQueries(
      "Do a web search about Alexander's tutors",
      ["Alexander", "Do"]
    );

    expect(queries.some((q) => q.includes("founder") || q.includes("creator"))).toBe(false);
    expect(queries.some((q) => q.includes("Alexander history") || q.includes("Alexander biography"))).toBe(true);
  });

  it("filters out low-topicality results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          organic: [
            {
              title: "Chris Do - LinkedIn",
              link: "https://www.linkedin.com/in/thechrisdo",
              snippet: "Founder and CEO at The Futur",
            },
            {
              title: "Alexander the Great - Education and Tutors",
              link: "https://example.org/alexander-education",
              snippet: "Aristotle tutored Alexander in Macedon.",
            },
          ],
        }),
      })
    );

    const results = await searchChatGrounding(
      "Do a web search about this statement: Alexander was raised by private tutors",
      ["Alexander"],
      { topK: 5, timeoutMs: 1000 }
    );

    expect(results.length).toBe(1);
    expect(results[0]?.title).toContain("Alexander the Great");
  });

  it("caps confidence when topical alignment is weak", () => {
    const confidence = assessFactualConfidence(
      "Alexander the Great tutors",
      [
        {
          title: "Chris Do - LinkedIn",
          link: "https://www.linkedin.com/in/thechrisdo",
          snippet: "Founder and CEO at The Futur",
          domain: "linkedin.com",
          rank: 1,
        },
        {
          title: "Do Kwon - Wikipedia",
          link: "https://en.wikipedia.org/wiki/Do_Kwon",
          snippet: "Entrepreneur",
          domain: "wikipedia.org",
          rank: 2,
        },
      ],
      ["Alexander"]
    );

    expect(confidence.level === "insufficient" || confidence.level === "low").toBe(true);
    expect(confidence.score).toBeLessThan(0.35);
    expect(confidence.rationale).toContain("avg_topicality=");
  });

  it("returns grounding provenance diagnostics", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          organic: [
            {
              title: "Alexander the Great - Education and Tutors",
              link: "https://example.org/alexander-education",
              snippet: "Aristotle tutored Alexander in Macedon.",
            },
            {
              title: "Chris Do - LinkedIn",
              link: "https://www.linkedin.com/in/thechrisdo",
              snippet: "Founder and CEO at The Futur",
            },
          ],
        }),
      })
    );

    const result = await searchChatGroundingDetailed(
      "Search for information about Alexander the Great tutors",
      ["Alexander"],
      { topK: 5, timeoutMs: 1000 }
    );

    expect(result.diagnostics.generatedQueries.length).toBeGreaterThan(0);
    expect(result.diagnostics.rawCandidateCount).toBeGreaterThan(0);
    expect(result.diagnostics.acceptedCount).toBe(result.sources.length);
    expect(result.diagnostics.filteredOutReasons.lowTopicality).toBeGreaterThanOrEqual(1);
  });
});
