/**
 * Legal MASA Auditor
 * 
 * Multi-Agent Scientific Arbitration for Legal Reasoning.
 * Three specialized agents collaborate to audit legal causation analysis.
 * 
 * The Three Agents (following MASA protocol):
 * 1. But-For Specialist: Validates counterfactual reasoning (Pearl's Rung 3)
 * 2. Proximate Cause Expert: Evaluates foreseeability and directness
 * 3. Precedent Scholar: Checks consistency with established case law
 * 
 * The Taoist Principle: "三生万物" (Three gives birth to all things)
 * Three perspectives create comprehensive legal understanding.
 * 
 * Phase 28.Legal: Pearl's Causal Blueprint for Legal Reasoning
 */

import { getClaudeModel } from './anthropic';
import { safeParseJson } from './ai-utils';
import {
  LegalCase,
  LegalVerdict,
} from '@/types/legal';

/**
 * MASA Agent Role
 */
type LegalMASARole = 'but_for_specialist' | 'proximate_cause_expert' | 'precedent_scholar';

/**
 * Agent Critique
 */
interface AgentCritique {
  role: LegalMASARole;
  verdict: 'agree' | 'disagree' | 'partial';
  confidence: number;
  reasoning: string;
  issues: string[];
  suggestions: string[];
}

/**
 * MASA Audit Result
 */
export interface LegalMASAAuditResult {
  consensus: boolean;
  consensusScore: number; // 0-1, how much agents agree
  critiques: AgentCritique[];
  synthesis: string;
  recommendedVerdict: LegalVerdict;
  dissents: string[];
  timestamp: Date;
}

/**
 * Configuration for Legal MASA Auditor
 */
export interface LegalMASAConfig {
  /** Whether to run agents in parallel */
  parallel?: boolean;
  /** Minimum consensus score to accept verdict */
  minConsensus?: number;
  /** Maximum retries for agent failures */
  maxRetries?: number;
}

const DEFAULT_CONFIG: LegalMASAConfig = {
  parallel: true,
  minConsensus: 0.66, // 2/3 majority
  maxRetries: 2,
};

/**
 * Legal MASA Auditor
 * 
 * Multi-agent system for auditing legal causation analyses.
 */
export class LegalMASAAuditor {
  private config: LegalMASAConfig;
  private model = getClaudeModel();

