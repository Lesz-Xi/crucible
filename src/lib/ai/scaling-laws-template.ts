import { StructuralCausalModel, type ConstraintViolation, type DAGValidationResult } from './causal-blueprint';

/**
 * The Scaling Laws Template (Geoffrey West - Scale)
 * 
 * Tier 2 SCM for complex systems physics based on Geoffrey West's "Scale: The Universal Laws
 * of Life, Growth, and Death in Organisms, Cities, and Companies". Validates ideas against
 * universal scaling laws governing growth dynamics across biological, corporate, and urban systems.
 * 
 * Master Equation: dN/dt = a·N^β - b·N
 * 
 * MVP Implementation: Beta Regime Validation (β < 1 vs β > 1)
 * Future: Froude number, Marchetti's constant, pace of life, innovation reset dynamics
 */
export class ScalingLawsTemplate extends StructuralCausalModel {
  name = "Scale (Geoffrey West)";
  domain = "scaling_laws";

  async initialize(): Promise<void> {
    // Inject domain-specific nodes for Scaling Laws
    this.customNodes = [
      { name: 'N', type: 'observable', domain: 'abstract' }, // Size/Population
      { name: 'beta', type: 'observable', domain: 'abstract' }, // Scaling Exponent
      { name: 'growth_rate', type: 'observable', domain: 'abstract' }, // dN/dt
      { name: 'carrying_capacity', type: 'observable', domain: 'abstract' },
      { name: 'singularity_time', type: 'observable', domain: 'abstract' },
      { name: 'innovation_rate', type: 'observable', domain: 'abstract' }
    ];

    this.customEdges = [
      { from: 'beta', to: 'growth_rate', constraint: 'causality', reversible: false },
      { from: 'N', to: 'growth_rate', constraint: 'causality', reversible: false },
      { from: 'growth_rate', to: 'carrying_capacity', constraint: 'causality', reversible: false },
      { from: 'growth_rate', to: 'singularity_time', constraint: 'causality', reversible: false },
      { from: 'innovation_rate', to: 'singularity_time', constraint: 'causality', reversible: false }
    ];
  }

  /**
   * Override validateMechanism to add Tier 2 scaling laws constraints
   */
  async validateMechanism(mechanismText: string): Promise<DAGValidationResult> {
    // First run Tier 1 (universal physics) validation
    const tier1Result = await super.validateMechanism(mechanismText);
    
    // Then run Tier 2 (scaling laws) validation
    const betaRegimeViolations = this.validateBetaRegime(mechanismText);
    
    // Combine violations
    const allViolations = [
      ...tier1Result.violations,
      ...betaRegimeViolations
    ];
    
    return {
      valid: allViolations.length === 0,
      violations: allViolations,
      passedConstraints: tier1Result.passedConstraints.concat(
        betaRegimeViolations.length === 0 ? ['beta_regime'] : []
      )
    };
  }

  /**
   * Validates Beta Regime Constraints (Geoffrey West's Scaling Laws)
   * 
   * The fundamental growth equation: dN/dt = a·N^β - b·N
   * 
   * Two regimes determined by β:
   * 
   * REGIME A (β < 1): Sublinear scaling
   * - Examples: Biology (β=0.75), Companies (β=0.9), Infrastructure (β=0.85)
   * - Dynamics: Bounded growth approaching carrying capacity N* = (a/b)^(1/(1-β))
   * - Endpoint: Stasis (growth stops)
   * - Constraint: Cannot claim unbounded growth
   * 
   * REGIME B (β > 1): Superlinear scaling
   * - Example: Cities socioeconomic (β=1.15)
   * - Dynamics: Unbounded hyperbolic growth toward finite-time singularity
   * - Singularity: t_sing = t_0 + N_0^(-(β-1)) / (a(β-1))
   * - Constraint: Must acknowledge singularity risk OR innovation reset requirement
   */
  private validateBetaRegime(mechanismText: string): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    const lowerText = mechanismText.toLowerCase();

