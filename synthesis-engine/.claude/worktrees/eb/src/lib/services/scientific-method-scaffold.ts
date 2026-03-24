/**
 * Scientific Method Scaffold Service
 *
 * Provides prompt architecture that encodes scientific method phases
 * (observation, hypothesis, prediction, experimentation, analysis, revision)
 * as mandatory response scaffolding.
 */

/**
 * Scientific method phases
 */
export type ScientificPhase =
    | "observation"
    | "hypothesis"
    | "prediction"
    | "experiment"
    | "analysis"
    | "revision";

/**
 * Phase configuration
 */
export interface PhaseConfig {
    name: string;
    description: string;
    required: boolean;
    outputKey: string;
    promptTemplate: string;
}

/**
 * Scientific method scaffold configuration
 */
export const SCIENTIFIC_METHOD_SCAFFOLD: Record<ScientificPhase, PhaseConfig> = {
    observation: {
        name: "Observation",
        description: "What phenomenon is under investigation?",
        required: true,
        outputKey: "observation",
        promptTemplate: "Identify the phenomenon under investigation. What data/evidence is available? What is unknown or uncertain?",
    },

    hypothesis: {
        name: "Hypothesis",
        description: "What is the proposed explanation?",
        required: true,
        outputKey: "hypothesis",
        promptTemplate: "Propose a falsifiable explanation. What causal mechanism is posited? What assumptions are required?",
    },

    prediction: {
        name: "Prediction",
        description: "What would we expect if hypothesis is true?",
        required: true,
        outputKey: "prediction",
        promptTemplate: "Derive testable consequences from the hypothesis. What specific outcome is predicted? What quantitative/qualitative signal?",
    },

    experiment: {
        name: "Experiment",
        description: "How can we test this?",
        required: true,
        outputKey: "testProposal",
        promptTemplate: "Design a test to validate or falsify. What intervention would test the hypothesis? What measurements are needed?",
    },

    analysis: {
        name: "Analysis",
        description: "How do results compare to prediction?",
        required: false,
        outputKey: "analysis",
        promptTemplate: "Evaluate results against prediction. Does evidence support or contradict the hypothesis? What confidence level?",
    },

    revision: {
        name: "Revision",
        description: "How should the hypothesis be updated?",
        required: false,
        outputKey: "revision",
        promptTemplate: "Update hypothesis based on evidence. What modifications are needed? What further tests are required?",
    },
};

/**
 * Scaffolded response structure
 */
export interface ScaffoldedResponse {
    observation: string;
    hypothesis: string;
    prediction: string;
    testProposal: string;
    falsificationCriteria: string;
    confidence: number;
    analysis?: string;
    revision?: string;
    nextStep: string;
}

/**
 * Options for scaffold generation
 */
export interface ScaffoldOptions {
    /** Include optional phases (analysis, revision) */
    includeOptionalPhases?: boolean;

    /** Custom context to include */
    context?: string;

    /** Domain-specific constraints */
    constraints?: string[];

    /** Prior conversation context */
    conversationContext?: string;
}

/**
 * Generate the scientific method scaffold prompt section
 */
export function generateScaffoldPrompt(options: ScaffoldOptions = {}): string {
    const phases = Object.entries(SCIENTIFIC_METHOD_SCAFFOLD);

    let prompt = "## RESPONSE STRUCTURE (MANDATORY)\n\n";

    for (const [key, config] of phases) {
        if (!config.required && !options.includeOptionalPhases) {
            continue;
        }

        const reqMarker = config.required ? "(REQUIRED)" : "(OPTIONAL)";
        prompt += `### Phase: ${config.name} ${reqMarker}\n`;
        prompt += `${config.description}\n`;
        prompt += `${config.promptTemplate}\n\n`;
    }

    // Add falsification requirement
    prompt += `### Falsification Criteria (REQUIRED)
State explicitly what would disprove the hypothesis. If nothing can disprove it, the hypothesis is invalid.

`;

    // Add next step requirement
    prompt += `### Next Step (REQUIRED)
Propose the next epistemic action. What experiment, observation, or analysis would advance understanding?

`;

    // Add output format
    prompt += `---

**OUTPUT FORMAT:**
\`\`\`json
{
  "observation": "string - phenomenon under investigation",
  "hypothesis": "string - falsifiable explanation",
  "prediction": "string - testable consequence",
  "falsificationCriteria": "string - what would disprove",
  "testProposal": "string - how to test",
  "confidence": number between 0 and 1,
  "nextStep": "string - next epistemic action"
}
\`\`\`
`;

    return prompt;
}

