import { describe, expect, it } from "vitest";
import { CausalIntegrityService } from "@/lib/ai/causal-integrity-service";

describe("CausalIntegrityService L1/L2/L3 boundaries", () => {
  const service = new CausalIntegrityService();

  it("classifies pure association as L1", () => {
    const result = service.evaluate("Sleep is associated with better grades and is related to focus.");
    expect(result.score).toBe(1);
    expect(result.label).toBe("Association");
  });

  it("classifies intervention language with structure as L2", () => {
    const result = service.evaluate(
      "If we intervene by fixing bedtime to 11pm and holding caffeine constant, study retention improves because executive control recovers."
    );
    expect(result.score).toBe(2);
    expect(result.label).toBe("Intervention");
  });

  it("classifies counterfactual reasoning with chain as L3", () => {
    const result = service.evaluate(
      "If we had slept 8 hours instead of 4, we would have sustained attention because the counterfactual chain is sleep debt -> impulse control -> study failure."
    );
    expect(result.score).toBe(3);
    expect(result.label).toBe("Counterfactual");
  });

  it("does not auto-upgrade poetic narrative without operators", () => {
    const result = service.evaluate(
      "Like water the mind flows toward bright rewards and drifts from distant duties."
    );
    expect(result.score).toBe(1);
  });

  it("demotes contradictory/no-structure counterfactual mentions", () => {
    const result = service.evaluate(
      "This is counterfactual talk, but there is no causal chain and no relationship here."
    );
    expect(result.score).toBe(1);
  });
});
