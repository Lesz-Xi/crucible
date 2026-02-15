import { describe, expect, it } from "vitest";
import { ConstraintInjector } from "../constraint-injector";
import type { SCMContext } from "../scm-retrieval";

const mockContext = {
  primaryScm: {
    getConstraints: () => ["Tier1: Causal order must be preserved."],
  },
  tier2: {
    getConstraints: () => ["Tier2: Educational intervention follows prerequisite mastery."],
  },
} as unknown as SCMContext;

describe("ConstraintInjector with conversation context", () => {
  it("injects conversation block and explicit continuity instruction", () => {
    const injector = new ConstraintInjector();
    const { systemPrompt } = injector.inject(
      "What should I do to overcome this inertia?",
      mockContext,
      "",
      {
        conversationContext:
          "User (T1): Coding distractions are pulling me away from school.\nAssistant (T1): Your reward loop is immediate in coding.",
        explicitCarryover: true,
        ambiguityPolicy: "ask_one_clarifier",
        ambiguousReference: false,
      }
    );

    expect(systemPrompt).toContain("**CONVERSATION CONTEXT (Chronological):**");
    expect(systemPrompt).toContain("User (T1): Coding distractions are pulling me away from school.");
    expect(systemPrompt).toContain("first sentence must explicitly anchor");
    expect(systemPrompt).toContain("AMBIGUITY POLICY");
  });

  it("injects one-clarifier stop rule when ambiguous referential follow-up is flagged", () => {
    const injector = new ConstraintInjector();
    const { systemPrompt } = injector.inject("How do I overcome this?", mockContext, "", {
      ambiguityPolicy: "ask_one_clarifier",
      ambiguousReference: true,
    });

    expect(systemPrompt).toContain("AMBIGUOUS FOLLOW-UP DETECTED");
    expect(systemPrompt).toContain("ask exactly one short clarifying question and stop");
  });
});
