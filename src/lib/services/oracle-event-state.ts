export interface OracleEventResolutionInput {
  eventType: string;
  data: any;
  currentOracleMode: boolean;
}

/**
 * Oracle mode state is owned by backend Oracle events.
 * Density level alone must not toggle Oracle mode.
 */
export function resolveOracleModeFromEvent({
  eventType,
  data,
  currentOracleMode,
}: OracleEventResolutionInput): boolean {
  if (eventType === "oracle_mode_change" && typeof data?.active === "boolean") {
    return data.active;
  }

  if (eventType === "bayesian_oracle_update" && typeof data?.isActive === "boolean") {
    return data.isActive;
  }

  return currentOracleMode;
}
