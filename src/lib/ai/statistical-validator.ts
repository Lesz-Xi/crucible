import { ExtractedConcepts, NovelIdea, StatisticalMetrics } from "@/types";
import { jStat } from "jstat";

export class StatisticalValidator {
  calculatePValue(observedEffect: number, nullMean: number, sampleSize: number): number {
    if (!Number.isFinite(observedEffect) || sampleSize <= 1) return 0.5;
    const stdErr = Math.max(1 / Math.sqrt(sampleSize), 1e-6);
    const t = (observedEffect - nullMean) / stdErr;
    const df = Math.max(sampleSize - 1, 1);
    const oneTailed = 1 - jStat.studentt.cdf(Math.abs(t), df);
    return Math.max(0, Math.min(1, oneTailed * 2));
  }

  calculateBayesFactor(observedEffect: number, priorBelief: number, evidenceQuality: number): number {
    const safePrior = Math.max(0.01, Math.min(0.99, priorBelief));
    const safeEvidence = Math.max(0.01, Math.min(1, evidenceQuality));
    const standardized = Math.max(-3, Math.min(3, observedEffect));
    const signal = Math.exp(Math.abs(standardized) * safeEvidence);
    const priorOdds = safePrior / (1 - safePrior);
    const bf = signal * priorOdds;
    return Number.isFinite(bf) ? Math.max(0.1, Math.min(100, bf)) : 1;
  }

  validateHypothesis(idea: NovelIdea, sources: ExtractedConcepts[]): StatisticalMetrics {
    const confidence = Number.isFinite(idea.confidence) ? idea.confidence : 50;
    const sourceCount = Math.max(1, sources.length);

    const qualityMap: Record<string, number> = {
      strong: 1,
      moderate: 0.7,
      weak: 0.4,
      anecdotal: 0.2,
    };

    const avgQuality =
      sources.reduce((sum, s) => sum + (qualityMap[s.evidenceQuality || "moderate"] ?? 0.7), 0) /
      sourceCount;
    const sampleSize = Math.max(2, Math.round(sourceCount * (2 + avgQuality * 3)));

    const effectSize = (confidence - 50) / 20;
    const pValue = this.calculatePValue(confidence, 50, sampleSize);
    const bayesFactor = this.calculateBayesFactor(effectSize, 0.5 + avgQuality * 0.25, avgQuality);

    let interpretation = "Weak evidence";
    if (bayesFactor > 10 && pValue < 0.05) interpretation = "Strong evidence";
    else if (bayesFactor > 3 && pValue < 0.1) interpretation = "Moderate evidence";

    return {
      pValue: Number(pValue.toFixed(4)),
      bayesFactor: Number(bayesFactor.toFixed(2)),
      effectSize: Number(effectSize.toFixed(3)),
      interpretation: `${interpretation} (exploratory, non-confirmatory)`,
    };
  }
}
