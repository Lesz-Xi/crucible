"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface WabiLoadingStateProps {
  phase?: string;
  className?: string;
}

/**
 * Wabi-Sabi Loading Animation
 * 
 * Design Principles:
 * - Impermanence (無常): Organic, breathing motion
 * - Simplicity (簡素): Minimal, contemplative
 * - Natural (自然): Inspired by water ripples and heartbeats
 */
export function WabiLoadingState({ phase, className }: WabiLoadingStateProps) {
  const [currentPhase, setCurrentPhase] = useState(0);

  useEffect(() => {
    // Rotate through phases every 2 seconds
    const interval = setInterval(() => {
      setCurrentPhase((prev) => (prev + 1) % PHASES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Use explicit phase if provided, otherwise cycle
  const displayPhase = phase || PHASES[currentPhase];

  return (
    <div className={cn("flex flex-col items-center gap-4 py-8", className)}>
      {/* Breathing Circle with Ripples */}
      <div className="relative w-16 h-16">
        {/* Outer ripple 1 */}
        <div className="absolute inset-0 rounded-full border-2 border-wabi-clay/20 animate-ripple-slow" />
        
        {/* Outer ripple 2 */}
        <div className="absolute inset-0 rounded-full border-2 border-wabi-moss/20 animate-ripple-slow animation-delay-700" />
        
        {/* Breathing core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-wabi-clay/40 to-wabi-moss/40 backdrop-blur-sm animate-breathe" />
        </div>
      </div>

      {/* Contemplative Status Text */}
      <p className="text-sm text-wabi-ink-light/70 font-serif animate-fade-in">
        {displayPhase}
      </p>
    </div>
  );
}

const PHASES = [
  "Entering the Valley...",
  "Observing the patterns...",
  "Consulting the Truth Store...",
  "Grounding in causal laws...",
  "The Uncarved Block speaks...",
];
