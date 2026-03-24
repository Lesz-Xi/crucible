import { describe, expect, it } from "vitest";
import { applyTemporalDecay, calculateTemporalWeight, extractPublicationYear } from "../temporal-decay";

describe("temporal-decay", () => {
  it("calculates half-life style decay", () => {
    const current = calculateTemporalWeight(2024, 2024);
    const tenYears = calculateTemporalWeight(2014, 2024);
    const fiftyYears = calculateTemporalWeight(1974, 2024);

    expect(current).toBeCloseTo(1, 4);
    expect(tenYears).toBeCloseTo(0.5, 2);
    expect(fiftyYears).toBeCloseTo(0.03125, 3);
  });

  it("extracts publication year", () => {
    expect(extractPublicationYear("Smith et al. (2019)")).toBe(2019);
    expect(extractPublicationYear("Invalid string")).toBeNull();
  });

  it("applies temporal decay to prior art", () => {
    const weighted = applyTemporalDecay([
      { source: "web", title: "Old paper (2000)", similarity: 80, differentiator: "x" },
    ]);
    expect(weighted[0].temporalWeight).toBeLessThan(1);
    expect(weighted[0].adjustedSimilarity).toBeLessThan(80);
  });
});
