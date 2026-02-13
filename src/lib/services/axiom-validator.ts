import { DAGValidationResult, StructuralCausalModel } from "../ai/causal-blueprint";

export interface AxiomViolation {
  axiom: string;
  severity: "fatal" | "warning";
  evidence: string;
  reason: string;
}

export interface ValidationReport {
  isValid: boolean;
  violations: AxiomViolation[];
  score: number; // 0-1 confidence score
}

/**
 * The Axiom Validator (The Pearlian Guard)
 * 
 * Enforces the 5 Taoist/Pearlian Axioms on Generated Text.
 * Unlike the 'Sage' prompt which encourages good behavior,
 * this Logic Gate strictly FORBIDS bad behavior.
 */
export class AxiomValidator {
  
  /**
   * Validates LLM output against the 5 Axioms.
   */
  validate(text: string, scm?: StructuralCausalModel): ValidationReport {
    const violations: AxiomViolation[] = [];

    // 1. Definiteness (The "Maybe" Trap)
    // Pearlian Scientist: "X causes Y."
    // Sophist: "X might influence Y under some conditions."
    const ambiguityPattern = /might|maybe|could possibly|it depends|sometimes/i;
    if (ambiguityPattern.test(text)) {
      violations.push({
        axiom: "Definiteness",
        severity: "warning",
        evidence: text.match(ambiguityPattern)?.[0] || "ambiguous terms",
        reason: "Causal mechanisms must be definite, not probabilistic (Rung 1 vs Rung 2)."
      });
    }

    // 2. Transitivity/Coherence (Checking against SCM)
    // If the SCM says A->B->C, you cannot say "A has no effect on C".
    // This requires the SCM context.
    // Future: Use SCM graph traversal to check reachability.

    // 3. Reversibility (The Arrow of Time)
    // "Effect causes Cause"
    const retroCausal = /backward.*time|future.*past|retrocausal/i;
    if (retroCausal.test(text)) {
       violations.push({
        axiom: "Reversibility",
        severity: "fatal",
        evidence: text.match(retroCausal)?.[0] || "time reversal",
        reason: "Violation of Causal Arrow (Universal Physics Constraints)."
      });
    }

    // 4. Markov Property (Self-contained)
    // "Depends on unobserved magic variable."
    
    // 5. Entropic Penalty (Thermodynamics)
    const entropyViolations = /perpetual motion|free energy|infinite resource/i;
    if (entropyViolations.test(text)) {
      violations.push({
        axiom: "Entropy",
        severity: "fatal",
        evidence: text.match(entropyViolations)?.[0] || "thermodynamic violation",
        reason: "Violation of 1st/2nd Law of Thermodynamics."
      });
    }

    const fatalCount = violations.filter(v => v.severity === "fatal").length;
    
    return {
      isValid: fatalCount === 0,
      violations,
      score: Math.max(0, 1 - (violations.length * 0.2))
    };
  }

  /**
   * Generates a "Correction Prompt" for the LLM if validation fails.
   */
  generateCorrection(report: ValidationReport): string {
    if (report.isValid) return "";

    return `
### 🛑 AXIOM VIOLATION DETECTED
Your previous response violated the Pearlian Causal Axioms:

${report.violations.map(v => `- **${v.axiom}**: ${v.reason} (Evidence: "${v.evidence}")`).join('\n')}

**CORRECTION INSTRUCTION:**
Reword your hypothesis to remove these violations.
- If you used "probabilistic hedging" (maybe/could), switch to **Structural Determinism** (X determines Y).
- If you implied "Retrocausation" or "Perpetual Motion", DELETE that mechanism immediately.
`;
  }
}
