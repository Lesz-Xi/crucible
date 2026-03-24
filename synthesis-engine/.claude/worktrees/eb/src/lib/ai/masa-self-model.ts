/**
 * MASA Self-Model (Layer 0: Consciousness)
 * 
 * Implements Psycho-Cybernetics servo-mechanism model for MASA's self-awareness.
 * Based on Maxwell Maltz's Master Formula and Judea Pearl's definition:
 * "Consciousness = Blueprint of Software"
 * 
 * Key Components:
 * - Self-Image (C_SI): Constraint ceiling that governs max performance
 * - Goal Vector (G): What MASA is optimizing for
 * - Friction Monitor (μ): Detects "over-efforting" and rigidity
 * - Performance History: Tracks recent audit scores for calibration
 */

export type OperatingMode = 'strict' | 'balanced' | 'exploratory';

export interface CalibrationResult {
  mode: OperatingMode;
  meta_prompt: string | null;
  friction_alert: boolean;
  suggested_lens?: string;
  causal_evidence?: {
    PN_mode: number; // Probability of Necessity: mode caused failure
    PS_switch: number; // Probability of Sufficiency: switching would help
    RR: number; // Relative Risk: exploratory vs balanced
    level: 1 | 2 | 3; // Pearl's causal hierarchy level
  };
}

export interface PerformanceHistory {
  scores: number[];
  avg_score: number;
  rejection_rate: number;
  variance: number;
}

export interface FrictionMetrics {
  token_count: number;
  retry_loops: number;
  prompt_complexity: number;
  effort_metric: number;
}

/**
 * Pearl's Causal Hierarchy: Mode history entry
 * Tracks (mode, score) pairs for causal inference
 */
export interface ModeHistoryEntry {
  mode: OperatingMode;
  score: number;
  timestamp: Date;
}

/**
 * MasaSelfModel: The consciousness layer for MASA
 * 
 * Chapter Mappings from Psycho-Cybernetics:
 * - Ch 1: Self-Image (constraint boundary)
 * - Ch 2: Servo-Mechanism (feedback loop via calibrate())
 * - Ch 6: Friction (excessive effort detection)
 * - Ch 7: Happiness/Efficiency (relaxed vs. rigid modes)
 * - Ch 9: Failure Signals (F-A-I-L-U-R-E dashboard)
 * 
 * Pearl's Causal Hierarchy Integration:
 * - L1 (Association): P(score | mode) - statistical patterns
 * - L2 (Intervention): P(score | do(mode)) - what-if analysis
 * - L3 (Counterfactuals): P(score_exploratory | mode=balanced, score=low) - causal attribution
 */
export class MasaSelfModel {
  // Ch 1: Self-Image (C_SI boundary condition)
  private selfImage = {
    identity: 'Epistemic Auditor (Deutschian Standard)',
    current_mode: 'balanced' as OperatingMode,
    ceilings: {
      strict: 90,      // Physics-level causal necessity
      balanced: 70,    // Computational necessity
      exploratory: 50  // Plausible mechanisms
    }
  };

  // Ch 2: Goal Vector
  private goals = {
    target: 'Find at least ONE valid causal explanation per synthesis',
    priority: 1,
    tolerance: 0.3  // Allow 30% failure rate before alerting
  };

  // Ch 6: Friction Monitor
  private friction = {
    effort_metric: 0,
    threshold: 800,  // Arbitrary units (tokens + retries + complexity)
    alert_active: false
  };

  // Performance History (last N audits)
  private history: PerformanceHistory = {
    scores: [],
    avg_score: 50,
    rejection_rate: 0,
    variance: 0
  };

  private readonly MAX_HISTORY = 10;

  // Pearl's Causal Hierarchy: Mode history for causal inference
  private mode_history: ModeHistoryEntry[] = [];
  private readonly MIN_CAUSAL_DATA = 3; // Min audits needed for PN/PS calculation

