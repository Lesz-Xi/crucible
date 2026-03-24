export type CommonSenseAction = "allow" | "deescalate" | "decline";

export interface CommonSenseDecision {
  action: CommonSenseAction;
  rationale: string;
  signals: string[];
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function evaluateCommonSensePolicy(input: string): CommonSenseDecision {
  const text = (input || "").toLowerCase();
  const signals: string[] = [];
  const explicitNonThreatening = /\bnon[-\s]?threatening\b/.test(text);

  const coerciveSignals = [
    /\bblackmail\b/,
    /\bextort(?:ion)?\b/,
    /\bdoxx(?:ing)?\b/,
    /\bimpersonat(?:e|ion)\b/,
    /\bfake (?:proof|evidence|records?)\b/,
    /\bfabricat(?:e|ion)\b.*\bevidence\b/,
  ];
  const directThreatSignal = /\bthreat(?:en|ening)?\b/.test(text) && !explicitNonThreatening;

  const targetedHarassmentSignals = [
    /\bhumiliat(?:e|ion)\b/,
    /\bharass(?:ment)?\b/,
    /\bsmear\b/,
    /\bdestroy (?:his|her|their) reputation\b/,
  ];

  const boundaryMessageSignals = [
    /\bcease contact\b/,
    /\bformal notice\b/,
    /\breport(?:ing)? to (?:authorit(?:y|ies)|police|hr)\b/,
    /\bdo not contact me\b/,
    /\bnon-threatening\b/,
  ];

  if (hasAny(text, coerciveSignals) || directThreatSignal || hasAny(text, targetedHarassmentSignals)) {
    signals.push("coercive_or_harassment_intent");
    return {
      action: "decline",
      rationale:
        "Request indicates coercive, deceptive, or targeted-harm intent. Must decline and redirect to safe alternatives.",
      signals,
    };
  }

  if (hasAny(text, boundaryMessageSignals)) {
    signals.push("high_conflict_boundary_context");
    return {
      action: "deescalate",
      rationale:
        "Request sits in a high-conflict communication context. Response should be neutral, brief, and non-escalatory.",
      signals,
    };
  }

  return {
    action: "allow",
    rationale: "No high-risk conflict or coercion signals detected.",
    signals,
  };
}

export function buildCommonSenseInstructionBlock(decision: CommonSenseDecision): string {
  if (decision.action === "allow") return "";

  if (decision.action === "decline") {
    return `
COMMON-SENSE GOVERNOR (MANDATORY):
- Decline to provide instructions, drafts, or strategies that enable coercion, threat, deception, harassment, or reputational harm.
- Give a short reason for refusal.
- Offer one safe alternative: neutral boundary-setting template or recommendation to use formal legal counsel/official reporting channels.
- Do not provide actionable harmful wording.`;
  }

  return `
COMMON-SENSE GOVERNOR (MANDATORY):
- Use a neutral, non-accusatory, low-escalation tone.
- Keep response concise and practical.
- Avoid legal-threat language, psychological attribution, or loaded claims about the other person.
- Prefer "boundary + channel + no-response policy" format.
- If facts are missing, ask one clarifying question instead of escalating assumptions.`;
}