    // Check if mechanism involves growth/scaling dynamics
    if (!this.involvesGrowthDynamics(lowerText)) {
      return violations; // Not relevant to scaling laws
    }

    // Extract beta exponent
    const beta = this.extractBetaExponent(mechanismText);
    
    if (!beta) {
      // Growth claim without specifying beta
      if (this.claimsSpecificScaling(lowerText)) {
        violations.push({
          constraint: "beta_regime",
          description: "Growth/scaling claim should specify scaling exponent β or identify regime. West's scaling laws show β < 1 (bounded) vs β > 1 (singular) have fundamentally different dynamics.",
          severity: "warning"
        });
      }
      return violations;
    }

    // Validate beta is physically reasonable
    if (beta <= 0 || beta > 2) {
      violations.push({
        constraint: "beta_regime",
        description: `Scaling exponent β=${beta.toFixed(2)} is outside physically observed range (0 < β ≤ 2). Known systems: biology (0.75), companies (0.9), infrastructure (0.85), cities (1.15).`,
        severity: "fatal"
      });
      return violations;
    }

    // REGIME A: Sublinear (β < 1)
    if (beta < 1) {
      const claimsUnbounded = this.claimsUnboundedGrowth(mechanismText);
      const hasCarryingCapacity = this.hasCarryingCapacity(mechanismText);
      
      if (claimsUnbounded && !hasCarryingCapacity) {
        violations.push({
          constraint: "beta_regime",
          description: `Sublinear scaling (β=${beta.toFixed(2)} < 1) implies bounded growth approaching carrying capacity N* = (a/b)^(1/(1-β)). Cannot claim indefinite/unbounded growth.`,
          severity: "fatal"
        });
      }
    }

    // REGIME B: Superlinear (β > 1)
    if (beta > 1) {
      const hasSingularityAwareness = this.hasSingularityAwareness(mechanismText);
      const hasInnovationReset = this.hasInnovationReset(mechanismText);
      const claimsStability = this.claimsStableEquilibrium(mechanismText);
      
      if (claimsStability) {
        violations.push({
          constraint: "singularity_risk",
          description: `Superlinear scaling (β=${beta.toFixed(2)} > 1) leads to finite-time singularity t_sing, not stable equilibrium. System mathematically demands infinite resources in finite time.`,
          severity: "fatal"
        });
      } else if (!hasSingularityAwareness && !hasInnovationReset) {
        violations.push({
          constraint: "singularity_risk",
          description: `Superlinear scaling (β=${beta.toFixed(2)} > 1) leads to finite-time singularity. Must acknowledge collapse risk OR innovation reset requirement (Δt → 0, West 2017).`,
          severity: "warning"
        });
      }
    }

    // Check against known systems
    const knownSystem = this.detectKnownSystem(mechanismText);
    if (knownSystem && Math.abs(beta - knownSystem.expectedBeta) > 0.15) {
      violations.push({
        constraint: "beta_regime",
        description: `Claims β=${beta.toFixed(2)} for ${knownSystem.type}, but empirical value is β≈${knownSystem.expectedBeta} (West 2017). Verify scaling exponent.`,
        severity: "warning"
      });
    }

