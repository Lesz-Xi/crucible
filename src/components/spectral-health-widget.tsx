import React from 'react';

interface SpectralHealthWidgetProps {
  interference?: Map<string, number>;
}

export function SpectralHealthWidget({ interference }: SpectralHealthWidgetProps) {
  if (!interference || interference.size === 0) {
    return (
      <div className="spectral-health p-4 bg-slate-900/50 rounded-lg border border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">
          🧠 Cognitive Health: Domain Separation
        </h3>
        <p className="text-xs text-slate-400">
          No interference detected. This is the first idea in the knowledge base.
        </p>
      </div>
    );
  }

  const domains = Array.from(interference.entries());
  const maxInterference = Math.max(...domains.map(([_, v]) => v));

  return (
    <div className="spectral-health p-4 bg-slate-900/50 rounded-lg border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">
        🧠 Cognitive Health: Domain Separation
      </h3>
      
      <div className="space-y-2">
        {domains.map(([domain, strength]) => {
          const level = strength > 0.5 ? 'high' : strength > 0.1 ? 'moderate' : 'low';
          const color = level === 'high' ? 'red' : level === 'moderate' ? 'yellow' : 'green';
          const bgColor = level === 'high' ? 'bg-red-500/20' : level === 'moderate' ? 'bg-yellow-500/20' : 'bg-green-500/20';
          const borderColor = level === 'high' ? 'border-red-500' : level === 'moderate' ? 'border-yellow-500' : 'border-green-500';
          const textColor = level === 'high' ? 'text-red-400' : level === 'moderate' ? 'text-yellow-400' : 'text-green-400';
          
          return (
            <div 
              key={domain}
              className={`p-2 rounded border ${bgColor} ${borderColor}`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-200">{domain}</span>
                <span className={`text-xs font-mono ${textColor}`}>
                  {strength.toFixed(3)}
                </span>
              </div>
              <div className="mt-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${color === 'red' ? 'bg-red-500' : color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${(strength / maxInterference) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700">
        <p className="text-xs text-slate-400">
          {maxInterference < 0.1 ? (
            <><span className="text-green-400">✓ Orthogonal</span> - Safe to learn without interference.</>
          ) : maxInterference < 0.5 ? (
            <><span className="text-yellow-400">⚠ Moderate Overlap</span> - Some semantic similarity detected.</>
          ) : (
            <><span className="text-red-400">⚠ High Interference</span> - Risk of catastrophic forgetting!</>
          )}
        </p>
      </div>
    </div>
  );
}
