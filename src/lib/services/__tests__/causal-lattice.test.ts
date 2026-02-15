import { describe, expect, it } from "vitest";
import { CausalLatticeService } from "../causal-lattice";

describe("CausalLatticeService", () => {
  it("rejects invalid broadcast policy inputs", () => {
    const service = new CausalLatticeService();
    const result = service.validateBroadcastPolicy({
      originSessionId: "",
      targetSessionId: "target",
      userId: "user",
      domain: "alignment",
      confidenceThreshold: 0.75,
    });

    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("missing_required_context");
  });

  it("accepts valid cross-session broadcast policy", () => {
    const service = new CausalLatticeService();
    const result = service.validateBroadcastPolicy({
      originSessionId: "origin",
      targetSessionId: "target",
      userId: "user",
      domain: "alignment",
      confidenceThreshold: 0.75,
    });

    expect(result.accepted).toBe(true);
    expect(result.reason).toBe("policy_pass");
  });
});