  constructor(config: Partial<LegalMASAConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Audit a legal case analysis with three specialized agents
   */
  async auditCase(legalCase: LegalCase): Promise<LegalMASAAuditResult> {
    console.log('[LegalMASA] Starting audit with 3 agents');

    // Run all three agents
    const agentPromises: Promise<AgentCritique>[] = [
      this.runButForSpecialist(legalCase),
      this.runProximateCauseExpert(legalCase),
      this.runPrecedentScholar(legalCase),
    ];

    let critiques: AgentCritique[];
    if (this.config.parallel) {
      critiques = await Promise.all(agentPromises);
    } else {
      critiques = [];
      for (const promise of agentPromises) {
        critiques.push(await promise);
      }
    }

    // Calculate consensus
    const consensusScore = this.calculateConsensus(critiques);
    const consensus = consensusScore >= (this.config.minConsensus || 0.66);

    // Synthesize final result
    const synthesis = this.synthesizeCritiques(critiques);
    const recommendedVerdict = this.deriveVerdict(critiques, legalCase.verdict);

    // Collect dissents
    const dissents = critiques
      .filter((c) => c.verdict === 'disagree')
      .map((c) => `${c.role}: ${c.reasoning}`);

    console.log('[LegalMASA] Audit complete. Consensus:', consensus, 'Score:', consensusScore);

    return {
      consensus,
      consensusScore,
      critiques,
      synthesis,
      recommendedVerdict,
      dissents,
      timestamp: new Date(),
    };
  }

  /**
   * But-For Specialist Agent
   * 
   * Validates counterfactual reasoning:
   * "Would the harm have occurred but for the defendant's action?"
   */
  private async runButForSpecialist(legalCase: LegalCase): Promise<AgentCritique> {
    const prompt = `You are the BUT-FOR SPECIALIST agent in a legal MASA (Multi-Agent Scientific Arbitration) system.

## YOUR EXPERTISE
You specialize in counterfactual causal analysis - the "but-for" test.
Your role is to rigorously validate whether harms would have occurred without defendant's actions.

## PEARL'S CAUSAL FRAMEWORK
You apply Judea Pearl's Rung 3 (Counterfactual) reasoning:
- Imagine a world where the defendant's action did NOT occur
- Determine if the harm would still have happened
- Consider alternative causes and their sufficiency

## CASE TO ANALYZE

Title: ${legalCase.title}
Type: ${legalCase.caseType}
Jurisdiction: ${legalCase.jurisdiction || 'Not specified'}

### Parties
${legalCase.parties.map((p) => `- ${p.name} (${p.role})`).join('\n')}

### Timeline of Actions
${legalCase.timeline.map((a) => `- ${a.description} [Intent: ${a.intent?.type || 'unknown'}]`).join('\n')}

### Identified Harms
${legalCase.harms.map((h) => `- ${h.description} (Severity: ${h.severity}, Victim: ${h.victim || 'unknown'})`).join('\n')}

### Established Causal Chains
${legalCase.causalChains.map((c, i) => `
Chain ${i + 1}:
  Intent: ${c.intent.type} - "${c.intent.description}"
  Action: "${c.action.description}"
  Harm: "${c.harm.description}"
  But-For Result: ${c.butForAnalysis?.result || 'not analyzed'}
  But-For Confidence: ${c.butForAnalysis?.confidence || 0}
`).join('\n')}

### Current Verdict
Liable: ${legalCase.verdict?.liable || 'not determined'}
Reasoning: ${legalCase.verdict?.reasoning || 'none'}

## YOUR TASK

Critically evaluate the but-for analysis for each causal chain:

1. Is the counterfactual reasoning sound?
2. Were alternative causes properly considered?
3. Is the harm truly dependent on the defendant's action?
4. Are there any logical fallacies in the causation analysis?

Output your critique in JSON format:
{
  "role": "but_for_specialist",
  "verdict": "agree" | "disagree" | "partial",
  "confidence": number (0-1),
  "reasoning": "Your detailed reasoning",
  "issues": ["List of specific issues found"],
  "suggestions": ["Recommendations for improvement"]
}`;

    return this.runAgent(prompt, 'but_for_specialist');
  }

  /**
   * Proximate Cause Expert Agent
   * 
   * Evaluates foreseeability and directness of causation.
   */
  private async runProximateCauseExpert(legalCase: LegalCase): Promise<AgentCritique> {
    const prompt = `You are the PROXIMATE CAUSE EXPERT agent in a legal MASA (Multi-Agent Scientific Arbitration) system.

## YOUR EXPERTISE
You specialize in proximate causation - the legal concept of foreseeability and directness.
Your role is to determine whether the harm was a reasonably foreseeable consequence of the action.

## KEY LEGAL PRINCIPLES
1. **Foreseeability**: Was the type of harm foreseeable to a reasonable person?
2. **Directness**: Was the causal chain direct, or were there intervening causes?
3. **Superseding Causes**: Did any intervening event break the chain of causation?
4. **Palsgraf Standard**: Was the plaintiff in the foreseeable zone of danger?

## CASE TO ANALYZE

Title: ${legalCase.title}
Type: ${legalCase.caseType}
Jurisdiction: ${legalCase.jurisdiction || 'Not specified'}

### Parties
${legalCase.parties.map((p) => `- ${p.name} (${p.role})`).join('\n')}

### Timeline of Actions
${legalCase.timeline.map((a) => `- ${a.description} [Intent: ${a.intent?.type || 'unknown'}]`).join('\n')}

### Identified Harms
${legalCase.harms.map((h) => `- ${h.description} (Severity: ${h.severity}, Victim: ${h.victim || 'unknown'})`).join('\n')}

### Established Causal Chains
${legalCase.causalChains.map((c, i) => `
Chain ${i + 1}:
  Intent: ${c.intent.type} - "${c.intent.description}"
  Action: "${c.action.description}"
  Harm: "${c.harm.description}"
  Proximate Cause Established: ${c.proximateCauseEstablished}
  Foreseeability Score: ${c.foreseeability || 'not calculated'}
  Intervening Causes: ${c.interveningCauses?.length || 0}
`).join('\n')}

### Current Verdict
Proximate Cause Satisfied: ${legalCase.verdict?.proximateCauseSatisfied || 'not determined'}
Reasoning: ${legalCase.verdict?.reasoning || 'none'}

## YOUR TASK

Critically evaluate the proximate cause analysis:

1. Was the harm reasonably foreseeable to a reasonable person in defendant's position?
2. Is the causal chain sufficiently direct?
3. Were all potential intervening causes properly identified and analyzed?
4. Would the Palsgraf court find proximate cause here?

Output your critique in JSON format:
{
  "role": "proximate_cause_expert",
  "verdict": "agree" | "disagree" | "partial",
  "confidence": number (0-1),
  "reasoning": "Your detailed reasoning",
  "issues": ["List of specific issues found"],
  "suggestions": ["Recommendations for improvement"]
}`;

    return this.runAgent(prompt, 'proximate_cause_expert');
  }

  /**
   * Precedent Scholar Agent
   * 
   * Checks consistency with established case law.
   */
  private async runPrecedentScholar(legalCase: LegalCase): Promise<AgentCritique> {
    const precedentsText = legalCase.precedents.length > 0
      ? legalCase.precedents.map((p) => `
- ${p.caseName} (${p.citation}, ${p.year})
  Holding: ${p.holdingText}
  Similarity: ${Math.round(p.similarity * 100)}%
  Ruling: ${p.causalPattern.ruling}
`).join('\n')
      : 'No precedents were matched.';

    const prompt = `You are the PRECEDENT SCHOLAR agent in a legal MASA (Multi-Agent Scientific Arbitration) system.

## YOUR EXPERTISE
You specialize in legal precedent analysis and stare decisis.
Your role is to ensure the causation analysis is consistent with established case law.

## KEY CONSIDERATIONS
1. **Stare Decisis**: Does the analysis follow precedent?
2. **Distinguishing**: Are distinctions from precedent justified?
3. **Policy Consistency**: Is the outcome consistent with the policy rationale of precedents?
4. **Jurisdiction**: Are the precedents applicable in this jurisdiction?

## CASE TO ANALYZE

Title: ${legalCase.title}
Type: ${legalCase.caseType}
Jurisdiction: ${legalCase.jurisdiction || 'Not specified'}

### Summary
${legalCase.causalChains.length} causal chain(s) established.
${legalCase.causalChains.filter((c) => c.butForAnalysis?.result === 'necessary').length} passed but-for test.
${legalCase.causalChains.filter((c) => c.proximateCauseEstablished).length} established proximate cause.

### Matched Precedents
${precedentsText}

### Current Verdict
Liable: ${legalCase.verdict?.liable || 'not determined'}
But-For Satisfied: ${legalCase.verdict?.butForSatisfied || 'not determined'}
Proximate Cause: ${legalCase.verdict?.proximateCauseSatisfied || 'not determined'}
Reasoning: ${legalCase.verdict?.reasoning || 'none'}

## YOUR TASK

Evaluate consistency with precedent:

1. Is the verdict consistent with the matched precedents?
2. If the verdict differs from similar precedents, is the distinction justified?
3. Are there landmark cases that should have been considered?
4. Would this verdict create problematic precedent?

Output your critique in JSON format:
{
  "role": "precedent_scholar",
  "verdict": "agree" | "disagree" | "partial",
  "confidence": number (0-1),
  "reasoning": "Your detailed reasoning",
  "issues": ["List of specific issues found"],
  "suggestions": ["Recommendations for improvement, including missing precedents"]
}`;

    return this.runAgent(prompt, 'precedent_scholar');
  }

  /**
   * Run an agent with retry logic
   */
  private async runAgent(prompt: string, role: LegalMASARole): Promise<AgentCritique> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < (this.config.maxRetries || 2); attempt++) {
      try {
        const response = await this.model.generateContent(prompt);
        const text = response.response.text();

        const parsed = safeParseJson<AgentCritique>(text, {
          role,
          verdict: 'partial',
          confidence: 0.5,
          reasoning: 'Unable to parse agent response',
          issues: ['Agent response parsing failed'],
          suggestions: [],
        });

        // Ensure role is set correctly
        parsed.role = role;

        console.log(`[LegalMASA] ${role} verdict:`, parsed.verdict);
        return parsed;

      } catch (error: any) {
        lastError = error;
        console.warn(`[LegalMASA] ${role} attempt ${attempt + 1} failed:`, error.message);
      }
    }

