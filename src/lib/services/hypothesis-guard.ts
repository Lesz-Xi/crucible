import { SCMHypothesisSkeleton } from "@/types/scm";

export interface GuardInput extends SCMHypothesisSkeleton {
  interventionValueScore?: number;
  mechanismDepth?: number;
  noveltyScore?: number;
}

export interface GuardOptions {
  canonicalVariables?: string[];
  requiredConfounders?: string[];
}

export interface GuardEvaluation {
  accepted: boolean;
  violations: string[];
  interventionValueScore: number;
  falsifiabilityScore: number;
  identifiabilityScore: number;
  mechanismDepth: number;
  noveltyScore: number;
}

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

function normalizeVariable(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export class HypothesisGuard {
  evaluate(input: GuardInput, options: GuardOptions = {}): GuardEvaluation {
    const violations: string[] = [];

    const canonicalSet = new Set((options.canonicalVariables ?? []).map(normalizeVariable));
    const requiredConfounders = options.requiredConfounders ?? [];

    const hasDoPlan = /do\s*\(/i.test(input.doQuery ?? "");
    const hasFalsifier = (input.falsifier ?? "").trim().length >= 20;

    if (!hasDoPlan) {
      violations.push("Missing explicit do() intervention query");
    }

    if (!hasFalsifier) {
      violations.push("Missing disconfirming falsifier");
    }

    if (canonicalSet.size > 0) {
      const causeCanonical = canonicalSet.has(normalizeVariable(input.cause));
      const effectCanonical = canonicalSet.has(normalizeVariable(input.effect));
      if (!causeCanonical) {
        violations.push(`Cause variable '${input.cause}' is not in canonical ontology`);
      }
      if (!effectCanonical) {
        violations.push(`Effect variable '${input.effect}' is not in canonical ontology`);
      }
    }

    const confounderCoverage =
      requiredConfounders.length === 0
        ? input.confounders.length > 0
          ? 0.8
          : 0.6
        : input.confounders.filter((item) => requiredConfounders.includes(item)).length /
          requiredConfounders.length;

    if (requiredConfounders.length > 0 && confounderCoverage < 0.5) {
      violations.push("Confounder set is incomplete for identifiability");
    }

    const falsifiabilityScore = clamp((hasDoPlan ? 0.55 : 0) + (hasFalsifier ? 0.45 : 0));
    const identifiabilityScore = clamp(
      confounderCoverage * 0.75 + (canonicalSet.size === 0 ? 0.25 : violations.length === 0 ? 0.25 : 0.05)
    );

    const interventionValueScore = clamp(input.interventionValueScore ?? 0.5);
    const mechanismDepth = clamp((input.mechanismDepth ?? 0.4), 0, 1);
    const noveltyScore = clamp(input.noveltyScore ?? 0.5);

    const accepted =
      hasDoPlan &&
      hasFalsifier &&
      (canonicalSet.size === 0 || !violations.some((item) => item.includes("canonical ontology")));

    return {
      accepted,
      violations,
      interventionValueScore,
      falsifiabilityScore,
      identifiabilityScore,
      mechanismDepth,
      noveltyScore,
    };
  }
}
