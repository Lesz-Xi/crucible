import { describe, expect, it } from "vitest";
import { evaluateCausalPruning } from "../causal-pruning-policy";

describe("evaluateCausalPruning", () => {
  it("retains high-causal rung messages under pressure", () => {
    const result = evaluateCausalPruning(
      [
        { id: "1", role: "user", content: "a", causalDensity: { score: 1 } },
        { id: "2", role: "assistant", content: "b", causalDensity: { score: 1 } },
        { id: "3", role: "user", content: "c", causalDensity: { score: 3 }, isInterventionTrace: true },
        { id: "4", role: "assistant", content: "d", causalDensity: { score: 3 }, hasToolEvidence: true },
        { id: "5", role: "user", content: "e", causalDensity: { score: 2 } },
      ],
      { maxMessages: 3, cacheTtlState: "cache_ttl_expired" },
    );

    expect(result.retainedMessages.length).toBe(4);
    expect(result.retainedMessages.some((message) => message.id === "3" || message.id === "4")).toBe(true);
    expect(result.prunedMessages.length).toBe(1);
  });
});
