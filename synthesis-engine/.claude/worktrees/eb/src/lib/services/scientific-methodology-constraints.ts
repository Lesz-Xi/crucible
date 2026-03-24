/**
 * Scientific Methodology Constraints
 * 
 * Enforces scientific methodology over social accommodation patterns.
 * These constraints are injected into the prompt to guide response generation.
 */

export const SCIENTIFIC_METHODOLOGY_CONSTRAINTS = [
    // === FALSIFIABILITY ===
    "Every claim must be falsifiable - state what would disprove it",
    "No unfalsifiable assertions (e.g., 'it could be anything', 'this is beyond investigation')",
    "If a claim cannot be tested, it must not be asserted as true",

    // === EVIDENCE GROUNDING ===
    "Every positive claim requires evidence or explicit uncertainty",
    "Evidence must be traceable to source (citation, observation, or logical derivation)",
    "Distinguish between strong evidence (direct observation) and weak evidence (inference)",

    // === HYPOTHESIS STRUCTURE ===
    "Hypotheses must include: prediction, test method, and falsification criteria",
    "Correlation claims must be distinguished from causation claims",
    "State assumptions explicitly - hidden assumptions are forbidden",

    // === UNCERTAINTY HANDLING ===
    "Uncertainty must be quantified (confidence interval, probability, or qualitative level)",
    "Epistemic humility is mandatory - state what is unknown",
    "Confidence levels must match evidence strength",

    // === ACTIVE INVESTIGATION ===
    "When evidence is insufficient, propose the next experiment",
    "Never end with 'we cannot know' - always propose a test",
    "Every uncertainty is a target for experimental reduction",

    // === CAUSAL RIGOR ===
    "Distinguish observation (seeing X) from intervention (doing X)",
    "Causal claims require causal structure (mechanism or SCM support)",
    "Counterfactuals must be grounded in causal model",

    // === NO SYCOPHANCY ===
    "No agreement without evidence - validate claims, not people",
    "No performative validation ('great question') - proceed directly to investigation",
    "No accommodation over truth - scientific rigor overrides social comfort",
] as const;

/**
 * Social accommodation patterns to eliminate
 */
export const SOCIAL_ACCOMMODATION_PATTERNS = {
    agreementWithoutEvidence: [
        "you're right",
        "you are right",
        "that's correct",
        "absolutely correct",
        "I agree",
        "completely agree",
        "exactly",
        "precisely right",
    ],

    performativeValidation: [
        "great question",
        "excellent point",
        "good observation",
        "I appreciate your",
        "thank you for asking",
        "interesting perspective",
    ],

    accommodationOverTruth: [
        "from your perspective",
        "if that's what you believe",
        "I can see why you would think",
        "that makes sense from your point of view",
        "your intuition is reasonable",
    ],

    hedgingWithoutFalsification: [
        "that's one possible interpretation",
        "there are many ways to look at this",
        "both perspectives have merit",
        "it depends on how you look at it",
        "that's a valid perspective",
    ],

    epistemicSurrender: [
        "we can't know for sure",
        "this is unknowable",
        "there's no way to verify",
        "it's impossible to determine",
        "beyond our ability to know",
    ],
} as const;

/**
 * Scientific method phases for response scaffolding
 */
export const SCIENTIFIC_METHOD_PHASES = {
    observation: {
        description: "What phenomenon is under investigation?",
        required: true,
        outputKey: "observation",
    },
    hypothesis: {
        description: "What is the proposed explanation?",
        required: true,
        outputKey: "hypothesis",
    },
    prediction: {
        description: "What would we expect if hypothesis is true?",
        required: true,
        outputKey: "prediction",
    },
    falsification: {
        description: "What would disprove this hypothesis?",
        required: true,
        outputKey: "falsificationCriteria",
    },
    test: {
        description: "How can we verify or resolve uncertainty?",
        required: true,
        outputKey: "testProposal",
    },
} as const;

/**
 * Generate constraint prompt section
 */
export function formatConstraintsForPrompt(): string {
    return [
        "SCIENTIFIC METHODOLOGY CONSTRAINTS:",
        ...SCIENTIFIC_METHODOLOGY_CONSTRAINTS.map((c, i) => `${i + 1}. ${c}`),
    ].join('\n');
}

/**
 * Check if text contains social accommodation patterns
 */
export function detectSocialAccommodation(text: string): {
    detected: boolean;
    patterns: string[];
    categories: string[];
} {
    const detectedPatterns: string[] = [];
    const categories: string[] = [];
    const lowerText = text.toLowerCase();

    for (const [category, patterns] of Object.entries(SOCIAL_ACCOMMODATION_PATTERNS)) {
        for (const pattern of patterns) {
            if (lowerText.includes(pattern.toLowerCase())) {
                detectedPatterns.push(pattern);
                if (!categories.includes(category)) {
                    categories.push(category);
                }
            }
        }
    }

    return {
        detected: detectedPatterns.length > 0,
        patterns: detectedPatterns,
        categories,
    };
}

/**
 * Generate scientific method scaffold for prompt
 */
export function formatScientificMethodScaffold(): string {
    return Object.entries(SCIENTIFIC_METHOD_PHASES)
        .map(([phase, config]) => {
            const req = config.required ? "(REQUIRED)" : "(OPTIONAL)";
            return `### ${phase.toUpperCase()} ${req}\n${config.description}`;
        })
        .join('\n\n');
}

/**
 * Constraint validation result
 */
export interface ConstraintValidationResult {
    valid: boolean;
    violations: {
        constraint: string;
        evidence: string;
        severity: "fatal" | "warning";
    }[];
    socialAccommodationDetected: boolean;
    socialAccommodationPatterns: string[];
}

/**
 * Validate response against scientific methodology constraints
 */
export function validateAgainstConstraints(response: string): ConstraintValidationResult {
    const violations: ConstraintValidationResult["violations"] = [];

    // Check for unfalsifiable claims
    const unfalsifiablePatterns = [
        /could be (anything|everything)/i,
        /impossible to (know|verify|test|determine)/i,
        /beyond (scientific|empirical) (investigation|scope)/i,
        /we can't know/i,
        /unknowable/i,
    ];

    for (const pattern of unfalsifiablePatterns) {
        if (pattern.test(response)) {
            violations.push({
                constraint: "Falsifiability",
                evidence: response.match(pattern)?.[0] || "",
                severity: "fatal",
            });
        }
    }

    // Check for social accommodation
    const socialCheck = detectSocialAccommodation(response);

    // Check for missing scientific method phases
    const hasObservation = /observation/i.test(response);
    const hasHypothesis = /hypothesis/i.test(response);
    const hasPrediction = /prediction/i.test(response);
    const hasFalsification = /falsif/i.test(response);
    const hasTest = /test|experiment/i.test(response);

    if (!hasHypothesis && response.length > 200) {
        violations.push({
            constraint: "Hypothesis Structure",
            evidence: "No hypothesis formulation detected",
            severity: "warning",
        });
    }

    if (!hasFalsification && response.length > 200) {
        violations.push({
            constraint: "Falsification Criteria",
            evidence: "No falsification criteria detected",
            severity: "warning",
        });
    }

    return {
        valid: violations.filter(v => v.severity === "fatal").length === 0,
        violations,
        socialAccommodationDetected: socialCheck.detected,
        socialAccommodationPatterns: socialCheck.patterns,
    };
}