/**
 * PHASE 28 COMPONENT 3: COUNTERFACTUAL CRITIQUE
 * 
 * Implements Pearl's Layer 3 (Counterfactual Reasoning) to test mechanism robustness
 * by generating "what-if" scenarios and evaluating how well the mechanism handles them.
 * 
 * Pearl's Ladder of Causation:
 * - Layer 1: Association (seeing) - "What is the correlation?"
 * - Layer 2: Intervention (doing) - "What if we do X?"
 * - Layer 3: Counterfactual (imagining) - "What if X had been different?"
 */

import { getClaudeModel } from "../ai/anthropic";

export interface CounterfactualScenario {
  type: 'boundary' | 'confounding' | 'reversed_causality';
  condition: string;
  expectedOutcome: string;
  testsPurpose: string;
}

export interface CounterfactualEvaluation {
  completeness: number;        // 0-1: Does mechanism explain all scenarios?
  boundaryAwareness: number;    // 0-1: Does it acknowledge limits?
  confounderHandling: number;   // 0-1: Does it control for hidden variables?
  causalDirection: number;      // 0-1: Is cause-effect direction clear?
  scenarios: CounterfactualScenario[];
  critique: string;             // Actionable critique for improvement
}

export class CounterfactualGenerator {
  private model: any;

  async initialize() {
    this.model = getClaudeModel();
  }

