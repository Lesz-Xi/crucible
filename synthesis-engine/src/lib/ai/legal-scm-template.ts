/**
 * Legal SCM Template (Tier 2 Domain-Specific)
 * 
 * Implements Pearl's Structural Causal Model for Legal Reasoning.
 * Extends the base StructuralCausalModel with legal-specific constraints:
 * 
 * 1. But-For Test (Counterfactual Necessity)
 * 2. Proximate Cause (Foreseeability)
 * 3. Mens Rea (Intent Requirement)
 * 4. Intervening Cause Analysis
 * 5. Correlation vs Causation Detection
 * 
 * The Taoist Principle: "The valley receives all streams, but only some 
 * streams carved the valley." - Distinguishing correlation from causation.
 * 
 * Phase 28.Legal: Pearl's Causal Blueprint + Legal Causation Theory
 */

import { 
  StructuralCausalModel, 
  CausalNode, 
  CausalEdge
} from './causal-blueprint';
import { getClaudeModel } from './anthropic';
import { safeParseJson } from './ai-utils';

// Legal-specific constraint types (separate from base to avoid type conflicts)
export type LegalConstraintType =
  | 'conservation'        // Inherited from Tier 1
  | 'entropy'             // Inherited from Tier 1
  | 'causality'           // Inherited from Tier 1
  | 'locality'            // Inherited from Tier 1
  | 'but_for'             // Legal: Counterfactual necessity
  | 'proximate_cause'     // Legal: Foreseeability
  | 'mens_rea'            // Legal: Intent requirement
  | 'intervening_cause'   // Legal: Superseding cause
  | 'correlation_trap';   // Legal: Presence ≠ causation

export interface LegalSCMViolation {
  constraint: LegalConstraintType;
  description: string;
  severity: 'fatal' | 'warning';
  evidence?: string;
  legalBasis?: string; // Legal principle or case citation
  remediation?: string; // How to fix the violation
}

export interface LegalCausationValidation {
  valid: boolean;
  violations: LegalSCMViolation[];
  butForPassed: boolean;
  proximateCausePassed: boolean;
  mensReaPassed: boolean;
  overallConfidence: number;
}

/**
 * Legal Structural Causal Model Template
 * 
 * Implements the Intent → Action → Harm causal chain with legal causation
 * requirements (but-for test, proximate cause, mens rea).
 */
export class LegalSCMTemplate extends StructuralCausalModel {
  // Legal-specific causal nodes
  protected legalNodes: CausalNode[] = [
    { name: 'Intent', type: 'latent', domain: 'abstract' },
    { name: 'Action', type: 'observable', domain: 'abstract' },
    { name: 'Harm', type: 'observable', domain: 'abstract' },
    { name: 'Presence', type: 'observable', domain: 'abstract' }, // Mere correlation
    { name: 'InterveningCause', type: 'latent', domain: 'abstract' },
    { name: 'Foreseeability', type: 'latent', domain: 'abstract' },
  ];

  // Legal causal edges
  protected legalEdges: CausalEdge[] = [
    {
      from: 'Intent',
      to: 'Action',
      constraint: 'causality',
      reversible: false,
    },
    {
      from: 'Action',
      to: 'Harm',
      constraint: 'causality',
      reversible: false,
    },
    {
      from: 'Foreseeability',
      to: 'Harm',
      constraint: 'causality',
      reversible: false,
    },
    // Note: No edge from Presence → Harm (correlation trap prevention)
  ];

  constructor() {
    super();
    // Hydrate with legal-specific nodes and edges
    this.hydrate(this.legalNodes, this.legalEdges);
  }

  /**
   * Get legal-specific constraints for LLM grounding
   */
  override getConstraints(): string[] {
    return [
      ...super.getConstraints(), // Inherit Tier 1 physics constraints
      
      // Legal Causation Constraints
      "But-For Test (Counterfactual Necessity): Harm H is caused by Action A if and only if H would NOT have occurred but for A. This is Pearl's Rung 3 counterfactual.",
      
      "Proximate Cause (Foreseeability): Action A is the proximate cause of Harm H only if H was a reasonably foreseeable consequence of A. Unforeseeable harms break the causal chain.",
      
      "Correlation ≠ Causation: Defendant's presence at the scene does NOT establish causation. You must show the defendant's ACTION caused the harm, not merely that they were present.",
      
      "Intervening Causes: A superseding intervening cause breaks the causal chain if it is (1) unforeseeable, (2) independent of defendant's conduct, and (3) sufficient by itself to cause the harm.",
      
      "Mens Rea Requirement: Establishing liability requires showing the defendant acted with the requisite mental state (Intent → Action linkage), except in strict liability cases.",
      
      "Multiple Sufficient Causes: When multiple defendants' actions were each independently sufficient to cause the harm, each is a but-for cause under the substantial factor test.",
    ];
  }

