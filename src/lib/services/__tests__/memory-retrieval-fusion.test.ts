import { describe, expect, it } from "vitest";
import { fuseMemoryRetrieval } from "../memory-retrieval-fusion";

describe("fuseMemoryRetrieval", () => {
  it("scores and ranks candidates with causal priority", () => {
    const result = fuseMemoryRetrieval(
      "counterfactual confounder",
      [
        { id: "l1", content: "association observation text", causalLevel: "L1", vectorScore: 0.4 },
        { id: "l3", content: "counterfactual confounder intervention", causalLevel: "L3", vectorScore: 0.7 },
      ],
      { topK: 2 },
    );

    expect(result.topK[0]?.id).toBe("l3");
    expect(result.topK[0]?.finalScore).toBeGreaterThan(result.topK[1]?.finalScore ?? 0);
  });
});
