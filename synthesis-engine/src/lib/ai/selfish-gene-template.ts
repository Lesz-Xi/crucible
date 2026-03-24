import { StructuralCausalModel, type ConstraintViolation, type DAGValidationResult } from './causal-blueprint';

/**
 * The Selfish Gene Template (Dawkins)
 * 
 * Tier 2 SCM for evolutionary biology based on Richard Dawkins' "The Selfish Gene".
 * Validates ideas against gene-level selection theory, focusing on kin selection,
 * game-theoretic stability, and reproductive optimization.
 * 
 * MVP Implementation: Hamilton's Rule (H_kin) only
 * Future: ESS, reproductive trade-offs, replicator viability, extended phenotype
 */
export class SelfishGeneTemplate extends StructuralCausalModel {
  name = "Selfish Gene (Dawkins)";
  domain = "evolutionary_biology";

  async initialize(): Promise<void> {
    // Template initialized - constraints will be checked in validateMechanism
  }

  /**
   * Override validateMechanism to add Tier 2 evolutionary biology constraints
   */
  async validateMechanism(mechanismText: string): Promise<DAGValidationResult> {
    // First run Tier 1 (universal physics) validation
    const tier1Result = await super.validateMechanism(mechanismText);
    
    // Then run Tier 2 (evolutionary biology) validation
    const hamiltonViolations = this.validateHamiltonRule(mechanismText);
    
    // Combine violations
    const allViolations = [...tier1Result.violations, ...hamiltonViolations];
    
    return {
      valid: allViolations.length === 0,
      violations: allViolations,
      passedConstraints: tier1Result.passedConstraints.concat(
        hamiltonViolations.length === 0 ? ['kin_selection'] : []
      )
    };
  }

  /**
   * Validates Hamilton's Rule: rB > C
   * 
   * W.D. Hamilton's inequality for the evolution of altruism:
   * - r = coefficient of relatedness between donor and recipient
   * - B = reproductive benefit to recipient
   * - C = reproductive cost to donor
   * 
   * Altruistic behavior can only evolve if rB > C.
   * 
   * Known coefficients:
   * - Parent-offspring: r = 0.5
   * - Siblings (standard diploid): r = 0.5
   * - Haplodiploidy sisters (bees, ants): r = 0.75
   * - Grandparent-grandchild: r = 0.25
   * - Cousins: r = 0.125
   */
  private validateHamiltonRule(mechanismText: string): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];
    const lowerText = mechanismText.toLowerCase();

    // Check if this mechanism involves altruism or kin selection
    const involvesAltruism = this.detectAltruisticBehavior(lowerText);
    
    if (!involvesAltruism) {
      return violations; // Not relevant to Hamilton's Rule
    }

    // Try to extract relatedness coefficient
    const extractedR = this.extractRelatednessCoefficient(mechanismText);
    
    if (extractedR === null) {
      // Altruism claim without specifying relatedness
      violations.push({
        constraint: "kin_selection",
        description: "Mechanism involves altruistic/cooperative behavior but does not specify coefficient of relatedness (r). Hamilton's Rule (rB > C) requires r to be defined for kin selection validation.",
        severity: "warning"
      });
      return violations;
    }

    // Validate against known biological relationships
    const knownRelationships = this.detectKnownRelationship(mechanismText);
    
    for (const relationship of knownRelationships) {
      if (Math.abs(extractedR - relationship.expectedR) > 0.1) {
        violations.push({
          constraint: "kin_selection",
          description: `Mechanism claims r=${extractedR.toFixed(2)} for ${relationship.type}, but expected r=${relationship.expectedR} (standard coefficient). Verify genetic relatedness calculation.`,
          severity: "warning"
        });
      }
    }

    // Check for common misconceptions
    if (extractedR > 1.0) {
      violations.push({
        constraint: "kin_selection",
        description: `Relatedness coefficient r=${extractedR.toFixed(2)} exceeds 1.0 (maximum possible). Even identical twins/clones have r=1.0. Check calculation.`,
        severity: "fatal"
      });
    }

    if (extractedR < 0.0) {
      violations.push({
        constraint: "kin_selection",
        description: `Relatedness coefficient r=${extractedR.toFixed(2)} is negative. Relatedness ranges from 0 (unrelated) to 1 (identical). Check calculation.`,
        severity: "fatal"
      });
    }

    return violations;
  }

  /**
   * Detects if the text describes altruistic or cooperative behavior
   */
  private detectAltruisticBehavior(text: string): boolean {
    const altruismKeywords = [
      'altruism', 'altruistic', 'sacrifice', 'cooperat', 'help',
      'kin selection', 'inclusive fitness', 'hamilton',
      'sterile worker', 'eusocial', 'colony', 'nest defense',
      'alarm call', 'sharing food', 'parental care'
    ];

    return altruismKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Extracts relatedness coefficient (r) from mechanism text
   * Looks for patterns like:
   * - "r = 0.5"
   * - "r=0.75"
   * - "relatedness of 0.5"
   * - "share 75% of DNA" (converts to r=0.75)
   * - "coefficient of relatedness = 0.5"
   */
  private extractRelatednessCoefficient(text: string): number | null {
    // Pattern 1: Explicit r = value
    const explicitRMatch = text.match(/r\s*=\s*([\d.]+)/i);
    if (explicitRMatch) {
      return parseFloat(explicitRMatch[1]);
    }

    // Pattern 2: "relatedness of X"
    const relatednessOfMatch = text.match(/relatedness\s+of\s+([\d.]+)/i);
    if (relatednessOfMatch) {
      return parseFloat(relatednessOfMatch[1]);
    }

    // Pattern 3: "share X% of DNA" or "X% DNA shared"
    const percentDNAMatch = text.match(/([\d.]+)%\s+(?:of\s+)?DNA/i);
    if (percentDNAMatch) {
      const percent = parseFloat(percentDNAMatch[1]);
      return percent / 100; // Convert percentage to coefficient
    }

    // Pattern 4: "coefficient of relatedness = X"
    const coefficientMatch = text.match(/coefficient\s+of\s+relatedness\s*[=:]\s*([\d.]+)/i);
    if (coefficientMatch) {
      return parseFloat(coefficientMatch[1]);
    }

    return null; // No relatedness coefficient found
  }

  /**
   * Detects known biological relationships and returns expected r values
   */
  private detectKnownRelationship(text: string): Array<{ type: string; expectedR: number }> {
    const relationships: Array<{ type: string; expectedR: number }> = [];
    const lowerText = text.toLowerCase();

    // Parent-offspring
    if (lowerText.match(/parent|offspring|mother|father|child/)) {
      relationships.push({ type: "parent-offspring", expectedR: 0.5 });
    }

    // Siblings (standard diploid)
    if (lowerText.match(/sibling|brother|sister/) && !lowerText.includes('haplodiploid')) {
      relationships.push({ type: "siblings (diploid)", expectedR: 0.5 });
    }

    // Haplodiploidy (bees, ants, wasps)
    if (lowerText.match(/haplodiploid|honeybee|bee|ant|wasp/) && lowerText.match(/sister/)) {
      relationships.push({ type: "haplodiploidy sisters", expectedR: 0.75 });
    }

    // Grandparent-grandchild
    if (lowerText.match(/grandparent|grandchild|grandmother|grandfather/)) {
      relationships.push({ type: "grandparent-grandchild", expectedR: 0.25 });
    }

    // Cousins
    if (lowerText.match(/cousin/)) {
      relationships.push({ type: "cousins", expectedR: 0.125 });
    }

    return relationships;
  }
}