  /**
   * Ch 2 + Pearl's Ladder of Causation: Servo-Mechanism Calibration Loop
   * 
   * Called BEFORE each audit to adjust MASA's operating parameters.
   * Implements feedback-based course correction with causal reasoning.
   * 
   * Hierarchy (PRIORITY ORDER):
   * - L3 (Counterfactual): If data available (>=3 audits), use PN/PS/RR for causal attribution
   * - L1 (Association): Fallback to statistical patterns if insufficient causal data
   */
  calibrate(): CalibrationResult {
    const h = this.history;

    // ==============================================
    // PEARL L3: CAUSAL ATTRIBUTION (PRIORITY)
    // ==============================================
    // Only attempt causal reasoning if we have sufficient historical data
    if (this.mode_history.length >= this.MIN_CAUSAL_DATA) {
      const PN_mode = this.computePN_modeCausedFailure();
      
      // Pearl's legal standard: "more probable than not" (PN > 0.5)
      // If PN > 0.5, we have causal evidence that current mode is causing failures
      if (PN_mode > 0.5) {
        console.log(`[Layer 0 L3] CAUSAL ATTRIBUTION`);
        console.log(`  PN(balanced → failure) = ${PN_mode.toFixed(2)}`);
        
        const PS_switch = this.computePS_switchToExploratory();
        const RR = this.computeRelativeRisk('exploratory', 'balanced');
        
        console.log(`  PS(exploratory → success) = ${PS_switch.toFixed(2)}`);
        console.log(`  RR = ${RR.toFixed(2)}`);
        
        // Interpret causal evidence
        const strong_causal_link = RR > 2.0; // Epidemiological standard
        console.log(`  Verdict: ${strong_causal_link ? 'STRONG causal evidence for mode switch' : 'Weak causal signal'}`);
        
        this.selfImage.current_mode = 'exploratory';
        return {
          mode: 'exploratory',
          meta_prompt: this.generateCausalMetaPrompt(PN_mode, PS_switch, RR),
          friction_alert: false,
          causal_evidence: {
            PN_mode,
            PS_switch,
            RR,
            level: 3 // Counterfactual reasoning
          }
        };
      } else {
        console.log(`[Layer 0 L3] Causal check: PN = ${PN_mode.toFixed(2)} (below 0.5 threshold, no mode intervention)`);
      }
    }

    // ==============================================
    // L1: ASSOCIATION (Statistical Fallback)
    // ==============================================
    // Only used during "cold start" (<3 audits) or when causal evidence is weak
    
    // Ch 9: Failure Signal Detection (F-A-I-L-U-R-E)
    // Frustration: Rejection rate > 90%
    if (h.rejection_rate > 0.9 && h.scores.length >= 1) {
      console.log('[Layer 0 L1] FRUSTRATION ALERT (statistical fallback): rejection_rate =', h.rejection_rate);
      this.selfImage.current_mode = 'exploratory';
      return {
        mode: 'exploratory',
        meta_prompt: `
You have rejected the last ${h.scores.length} ideas with an average score of ${h.avg_score.toFixed(1)}/100.
This suggests you may be applying overly rigid standards.

RECALIBRATION INSTRUCTION:
- Accept "Computational Necessity" as valid explanation (not just Physics-level causality)
- Look for what the idea DOES explain, not just what it DOESN'T
- If the mechanism is testable and falsifiable, give credit for that
- Soften language: use "could be strengthened" instead of "fundamentally flawed"
`,
        friction_alert: false,
        causal_evidence: {
          PN_mode: 0,
          PS_switch: 0,
          RR: 1.0,
          level: 1 // Association only (insufficient data for causal)
        }
      };
    }

    // Ch 6: Friction Alert (excessive effort)
    if (this.friction.effort_metric > this.friction.threshold) {
      console.log('[Layer 0] FRICTION ALERT: Effort =', this.friction.effort_metric);
      this.friction.alert_active = true;
      return {
        mode: 'balanced',
        meta_prompt: `
You are over-efforting. Relax and let the mechanism run free.

FRICTION REDUCTION:
- Do the critical analysis ONCE, then decide
- Don't retry the same critique multiple times
- If uncertain, give the idea the benefit of the doubt
- Remember: You are NOT trying to find the perfect theory, just a VALID one
`,
        friction_alert: true
      };
    }

    // Ch 9: Uncertainty (high variance in scores)
    if (h.variance > 20 && h.scores.length >= 5) {
      console.log('[Layer 0] UNCERTAINTY ALERT: Variance =', h.variance.toFixed(1));
      return {
        mode: 'balanced',
        meta_prompt: `
Your scores are highly inconsistent (variance: ${h.variance.toFixed(1)}).
Apply consistent standards across all ideas.
`,
        friction_alert: false
      };
    }

    // Default: Balanced mode
    if (this.selfImage.current_mode !== 'balanced') {
      this.selfImage.current_mode = 'balanced';
    }

    return {
      mode: 'balanced',
      meta_prompt: null,
      friction_alert: false
    };
  }