  /**
   * Validate a legal causal claim against all legal constraints
   */
  async validateLegalCausation(
    intent: string,
    action: string,
    harm: string
  ): Promise<LegalCausationValidation> {
    const violations: LegalSCMViolation[] = [];
    let butForPassed = false;
    let proximateCausePassed = false;
    let mensReaPassed = false;

    // Check 1: But-For Test (Counterfactual Necessity)
    const butForTest = await this.checkButForTest(action, harm);
    if (!butForTest.passed) {
      violations.push({
        constraint: 'but_for' as LegalConstraintType,
        description: `But-For Test Failed: ${butForTest.reason}`,
        severity: 'fatal',
        evidence: butForTest.evidence,
        legalBasis: 'Counterfactual causation doctrine - harm must not have occurred but for defendant\'s action',
        remediation: 'Demonstrate that the harm would not have occurred in the absence of the defendant\'s action',
      });
    } else {
      butForPassed = true;
    }

    // Check 2: Proximate Cause (Foreseeability)
    const proximateCauseTest = this.checkProximateCause(action, harm);
    if (!proximateCauseTest.passed) {
      violations.push({
        constraint: 'proximate_cause' as LegalConstraintType,
        description: `Proximate Cause Failed: ${proximateCauseTest.reason}`,
        severity: proximateCauseTest.severity,
        evidence: proximateCauseTest.evidence,
        legalBasis: 'Palsgraf v. Long Island Railroad Co. - harm must be foreseeable consequence of action',
        remediation: 'Establish that a reasonable person would foresee the type of harm that occurred',
      });
    } else {
      proximateCausePassed = true;
    }

    // Check 3: Correlation vs Causation
    const correlationTrap = this.checkCorrelationTrap(action);
    if (correlationTrap.violated) {
      violations.push({
        constraint: 'correlation_trap' as LegalConstraintType,
        description: `Correlation Error: ${correlationTrap.reason}`,
        severity: 'fatal',
        legalBasis: 'Mere presence or association does not establish causation',
        remediation: 'Identify specific action by defendant that caused the harm, not just their presence',
      });
    }

    // Check 4: Mens Rea (Intent Requirement)
    const mensReaTest = this.checkMensRea(intent);
    if (!mensReaTest.passed) {
      violations.push({
        constraint: 'mens_rea' as LegalConstraintType,
        description: `Mens Rea Issue: ${mensReaTest.reason}`,
        severity: 'warning',
        evidence: mensReaTest.evidence,
        legalBasis: 'Criminal liability requires showing defendant acted with requisite mental state',
        remediation: mensReaTest.remediation,
      });
    } else {
      mensReaPassed = true;
    }

    // Check 5: Intervening Causes
    const interveningCheck = this.checkInterveningCauses(action, harm);
    if (interveningCheck.hasSupersedingCause) {
      violations.push({
        constraint: 'intervening_cause' as LegalConstraintType,
        description: `Superseding Cause Detected: ${interveningCheck.reason}`,
        severity: 'fatal',
        evidence: interveningCheck.evidence,
        legalBasis: 'Superseding intervening causes break the chain of proximate causation',
        remediation: 'Show that the intervening cause was foreseeable or not truly independent',
      });
      proximateCausePassed = false;
    }

    // Calculate overall confidence
    const fatalViolations = violations.filter(v => v.severity === 'fatal').length;
    const warningViolations = violations.filter(v => v.severity === 'warning').length;
    const overallConfidence = Math.max(0, 1 - (fatalViolations * 0.3) - (warningViolations * 0.1));

    return {
      valid: fatalViolations === 0,
      violations,
      butForPassed,
      proximateCausePassed,
      mensReaPassed,
      overallConfidence,
    };
  }

