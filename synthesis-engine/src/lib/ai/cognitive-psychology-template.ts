import { StructuralCausalModel, type ConstraintViolation, type DAGValidationResult } from './causal-blueprint';

/**
 * The Cognitive Psychology Template (Kahneman - Thinking, Fast and Slow)
 * 
 * Tier 2 SCM for human judgment and decision-making based on Daniel Kahneman's
 * "Thinking, Fast and Slow". Validates ideas against Prospect Theory, cognitive biases,
 * and dual-process theory (System 1 vs System 2).
 * 
 * MVP Implementation: Prospect Theory (Reference Point Dependence + Loss Aversion)
 * Future: WYSIATI, Base Rate Neglect, Availability Heuristic, Peak-End Rule
 */
export class CognitivePsychologyTemplate extends StructuralCausalModel {
  name = "Thinking Fast and Slow (Kahneman)";
  domain = "cognitive_psychology";

  async initialize(): Promise<void> {
    // Template initialized - constraints will be checked in validateMechanism
  }

  /**
   * Override validateMechanism to add Tier 2 cognitive psychology constraints
   */
  async validateMechanism(mechanismText: string): Promise<DAGValidationResult> {
    // First run Tier 1 (universal physics) validation
    const tier1Result = await super.validateMechanism(mechanismText);
    
    // Then run Tier 2 (cognitive psychology) validation
    const refPointViolations = this.validateReferencePointDependence(mechanismText);
    const lossAversionViolations = this.validateLossAversion(mechanismText);
    
    // Combine violations
    const allViolations = [
      ...tier1Result.violations,
      ...refPointViolations,
      ...lossAversionViolations
    ];
    
    return {
      valid: allViolations.length === 0,
      violations: allViolations,
      passedConstraints: tier1Result.passedConstraints.concat(
        refPointViolations.length === 0 ? ['reference_point'] : [],
        lossAversionViolations.length === 0 ? ['loss_aversion'] : []
      )
    };
  }

  /**
   * Validates Reference Point Dependence (Prospect Theory)
   * 
   * Kahneman & Tversky's core insight: Utility is a function of gains/losses
   * relative to a reference point (Δx), NOT absolute wealth (x).
   * 
   * U = f(Δx; Ref) where Ref = current state
   * 
   * Violations occur when utility/value claims don't specify:
   * - What is the reference point (baseline)?
   * - Is this a gain or loss relative to that baseline?
   */
  private validateReferencePointDependence(mechanismText: string): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    const lowerText = mechanismText.toLowerCase();

    // Detect utility/value language
    const hasUtilityLanguage = this.detectUtilityLanguage(lowerText);
    
    if (!hasUtilityLanguage) {
      return violations; // Not relevant to Prospect Theory
    }

    // Check for reference point specification
    const hasReferencePoint = this.detectReferencePoint(mechanismText);
    
    if (!hasReferencePoint) {
      violations.push({
        constraint: "reference_point",
        description: "Utility/value claim must specify reference point (baseline). Prospect Theory shows evaluation is relative to current state (Δx), not absolute level.",
        severity: "warning"
      });
    }

    return violations;
  }

  /**
   * Validates Loss Aversion Asymmetry (Prospect Theory)
   * 
   * The value function is steeper for losses than gains:
   * V(x) = x^α for gains (α ≈ 0.88)
   * V(x) = -λ(-x)^β for losses (β ≈ 0.88, λ ≈ 2.25)
   * 
   * Key insight: Losses hurt ~2.25× more than equivalent gains feel good.
   * 
   * Violations occur when mechanisms involve losses but don't account for
   * this asymmetry in their predictions.
   */
  private validateLossAversion(mechanismText: string): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    const lowerText = mechanismText.toLowerCase();

    // Check if mechanism involves losses
    const involvesLosses = this.detectLossLanguage(lowerText);
    
    if (!involvesLosses) {
      return violations; // Not relevant to loss aversion
    }

    // Check if utility/impact is being claimed
    const hasUtilityLanguage = this.detectUtilityLanguage(lowerText);
    
    if (!hasUtilityLanguage) {
      return violations; // Mentions losses but not evaluating them
    }

    // Check if loss aversion asymmetry is acknowledged
    const hasLossAversionAwareness = this.detectLossAversionAwareness(mechanismText);
    
    if (!hasLossAversionAwareness) {
      violations.push({
        constraint: "loss_aversion",
        description: "Mechanism involves losses but does not account for loss aversion asymmetry. Losses are weighted ~2.25× more than equivalent gains (λ ≈ 2.25, Kahneman & Tversky 1979).",
        severity: "warning"
      });
    }

    return violations;
  }

  /**
   * Detects if text involves utility/value evaluation language
   */
  private detectUtilityLanguage(text: string): boolean {
    const utilityKeywords = [
      'utility', 'value', 'happiness', 'well-being', 'satisfaction',
      'preference', 'benefit', 'worth', 'desire', 'welfare',
      'life satisfaction', 'subjective value', 'perceived value',
      'emotional response', 'affective', 'morale'
    ];

    return utilityKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Detects if text specifies a reference point
   */
  private detectReferencePoint(text: string): boolean {
    const refPointPatterns = [
      /reference\s+point/i,
      /baseline/i,
      /current\s+state/i,
      /relative\s+to/i,
      /compared\s+to/i,
      /change\s+from/i,
      /starting\s+point/i,
      /initial\s+state/i,
      /status\s+quo/i,
      /\bref\s*=/i,  // Mathematical notation "Ref ="
      /gain.*from/i,  // "gain from [baseline]"
      /loss.*from/i   // "loss from [baseline]"
    ];

    return refPointPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Detects if text involves loss language
   */
  private detectLossLanguage(text: string): boolean {
    const lossKeywords = [
      'loss', 'losses', 'losing', 'lost',
      'decrease', 'reduction', 'decline', 'drop',
      'pay cut', 'layoff', 'downsizing',
      'sacrifice', 'give up', 'forgo',
      'penalty', 'cost', 'expense',
      'disadvantage', 'harm', 'damage',
      'negative impact', 'adverse'
    ];

    return lossKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Detects if text acknowledges loss aversion asymmetry
   */
  private detectLossAversionAwareness(text: string): boolean {
    const awarenessPatterns = [
      /loss\s+aversion/i,
      /λ\s*[≈=~]\s*2\.25/i,  // Lambda coefficient
      /lambda\s*[≈=~]\s*2/i,
      /asymmetr/i,           // asymmetry, asymmetric
      /2\.25.*times/i,       // "2.25 times more"
      /twice\s+as/i,         // "twice as painful"
      /stronger.*loss/i,     // "stronger response to losses"
      /disproportion/i,      // disproportionate
      /steeper.*loss/i,      // "steeper for losses"
      /kahneman.*tversky/i   // Citing the original authors
    ];

    return awarenessPatterns.some(pattern => pattern.test(text));
  }
}