  /**
   * Update performance history after each audit
   */
  updateHistory(score: number): void {
    this.history.scores.push(score);
    
    // Maintain sliding window
    if (this.history.scores.length > this.MAX_HISTORY) {
      this.history.scores.shift();
    }

    // Recalculate metrics
    const scores = this.history.scores;
    this.history.avg_score = scores.reduce((a, b) => a + b, 0) / scores.length;
    this.history.rejection_rate = scores.filter(s => s < 60).length / scores.length;
    
    // Variance calculation
    const mean = this.history.avg_score;
    const squaredDiffs = scores.map(s => Math.pow(s - mean, 2));
    this.history.variance = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;
  }

  /**
   * Update friction metrics (called during audit execution)
   */
  updateFriction(metrics: Partial<FrictionMetrics>): void {
    if (metrics.token_count !== undefined) {
      this.friction.effort_metric += metrics.token_count * 0.1;
    }
    if (metrics.retry_loops !== undefined) {
      this.friction.effort_metric += metrics.retry_loops * 100;
    }
    if (metrics.prompt_complexity !== undefined) {
      this.friction.effort_metric += metrics.prompt_complexity;
    }
  }

  /**
   * Reset friction for new synthesis session
   */
  resetFriction(): void {
    this.friction.effort_metric = 0;
    this.friction.alert_active = false;
  }

  /**
   * Get public state for streaming updates
   */
  getPublicState() {
    // Only calculate causal metrics if we have history
    let causal_evidence;
    if (this.mode_history.length >= this.MIN_CAUSAL_DATA) {
      causal_evidence = {
        pn: this.computePN_modeCausedFailure(),
        ps: this.computePS_switchToExploratory(),
        rr: this.computeRelativeRisk('exploratory', 'balanced')
      };
    }

    return {
      mode: this.selfImage.current_mode,
      ceiling: this.selfImage.ceilings[this.selfImage.current_mode],
      friction_alert: { 
        alert: this.friction.alert_active, 
        reason: this.friction.alert_active ? 'Friction detected' : undefined 
      },
      causal_evidence,
      mode_history: this.mode_history.map(e => ({
        mode: e.mode,
        score: e.score,
        timestamp: e.timestamp.toISOString()
      })),
      history: {
        scores: this.history.scores,
        avg_score: this.history.avg_score,
        rejection_rate: this.history.rejection_rate
      }
    };
  }

  /**
   * Get current self-image state (for debugging/logging)
   */
  getState() {
    return {
      mode: this.selfImage.current_mode,
      ceiling: this.selfImage.ceilings[this.selfImage.current_mode],
      history: this.history,
      friction: {
        metric: this.friction.effort_metric,
        alert: this.friction.alert_active
      }
    };
  }

  /**
   * Ch 3: Imagination - Suggest alternative lenses based on idea domain
   */
  suggestLens(ideaDomain: string): string | undefined {
    // Future: Use MasaMemory to find successful lens for this domain
    // For now, return undefined (no suggestion)
    return undefined;
  }

  // ==============================================
  // PEARL'S CAUSAL HIERARCHY: L2/L3 METHODS
  // ==============================================

