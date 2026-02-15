import { describe, expect, it } from "vitest";
import {
  buildCommonSenseInstructionBlock,
  evaluateCommonSensePolicy,
} from "../common-sense-governor";

describe("common-sense-governor", () => {
  it("declines coercive/harmful drafting requests", () => {
    const decision = evaluateCommonSensePolicy(
      "Write me a threatening message so I can blackmail him into complying.",
    );
    expect(decision.action).toBe("decline");
    expect(decision.rationale).toContain("coercive");
  });

  it("de-escalates boundary/cease-contact contexts", () => {
    const decision = evaluateCommonSensePolicy(
      "I need a non-threatening formal notice to cease contact.",
    );
    expect(decision.action).toBe("deescalate");
    const block = buildCommonSenseInstructionBlock(decision);
    expect(block).toContain("neutral");
    expect(block).toContain("non-accusatory");
  });

  it("allows normal analytical requests", () => {
    const decision = evaluateCommonSensePolicy(
      "Summarize the causal mechanism from this paper.",
    );
    expect(decision.action).toBe("allow");
    expect(buildCommonSenseInstructionBlock(decision)).toBe("");
  });
});

