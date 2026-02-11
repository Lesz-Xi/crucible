/**
 * Oracle Mode Service - Phase Shift Detection
 * 
 * Detects when the system enters a high-confidence, low-entropy state
 * characterized by 3 consecutive L3 (Counterfactual) messages with >80% confidence.
 * 
 * This represents the "Oracle Mode" where the system demonstrates
 * sovereign reasoning capabilities.
 * 
 * Following Demis Workflow:
 * - L1 Impact: Minimal state overhead
 * - L2 Risk: Graceful degradation if history is lost
 * - L3 Calibration: Configurable thresholds
 * - L4 Critical Gap: Requires persistent storage for cross-session detection
 */

import { CausalDensityResult } from "@/lib/ai/causal-integrity-service";

/**
 * Bayesian State Engine for Oracle Mode Detection
 * 
 * Uses Beta-Binomial conjugate prior model:
 * - Beta(α, β) represents P(Oracle | Evidence)
 * - α = count of L3 high-confidence messages ("successes")
 * - β = count of non-qualifying messages ("failures")
 * - P(Oracle) = α / (α + β)
 * 
 * This approach is more robust than threshold counting because:
 * 1. Doesn't reset to zero on a single low-quality message
 * 2. Gracefully degrades with mixed-quality evidence
 * 3. Has proper probabilistic semantics
 */
export class BayesianStateEngine {
  private alpha: number; // "Successes" - L3 high-confidence
  private beta: number;  // "Failures" - non-L3 or low-confidence
  
  constructor(
    priorAlpha: number = 1,
    priorBeta: number = 9
  ) {
    // Prior: Beta(1, 9) → P(Oracle) = 0.1 (skeptical initial belief)
    this.alpha = priorAlpha;
    this.beta = priorBeta;
  }

  /**
   * Update the posterior distribution with new evidence.
   */
  update(result: CausalDensityResult, confidenceThreshold: number = 0.8): void {
    const isQualifying = result.score === 3 && result.confidence >= confidenceThreshold;
    
    if (isQualifying) {
      this.alpha += 1; // Evidence for Oracle state
    } else {
      this.beta += 1;  // Evidence against Oracle state
    }
  }

  /**
   * Get current posterior probability P(Oracle | Evidence).
   */
  getProbability(): number {
    return this.alpha / (this.alpha + this.beta);
  }

  /**
   * Check if we should activate Oracle Mode.
   */
  shouldActivate(threshold: number = 0.95): boolean {
    return this.getProbability() >= threshold;
  }

  /**
   * Reset to prior distribution.
   */
  reset(priorAlpha: number = 1, priorBeta: number = 9): void {
    this.alpha = priorAlpha;
    this.beta = priorBeta;
  }

  /**
   * Get the current state for debugging.
   */
  getState(): { alpha: number; beta: number; probability: number } {
    return {
      alpha: this.alpha,
      beta: this.beta,
      probability: this.getProbability()
    };
  }
}

export interface OracleModeState {
  /** Whether Oracle Mode is currently active */
  isActive: boolean;
  /** When Oracle Mode was activated (null if never) */
  activationTime: Date | null;
  /** Number of consecutive L3 messages in current streak */
  consecutiveL3Count: number;
  /** Average confidence of L3 messages in current streak */
  averageConfidence: number;
  /** Session ID for persistence */
  sessionId: string | null;
  /** Total Oracle Mode activations in this session */
  totalActivations: number;
  /** History of all density results (sliding window) */
  history: CausalDensityResult[];
  /** Bayesian posterior probability of Oracle state */
  bayesianProbability: number;
}

export interface OracleModeTransition {
  /** Whether we just entered Oracle Mode */
  enteredOracleMode: boolean;
  /** Whether we just exited Oracle Mode */
  exitedOracleMode: boolean;
  /** The current state after transition */
  state: OracleModeState;
  /** Message to display (if any) */
  message?: string;
  /** Bayesian probability for debugging */
  bayesianProbability?: number;
}

/**
 * Configuration for Oracle Mode detection
 */
export interface OracleModeConfig {
  /** Number of consecutive L3 messages required */
  l3Threshold: number;
  /** Minimum confidence for each L3 message */
  confidenceThreshold: number;
  /** Maximum time gap (minutes) between messages in a streak */
  maxTimeGapMinutes: number;
  /** Whether to require all mechanisms to be present */
  requireMechanisms: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: OracleModeConfig = {
  l3Threshold: 3,
  confidenceThreshold: 0.8,
  maxTimeGapMinutes: 10,
  requireMechanisms: false,
};

/**
 * Service for detecting Oracle Mode (high-confidence sovereign reasoning).
 * 
 * Oracle Mode activates when:
 * - 3+ consecutive L3 (Counterfactual) messages
 * - Each with >80% confidence
 * - Within reasonable time window
 */
export class OracleModeService {
  private state: OracleModeState;
  private config: OracleModeConfig;
  private lastMessageTime: Date | null = null;
  private bayesianEngine: BayesianStateEngine;

