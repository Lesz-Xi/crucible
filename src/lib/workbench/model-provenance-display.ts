export interface ModelProvenanceDisplayInput {
  modelKey?: string | null;
  latestClaimId?: string | null;
}

export interface ModelProvenanceDisplayState {
  title: string;
  text: string;
}

function isRealModelKey(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0 && value !== "default";
}

export function buildModelProvenanceDisplayState(
  input: ModelProvenanceDisplayInput,
): ModelProvenanceDisplayState {
  const modelKey = isRealModelKey(input.modelKey) ? input.modelKey : null;

  if (input.latestClaimId) {
    return {
      title: modelKey || "unavailable",
      text: `Claim lineage recorded for ${input.latestClaimId}.`,
    };
  }

  if (modelKey) {
    return {
      title: modelKey,
      text: "Runtime model metadata was emitted for this run. Verified claim lineage is unavailable.",
    };
  }

  return {
    title: "unavailable",
    text: "No verified model provenance was emitted for this run.",
  };
}