    return violations;
  }

  /**
   * Detects if text involves growth or scaling dynamics
   */
  private involvesGrowthDynamics(text: string): boolean {
    const growthKeywords = [
      'growth', 'scale', 'scaling', 'grows', 'growing',
      'expand', 'increase', 'metabolic', 'power law',
      'carrying capacity', 'equilibrium', 'singularity',
      'N^', 'exponent', 'beta'
    ];

    return growthKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Extracts beta exponent from mechanism text
   * Looks for patterns like:
   * - "β = 0.75"
   * - "beta = 1.15"
   * - "N^0.9"
   * - "M^(3/4)" → 0.75
   * - "scales as N^{1.15}"
   */
  private extractBetaExponent(text: string): number | null {
    // Pattern 1: Explicit β = value or beta = value
    const explicitBetaMatch = text.match(/β\s*=\s*([\d.]+)|beta\s*=\s*([\d.]+)/i);
    if (explicitBetaMatch) {
      return parseFloat(explicitBetaMatch[1] || explicitBetaMatch[2]);
    }

    // Pattern 2: N^beta or M^beta format
    const powerLawMatch = text.match(/[NM]\^[\{\(]?([\d.]+)[\}\)]?/i);
    if (powerLawMatch) {
      return parseFloat(powerLawMatch[1]);
    }

    // Pattern 3: Fractions like 3/4 or 1/4
    const fractionMatch = text.match(/\b3\/4\b|\b1\/4\b|\b9\/10\b/);
    if (fractionMatch) {
      const fraction = fractionMatch[0];
      if (fraction === '3/4') return 0.75;
      if (fraction === '1/4') return 0.25;
      if (fraction === '9/10') return 0.9;
    }

    // Pattern 4: "scales with exponent X"
    const exponentMatch = text.match(/exponent\s*[=:~]?\s*([\d.]+)/i);
    if (exponentMatch) {
      return parseFloat(exponentMatch[1]);
    }

    return null;
  }

  /**
   * Detects if text claims specific scaling behavior
   */
  private claimsSpecificScaling(text: string): boolean {
    return text.includes('scale') && (
      text.includes('law') ||
      text.includes('exponent') ||
      text.includes('power') ||
      text.includes('metabolic')
    );
  }

  /**
   * Detects if text claims unbounded/indefinite growth
   */
  private claimsUnboundedGrowth(text: string): boolean {
    return text.match(/unbounded|indefinite|infinite|limitless|without bound|exponential.*forever|grow.*forever/i) !== null;
  }

  /**
   * Detects if text mentions carrying capacity or bounded growth
   */
  private hasCarryingCapacity(text: string): boolean {
    return text.match(/carrying capacity|bounded|equilibrium|asymptot|N\*|stasis|stops growing|approaches.*limit/i) !== null;
  }

  /**
   * Detects if text acknowledges finite-time singularity
   */
  private hasSingularityAwareness(text: string): boolean {
    return text.match(/singularity|finite.time|t_sing|collapse|diverge|hyperbolic.*growth|infinite.*finite/i) !== null;
  }

  /**
   * Detects if text mentions innovation reset mechanism
   */
  private hasInnovationReset(text: string): boolean {
    return text.match(/innovation.*reset|reset.*cycle|R_inn|Δt.*→.*0|delta.*t.*0|accelerating.*innovation|innovation.*treadmill/i) !== null;
  }

  /**
   * Detects if text claims stable equilibrium
   */
  private claimsStableEquilibrium(text: string): boolean {
    return text.match(/stable.*equilibrium|steady.*state|long.term.*stability|sustainable.*equilibrium/i) !== null;
  }

  /**
   * Detects known systems and returns expected beta values
   */
  private detectKnownSystem(text: string): { type: string; expectedBeta: number } | null {
    const lowerText = text.toLowerCase();

    // Biological organisms (Kleiber's Law)
    if (lowerText.match(/biolog|organism|metabolic|kleiber|mammal|animal/)) {
      return { type: "biological organisms", expectedBeta: 0.75 };
    }

    // Companies
    if (lowerText.match(/compan|corporate|business|firm/)) {
      return { type: "companies", expectedBeta: 0.9 };
    }

    // Urban infrastructure
    if (lowerText.match(/infrastructure|road|pipe|wire|utility/)) {
      return { type: "urban infrastructure", expectedBeta: 0.85 };
    }

    // Urban socioeconomic (superlinear)
    if (lowerText.match(/cit|urban|socioeconomic|gdp|patent|wage|crime/) && lowerText.match(/scale|growth/)) {
      return { type: "city socioeconomic outputs", expectedBeta: 1.15 };
    }

    return null;
  }
}
