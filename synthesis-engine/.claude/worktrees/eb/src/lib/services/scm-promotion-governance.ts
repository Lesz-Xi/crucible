import { DisagreementAtom, DisagreementReport, SCMPromotionGate, SCMPromotionOverride } from "@/types/scm";

const DEFAULT_ALIGNMENT_THRESHOLD = 0.9;
const CROSS_DOMAIN_ALIGNMENT_THRESHOLD = 0.95;
const MIN_OVERRIDE_RATIONALE_LENGTH = 20;

function normalizeList(values: string[] | undefined): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
    )
  );
}

function hasValidOverride(override?: SCMPromotionOverride): boolean {
  if (!override) return false;
  const rationale = typeof override.rationale === "string" ? override.rationale.trim() : "";
  const approvedBy = typeof override.approvedBy === "string" ? override.approvedBy.trim() : "";
  return rationale.length >= MIN_OVERRIDE_RATIONALE_LENGTH && approvedBy.length > 0;
}

function countBySeverity(atoms: DisagreementAtom[]) {
  return atoms.reduce(
    (acc, atom) => {
      if (atom.severity === "high") acc.high += 1;
      else if (atom.severity === "medium") acc.medium += 1;
      else acc.low += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );
}

export interface EvaluatePromotionGateInput {
  report: DisagreementReport;
  crossDomain?: boolean;
  override?: SCMPromotionOverride;
}

export function evaluateSCMPromotionGate(input: EvaluatePromotionGateInput): SCMPromotionGate {
  const atoms = Array.isArray(input.report?.atoms) ? input.report.atoms : [];
  const counts = countBySeverity(atoms);
  const overrideValid = hasValidOverride(input.override);

  const crossDomain = Boolean(input.report?.alignmentQuality?.crossDomain ?? input.crossDomain);
  const alignmentCoverage = Number((input.report?.alignmentQuality?.coverage ?? 0).toFixed(4));
  const requiredAlignmentCoverage = Number(
    (
      input.report?.alignmentQuality?.threshold ??
      (crossDomain ? CROSS_DOMAIN_ALIGNMENT_THRESHOLD : DEFAULT_ALIGNMENT_THRESHOLD)
    ).toFixed(4)
  );
  const unknownVariables = normalizeList(input.report?.alignmentQuality?.unknownVariables);

  const unresolvedHighSeverityAtoms = counts.high;
  const alignmentShortfall = alignmentCoverage < requiredAlignmentCoverage;
  const requiresManualOverride = unresolvedHighSeverityAtoms > 0 || alignmentShortfall;

  if (!requiresManualOverride) {
    return {
      allowed: true,
      blocked: false,
      reason: "Promotion gate passed. No unresolved high-severity disagreement atoms detected.",
      requiresManualOverride: false,
      overrideUsed: false,
      highSeverityAtoms: counts.high,
      mediumSeverityAtoms: counts.medium,
      lowSeverityAtoms: counts.low,
      unresolvedHighSeverityAtoms,
      alignmentCoverage,
      requiredAlignmentCoverage,
      unknownVariables,
    };
  }

  if (!overrideValid) {
    const reasons: string[] = [];
    if (unresolvedHighSeverityAtoms > 0) {
      reasons.push(`${unresolvedHighSeverityAtoms} unresolved high-severity disagreement atom(s).`);
    }
    if (alignmentShortfall) {
      reasons.push(
        `Alignment coverage ${alignmentCoverage} is below required threshold ${requiredAlignmentCoverage}.`
      );
    }

    return {
      allowed: false,
      blocked: true,
      reason: `Promotion blocked: ${reasons.join(" ")}`.trim(),
      requiresManualOverride: true,
      overrideUsed: false,
      highSeverityAtoms: counts.high,
      mediumSeverityAtoms: counts.medium,
      lowSeverityAtoms: counts.low,
      unresolvedHighSeverityAtoms,
      alignmentCoverage,
      requiredAlignmentCoverage,
      unknownVariables,
    };
  }

  return {
    allowed: true,
    blocked: false,
    reason:
      "Promotion override accepted. High-severity disagreement risk remains and must be tracked in governance audit.",
    requiresManualOverride: true,
    overrideUsed: true,
    highSeverityAtoms: counts.high,
    mediumSeverityAtoms: counts.medium,
    lowSeverityAtoms: counts.low,
    unresolvedHighSeverityAtoms,
    alignmentCoverage,
    requiredAlignmentCoverage,
    unknownVariables,
  };
}