  /**
   * Generate counterfactual scenarios to test mechanism robustness
   * 
   * Pearl's counterfactual reasoning asks: "What if things had been different?"
   * We generate 3 types of counterfactuals:
   * 1. Boundary conditions: Extreme values of key variables
   * 2. Confounding factors: Hidden variables that affect the outcome
   * 3. Reversed causality: Flipping cause-effect direction
   */
  async generateScenarios(mechanism: string): Promise<CounterfactualScenario[]> {
    if (!mechanism || mechanism.trim().length < 20) {
      return []; // Graceful degradation for trivial mechanisms
    }

    const prompt = `You are a causal reasoning expert analyzing a proposed mechanism.

MECHANISM:
${mechanism}

Generate EXACTLY 3 counterfactual scenarios to test this mechanism's robustness:

1. **Boundary Condition**: What if a key variable is at an extreme value (very high, very low, zero, infinity)?
2. **Confounding Factor**: What if a hidden variable that wasn't mentioned affects the outcome?
3. **Reversed Causality**: What if the cause-effect direction is flipped (Y causes X instead of X causes Y)?

For each scenario, provide:
- **Condition**: The specific counterfactual "what-if" question
- **Expected Outcome**: What SHOULD happen according to the mechanism
- **Tests Purpose**: What aspect of robustness this tests

Return ONLY a JSON array with this structure:
[
  {
    "type": "boundary",
    "condition": "What if X approaches infinity?",
    "expectedOutcome": "The mechanism should...",
    "testsPurpose": "Tests whether mechanism acknowledges physical limits"
  },
  {
    "type": "confounding",
    "condition": "What if variable Z (not mentioned) also affects Y?",
    "expectedOutcome": "The mechanism should...",
    "testsPurpose": "Tests whether mechanism controls for hidden variables"
  },
  {
    "type": "reversed_causality",
    "condition": "What if Y causes X instead of X causing Y?",
    "expectedOutcome": "The mechanism should...",
    "testsPurpose": "Tests whether causal direction is justified"
  }
]

OUTPUT ONLY THE JSON ARRAY. NO MARKDOWN, NO EXPLANATIONS, NO CODE FENCES.`;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      // Clean up response (remove markdown code fences if present)
      let jsonText = responseText;
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      
      const scenarios = JSON.parse(jsonText);
      
      // Validate structure
      if (!Array.isArray(scenarios) || scenarios.length !== 3) {
        console.warn('[Counterfactual] Invalid scenario count, using fallback');
        return this.generateFallbackScenarios();
      }
      
      return scenarios;
    } catch (error) {
      console.error('[Counterfactual] Error generating scenarios:', error);
      return this.generateFallbackScenarios();
    }
  }

  /**
   * Evaluate mechanism against counterfactual scenarios
   * 
   * Scores mechanism on 4 dimensions:
   * - Completeness: Can it explain all scenarios?
   * - Boundary Awareness: Does it acknowledge limits?
   * - Confounder Handling: Does it control for hidden variables?
   * - Causal Direction: Is the cause-effect relationship clear?
   */
  async evaluateMechanism(
    mechanism: string,
    scenarios: CounterfactualScenario[]
  ): Promise<CounterfactualEvaluation> {
    if (!mechanism || scenarios.length === 0) {
      return {
        completeness: 0,
        boundaryAwareness: 0,
        confounderHandling: 0,
        causalDirection: 0,
        scenarios: [],
        critique: 'Mechanism too brief or scenarios unavailable for counterfactual analysis'
      };
    }

    const prompt = `You are a causal reasoning expert evaluating a mechanism's robustness.

MECHANISM:
${mechanism}

COUNTERFACTUAL SCENARIOS:
${scenarios.map((s, i) => `
${i + 1}. [${s.type.toUpperCase()}]
   Condition: ${s.condition}
   Expected: ${s.expectedOutcome}
   Tests: ${s.testsPurpose}
`).join('\n')}

Evaluate the mechanism on these 4 dimensions (score 0.0 to 1.0):

1. **Completeness**: Can the mechanism explain all 3 counterfactual scenarios?
   - 1.0 = Fully explains all scenarios with clear reasoning
   - 0.5 = Partially explains some scenarios
   - 0.0 = Cannot explain any scenario adequately

2. **Boundary Awareness**: Does it acknowledge physical/logical limits?
   - 1.0 = Explicitly states boundary conditions and failure modes
   - 0.5 = Implicitly aware but doesn't state limits
   - 0.0 = Ignores or contradicts boundary conditions

3. **Confounder Handling**: Does it control for hidden variables?
   - 1.0 = Explicitly addresses potential confounders
   - 0.5 = Acknowledges some variables but misses others
   - 0.0 = No mention of confounding factors

4. **Causal Direction**: Is the cause-effect relationship clear and justified?
   - 1.0 = Clear causal direction with physical/logical justification
   - 0.5 = Direction stated but not well-justified
   - 0.0 = Unclear or potentially reversed causality

Provide:
- Numerical scores (0.0-1.0) for each dimension
- A concise critique (2-3 sentences) with ACTIONABLE improvements

Return ONLY a JSON object:
{
  "completeness": 0.0-1.0,
  "boundaryAwareness": 0.0-1.0,
  "confounderHandling": 0.0-1.0,
  "causalDirection": 0.0-1.0,
  "critique": "Specific actionable feedback here..."
}

OUTPUT ONLY THE JSON OBJECT. NO MARKDOWN, NO EXPLANATIONS, NO CODE FENCES.`;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      // Clean up response
      let jsonText = responseText;
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      
      const evaluation = JSON.parse(jsonText);
      
      // Validate scores are in range
      const clamp = (val: number) => Math.max(0, Math.min(1, val));
      
      return {
        completeness: clamp(evaluation.completeness || 0),
        boundaryAwareness: clamp(evaluation.boundaryAwareness || 0),
        confounderHandling: clamp(evaluation.confounderHandling || 0),
        causalDirection: clamp(evaluation.causalDirection || 0),
        scenarios,
        critique: evaluation.critique || 'Evaluation unavailable'
      };
    } catch (error) {
      console.error('[Counterfactual] Error evaluating mechanism:', error);
      return {
        completeness: 0.5,
        boundaryAwareness: 0.5,
        confounderHandling: 0.5,
        causalDirection: 0.5,
        scenarios,
        critique: 'Counterfactual evaluation failed - using default scores'
      };
    }
  }

  /**
   * Fallback scenarios if LLM generation fails
   */
  private generateFallbackScenarios(): CounterfactualScenario[] {
    return [
      {
        type: 'boundary',
        condition: 'What if key variables are at extreme values?',
        expectedOutcome: 'Mechanism should explain behavior at limits',
        testsPurpose: 'Tests boundary condition awareness'
      },
      {
        type: 'confounding',
        condition: 'What if unmeasured variables affect the outcome?',
        expectedOutcome: 'Mechanism should acknowledge potential confounders',
        testsPurpose: 'Tests hidden variable consideration'
      },
      {
        type: 'reversed_causality',
        condition: 'What if causality runs in the opposite direction?',
        expectedOutcome: 'Mechanism should justify causal direction',
        testsPurpose: 'Tests causal reasoning clarity'
      }
    ];
  }

  /**
   * Calculate novelty fault (for causal_credit)
   * Based on similarity to prior art
   */
  calculateNoveltyFault(priorArt: any[]): number {
    if (!priorArt || priorArt.length === 0) {
      return 0; // No prior art = highly novel
    }
    
    // Simple heuristic: more prior art = less novel
    // In production, use semantic similarity
    const similarityScore = Math.min(priorArt.length / 10, 1.0);
    return similarityScore;
  }
}
