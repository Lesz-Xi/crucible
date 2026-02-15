import { describe, expect, it } from "vitest";
import { resolveOracleModeFromEvent } from "../oracle-event-state";

describe("resolveOracleModeFromEvent", () => {
  it("applies oracle_mode_change event", () => {
    const next = resolveOracleModeFromEvent({
      eventType: "oracle_mode_change",
      data: { active: true },
      currentOracleMode: false,
    });
    expect(next).toBe(true);
  });

  it("applies bayesian_oracle_update event", () => {
    const next = resolveOracleModeFromEvent({
      eventType: "bayesian_oracle_update",
      data: { isActive: false },
      currentOracleMode: true,
    });
    expect(next).toBe(false);
  });

  it("ignores density events without explicit oracle state", () => {
    const next = resolveOracleModeFromEvent({
      eventType: "causal_density_update",
      data: { score: 2 },
      currentOracleMode: false,
    });
    expect(next).toBe(false);
  });
});