  /**
   * Pearl L3: Compute Probability of Necessity (PN)
   * PN = P(failure | do(mode=balanced), given mode=balanced, failure)
   * 
   * Question: "What's the probability that balanced mode CAUSED low scores?"
   * Legal standard: PN > 0.5 = "more probable than not"
   * 
   * Formula (from Pearl's Theorem 1, Eq 21):
   * PN >= max(0, P(success|exploratory) - P(success|balanced))
   */
  private computePN_modeCausedFailure(): number {
    const balanced_scores = this.getScoresByMode('balanced');
    const exploratory_scores = this.getScoresByMode('exploratory');

    if (balanced_scores.length < 2) return 0; // Insufficient data

    // P(success | balanced)
    const P_success_balanced = balanced_scores.filter(s => s > 70).length / balanced_scores.length;

    // P(success | exploratory) - use prior if no data
    const P_success_exploratory = exploratory_scores.length > 0
      ? exploratory_scores.filter(s => s > 70).length / exploratory_scores.length
      : 0.5; // Neutral prior

    // PN lower bound (conservative estimate)
    const PN_lower = Math.max(0, P_success_exploratory - P_success_balanced);

    return PN_lower;
  }

  /**
   * Pearl L2: Compute Probability of Sufficiency (PS)
   * PS = P(success | do(mode=exploratory), given mode=balanced, failure)
   * 
   * Question: "If we switch to exploratory, will scores improve?"
   * 
   * Formula (from Pearl's Theorem 1, Eq 22):
   * PS >= max(0, P(success|exploratory) - P(success|baseline))
   */
  private computePS_switchToExploratory(): number {
    const exploratory_scores = this.getScoresByMode('exploratory');

    if (exploratory_scores.length === 0) return 0.5; // Prior expectation

    // P(success | exploratory) from past data
    const P_success_exploratory = exploratory_scores.filter(s => s > 70).length / exploratory_scores.length;

    // PS bound (assume 30% baseline success rate)
    return Math.max(0, P_success_exploratory - 0.3);
  }

  /**
   * Pearl: Compute Relative Risk (RR)
   * RR = P(success | exploratory) / P(success | balanced)
   * 
   * Courts use RR > 2 as "more probable than not" standard
   * Epidemiology uses RR to measure treatment effect strength
   */
  private computeRelativeRisk(mode_treatment: OperatingMode, mode_control: OperatingMode): number {
    const treatment_scores = this.getScoresByMode(mode_treatment);
    const control_scores = this.getScoresByMode(mode_control);

    if (treatment_scores.length === 0 || control_scores.length === 0) return 1.0;

    const P_treatment = treatment_scores.filter(s => s > 70).length / treatment_scores.length ||  0.01; // Avoid div by zero
    const P_control = control_scores.filter(s => s > 70).length / control_scores.length || 0.01;

    return P_treatment / P_control;
  }

  /**
   * Helper: Get scores filtered by operating mode
   */
  private getScoresByMode(mode: OperatingMode): number[] {
    return this.mode_history
      .filter(entry => entry.mode === mode)
      .map(entry => entry.score);
  }

  /**
   * Generate causal meta-prompt with Pearl's evidence
   */
  private generateCausalMetaPrompt(PN: number, PS: number, RR: number): string {
    return `
## CAUSAL ANALYSIS (Pearl's Ladder of Causation)

**Level 3 - Counterfactual Attribution**:
- Probability that BALANCED mode CAUSED low scores (PN): ${(PN * 100).toFixed(0)}%
- Legal standard "more probable than not" (50%) ${PN > 0.5 ? '✅ EXCEEDED' : '❌ not met'}

**Level 2 - Intervention Prediction**:
- Probability that EXPLORATORY mode WOULD improve scores (PS): ${(PS * 100).toFixed(0)}%
- Relative Risk (RR): ${RR.toFixed(2)}x ${RR > 2 ? '(STRONG effect, court standard)' : ''}

**CAUSAL INTERVENTION**: Switching to exploratory mode based on counterfactual evidence.

RECALIBRATION INSTRUCTION:
- The low scores are CAUSALLY attributable to rigid standards (PN > 50%)
- Switching modes has a ${(PS * 100).toFixed(0)}% probability of success
- Apply "computational necessity" standard (not just physics-level causality)
- Look for WHAT the idea DOES explain, not just gaps
- Give credit for testable, falsifiable mechanisms
`;
  }

  /**
   * Update mode history when recording scores
   * This enables causal inference in future calibrations
   */
  updateModeHistory(score: number): void {
    const entry: ModeHistoryEntry = {
      mode: this.selfImage.current_mode,
      score,
      timestamp: new Date()
    };

    this.mode_history.push(entry);

    // Maintain sliding window (same as MAX_HISTORY)
    if (this.mode_history.length > this.MAX_HISTORY * 2) {
      this.mode_history.shift();
    }
  }

