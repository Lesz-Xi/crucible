import { describe, expect, it } from "vitest";
import { evaluateFactTrigger } from "../chat-fact-trigger";

describe("evaluateFactTrigger", () => {
  it("does not promote imperative lead token as an entity", () => {
    const result = evaluateFactTrigger(
      "Do a web search about this statement: Alexander was raised by private tutors"
    );

    expect(result.normalizedEntities).not.toContain("Do");
    expect(result.normalizedEntities).toContain("Alexander");
    expect(result.shouldSearch).toBe(true);
  });

  it("allows short entities from allowlist", () => {
    const result = evaluateFactTrigger("What is the latest in AI alignment?");
    expect(result.normalizedEntities).toContain("AI");
  });
});
