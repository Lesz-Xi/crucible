import { describe, expect, it } from "vitest";
import { StatisticalValidator } from "../statistical-validator";
import { NovelIdea } from "@/types";

const validator = new StatisticalValidator();

const source = (quality: "strong" | "moderate" | "weak" | "anecdotal") => ({
  mainThesis: "t",
  keyArguments: ["a"],
  entities: [],
  evidenceQuality: quality,
});

describe("statistical-validator", () => {
  it("returns stronger evidence for high-confidence idea", () => {
    const idea: NovelIdea = {
      id: "1",
      thesis: "A",
      description: "D",
      bridgedConcepts: ["x", "y", "z"],
      confidence: 90,
      noveltyAssessment: "N",
    };
    const metrics = validator.validateHypothesis(idea, [
      source("strong"),
      source("strong"),
      source("strong"),
      source("strong"),
      source("strong"),
    ]);
    expect(metrics.bayesFactor).toBeGreaterThan(3);
    expect(metrics.pValue).toBeLessThan(0.1);
  });

  it("handles null-like confidence safely", () => {
    const idea: NovelIdea = {
      id: "2",
      thesis: "A",
      description: "D",
      bridgedConcepts: ["x"],
      confidence: Number.NaN,
      noveltyAssessment: "N",
    };
    const metrics = validator.validateHypothesis(idea, [source("weak")]);
    expect(metrics.pValue).toBeGreaterThanOrEqual(0);
    expect(metrics.pValue).toBeLessThanOrEqual(1);
  });
});
