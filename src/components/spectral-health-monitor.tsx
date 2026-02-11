'use client';

import React from 'react';
import { Waves, AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react';

/**
 * SpectralHealthMonitor
 * 
 * Phase 1 Frontend Shell (Mock Data)
 * Displays real-time spectral gap analysis:
 * - Lambda Min/Max (eigenvalue bounds)
 * - Spectral Gap (λ_max - λ_min)
 * - Health Status Indicators
 * 
 * Wabi-Sabi Integration:
 * - Wave-like visualizations for spectral dynamics
 * - Natural color gradients reflecting health states
 * - Organic spacing and layout
 * 
 * Backend Dependency: Phase 2 SSE event 'spectral_health_tick'
 */

interface SpectralHealthData {
  lambda_min: number;
  lambda_max: number;
  spectralGap: number;
  timestamp: number;
  healthStatus: 'optimal' | 'good' | 'warning' | 'critical';
}

interface SpectralHealthHistory {
  current: SpectralHealthData;
  history: SpectralHealthData[];
}

export const SpectralHealthMonitor: React.FC<{ data?: SpectralHealthHistory }> = ({ data }) => {
  // Mock data for Phase 1 design validation
  const mockData: SpectralHealthHistory = {
    current: {
      lambda_min: 0.023,
      lambda_max: 4.567,
      spectralGap: 4.544,
      timestamp: Date.now(),
      healthStatus: 'optimal',
    },
    history: [
      { lambda_min: 0.019, lambda_max: 4.234, spectralGap: 4.215, timestamp: Date.now() - 5000, healthStatus: 'good' },
      { lambda_min: 0.021, lambda_max: 4.412, spectralGap: 4.391, timestamp: Date.now() - 3000, healthStatus: 'good' },
      { lambda_min: 0.023, lambda_max: 4.567, spectralGap: 4.544, timestamp: Date.now(), healthStatus: 'optimal' },
    ],
  };

  const displayData = data || mockData;
  const { current } = displayData;

  // Helper to get health status config
  const getHealthConfig = (status: string) => {
    switch (status) {
      case 'optimal':
        return {
          color: 'wabi-emerald',
          icon: <CheckCircle2 className="w-4 h-4" />,
          label: 'Optimal',
          bgClass: 'bg-wabi-emerald/10',
          borderClass: 'border-wabi-emerald/20',
          textClass: 'text-wabi-emerald',
        };
      case 'good':
        return {
          color: 'wabi-rust',
          icon: <Waves className="w-4 h-4" />,
          label: 'Good',
          bgClass: 'bg-wabi-rust/10',
          borderClass: 'border-wabi-rust/20',
          textClass: 'text-wabi-rust',
        };
      case 'degraded':
        return {
          color: 'yellow-500',
          icon: <AlertCircle className="w-4 h-4" />,
          label: 'Degraded',
          bgClass: 'bg-yellow-500/10',
          borderClass: 'border-yellow-500/20',
          textClass: 'text-yellow-600 dark:text-yellow-500',
        };
      case 'critical':
        return {
          color: 'red-500',
          icon: <AlertCircle className="w-4 h-4" />,
          label: 'Critical',
          bgClass: 'bg-red-500/10',
          borderClass: 'border-red-500/20',
          textClass: 'text-red-600 dark:text-red-500',
        };
      default:
        return {
          color: 'wabi-charcoal',
          icon: <Waves className="w-4 h-4" />,
          label: 'Unknown',
          bgClass: 'bg-wabi-charcoal/10',
          borderClass: 'border-wabi-sand/20',
          textClass: 'text-wabi-charcoal dark:text-wabi-sand',
        };
    }
  };

  const healthConfig = getHealthConfig(current.healthStatus);

  // Mini sparkline for spectral gap trend
  const SparklineGap: React.FC<{ history: SpectralHealthData[] }> = ({ history }) => {
    if (history.length < 2) return null;

    const maxGap = Math.max(...history.map(h => h.spectralGap));
    const minGap = Math.min(...history.map(h => h.spectralGap));
    const range = maxGap - minGap || 1;

    return (
      <div className="h-12 flex items-end gap-1">
        {history.map((h, idx) => {
          const height = ((h.spectralGap - minGap) / range) * 100;
          return (
            <div
              key={idx}
              className="flex-1 bg-gradient-to-t from-wabi-emerald/60 to-wabi-emerald rounded-t-sm transition-all duration-300"
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-glass-card backdrop-blur-md border border-wabi-sand/20 rounded-lg p-6 shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-wabi-emerald/10 rounded-lg">
          <Waves className="w-5 h-5 text-wabi-emerald" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-wabi-charcoal dark:text-wabi-sand">
            Spectral Health
          </h3>
          <p className="text-xs text-wabi-charcoal/60 dark:text-wabi-sand/60">
            Eigenvalue Stability Monitor
          </p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${healthConfig.bgClass} ${healthConfig.borderClass} border`}>
          {healthConfig.icon}
          <span className={`text-xs font-semibold ${healthConfig.textClass}`}>
            {healthConfig.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Primary Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {/* Lambda Min */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-wabi-charcoal/70 dark:text-wabi-sand/70 uppercase tracking-wide">
              λ Min
            </div>
            <div className="p-4 bg-wabi-charcoal/5 dark:bg-wabi-sand/5 rounded-lg border border-wabi-sand/10">
              <div className="text-2xl font-mono font-bold text-wabi-rust">
                {current.lambda_min.toFixed(3)}
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-wabi-charcoal/60 dark:text-wabi-sand/60">
                <TrendingDown className="w-3 h-3" />
                <span>Minimum Eigenvalue</span>
              </div>
            </div>
          </div>

          {/* Lambda Max */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-wabi-charcoal/70 dark:text-wabi-sand/70 uppercase tracking-wide">
              λ Max
            </div>
            <div className="p-4 bg-wabi-charcoal/5 dark:bg-wabi-sand/5 rounded-lg border border-wabi-sand/10">
              <div className="text-2xl font-mono font-bold text-wabi-emerald">
                {current.lambda_max.toFixed(3)}
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-wabi-charcoal/60 dark:text-wabi-sand/60">
                <TrendingDown className="w-3 h-3 rotate-180" />
                <span>Maximum Eigenvalue</span>
              </div>
            </div>
          </div>
        </div>

        {/* Spectral Gap */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-wabi-charcoal/70 dark:text-wabi-sand/70 uppercase tracking-wide">
            Spectral Gap (λ_max - λ_min)
          </div>
          <div className={`p-5 rounded-lg border ${healthConfig.bgClass} ${healthConfig.borderClass}`}>
            <div className={`text-3xl font-mono font-bold ${healthConfig.textClass}`}>
              {current.spectralGap.toFixed(3)}
            </div>
            <p className="text-xs text-wabi-charcoal/60 dark:text-wabi-sand/60 mt-2 italic">
              Higher gap indicates better knowledge representation stability
            </p>
          </div>
        </div>

        {/* Trend Visualization */}
        {displayData.history.length > 1 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-wabi-charcoal/70 dark:text-wabi-sand/70 uppercase tracking-wide">
              Gap Trend
            </div>
            <div className="p-4 bg-wabi-charcoal/5 dark:bg-wabi-sand/5 rounded-lg border border-wabi-sand/10">
              <SparklineGap history={displayData.history} />
              <div className="flex items-center justify-between mt-3 text-xs text-wabi-charcoal/60 dark:text-wabi-sand/60">
                <span>Iteration {displayData.history.length - 2}</span>
                <span>Current</span>
              </div>
            </div>
          </div>
        )}

        {/* Interpretation Guide */}
        <div className="pt-4 border-t border-wabi-sand/10">
          <div className="text-xs text-wabi-charcoal/60 dark:text-wabi-sand/60 space-y-1.5">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-wabi-emerald mt-1.5" />
              <span><strong>Optimal:</strong> Gap {'>'}4.0, stable convergence</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-wabi-rust mt-1.5" />
              <span><strong>Good:</strong> Gap 2.5-4.0, minor fluctuations</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5" />
              <span><strong>Degraded:</strong> Gap 1.0-2.5, needs attention</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