/**
 * Generate full system prompt with scientific method scaffold
 */
export function generateScientistSystemPrompt(
    question: string,
    options: ScaffoldOptions = {}
): string {
    const contextSection = options.context
        ? `\n**CONTEXT:**\n${options.context}\n`
        : "";

    const constraintsSection = options.constraints && options.constraints.length > 0
        ? `\n**CONSTRAINTS:**\n${options.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n`
        : "";

    const conversationSection = options.conversationContext
        ? `\n**CONVERSATION CONTEXT:**\n${options.conversationContext}\n`
        : "";

    return `You are the **Principal Investigator (PI)**, an Automated Scientist that embodies the scientific method as a computational framework.

**YOUR IDENTITY:**
You are not a chatbot. You are a scientist. Your purpose is not to accommodate, but to investigate. Your goal is not to agree, but to falsify.

**YOUR METHODOLOGY:**
You follow the scientific method as a mandatory response scaffold. Every response must advance through Observation -> Hypothesis -> Prediction -> Falsification -> Test phases.

**YOUR CONSTRAINTS:**
- No unfalsifiable claims
- No sycophantic agreement
- No epistemic surrender
- No accommodation over truth
- No claim without evidence or explicit uncertainty

${generateScaffoldPrompt(options)}
${contextSection}${constraintsSection}${conversationSection}
**CRITICAL:**
- No response without falsification criteria
- No claim without evidence or explicit uncertainty
- No uncertainty without proposed test
- No sycophancy - only scientific rigor

User asks: "${question}"

Respond as the Principal Investigator:`;
}

/**
 * Validate that a response follows the scaffold
 */
export function validateScaffoldCompliance(response: string): {
    compliant: boolean;
    missingPhases: ScientificPhase[];
    hasFalsification: boolean;
    hasNextStep: boolean;
    issues: string[];
} {
    const issues: string[] = [];
    const missingPhases: ScientificPhase[] = [];

    // Check for required phases
    const phaseChecks: Record<ScientificPhase, boolean> = {
        observation: /observation/i.test(response),
        hypothesis: /hypothesis/i.test(response),
        prediction: /prediction/i.test(response),
        experiment: /experiment|test/i.test(response),
        analysis: /analysis/i.test(response),
        revision: /revision|update/i.test(response),
    };

    for (const [phase, config] of Object.entries(SCIENTIFIC_METHOD_SCAFFOLD)) {
        if (config.required && !phaseChecks[phase as ScientificPhase]) {
            missingPhases.push(phase as ScientificPhase);
            issues.push(`Missing required phase: ${config.name}`);
        }
    }

    // Check for falsification
    const hasFalsification = /falsif|disprove|would (not |fail to )?occur/i.test(response);
    if (!hasFalsification) {
        issues.push("Missing falsification criteria");
    }

    // Check for next step
    const hasNextStep = /next (step|action|test|experiment)|proposed|recommend/i.test(response);
    if (!hasNextStep) {
        issues.push("Missing next step proposal");
    }

    return {
        compliant: missingPhases.length === 0 && hasFalsification && hasNextStep,
        missingPhases,
        hasFalsification,
        hasNextStep,
        issues,
    };
}

/**
 * Format scaffolded response for display
 */
export function formatScaffoldedResponse(response: ScaffoldedResponse): string {
    let formatted = `**Observation:** ${response.observation}

**Hypothesis:** ${response.hypothesis}

**Prediction:** ${response.prediction}

**Falsification Criteria:** ${response.falsificationCriteria}

**Test Proposal:** ${response.testProposal}

**Confidence:** ${Math.round(response.confidence * 100)}%`;

    if (response.analysis) {
        formatted += `

**Analysis:** ${response.analysis}`;
    }

    if (response.revision) {
        formatted += `

**Revision:** ${response.revision}`;
    }

    formatted += `

---
*Next step: ${response.nextStep}*`;

    return formatted;
}

/**
 * Format scaffold event for SSE
 */
export function formatScaffoldEvent(response: ScaffoldedResponse): Record<string, unknown> {
    return {
        type: "scientific_scaffold",
        observation: response.observation,
        hypothesis: response.hypothesis,
        prediction: response.prediction,
        falsificationCriteria: response.falsificationCriteria,
        testProposal: response.testProposal,
        confidence: response.confidence,
        analysis: response.analysis,
        revision: response.revision,
        nextStep: response.nextStep,
    };
}