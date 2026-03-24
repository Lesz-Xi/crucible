import { NovelIdea, HypothesisAuditEvent, HypothesisAuditTrigger, HypothesisState } from "@/types";

const STATE_PRIORITY: Record<HypothesisState, number> = {
  tested: 0,
  proposed: 1,
  retracted: 2,
  falsified: 3,
};

const RECOMMENDATION_ELIGIBLE = new Set<HypothesisState>(["proposed", "tested"]);

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)));
}

function scoreIdeaForRecommendation(idea: NovelIdea): number {
  return (
    (idea.interventionValueScore ?? 0) * 100 +
    (idea.identifiabilityScore ?? 0) * 20 +
    (idea.falsifiabilityScore ?? 0) * 10 +
    (idea.noveltyScore ?? 0) * 0.25 +
    (idea.confidence ?? 0)
  );
}

function hasMeaningfulFalsifier(value: string | undefined): boolean {
  return (value ?? "").trim().length >= 20;
}

function validationPassesFalsifier(idea: NovelIdea): boolean | undefined {
  if (!idea.validationResult) return undefined;

  const success = idea.validationResult.success === true;
  const pValue = idea.validationResult.metrics?.pValue;
  const conclusionValid = idea.validationResult.metrics?.conclusionValid;

  if (!success) return false;
  if (typeof conclusionValid === "boolean" && !conclusionValid) return false;
  if (typeof pValue === "number" && pValue > 0.05) return false;
  return true;
}

function buildEvent(
  hypothesisId: string,
  state: HypothesisState,
  trigger: HypothesisAuditTrigger,
  rationale: string,
  evidenceRef: string[] = [],
  timestamp = new Date().toISOString()
): HypothesisAuditEvent {
  return {
    hypothesisId,
    state,
    trigger,
    rationale: rationale.trim(),
    evidenceRef: uniqueStrings(evidenceRef),
    timestamp,
  };
}

function sameEvent(left: HypothesisAuditEvent, right: HypothesisAuditEvent): boolean {
  if (left.hypothesisId !== right.hypothesisId) return false;
  if (left.state !== right.state || left.trigger !== right.trigger) return false;
  if (left.rationale !== right.rationale) return false;
  const leftEvidence = uniqueStrings(left.evidenceRef).sort().join("|");
  const rightEvidence = uniqueStrings(right.evidenceRef).sort().join("|");
  return leftEvidence === rightEvidence;
}

export function addHypothesisAuditEvent(
  idea: NovelIdea,
  event: Omit<HypothesisAuditEvent, "hypothesisId" | "timestamp"> & {
    hypothesisId?: string;
    timestamp?: string;
  }
): NovelIdea {
  const hypothesisId = event.hypothesisId || idea.id;
  const normalized = buildEvent(
    hypothesisId,
    event.state,
    event.trigger,
    event.rationale,
    event.evidenceRef,
    event.timestamp
  );

  const existing = Array.isArray(idea.hypothesisAuditEvents) ? idea.hypothesisAuditEvents : [];
  if (existing.some((entry) => sameEvent(entry, normalized))) {
    return {
      ...idea,
      hypothesisAuditEvents: existing,
    };
  }

  return {
    ...idea,
    hypothesisState: normalized.state,
    hypothesisAuditEvents: [...existing, normalized],
  };
}

export function ensureHypothesisLifecycle(idea: NovelIdea): NovelIdea {
  let next = idea;
  next = addHypothesisAuditEvent(next, {
    state: "proposed",
    trigger: "generation",
    rationale: "Hypothesis generated and entered lifecycle ledger.",
    evidenceRef: [idea.id],
  });

  const currentState = next.hypothesisState || idea.hypothesisState;
  if (currentState === "falsified" || currentState === "retracted") {
    return next;
  }

  if (!hasMeaningfulFalsifier(next.falsifier)) {
    next = addHypothesisAuditEvent(next, {
      state: "retracted",
      trigger: "manual_review",
      rationale: "Missing concrete falsifier; hypothesis cannot remain production-eligible.",
      evidenceRef: [idea.id],
    });
    return next;
  }

  const validationStatus = validationPassesFalsifier(next);
  if (currentState === "tested" && validationStatus !== false) {
    return next;
  }

  if (validationStatus === true) {
    next = addHypothesisAuditEvent(next, {
      state: "tested",
      trigger: "intervention_result",
      rationale: "Validation run is consistent with falsifier threshold.",
      evidenceRef: [idea.id],
    });
    return next;
  }

  if (validationStatus === false) {
    next = addHypothesisAuditEvent(next, {
      state: "falsified",
      trigger: "intervention_result",
      rationale: "Validation run failed falsifier threshold; hypothesis demoted.",
      evidenceRef: [idea.id],
    });
    return next;
  }

  return next;
}

export function markHypothesisRetracted(
  idea: NovelIdea,
  rationale: string,
  evidenceRef: string[] = []
): NovelIdea {
  return addHypothesisAuditEvent(idea, {
    state: "retracted",
    trigger: "manual_review",
    rationale,
    evidenceRef,
  });
}

export function markHypothesisCounterfactualFailure(
  idea: NovelIdea,
  rationale: string,
  evidenceRef: string[] = []
): NovelIdea {
  return addHypothesisAuditEvent(idea, {
    state: "falsified",
    trigger: "counterfactual_failure",
    rationale,
    evidenceRef,
  });
}

export function isHypothesisRecommendationEligible(idea: NovelIdea): boolean {
  const state = idea.hypothesisState || "proposed";
  return RECOMMENDATION_ELIGIBLE.has(state);
}

export function orderHypothesesForRecommendation(ideas: NovelIdea[]): NovelIdea[] {
  const withLifecycle = ideas.map((idea) => ensureHypothesisLifecycle(idea));
  return withLifecycle
    .slice()
    .sort((left, right) => {
      const stateA = left.hypothesisState || "proposed";
      const stateB = right.hypothesisState || "proposed";
      const priorityDelta = STATE_PRIORITY[stateA] - STATE_PRIORITY[stateB];
      if (priorityDelta !== 0) return priorityDelta;
      return scoreIdeaForRecommendation(right) - scoreIdeaForRecommendation(left);
    });
}

export function selectTopRecommendationSet(ideas: NovelIdea[], maxCount: number): NovelIdea[] {
  if (maxCount <= 0) return [];
  const ordered = orderHypothesesForRecommendation(ideas);
  const eligible = ordered.filter((idea) => isHypothesisRecommendationEligible(idea));
  return eligible.slice(0, maxCount);
}
