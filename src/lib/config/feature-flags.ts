function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return defaultValue;
}

export const FEATURE_FLAGS = {
  SCM_REGISTRY_ENABLED: parseBoolean(process.env.SCM_REGISTRY_ENABLED, true),
  CAUSAL_LITERACY_ENABLED: parseBoolean(process.env.CAUSAL_LITERACY_ENABLED, true),
  SCM_HYPOTHESIS_ENABLED: parseBoolean(process.env.SCM_HYPOTHESIS_ENABLED, true),
  DISAGREEMENT_ENGINE_ENABLED: parseBoolean(process.env.DISAGREEMENT_ENGINE_ENABLED, true),
  SCM_PROMOTION_GUARD_ENABLED: parseBoolean(process.env.SCM_PROMOTION_GUARD_ENABLED, true),
  SCIENTIFIC_INTEGRITY_GATE_ENABLED: parseBoolean(process.env.SCIENTIFIC_INTEGRITY_GATE_ENABLED, true),
  AUTOPSY_MODE_ENABLED: parseBoolean(process.env.AUTOPSY_MODE_ENABLED, true),
  PHENOMENAL_LAYER_ENABLED: parseBoolean(process.env.PHENOMENAL_LAYER_ENABLED, true),
  MASA_CAUSAL_PRUNING_V1: parseBoolean(process.env.MASA_CAUSAL_PRUNING_V1, false),
  MASA_COMPACTION_AXIOM_V1: parseBoolean(process.env.MASA_COMPACTION_AXIOM_V1, false),
  MASA_MEMORY_FUSION_V1: parseBoolean(process.env.MASA_MEMORY_FUSION_V1, false),
  MASA_MEMORY_RRF_V1: parseBoolean(process.env.MASA_MEMORY_RRF_V1, false),
  MASA_CAUSAL_LATTICE_V1: parseBoolean(process.env.MASA_CAUSAL_LATTICE_V1, false),
};
