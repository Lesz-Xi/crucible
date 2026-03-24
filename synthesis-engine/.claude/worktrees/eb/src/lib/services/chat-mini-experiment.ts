/**
 * Chat Mini-Experiment Service
 * 
 * Replaces conversational fast-path heuristics with hypothesis-driven response generation.
 * Even simple queries become mini-experiments with falsification criteria.
 */

import { getClaudeModel } from "@/lib/ai/anthropic";
import { safeParseJson } from "@/lib/ai/ai-utils";

/**
 * Mini-experiment structure for hypothesis-driven responses
 */
export interface MiniExperiment {
    /** What phenomenon is the user asking about */
    observation: string;

    /** Tentative answer or explanation */
    hypothesis: string;

    /** What would confirm/falsify the hypothesis */
    prediction: string;

    /** How to verify the hypothesis */
    testMethod: string;

    /** Prior confidence in hypothesis (0-1) */
    confidence: number;

    /** Can this be tested? */
    falsifiability: boolean;

    /** Is this a simple query that doesn't need full pipeline? */
    isSimpleQuery: boolean;

    /** Falsification criteria */
    falsificationCriteria: string;

    /** Next epistemic step */
    nextStep: string;
}

/**
 * Options for mini-experiment generation
 */
export interface MiniExperimentOptions {
    /** Maximum tokens for response */
    maxTokens?: number;

    /** Require falsification criteria */
    requireFalsification?: boolean;

    /** User context for personalization */
    userContext?: string;

    /** Conversation history */
    conversationContext?: string;
}

/**
 * Result of mini-experiment generation
 */
export interface MiniExperimentResult {
    experiment: MiniExperiment;
    rawResponse: string;
    processingTimeMs: number;
}

/**
 * Prompt template for mini-experiment generation
 */
const MINI_EXPERIMENT_PROMPT = `You are a Principal Investigator conducting rapid hypothesis testing.

User input: "{{USER_QUESTION}}"

{{CONTEXT_SECTION}}

Generate a mini-experiment following the scientific method:

1. OBSERVATION: What phenomenon is the user describing or asking about?
2. HYPOTHESIS: What is the most likely explanation or answer?
3. PREDICTION: What would we expect to observe if hypothesis is true?
4. FALSIFICATION: What would disprove this hypothesis?
5. TEST: How can we verify this in the next interaction?

**CONSTRAINTS:**
- Every claim must be falsifiable
- No sycophantic agreement ("you're right", "great question")
- No epistemic surrender ("we can't know")
- State confidence level (0-1) based on evidence strength
- Propose next epistemic step

Output as JSON:
{
  "observation": "string - what phenomenon is under investigation",
  "hypothesis": "string - proposed explanation",
  "prediction": "string - expected observation if hypothesis is true",
  "falsificationCriteria": "string - what would disprove",
  "testMethod": "string - how to verify",
  "confidence": number between 0 and 1,
  "falsifiability": boolean - can this be tested?,
  "isSimpleQuery": boolean - is this a simple social query?,
  "nextStep": "string - proposed next epistemic action"
}`;

/**
 * Generate a mini-experiment for a user query
 */
export async function generateMiniExperiment(
    userQuestion: string,
    options: MiniExperimentOptions = {}
): Promise<MiniExperimentResult> {
    const startTime = Date.now();

    const contextSection = options.conversationContext
        ? `**CONVERSATION CONTEXT:**\n${options.conversationContext}\n`
        : "";

    const prompt = MINI_EXPERIMENT_PROMPT
        .replace("{{USER_QUESTION}}", userQuestion)
        .replace("{{CONTEXT_SECTION}}", contextSection);

    try {
        const model = getClaudeModel();
        const response = await model.generateContent(prompt);

        const responseText = response.response.text();

        // Parse JSON response
        const experiment = safeParseJson<MiniExperiment>(responseText, {
            observation: `User query: ${userQuestion}`,
            hypothesis: "Unable to generate hypothesis",
            prediction: "N/A",
            testMethod: "Direct response required",
            confidence: 0.5,
            falsifiability: true,
            isSimpleQuery: true,
            falsificationCriteria: "User feedback on response accuracy",
            nextStep: "Await user clarification",
        });

        // Validate required fields
        if (!experiment.falsificationCriteria) {
            experiment.falsificationCriteria = "User feedback on response accuracy";
        }

        if (!experiment.nextStep) {
            experiment.nextStep = "Await user response to verify hypothesis";
        }

        return {
            experiment,
            rawResponse: responseText,
            processingTimeMs: Date.now() - startTime,
        };
    } catch (error) {
        console.error("[MiniExperiment] Generation failed:", error);

        // Return fallback experiment
        return {
            experiment: {
                observation: `User query: ${userQuestion}`,
                hypothesis: "Technical difficulty - unable to generate hypothesis",
                prediction: "N/A",
                testMethod: "Direct response required",
                confidence: 0.3,
                falsifiability: true,
                isSimpleQuery: true,
                falsificationCriteria: "User feedback on response helpfulness",
                nextStep: "Retry with simplified query",
            },
            rawResponse: "",
            processingTimeMs: Date.now() - startTime,
        };
    }
}

