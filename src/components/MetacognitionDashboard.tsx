// Phase 23: Layer 0 Consciousness Visualization

import React from 'react';
import { CausalGraph } from './CausalGraph';
import { ConsciousnessState } from '@/types';

interface MetacognitionDashboardProps {
  consciousnessState?: ConsciousnessState;
  className?: string;
}

export default function MetacognitionDashboard({ 
  consciousnessState,
  className = '' 
}: MetacognitionDashboardProps) {
  if (!consciousnessState) {
    return null;
  }

  const { current_mode, ceiling, friction_alert, history, causal_evidence } = consciousnessState;

  // Mode badge styling
  const modeColors = {
    strict: 'bg-purple-500 text-white',
    balanced: 'bg-blue-500 text-white',
    exploratory: 'bg-green-500 text-white'
  };

  const modeEmoji = {
    strict: '🔬',
    balanced: '⚖️',
    exploratory: '🧭'
  };

  const hasCausalData = causal_evidence && (
    causal_evidence.PN_mode_caused_failure !== undefined ||
    causal_evidence.PS_switch_to_exploratory !== undefined ||
    causal_evidence.RR_mode_risk_ratio !== undefined
  );

  return (
    <div className={`metacognition-dashboard ${className}`}>
      <div className="dashboard-header mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          🧠 Layer 0: Consciousness
        </h3>
      </div>

      {/* Mode Indicator Badge */}
      <div className="mode-badge mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">Mode:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${modeColors[current_mode]}`}>
            {modeEmoji[current_mode]} {current_mode.toUpperCase()}
          </span>
          <span className="text-xs text-gray-500">
            (Ceiling: {ceiling}/100)
          </span>
        </div>
      </div>

      {/* Friction Alert */}
      {friction_alert && (
        <div className="friction-alert mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600 dark:text-yellow-400 text-sm">⚠️ Friction Detected</span>
          </div>
        </div>
      )}

      {/* Performance History */}
      {history && history.scores.length > 0 && (
        <div className="performance-history mb-4">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Performance</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="metric p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-gray-500 dark:text-gray-400">Avg Score</div>
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {history.avg_score.toFixed(1)}
              </div>
            </div>
            <div className="metric p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-gray-500 dark:text-gray-400">Rejection</div>
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {(history.rejection_rate * 100).toFixed(0)}%
              </div>
            </div>
            <div className="metric p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-gray-500 dark:text-gray-400">Audits</div>
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {history.scores.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Causal Metrics (Pearl's L3 Attribution) */}
      {hasCausalData && (
        <div className="causal-metrics">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            🎯 Causal Attribution (Pearl&apos;s L3)
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {causal_evidence.PN_mode_caused_failure !== undefined && (
              <div className="metric p-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">PN (Necessity)</span>
                  <span className={`font-bold ${causal_evidence.PN_mode_caused_failure > 0.5 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {(causal_evidence.PN_mode_caused_failure * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  {causal_evidence.PN_mode_caused_failure > 0.5 
                    ? 'Mode likely caused failures' 
                    : 'Failures not mode-specific'}
                </div>
              </div>
            )}
            
            {causal_evidence.PS_switch_to_exploratory !== undefined && (
              <div className="metric p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">PS (Sufficiency)</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {(causal_evidence.PS_switch_to_exploratory * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  Exploratory mode success probability
                </div>
              </div>
            )}

            {causal_evidence.RR_mode_risk_ratio !== undefined && (
              <div className="metric p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">RR (Risk Ratio)</span>
                  <span className={`font-bold ${causal_evidence.RR_mode_risk_ratio > 2.0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {causal_evidence.RR_mode_risk_ratio.toFixed(2)}x
                  </span>
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  {causal_evidence.RR_mode_risk_ratio > 2.0 
                    ? 'High relative risk detected' 
                    : 'Normal risk levels'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!hasCausalData && history && history.scores.length < 3 && (
        <div className="text-xs text-gray-400 italic mt-2">
          Causal inference available after 3+ audits
        </div>
      )}
      
      {/* Phase 25: Causal Graph Visualization */}
      {consciousnessState.mode_history && consciousnessState.mode_history.length > 0 && (
         <div className="mt-4">
            <CausalGraph 
              history={consciousnessState.mode_history} 
              currentMode={current_mode} 
            />
         </div>
      )}
    </div>
  );
}
