import {
  CausalOutputContract,
  CausalStatus,
  Contradiction,
  InterventionEvidenceClass,
  NovelIdea,
} from "@/types";

type DirectedEdge = { from: string; to: string };

export interface CausalOutputBuildContext {
  modelRef?: string;
  variables?: string[];
  directedEdges?: DirectedEdge[];
  assumptions?: string[];
  contradictions?: Contradiction[];
}

const BANNED_CERTAINTY_PATTERNS: Array<[RegExp, string]> = [
  [/\bproves?\b/gi, "suggests"],
  [/\bdemonstrates?\b/gi, "indicates"],
  [/\bshows that\b/gi, "is consistent with"],
  [/\btherefore\b/gi, "so"],
];

function sanitizeText(value: string | undefined | null): string {
  if (!value) return "";
  return value.replace(/\*+/g, "").replace(/`+/g, "").replace(/\s+/g, " ").trim();
}

function softenCertaintyLanguage(value: string | undefined | null): string {
  const sanitized = sanitizeText(value);
  if (!sanitized) return "";

  return BANNED_CERTAINTY_PATTERNS.reduce((acc, [pattern, replacement]) => {
    return acc.replace(pattern, replacement);
  }, sanitized);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => sanitizeText(value)).filter(Boolean)));
}

function toSentence(value: string, fallback: string): string {
  const cleaned = sanitizeText(value);
  if (!cleaned) return fallback;
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function toPercent(value?: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  if (value <= 1) return Math.max(0, Math.min(100, value * 100));
  return Math.max(0, Math.min(100, value));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeScore(value?: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  if (value > 1) return clamp01(value / 100);
  return clamp01(value);
}

function buildFallbackEdges(variables: string[]): DirectedEdge[] {
  if (variables.length < 2) return [];
  const edges: DirectedEdge[] = [];
  for (let i = 0; i < variables.length - 1; i += 1) {
    edges.push({ from: variables[i], to: variables[i + 1] });
  }
  return edges.slice(0, 6);
}

function classifyAssumptionType(value: string): "empirical" | "theoretical" | "convenience-based" {
  const normalized = value.toLowerCase();
  if (/(measured|observed|data|empirical|experiment|evidence)/.test(normalized)) return "empirical";
  if (/(assume|linear|exchangeability|identifi|independent|model|prior)/.test(normalized)) return "theoretical";
  return "convenience-based";
}

function classifyInterventionClass(idea: NovelIdea): InterventionEvidenceClass {
  const hasDoPlan = Boolean(sanitizeText(idea.doPlan));
  const hasEmpiricalValidation = idea.validationResult?.success === true;
  if (hasEmpiricalValidation) return "Empirical (Data-Grounded)";
  if (hasDoPlan) return "Simulated (Assumption-Bound)";
  return "Structural (Graph-Inferred Only)";
}

function classifyCausalStatus(idea: NovelIdea): CausalOutputContract["statusBanner"] {
  const hasDoPlan = Boolean(sanitizeText(idea.doPlan));
  const confounders = idea.confounderSet ?? [];
  const hasConfounders = confounders.length > 0;
  const hasFalsifier = Boolean(sanitizeText(idea.falsifier));
  const identifiability = normalizeScore(idea.identifiabilityScore);
  const hasEmpiricalValidation = idea.validationResult?.success === true;
  const failedValidation = idea.validationResult?.success === false;
  const lowValidity = (idea.criticalAnalysis?.validityScore ?? 100) < 35;

  let status: CausalStatus;
  if (failedValidation || lowValidity) {
    status = "Falsified / Inconclusive";
  } else if (hasEmpiricalValidation && hasDoPlan && hasConfounders && identifiability >= 0.7) {
    status = "Identified (Intervention-Supported)";
  } else if (hasDoPlan || identifiability >= 0.45 || hasConfounders) {
    status = "Partially Identified (Intervention-Inferred)";
  } else {
    status = "Exploratory (Association-Level)";
  }

  let downgradedByMissingFalsifier = false;
  if (!hasFalsifier && status === "Identified (Intervention-Supported)") {
    status = "Partially Identified (Intervention-Inferred)";
    downgradedByMissingFalsifier = true;
  }

  const justificationParts: string[] = [];
  if (status === "Falsified / Inconclusive") {
    justificationParts.push("Validation signals conflict with the current causal claim.");
  } else {
    justificationParts.push(
      hasDoPlan
        ? "An explicit intervention plan is present."
        : "No explicit do-intervention plan is present."
    );
    justificationParts.push(
      hasConfounders
        ? `Confounders are declared (${confounders.slice(0, 3).join(", ")}).`
        : "Confounders are under-specified."
    );
    if (identifiability > 0) {
      justificationParts.push(
        `Identifiability support is ${Math.round(identifiability * 100)} out of 100.`
      );
    }
    if (hasEmpiricalValidation) {
      justificationParts.push("Interventional validation evidence is available.");
    }
    if (!hasFalsifier) {
      justificationParts.push("No falsifier is defined, so certainty is capped.");
    }
  }

  return {
    status,
    justification: softenCertaintyLanguage(toSentence(justificationParts.join(" "), "Status inferred from available evidence.")),
    downgradedByMissingFalsifier,
  };
}

function buildInterventionNotes(idea: NovelIdea, cls: InterventionEvidenceClass): string[] {
  if (cls === "Empirical (Data-Grounded)") {
    const pValue = idea.validationResult?.metrics?.pValue;
    return [
      "Empirical intervention evidence was observed in validation outputs.",
      typeof pValue === "number"
        ? `Observed p-value from validation: ${pValue.toFixed(4)}.`
        : "Statistical detail is incomplete; inspect raw validation outputs.",
    ];
  }

  if (cls === "Simulated (Assumption-Bound)") {
    return [
      "Intervention effects are simulated under declared assumptions.",
      "No empirical intervention performed; treat outputs as assumption-bound propagation.",
    ];
  }

  return [
    "Effects are inferred from graph topology and mechanism structure.",
    "No empirical intervention performed; this is structural hypothesis propagation only.",
  ];
}

function buildAssumptionsAndConfounders(
  idea: NovelIdea,
  context: CausalOutputBuildContext
): CausalOutputContract["assumptionsAndConfounders"] {
  const assumptionsFromContext = context.assumptions ?? [];
  const confounders = idea.confounderSet ?? [];

  const records: CausalOutputContract["assumptionsAndConfounders"] = [];

  for (const assumption of assumptionsFromContext.slice(0, 5)) {
    const typed = classifyAssumptionType(assumption);
    records.push({
      assumption: softenCertaintyLanguage(toSentence(assumption, "Assumption not specified.")),
      type: typed,
      failureImpact:
        typed === "empirical"
          ? "Observed relationships may not transport to the claimed intervention context."
          : typed === "theoretical"
            ? "Identification logic weakens and causal status must be downgraded."
            : "Model convenience assumptions may inflate apparent certainty.",
    });
  }

  for (const confounder of confounders.slice(0, 5)) {
    records.push({
      assumption: `Confounder control is required for ${sanitizeText(confounder)}.`,
      type: "empirical",
      failureImpact: "Backdoor paths may stay open, biasing estimated intervention effect.",
    });
  }

  if (records.length === 0) {
    records.push({
      assumption: "No explicit assumptions or confounders were provided.",
      type: "convenience-based",
      failureImpact: "Causal status remains exploratory until assumptions are specified.",
    });
  }

  return records;
}

function buildUnresolvedGaps(
  idea: NovelIdea,
  status: CausalStatus,
  cls: InterventionEvidenceClass
): string[] {
  const gaps: string[] = [];
  if (!sanitizeText(idea.falsifier)) gaps.push("Missing falsifier for direct disconfirmation.");
  if (!(idea.confounderSet ?? []).length) gaps.push("Confounders are under-specified.");
  if (!sanitizeText(idea.doPlan)) gaps.push("No explicit do-intervention plan.");
  if (cls !== "Empirical (Data-Grounded)") gaps.push("No empirical interventional evidence.");
  if (normalizeScore(idea.identifiabilityScore) < 0.6) gaps.push("Identifiability support is below strong threshold.");
  if (status === "Falsified / Inconclusive") gaps.push("Current evidence is internally inconsistent.");
  if (gaps.length === 0) return ["None identified yet."];
  return unique(gaps);
}

function buildNextScientificAction(idea: NovelIdea, gaps: string[]): string {
  const hasGap = (fragment: string) => gaps.some((item) => item.toLowerCase().includes(fragment));

  if (hasGap("falsifier")) {
    return "Define one concrete falsifier with a pre-registered failure threshold and stop rule.";
  }
  if (hasGap("do-intervention")) {
    return "Design and run one explicit do-intervention targeting the proposed cause variable.";
  }
  if (hasGap("confounders")) {
    return "Measure and control the top confounders before estimating intervention effects.";
  }
  if (hasGap("empirical")) {
    return "Collect one empirical intervention dataset to replace assumption-only propagation.";
  }

  const cause = sanitizeText(idea.bridgedConcepts?.[0]) || "cause";
  const effect = sanitizeText(idea.bridgedConcepts?.[1]) || "outcome";
  return `Run a disconfirming experiment for ${cause} -> ${effect} under matched confounder controls.`;
}

function buildCounterfactualLayer(idea: NovelIdea): CausalOutputContract["counterfactualLayer"] {
  const hasFalsifier = Boolean(sanitizeText(idea.falsifier));
  const hasDoPlan = Boolean(sanitizeText(idea.doPlan));
  const hasConfounders = (idea.confounderSet ?? []).length > 0;

  return {
    necessity: hasFalsifier
      ? "Necessity can be probed by removing the proposed cause and evaluating falsifier criteria."
      : "Necessity is not evaluable because no falsifier is currently specified.",
    sufficiency: hasDoPlan
      ? hasConfounders
        ? "Sufficiency is evaluable under the declared intervention and confounder controls."
        : "Sufficiency is only weakly evaluable because confounders are under-specified."
      : "Sufficiency is not evaluable because no explicit intervention plan is provided.",
    evaluable: {
      necessity: hasFalsifier,
      sufficiency: hasDoPlan && hasConfounders,
    },
  };
}

function deriveStressTestInterpretation(idea: NovelIdea): CausalOutputContract["stressTestInterpretation"] {
  const validity = idea.criticalAnalysis?.validityScore;
  if (typeof validity !== "number") return undefined;

  const challengedAssumption =
    sanitizeText(idea.falsifier) ||
    "Primary causal assumption was challenged via internal audit constraints.";

  if (validity < 45) {
    return {
      challengedAssumption,
      result: "collapsed",
      statusDowngraded: true,
    };
  }
  if (validity < 70) {
    return {
      challengedAssumption,
      result: "weakened",
      statusDowngraded: true,
    };
  }

  return {
    challengedAssumption,
    result: "survived",
    statusDowngraded: false,
  };
}

function deriveCausalClaim(idea: NovelIdea): string {
  const candidate =
    sanitizeText(idea.thesis) ||
    sanitizeText(idea.prediction) ||
    sanitizeText(idea.description) ||
    "A causal relationship is hypothesized under declared assumptions.";

  return toSentence(softenCertaintyLanguage(candidate), "A causal claim is not yet available.");
}

export function buildCausalOutputContract(
  idea: NovelIdea,
  context: CausalOutputBuildContext = {}
): CausalOutputContract {
  const statusBanner = classifyCausalStatus(idea);
  const interventionClass = classifyInterventionClass(idea);

  const variables = unique([
    ...(context.variables ?? []),
    ...((idea.bridgedConcepts ?? []).map((item) => sanitizeText(item))),
  ]).slice(0, 12);

  const directedEdges = (context.directedEdges && context.directedEdges.length > 0
    ? context.directedEdges
    : buildFallbackEdges(variables)
  ).slice(0, 16);

  const confounders = unique(idea.confounderSet ?? []).slice(0, 8);
  const mechanismSummary = toSentence(
    softenCertaintyLanguage(
      sanitizeText(idea.mechanism) ||
      sanitizeText(idea.explanatoryMechanism) ||
      sanitizeText(idea.description)
    ),
    "Mechanism is not fully specified."
  );

  const assumptionsAndConfounders = buildAssumptionsAndConfounders(idea, context);
  const unresolvedGaps = buildUnresolvedGaps(idea, statusBanner.status, interventionClass);

  return {
    statusBanner,
    causalClaim: deriveCausalClaim(idea),
    supportingStructure: {
      modelRef: sanitizeText(context.modelRef) || "Model reference unavailable",
      variables: variables.length > 0 ? variables : ["Variable set unavailable"],
      directedEdges,
      confounders,
      mechanismSummary,
    },
    interventionLayer: {
      class: interventionClass,
      notes: buildInterventionNotes(idea, interventionClass),
      ...(interventionClass === "Simulated (Assumption-Bound)"
        ? {
          assumptionsForSimulation: assumptionsAndConfounders
            .slice(0, 4)
            .map((item) => item.assumption),
        }
        : {}),
    },
    counterfactualLayer: buildCounterfactualLayer(idea),
    assumptionsAndConfounders,
    stressTestInterpretation: deriveStressTestInterpretation(idea),
    unresolvedGaps,
    nextScientificAction: buildNextScientificAction(idea, unresolvedGaps),
  };
}

export function enrichIdeaWithCausalOutput(
  idea: NovelIdea,
  context: CausalOutputBuildContext = {}
): NovelIdea {
  const contract = buildCausalOutputContract(idea, context);

  const identifiabilityStrength = normalizeScore(idea.identifiabilityScore);
  const fallbackConfidence = toPercent(idea.confidence) / 100;
  const confidence = idea.confidence ?? Math.round((identifiabilityStrength || fallbackConfidence) * 100);

  return {
    ...idea,
    confidence,
    causalOutput: contract,
  };
}