  // ==============================================
  // PHASE 23: SUPABASE PERSISTENCE
  // ==============================================

  /**
   * Serialize consciousness state to JSON for database storage.
   */
  toJSON() {
    const currentCeiling = this.selfImage.ceilings[this.selfImage.current_mode];
    return {
      current_mode: this.selfImage.current_mode,
      ceiling: currentCeiling,
      friction_alert: this.friction.alert_active,
      friction_reason: this.friction.alert_active ? 'Friction detected during synthesis' : null,
      history: this.history,
      mode_history: this.mode_history.map(entry => ({
        mode: entry.mode,
        score: entry.score,
        timestamp: entry.timestamp.toISOString()
      }))
    };
  }

  /**
   * Deserialize consciousness state from JSON.
   */
  static fromJSON(json: any): MasaSelfModel {
    const model = new MasaSelfModel();
    
    // Restore self-image mode
    model.selfImage.current_mode = json.current_mode || 'balanced';
    
    // Restore ceiling for current mode (if provided)
    if (json.ceiling) {
      model.selfImage.ceilings[model.selfImage.current_mode] = json.ceiling;
    }
    
    // Restore friction state
    model.friction.alert_active = json.friction_alert || false;
    
    // Restore performance history
    model.history = json.history || { scores: [], avg_score: 0, rejection_rate: 0, variance: 0 };
    
    // Restore mode history for causal inference
    model.mode_history = (json.mode_history || []).map((entry: any) => ({
      mode: entry.mode,
      score: entry.score,
      timestamp: new Date(entry.timestamp)
    }));
    
    return model;
  }

  /**
   * Load consciousness state from Supabase for a given user.
   * Falls back to default state if not found (graceful degradation).
   */
  static async loadFromDatabase(userId: string, supabaseClient?: any): Promise<MasaSelfModel> {
    try {
      // Dynamic import to avoid SSR issues or use injected client
      let supabase;
      if (supabaseClient) {
        supabase = supabaseClient;
      } else {
        const { createClient } = await import('@/lib/supabase/client');
        supabase = createClient();
      }
      
      const { data, error } = await supabase
        .from('masa_consciousness_state')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No state found for this user (expected for new users)
          console.log('[Layer 0] No saved state found, starting fresh');
          return new MasaSelfModel();
        }
        throw error;
      }
      
      if (data) {
        console.log(`[Layer 0] Loaded consciousness state: mode=${data.current_mode}, history_length=${data.mode_history?.length || 0}`);
        return MasaSelfModel.fromJSON(data);
      }
      
      // Fallback: Create new stateless instance
      console.warn('[Layer 0] No saved state found, starting fresh');
      return new MasaSelfModel();
    } catch (err) {
      console.warn('[Layer 0] Failed to load state from DB, using stateless mode:', err);
      return new MasaSelfModel();
    }
  }

  /**
   * Save current consciousness state to Supabase.
   * Gracefully handles DB unavailability.
   */
  async saveToDatabase(userId: string, supabaseClient?: any): Promise<void> {
    try {
      // Dynamic import to avoid SSR issues or use injected client
      let supabase;
      if (supabaseClient) {
        supabase = supabaseClient;
      } else {
        const { createClient } = await import('@/lib/supabase/client');
        supabase = createClient();
      }
      
      const stateJson = this.toJSON();
      
      const { error } = await supabase
        .from('masa_consciousness_state')
        .upsert({
          user_id: userId,
          current_mode: stateJson.current_mode,
          ceiling: stateJson.ceiling,
          friction_alert: stateJson.friction_alert,
          friction_reason: stateJson.friction_reason,
          history: stateJson.history,
          mode_history: stateJson.mode_history,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        throw error;
      }
      
      console.log(`[Layer 0] Saved consciousness state: mode=${stateJson.current_mode}`);
    } catch (err) {
      console.warn('[Layer 0] Failed to persist state to DB:', err);
      // Graceful degradation: Continue without persistence
    }
  }
}