  /**
   * But-For Test: Would harm have occurred without the action?
   * 
   * This is Pearl's Rung 3 (Counterfactual):
   * P(~Y | do(~X), X, Y) - given that X happened and Y happened,
   * what is the probability that Y would NOT have happened if X had NOT happened?
   */
  private async checkButForTest(
    action: string,
    harm: string
  ): Promise<{ passed: boolean; reason: string; evidence?: string }> {
    const combinedText = `${action} ${harm}`.toLowerCase();
    
    // Pattern 1: Keywords indicating but-for FAILURE
    const failurePatterns = [
      /would have occurred anyway/i,
      /independent cause/i,
      /unrelated to/i,
      /mere coincidence/i,
      /regardless of/i,
      /would still have happened/i,
      /inevitable/i,
    ];
    
    for (const pattern of failurePatterns) {
      if (pattern.test(combinedText)) {
        return {
          passed: false,
          reason: 'Harm would have occurred even without defendant\'s action',
          evidence: combinedText.match(pattern)?.[0],
        };
      }
    }

    // Pattern 2: Keywords indicating but-for SUCCESS (direct causation)
    const successPatterns = [
      /directly caused/i,
      /resulted in/i,
      /led to/i,
      /brought about/i,
      /produced/i,
      /triggered/i,
      /because of/i,
      /due to/i,
      /as a result of/i,
    ];
    
    for (const pattern of successPatterns) {
      if (pattern.test(combinedText)) {
        return {
          passed: true,
          reason: 'Harm would not have occurred but for defendant\'s action',
          evidence: combinedText.match(pattern)?.[0],
        };
      }
    }

    // Default: Tentative pass, requires LLM counterfactual simulation
    return {
      passed: true,
      reason: 'Requires detailed counterfactual analysis',
    };
  }

  /**
   * Proximate Cause: Was harm a foreseeable consequence of the action?
   */
  private checkProximateCause(
    action: string,
    harm: string
  ): { passed: boolean; reason: string; severity: 'fatal' | 'warning'; evidence?: string } {
    const combinedText = `${action} ${harm}`.toLowerCase();
    
    // Check for superseding/unforeseeable cause indicators
    const unforeseeablePatterns = [
      /unforeseeable/i,
      /freak accident/i,
      /extraordinary/i,
      /unprecedented/i,
      /could not have anticipated/i,
      /no reasonable person/i,
    ];

    for (const pattern of unforeseeablePatterns) {
      if (pattern.test(combinedText)) {
        return {
          passed: false,
          reason: 'Harm was not a foreseeable consequence of defendant\'s action',
          severity: 'fatal',
          evidence: combinedText.match(pattern)?.[0],
        };
      }
    }

    // Check for intervening cause indicators
    const interveningPattern = /intervening|superseding|independent.*cause|third.*party/i;
    if (interveningPattern.test(combinedText)) {
      return {
        passed: false,
        reason: 'Potential superseding intervening cause identified',
        severity: 'warning',
        evidence: combinedText.match(interveningPattern)?.[0],
      };
    }

    return {
      passed: true,
      reason: 'Harm appears to be foreseeable result of action',
      severity: 'warning',
    };
  }

  /**
   * Check for the correlation-causation trap
   * 
   * "The valley receives all streams, but only some streams carved the valley"
   */
  private checkCorrelationTrap(action: string): { violated: boolean; reason: string } {
    const actionLower = action.toLowerCase();
    
    // Patterns indicating mere correlation (presence without action)
    const correlationPatterns = [
      /was present/i,
      /at the scene/i,
      /nearby/i,
      /witnessed/i,
      /observed/i,
      /in the area/i,
      /around the time/i,
    ];

    // Patterns indicating actual action (causation)
    const actionPatterns = [
      /did/i,
      /performed/i,
      /caused/i,
      /struck/i,
      /shot/i,
      /drove/i,
      /attacked/i,
      /pushed/i,
      /threw/i,
      /injected/i,
      /administered/i,
      /operated/i,
      /manufactured/i,
      /sold/i,
      /provided/i,
    ];

    const hasCorrelation = correlationPatterns.some(p => p.test(actionLower));
    const hasAction = actionPatterns.some(p => p.test(actionLower));

    if (hasCorrelation && !hasAction) {
      return {
        violated: true,
        reason: 'Defendant\'s presence does not establish causation without showing their action caused harm. The valley receives all streams, but only some streams carved the valley.',
      };
    }

    return { violated: false, reason: 'Specific action identified' };
  }