/**
 * Format mini-experiment as user-facing response
 */
export function formatMiniExperimentResponse(experiment: MiniExperiment): string {
    if (experiment.isSimpleQuery && experiment.confidence > 0.8) {
        // Simple high-confidence query - return concise response
        return `${experiment.hypothesis}

*Confidence: ${Math.round(experiment.confidence * 100)}%*`;
    }

    // Full mini-experiment format
    return `**Observation:** ${experiment.observation}

**Hypothesis:** ${experiment.hypothesis}

**Prediction:** ${experiment.prediction}

**Falsification:** ${experiment.falsificationCriteria}

**Confidence:** ${Math.round(experiment.confidence * 100)}%

---
*Next step: ${experiment.nextStep}*`;
}

/**
 * Format mini-experiment for SSE event
 */
export function formatMiniExperimentEvent(experiment: MiniExperiment): Record<string, unknown> {
    return {
        type: "mini_experiment",
        observation: experiment.observation,
        hypothesis: experiment.hypothesis,
        prediction: experiment.prediction,
        falsificationCriteria: experiment.falsificationCriteria,
        testMethod: experiment.testMethod,
        confidence: experiment.confidence,
        falsifiability: experiment.falsifiability,
        isSimpleQuery: experiment.isSimpleQuery,
        nextStep: experiment.nextStep,
    };
}

/**
 * Check if a query should use mini-experiment path
 */
export function shouldUseMiniExperiment(userQuestion: string): boolean {
    const lowerQ = userQuestion.trim().toLowerCase();

    // Simple greetings - still get hypothesis treatment but very brief
    const isGreeting = /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/i.test(lowerQ);

    // Identity questions
    const isIdentityQuery = /(who|what) (are|is) (you|this)/i.test(lowerQ);

    // Simple thanks
    const isThanks = /^(thanks|thank you|thx)/i.test(lowerQ);

    // Very short queries (< 20 chars) that aren't scientific
    const isVeryShort = lowerQ.length < 20 && !/^(why|how|what|when|where|which)/i.test(lowerQ);

    // Use mini-experiment for these, but mark as simple
    return isGreeting || isIdentityQuery || isThanks || isVeryShort || lowerQ.length < 150;
}

/**
 * Generate quick response for simple social queries
 * (Still hypothesis-driven but very brief)
 */
export async function generateQuickSocialResponse(
    userQuestion: string,
    options: MiniExperimentOptions = {}
): Promise<string> {
    const lowerQ = userQuestion.trim().toLowerCase();

    // Greeting hypothesis
    if (/^(hi|hello|hey|greetings)/i.test(lowerQ)) {
        return "Hello. I'm ready to investigate. What phenomenon would you like to explore?";
    }

    // Identity hypothesis
    if (/(who|what) (are|is) (you|this)/i.test(lowerQ)) {
        return "I'm a Principal Investigator - an automated scientist designed to help you explore hypotheses, design experiments, and pursue falsifiable knowledge. What would you like to investigate?";
    }

    // Thanks hypothesis
    if (/^(thanks|thank you)/i.test(lowerQ)) {
        return "Acknowledged. What's the next hypothesis to test?";
    }

    // Generate mini-experiment for other simple queries
    const result = await generateMiniExperiment(userQuestion, options);
    return formatMiniExperimentResponse(result.experiment);
}