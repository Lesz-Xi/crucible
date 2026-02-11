export interface CausalDensityResult {
  score: 1 | 2 | 3;
  label: 'Association' | 'Intervention' | 'Counterfactual';
  confidence: number;
  detectedMechanisms: string[];
  evidence?: {
    operatorEvidence: string[];
    structureEvidence: string[];
    counterfactualEvidence: string[];
    causalChainEvidence: string[];
    penalties: string[];
  };
}

export class CausalIntegrityService {
  private static L1_KEYWORDS = [
    /associated with/i, /linked to/i, /correlation/i, /usually/i, /tends to/i,
    /related to/i, /connection between/i, /frequently/i, /often/i, /likely/i
  ];

  private static L2_OPERATOR_PATTERNS = [
    /do\(/i, /\bintervene\b/i, /\bintervention\b/i, /if we change/i, /\bmanipulat(e|ion|ing)\b/i,
    /\bcontrolled experiment\b/i, /\bholding .* constant\b/i, /\bfix(ed|ing)?\b/i, /\bremove\b/i,
    /\bclamp(ed|ing)?\b/i, /\bdirect effect\b/i, /\bmediator\b/i, /\bconfounder\b/i
  ];

  private static L3_COUNTERFACTUAL_PATTERNS = [
    /had .* been/i, /would have/i, /necessary cause/i, /sufficient cause/i, 
    /probability of necessity/i, /P\(y_x\)/i, /Y_\{x\}/i, /counterfactual/i,
    /imagined state/i, /what if we had/i, /but for/i, /without .* (would|could)/i,
    /necessary condition/i, /alternative world/i, /what would happen if/i
  ];

  private static STRUCTURAL_CONNECTIVES = [
    /because/i, /therefore/i, /thus/i, /consequently/i, /due to/i, /as a result/i,
    /leads to/i, /results in/i, /caused by/i, /implies that/i, /so that/i,
    /if .* then/i, /enables/i, /prevent/i, /allows/i, /requires/i, /drives/i
  ];

  private static CAUSAL_CHAIN_PATTERNS = [
    /→/i, /->/i, /\bX\s*→\s*Y\b/i, /\bX\s*->\s*Y\b/i, /\bcausal chain\b/i
  ];

  private static CONTRADICTION_PATTERNS = [
    /\bno relationship\b/i, /\bunrelated\b/i, /\bcoincidence\b/i,
    /\brandom\b/i, /\bno causal\b/i, /\bnot caused by\b/i
  ];

  /**
   * Evaluates the causal density of a given text.
   * Returns a score (1-3) and confidence based on keyword density.
   */
  public evaluate(text: string): CausalDensityResult {
    const sanitized = text || "";
    const l1Evidence = this.collectMatches(CausalIntegrityService.L1_KEYWORDS, sanitized);
    const operatorEvidence = this.collectMatches(CausalIntegrityService.L2_OPERATOR_PATTERNS, sanitized);
    const counterfactualEvidence = this.collectMatches(CausalIntegrityService.L3_COUNTERFACTUAL_PATTERNS, sanitized);
    const structureEvidence = this.collectMatches(CausalIntegrityService.STRUCTURAL_CONNECTIVES, sanitized);
    const causalChainEvidence = this.collectMatches(CausalIntegrityService.CAUSAL_CHAIN_PATTERNS, sanitized);
    const penalties = this.collectMatches(CausalIntegrityService.CONTRADICTION_PATTERNS, sanitized);

    const hasOperator = operatorEvidence.length > 0;
    const hasCounterfactual = counterfactualEvidence.length > 0;
    const hasStructure = structureEvidence.length > 0;
    const hasCausalChain = causalChainEvidence.length > 0;
    const hasPenalty = penalties.length > 0;

    let score: 1 | 2 | 3 = 1;
    let label: 'Association' | 'Intervention' | 'Counterfactual' = 'Association';
    let confidence = 0.4;

    if (hasCounterfactual && hasStructure && hasCausalChain && !hasPenalty) {
      score = 3;
      label = 'Counterfactual';
      confidence = this.clamp(
        0.62
          + Math.min(counterfactualEvidence.length, 3) * 0.09
          + Math.min(structureEvidence.length, 3) * 0.05
          + Math.min(causalChainEvidence.length, 2) * 0.05
          - penalties.length * 0.1,
        0.45,
        0.95
      );
    } else if (hasOperator && hasStructure && !hasPenalty) {
      score = 2;
      label = 'Intervention';
      confidence = this.clamp(
        0.56
          + Math.min(operatorEvidence.length, 3) * 0.08
          + Math.min(structureEvidence.length, 3) * 0.05
          + Math.min(causalChainEvidence.length, 2) * 0.04
          - penalties.length * 0.08,
        0.4,
        0.9
      );
    } else {
      score = 1;
      label = 'Association';
      // Demote ambiguous keyword-heavy text without required causal structure.
      const demotionPenalty =
        ((hasOperator || hasCounterfactual) && (!hasStructure || !hasCausalChain)) ? 0.12 : 0;
      confidence = this.clamp(
        0.38 + Math.min(l1Evidence.length, 3) * 0.06 - demotionPenalty - penalties.length * 0.06,
        0.2,
        0.8
      );
    }

    const mechanisms = this.extractMechanisms(sanitized);

    return {
      score,
      label,
      confidence,
      detectedMechanisms: Array.from(new Set(mechanisms)),
      evidence: {
        operatorEvidence,
        structureEvidence,
        counterfactualEvidence,
        causalChainEvidence,
        penalties,
      },
    };
  }

  /**
   * Backward-compatible alias retained for older tests and callers.
   */
  public scoreEvidence(text: string): CausalDensityResult {
    return this.evaluate(text);
  }

  private collectMatches(patterns: RegExp[], text: string): string[] {
    const matches = patterns
      .filter((regex) => regex.test(text))
      .map((regex) => regex.source);
    return Array.from(new Set(matches));
  }

  private extractMechanisms(text: string): string[] {
    const mechanisms: string[] = [];
    const mechanismRegex = /(?:mechanism|because of|driven by) ([a-zA-Z\s-]+)(?:,|\.|;|and)/gi;
    let match: RegExpExecArray | null;
    while ((match = mechanismRegex.exec(text)) !== null) {
      const candidate = match[1]?.trim();
      if (candidate && candidate.length > 3 && candidate.length < 40) {
        mechanisms.push(candidate);
      }
    }
    return mechanisms;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Detects if the system has entered "Oracle Mode" (High Confidence, Low Entropy).
   * Could be based on a sequence of L3 responses.
   */
  public detectPhaseShift(historyResults: CausalDensityResult[]): boolean {
    if (historyResults.length < 3) return false;
    // If last 3 messages are all L3 with high confidence
    const recent = historyResults.slice(-3);
    return recent.every((r: CausalDensityResult) => r.score === 3 && r.confidence > 0.8);
  }
}