  /**
   * Check mens rea (mental state) requirement
   */
  private checkMensRea(
    intent: string
  ): { passed: boolean; reason: string; evidence?: string; remediation?: string } {
    const intentLower = intent.toLowerCase();
    
    // Check if intent is specified
    if (!intent || intent === 'unknown' || intent === 'unknown intent') {
      return {
        passed: false,
        reason: 'Intent/mental state not established',
        remediation: 'Identify defendant\'s mental state: purposeful, knowing, reckless, or negligent',
      };
    }

    // Valid intent types
    const validIntents = ['purposeful', 'knowing', 'reckless', 'negligent', 'strict liability', 'intentional'];
    const hasValidIntent = validIntents.some(i => intentLower.includes(i));

    if (!hasValidIntent) {
      return {
        passed: false,
        reason: 'Intent type unclear or not properly categorized',
        evidence: intent,
        remediation: 'Classify intent as purposeful, knowing, reckless, negligent, or strict liability',
      };
    }

    return {
      passed: true,
      reason: 'Mens rea requirement satisfied',
      evidence: intent,
    };
  }

  /**
   * Check for superseding intervening causes
   */
  private checkInterveningCauses(
    action: string,
    harm: string
  ): { hasSupersedingCause: boolean; reason: string; evidence?: string } {
    const combinedText = `${action} ${harm}`.toLowerCase();
    
    // Patterns indicating superseding cause
    const supersedesPatterns = [
      /superseding cause/i,
      /broke the chain/i,
      /independent.*intervening/i,
      /act of god/i,
      /force majeure/i,
      /sole proximate cause/i,
      /superseded by/i,
    ];

    for (const pattern of supersedesPatterns) {
      if (pattern.test(combinedText)) {
        return {
          hasSupersedingCause: true,
          reason: 'Superseding intervening cause detected that breaks the causal chain',
          evidence: combinedText.match(pattern)?.[0],
        };
      }
    }

    return {
      hasSupersedingCause: false,
      reason: 'No superseding cause detected',
    };
  }

  /**
   * Deep but-for analysis using LLM counterfactual reasoning
   */
  async deepButForAnalysis(
    action: string,
    harm: string
  ): Promise<{
    counterfactualWorld: string;
    necessityScore: number;
    sufficiencyScore: number;
    reasoning: string;
  }> {
    const model = getClaudeModel();

    const prompt = `You are a legal causation expert performing a but-for counterfactual analysis.

**But-For Test (Counterfactual Causation):**
The question is: "Would the harm have occurred BUT FOR the defendant's action?"

**Action:** ${action}
**Harm:** ${harm}

**Your Task:**
1. Construct a counterfactual world where the defendant's action DID NOT occur
2. In that counterfactual world, would the harm still have occurred?
3. Calculate:
   - Necessity Score (0-1): How necessary was the action for the harm? (1 = harm would definitely not occur without action)
   - Sufficiency Score (0-1): How sufficient was the action to cause harm? (1 = action definitely causes harm)

**Output JSON:**
{
  "counterfactualWorld": "Description of the world where the action did not occur",
  "harmInCounterfactual": boolean, // Would harm still occur in counterfactual?
  "necessityScore": number, // 0-1
  "sufficiencyScore": number, // 0-1
  "reasoning": "Detailed causal reasoning"
}`;

    const response = await model.generateContent(prompt);
    const result = safeParseJson<any>(response.response.text(), {
      counterfactualWorld: 'Unable to generate counterfactual',
      harmInCounterfactual: true,
      necessityScore: 0.5,
      sufficiencyScore: 0.5,
      reasoning: 'Analysis failed',
    });

    return {
      counterfactualWorld: result.counterfactualWorld,
      necessityScore: result.harmInCounterfactual ? 0 : result.necessityScore,
      sufficiencyScore: result.sufficiencyScore,
      reasoning: result.reasoning,
    };
  }

  /**
   * Get the legal causal graph structure for visualization
   */
  getLegalCausalStructure(): { nodes: CausalNode[]; edges: CausalEdge[] } {
    return {
      nodes: [...this.legalNodes],
      edges: [...this.legalEdges],
    };
  }
}
