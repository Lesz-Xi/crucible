/**
 * Educational SCM Template (Tier 2 Domain-Specific)
 * 
 * Implements Pearl's Structural Causal Model for Education.
 * Extends base StructuralCausalModel with learning-specific constraints.
 * 
 * Causal Chain: Motivation → Study_Habits → Practice_Quality → Performance
 *                  ↑              ↑
 *            Family_Support  Learning_Style_Match
 */

import {
  StructuralCausalModel,
  CausalNode,
  CausalEdge,
  SCMViolation,
  DAGValidationResult,
  ConstraintType
} from './causal-blueprint';

import { EducationalSCMViolation } from '@/types/education';

export class EducationalSCM extends StructuralCausalModel {
  name = "Educational Systems (College Learning SCM)";
  
  constructor() {
    super();
    this.initializeEducationalNodes();
  }

  /**
   * Initialize education-specific nodes
   */
  private initializeEducationalNodes(): void {
    this.customNodes = [
      ...this.customNodes,
      
      // Exogenous (background factors)
      { name: 'FamilySupport', type: 'exogenous', domain: 'abstract' },
      { name: 'PriorKnowledge', type: 'exogenous', domain: 'abstract' },
      { name: 'LearningStyle', type: 'exogenous', domain: 'abstract' },
      { name: 'SleepQuality', type: 'exogenous', domain: 'abstract' },
      
      // Observable (measurable via behavior)
      { name: 'Motivation', type: 'observable', domain: 'abstract' },
      { name: 'StudyHabits', type: 'observable', domain: 'abstract' },
      { name: 'ContentEngagement', type: 'observable', domain: 'abstract' },
      { name: 'PracticeQuality', type: 'observable', domain: 'abstract' },
      { name: 'Performance', type: 'observable', domain: 'abstract' },
      
      // Latent (hidden states)
      { name: 'CognitiveLoad', type: 'latent', domain: 'abstract' },
      { name: 'PerceivedCompetence', type: 'latent', domain: 'abstract' }
    ];
  }

  /**
   * Validate learning mechanism against physics + educational constraints
   */
  async validateMechanism(mechanismText: string): Promise<DAGValidationResult> {
    // Step 1: Base physics validation (Tier 1)
    const baseValidation = await super.validateMechanism(mechanismText);
    
    // Step 2: Educational constraint validation (Tier 2)
    const eduViolations = this.validateEducationalConstraints(mechanismText);
    
    // Combine violations
    const allViolations: SCMViolation[] = [
      ...baseValidation.violations,
      ...eduViolations.map(ev => ({
        constraint: ev.constraint as ConstraintType,
        description: ev.description,
        severity: ev.severity,
        evidence: ev.evidence
      }))
    ];
    
    return {
      valid: allViolations.filter(v => v.severity === 'fatal').length === 0,
      violations: allViolations,
      passedConstraints: baseValidation.passedConstraints
    };
  }

  /**
   * Educational-specific constraint validation
   */
  private validateEducationalConstraints(text: string): EducationalSCMViolation[] {
    const violations: EducationalSCMViolation[] = [];
    const textLower = text.toLowerCase();

    // Constraint 1: Cognitive Overload
    if (this.checkCognitiveOverload(textLower)) {
      violations.push({
        constraint: 'cognitive_overload',
        description: 'Intervention exceeds working memory capacity (Miller\'s 7±2 limit)',
        severity: 'fatal',
        evidence: 'Sweller (1988) Cognitive Load Theory',
        suggestedFix: 'Reduce information density or chunk content'
      });
    }

    // Constraint 2: Prerequisite Gap
    if (this.checkPrerequisiteViolation(textLower)) {
      violations.push({
        constraint: 'prerequisite_gap',
        description: 'Content assumes knowledge student lacks',
        severity: 'fatal',
        evidence: 'Bloom (1968) Mastery Learning',
        suggestedFix: 'Provide prerequisite review or remediation'
      });
    }

    // Constraint 3: Massed Practice (Cramming)
    if (this.checkMassedPractice(textLower)) {
      violations.push({
        constraint: 'massed_practice',
        description: 'Massed practice detected (cramming) - ineffective for retention',
        severity: 'warning',
        evidence: 'Cepeda et al. (2006) Spacing Effect meta-analysis',
        suggestedFix: 'Distribute practice sessions over multiple days'
      });
    }

    // Constraint 4: Passive Learning
    if (this.checkPassiveLearning(textLower)) {
      violations.push({
        constraint: 'passive_learning',
        description: 'Passive re-reading detected - low retention expected',
        severity: 'warning',
        evidence: 'Roediger & Karpicke (2006) Testing Effect',
        suggestedFix: 'Add active recall (practice tests, flashcards, teach-back)'
      });
    }

    // Constraint 5: Fixed Mindset Language
    if (this.checkFixedMindsetLanguage(textLower)) {
      violations.push({
        constraint: 'fixed_mindset_language',
        description: 'Feedback emphasizes ability over effort (undermines growth mindset)',
        severity: 'warning',
        evidence: 'Dweck (2006) Mindset Theory',
        suggestedFix: 'Use effort-based feedback: "your hard work paid off" not "you\'re smart"'
      });
    }

    return violations;
  }

