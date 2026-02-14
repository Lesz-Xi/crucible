import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Microscope, Code, Zap } from 'lucide-react';

interface InterventionTutorialProps {
  className?: string;
}

export function InterventionTutorial({ className = '' }: InterventionTutorialProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    // Default to expanded for first-time users, collapsed for returning users
    try {
      const stored = localStorage.getItem('interventionTutorialExpanded');
      return stored === null ? true : stored === 'true';
    } catch {
      return true; // Fallback if localStorage is blocked
    }
  });

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    try {
      localStorage.setItem('interventionTutorialExpanded', String(newState));
    } catch {
      // Silently fail if localStorage is blocked
    }
  };

  return (
    <div className={`rounded-lg border border-wabi-clay/30 bg-gradient-to-br from-white/5 to-white/0 overflow-hidden shadow-lg ${className}`}>
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/15 transition-colors">
            <Microscope className="w-5 h-5 text-[var(--lab-accent-earth)]" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-sm text-wabi-clay">Causal Surgery Playground</h3>
            <p className="text-xs text-wabi-clay/60">Test "what if" scenarios in your code</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-wabi-clay/60 transition-transform" />
        ) : (
          <ChevronDown className="w-5 h-5 text-wabi-clay/60 transition-transform" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
          {/* Introduction */}
          <div className="text-sm text-wabi-clay/80 leading-relaxed">
            <p>
              Perform <strong className="text-[var(--lab-accent-earth)]">causal interventions</strong> on your computational models using the do-calculus playground.
              This feature lets you test hypotheses by clamping variables and observing downstream effects.
            </p>
          </div>

          {/* How It Works */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-wabi-clay/60">How It Works</h4>
            
            <div className="space-y-2">
              {/* Step 1 */}
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-[var(--lab-accent-earth)]">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm text-wabi-clay/90">
                    <strong>Share your code or model</strong> in the chat (Python, simulation, etc.)
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-[var(--lab-accent-earth)]">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm text-wabi-clay/90">
                    <strong>Specify an intervention</strong> like <code className="px-1.5 py-0.5 rounded bg-wabi-sumi/20 text-[var(--lab-accent-earth)] text-xs font-mono">do(temperature = 500K)</code>
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-400">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm text-wabi-clay/90">
                    <strong>See downstream effects</strong> as the system identifies impacted variables
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="p-3 rounded-lg bg-wabi-sumi/10 border border-wabi-sumi/20">
            <div className="flex items-start gap-2 mb-2">
              <Code className="w-4 h-4 text-[var(--lab-accent-moss)] mt-0.5" />
              <h5 className="text-xs font-bold text-wabi-clay">Example Query</h5>
            </div>
            <div className="space-y-2 text-xs">
              <p className="text-wabi-clay/70 italic">
                "I have a neural network training loop. What if we set <code className="text-[var(--lab-accent-moss)]">learning_rate = 0.01</code>? 
                Show me how this affects loss convergence."
              </p>
              <div className="flex items-center gap-2 text-[var(--lab-accent-earth)]">
                <Zap className="w-3 h-3" />
                <span className="text-[10px] font-semibold">→ System will clamp the variable and trace effects through your code</span>
              </div>
            </div>
          </div>

          {/* Use Cases */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-wabi-clay/60">When To Use This</h4>
            <ul className="space-y-1.5 text-xs text-wabi-clay/80">
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Testing hypotheses in simulations or models</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Debugging causal assumptions in code</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Exploring parameter sensitivity in experiments</span>
              </li>
            </ul>
          </div>

          {/* Note */}
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-wabi-clay/70">
              <strong className="text-amber-400">Note:</strong> This is an approximation of Pearl's do-calculus. 
              The system performs variable clamping and traces affected nodes, but does not execute full graph-theoretic interventions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