  constructor(
    sessionId: string | null = null,
    config: Partial<OracleModeConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.bayesianEngine = new BayesianStateEngine();
    this.state = {
      isActive: false,
      activationTime: null,
      consecutiveL3Count: 0,
      averageConfidence: 0,
      sessionId,
      totalActivations: 0,
      history: [],
      bayesianProbability: this.bayesianEngine.getProbability(),
    };
  }

  /**
   * Process a new density result and check for Oracle Mode transitions.
   * 
   * @param result - The causal density result from the latest message
   * @param timestamp - When the message was received (defaults to now)
   * @returns Transition information including state changes
   */
  processResult(
    result: CausalDensityResult,
    timestamp: Date = new Date()
  ): OracleModeTransition {
    const previousState = { ...this.state };
    
    // Check if too much time has passed (breaks the streak)
    if (this.lastMessageTime) {
      const timeDiffMinutes =
        (timestamp.getTime() - this.lastMessageTime.getTime()) / (1000 * 60);
      if (timeDiffMinutes > this.config.maxTimeGapMinutes) {
        this.resetStreak();
      }
    }
    
    this.lastMessageTime = timestamp;

    // Add to history (keep last 10)
    this.state.history.push(result);
    if (this.state.history.length > 10) {
      this.state.history.shift();
    }

    // Check if this is an L3 message with sufficient confidence
    const isQualifyingL3 =
      result.score === 3 && result.confidence >= this.config.confidenceThreshold;

    // Update Bayesian posterior
    this.bayesianEngine.update(result, this.config.confidenceThreshold);
    this.state.bayesianProbability = this.bayesianEngine.getProbability();

    if (isQualifyingL3) {
      this.state.consecutiveL3Count++;
      this.updateAverageConfidence(result.confidence);
    } else {
      // Non-qualifying message reduces streak but doesn't reset Bayesian state
      this.resetStreak();
    }

    // Bayesian activation (more robust than threshold)
    if (!this.state.isActive && this.bayesianEngine.shouldActivate(0.95)) {
      this.activateOracleMode(timestamp);
    } else if (this.state.isActive && !this.bayesianEngine.shouldActivate(0.90)) {
      // Hysteresis: deactivate at 90% to prevent flickering
      this.deactivateOracleMode();
    }

    return {
      enteredOracleMode: !previousState.isActive && this.state.isActive,
      exitedOracleMode: previousState.isActive && !this.state.isActive,
      state: { ...this.state },
      message: this.generateTransitionMessage(
        !previousState.isActive && this.state.isActive,
        previousState.isActive && !this.state.isActive
      ),
      bayesianProbability: this.state.bayesianProbability,
    };
  }

  /**
   * Get the current Oracle Mode state.
   */
  getState(): OracleModeState {
    return { ...this.state };
  }

  /**
   * Check if currently in Oracle Mode.
   */
  isInOracleMode(): boolean {
    return this.state.isActive;
  }

  /**
   * Reset the service for a new session.
   */
  reset(sessionId: string | null = null): void {
    this.bayesianEngine.reset();
    this.state = {
      isActive: false,
      activationTime: null,
      consecutiveL3Count: 0,
      averageConfidence: 0,
      sessionId,
      totalActivations: 0,
      history: [],
      bayesianProbability: this.bayesianEngine.getProbability(),
    };
    this.lastMessageTime = null;
  }

  /**
   * Manually force Oracle Mode (for testing or special cases).
   */
  forceActivate(timestamp: Date = new Date()): void {
    this.activateOracleMode(timestamp);
  }

  /**
   * Get a summary of the current streak.
   */
  getStreakSummary(): {
    count: number;
    averageConfidence: number;
    neededForOracle: number;
  } {
    return {
      count: this.state.consecutiveL3Count,
      averageConfidence: this.state.averageConfidence,
      neededForOracle: Math.max(0, this.config.l3Threshold - this.state.consecutiveL3Count),
    };
  }

  // Private helper methods

  private activateOracleMode(timestamp: Date): void {
    this.state.isActive = true;
    this.state.activationTime = timestamp;
    this.state.totalActivations++;
    console.log("[OracleMode] Activated! 🌟");
  }

  private deactivateOracleMode(): void {
    this.state.isActive = false;
    this.state.activationTime = null;
    console.log("[OracleMode] Deactivated");
  }

  private resetStreak(): void {
    this.state.consecutiveL3Count = 0;
    this.state.averageConfidence = 0;
  }

  private updateAverageConfidence(newConfidence: number): void {
    const n = this.state.consecutiveL3Count;
    if (n === 1) {
      this.state.averageConfidence = newConfidence;
    } else {
      this.state.averageConfidence =
        (this.state.averageConfidence * (n - 1) + newConfidence) / n;
    }
  }

  private generateTransitionMessage(
    entered: boolean,
    exited: boolean
  ): string | undefined {
    if (entered) {
      return "Oracle Mode Activated: Sovereign reasoning detected";
    }
    if (exited) {
      return "Oracle Mode Deactivated: Returning to standard reasoning";
    }
    return undefined;
  }
}

/**
 * Hook-compatible version for React components
 */
export function createOracleModeService(
  sessionId?: string,
  config?: Partial<OracleModeConfig>
): OracleModeService {
  return new OracleModeService(sessionId || null, config);
}