  /**
   * Check for cognitive overload
   */
  private checkCognitiveOverload(text: string): boolean {
    // Heuristics for cognitive overload
    const overloadIndicators = [
      /learn.*10.*concepts.*one.*session/i,
      /cramming|all[- ]?nighter/i,
      /information.*overwhelming/i
    ];
    
    return overloadIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Check for prerequisite knowledge gaps
   */
  private checkPrerequisiteViolation(text: string): boolean {
    const gapIndicators = [
      /student.*doesn'?t.*understand.*basic/i,
      /skipped.*prerequisite/i,
      /foundation.*missing/i
    ];
    
    return gapIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Check for massed practice (cramming)
   */
  private checkMassedPractice(text: string): boolean {
    return /cram|all[- ]?night|study.*entire.*day|marathon.*session/i.test(text);
  }

  /**
   * Check for passive learning strategies
   */
  private checkPassiveLearning(text: string): boolean {
    const passiveIndicators = [
      /just.*re[- ]?read/i,
      /highlight.*again/i,
      /passive.*consumption/i,
      /watch.*video.*without.*practice/i
    ];
    
    return passiveIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Check for fixed mindset language
   */
  private checkFixedMindsetLanguage(text: string): boolean {
    const fixedMindsetPhrases = [
      /you'?re.*smart/i,
      /you'?re.*talented/i,
      /natural.*ability/i,
      /gifted.*student/i,
      /not.*a.*math.*person/i
    ];
    
    return fixedMindsetPhrases.some(pattern => pattern.test(text));
  }

  /**
   * Get default causal graph template
   */
  getDefaultGraph(): { nodes: CausalNode[]; edges: CausalEdge[] } {
    const nodes: CausalNode[] = [
      { name: 'FamilySupport', type: 'exogenous', domain: 'abstract' },
      { name: 'SleepQuality', type: 'exogenous', domain: 'abstract' },
      { name: 'LearningStyle', type: 'exogenous', domain: 'abstract' },
      { name: 'Motivation', type: 'observable', domain: 'abstract' },
      { name: 'StudyHabits', type: 'observable', domain: 'abstract' },
      { name: 'ContentEngagement', type: 'observable', domain: 'abstract' },
      { name: 'PracticeQuality', type: 'observable', domain: 'abstract' },
      { name: 'Performance', type: 'observable', domain: 'abstract' }
    ];

    const edges: CausalEdge[] = [
      {
        from: 'FamilySupport',
        to: 'Motivation',
        constraint: 'causality',
        reversible: false
      },
      {
        from: 'SleepQuality',
        to: 'Motivation',
        constraint: 'causality',
        reversible: false
      },
      {
        from: 'Motivation',
        to: 'StudyHabits',
        constraint: 'causality',
        reversible: false
      },
      {
        from: 'LearningStyle',
        to: 'ContentEngagement',
        constraint: 'causality',
        reversible: false
      },
      {
        from: 'StudyHabits',
        to: 'PracticeQuality',
        constraint: 'entropy', // Requires effort
        reversible: true // Can degrade without maintenance
      },
      {
        from: 'ContentEngagement',
        to: 'PracticeQuality',
        constraint: 'causality',
        reversible: false
      },
      {
        from: 'PracticeQuality',
        to: 'Performance',
        constraint: 'causality',
        reversible: false
      }
    ];

    return { nodes, edges };
  }
}
