"use client";

import { StatisticalMetrics } from "@/types";

interface StatisticalMetricsPanelProps {
  metrics: StatisticalMetrics;
}

function colorForPValue(p: number): string {
  if (p < 0.05) return "text-emerald-300";
  if (p < 0.1) return "text-amber-300";
  return "text-red-300";
}

function labelForBayesFactor(bf: number): string {
  if (bf > 10) return "Strong evidence";
  if (bf >= 3) return "Moderate evidence";
  return "Weak evidence";
}

function labelForEffectSize(d: number): string {
  const a = Math.abs(d);
  if (a >= 0.8) return "Large";
  if (a >= 0.5) return "Medium";
  if (a >= 0.2) return "Small";
  return "Negligible";
}

export function StatisticalMetricsPanel({ metrics }: StatisticalMetricsPanelProps) {
  return (
    <div className="mb-4 p-4 bg-slate-900/40 border border-slate-600/30 rounded-xl">
      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
        Statistical Validation
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-slate-400 text-xs">p-value</div>
          <div className={`font-semibold ${colorForPValue(metrics.pValue)}`}>{metrics.pValue}</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs">Bayes Factor</div>
          <div className="font-semibold text-slate-200">{metrics.bayesFactor} ({labelForBayesFactor(metrics.bayesFactor)})</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs">Effect Size</div>
          <div className="font-semibold text-slate-200">{metrics.effectSize} ({labelForEffectSize(metrics.effectSize)})</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        {metrics.interpretation}. Exploratory analysis only, not confirmatory evidence.
      </p>
    </div>
  );
}
