import { describe, expect, it } from "vitest";
import { buildModelProvenanceDisplayState } from "../model-provenance-display";

describe("buildModelProvenanceDisplayState", () => {
  it("shows claim lineage when a claim id exists", () => {
    expect(
      buildModelProvenanceDisplayState({
        modelKey: "claude-sonnet-4",
        latestClaimId: "claim-123",
      }),
    ).toEqual({
      title: "claude-sonnet-4",
      text: "Claim lineage recorded for claim-123.",
    });
  });

  it("separates runtime model metadata from verified provenance", () => {
    expect(
      buildModelProvenanceDisplayState({
        modelKey: "claude-sonnet-4",
        latestClaimId: null,
      }),
    ).toEqual({
      title: "claude-sonnet-4",
      text: "Runtime model metadata was emitted for this run. Verified claim lineage is unavailable.",
    });
  });

  it("stays fully unavailable when no model metadata exists", () => {
    expect(
      buildModelProvenanceDisplayState({
        modelKey: "default",
        latestClaimId: null,
      }),
    ).toEqual({
      title: "unavailable",
      text: "No verified model provenance was emitted for this run.",
    });
  });
});