    // Return fallback on complete failure
    return {
      role,
      verdict: 'partial',
      confidence: 0.3,
      reasoning: `Agent failed after ${this.config.maxRetries} attempts: ${lastError?.message}`,
      issues: ['Agent execution failed'],
      suggestions: ['Review agent configuration and prompts'],
    };
  }

  /**
   * Calculate consensus score from agent critiques
   */
  private calculateConsensus(critiques: AgentCritique[]): number {
    const verdictScores: Record<string, number> = {
      agree: 1,
      partial: 0.5,
      disagree: 0,
    };

    const weightedSum = critiques.reduce((sum, c) => {
      return sum + verdictScores[c.verdict] * c.confidence;
    }, 0);

    const maxPossible = critiques.reduce((sum, c) => sum + c.confidence, 0);

    return maxPossible > 0 ? weightedSum / maxPossible : 0;
  }

  /**
   * Synthesize critiques into a coherent summary
   */
  private synthesizeCritiques(critiques: AgentCritique[]): string {
    const parts: string[] = [];

    // Summary
    const agreementCount = critiques.filter((c) => c.verdict === 'agree').length;
    const partialCount = critiques.filter((c) => c.verdict === 'partial').length;
    const disagreeCount = critiques.filter((c) => c.verdict === 'disagree').length;

    parts.push(`MASA Audit: ${agreementCount} agree, ${partialCount} partial, ${disagreeCount} disagree.`);

    // Key issues
    const allIssues = critiques.flatMap((c) => c.issues);
    if (allIssues.length > 0) {
      parts.push(`Key issues identified: ${allIssues.slice(0, 3).join('; ')}.`);
    }

    // Suggestions
    const allSuggestions = critiques.flatMap((c) => c.suggestions);
    if (allSuggestions.length > 0) {
      parts.push(`Recommendations: ${allSuggestions.slice(0, 2).join('; ')}.`);
    }

    return parts.join(' ');
  }

  /**
   * Derive final verdict from agent critiques
   */
  private deriveVerdict(critiques: AgentCritique[], originalVerdict?: LegalVerdict): LegalVerdict {
    // If consensus agrees with original, keep it
    const consensus = this.calculateConsensus(critiques);
    
    if (consensus >= 0.8 && originalVerdict) {
      return originalVerdict;
    }

    // Otherwise, derive from critiques
    const butForAgent = critiques.find((c) => c.role === 'but_for_specialist');
    const proximateAgent = critiques.find((c) => c.role === 'proximate_cause_expert');
    const butForPasses = butForAgent?.verdict !== 'disagree';
    const proximatePasses = proximateAgent?.verdict !== 'disagree';

    const liable = butForPasses && proximatePasses;
    const avgConfidence = critiques.reduce((sum, c) => sum + c.confidence, 0) / critiques.length;

    // Collect all issues as caveats
    const caveats = critiques
      .filter((c) => c.verdict !== 'agree')
      .flatMap((c) => c.issues)
      .slice(0, 5);

    return {
      liable,
      causationEstablished: butForPasses,
      reasoning: this.synthesizeCritiques(critiques),
      butForSatisfied: butForPasses,
      proximateCauseSatisfied: proximatePasses,
      confidence: avgConfidence,
      caveats: caveats.length > 0 ? caveats : undefined,
    };
  }
}

// Export singleton instance
export const legalMASAAuditor = new LegalMASAAuditor();
