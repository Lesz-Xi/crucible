import { describe, expect, it } from "vitest";
import { buildConversationContext } from "../conversation-context";

describe("buildConversationContext", () => {
  it("keeps full chronological context with explicit role labels", () => {
    const currentQuestion = "What should I do to overcome this inertia?";
    const result = buildConversationContext(
      [
        {
          role: "user",
          content:
            "When I get distracted of vibe coding it makes it hard to get back to my studies. Why is this?",
        },
        {
          role: "assistant",
          content: "Your attention is locked in a short reward loop from coding momentum.",
        },
        { role: "user", content: currentQuestion },
      ],
      currentQuestion
    );

    expect(result.includedTurns).toBe(3);
    expect(result.truncatedTurns).toBe(0);
    expect(result.promptContext).toContain("User (T1): When I get distracted of vibe coding");
    expect(result.promptContext).toContain("Assistant (T1): Your attention is locked");
    expect(result.promptContext).toContain("User (T2): What should I do to overcome this inertia?");
  });

  it("deduplicates current question when it is already the last user turn", () => {
    const result = buildConversationContext(
      [{ role: "user", content: "What should I do to overcome this inertia?" }],
      "What should I do to overcome this inertia?"
    );

    const matchCount = (result.promptContext.match(/User \(T1\): What should I do to overcome this inertia\?/g) || [])
      .length;
    expect(result.includedTurns).toBe(1);
    expect(matchCount).toBe(1);
  });

  it("truncates oldest turns first when over max context size", () => {
    const result = buildConversationContext(
      [
        { role: "user", content: "oldest turn with long context A A A A A A A A A A A A A A A A A A A" },
        { role: "assistant", content: "assistant reply with long context B B B B B B B B B B B B B B B B" },
        { role: "user", content: "newer context with useful details C C C C C C C C C C C C C C C C C" },
      ],
      "newer context with useful details C C C C C C C C C C C C C C C C C",
      { maxContextChars: 120 }
    );

    expect(result.truncatedTurns).toBeGreaterThan(0);
    expect(result.promptContext).not.toContain("oldest turn with long context");
  });

  it("flags ambiguous referential follow-up when prior context is weak", () => {
    const result = buildConversationContext([], "How do I overcome this?");

    expect(result.hasPriorContext).toBe(false);
    expect(result.ambiguousReference).toBe(true);
  });
});
