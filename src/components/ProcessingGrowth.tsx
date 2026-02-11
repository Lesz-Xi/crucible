"use client";

import { useState, useEffect } from 'react';

interface RootSegment {
  id: number;
  points: string;
  delay: string;
  duration: string;
}

export function ProcessingGrowth() {
  const [segments, setSegments] = useState<RootSegment[]>([]);

  useEffect(() => {
    // Generative Root Synthesis
    // We create random organic paths branching from a central void
    const newSegments: RootSegment[] = [
      { id: 1, points: "M 200 200 Q 150 100 50 50", delay: "0s", duration: "4s" },
      { id: 2, points: "M 200 200 Q 250 100 350 30", delay: "0.5s", duration: "5s" },
      { id: 3, points: "M 200 200 Q 100 250 20 380", delay: "1s", duration: "3s" },
      { id: 4, points: "M 200 200 Q 300 300 380 350", delay: "1.5s", duration: "6s" },
      { id: 5, points: "M 200 200 Q 200 350 200 450", delay: "2s", duration: "4.5s" },
    ];
    setSegments(newSegments);
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center p-12">
      <div className="relative w-96 h-96 flex items-center justify-center">
        {/* THE VOID / CORE */}
        <div className="absolute w-4 h-4 rounded-full bg-wabi-clay blur-md animate-pulse opacity-40" />
        
        {/* GENERATIVE MYCELIUM */}
        <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="root-grad" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="#9E7E6B" stopOpacity="0.8" />
               <stop offset="100%" stopColor="#6D725E" stopOpacity="0.2" />
            </linearGradient>
            
            {/* Filter for "Inky" bleed effect */}
            <filter id="ink-bleed">
               <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
               <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="ink-bleed" />
               <feComposite in="SourceGraphic" in2="ink-bleed" operator="atop" />
            </filter>
          </defs>

          <g filter="url(#ink-bleed)">
            {segments.map((seg) => (
              <path
                key={seg.id}
                d={seg.points}
                fill="none"
                stroke="url(#root-grad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="root-path"
                style={{
                  strokeDasharray: 600,
                  strokeDashoffset: 600,
                  animation: `grow ${seg.duration} ease-in-out ${seg.delay} forwards`,
                }}
              />
            ))}
          </g>
        </svg>

        {/* HUD Overlay / Ritual Status */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
           <div className="px-6 py-3 rounded-full bg-white/5 border border-wabi-stone/20 backdrop-blur-xl animate-fade-in">
              <span className="text-[10px] font-mono tracking-[0.4em] uppercase text-wabi-sumi/80">
                 Synthesizing.Structure...
              </span>
           </div>
        </div>
      </div>

      <style jsx>{`
        .root-path {
          filter: drop-shadow(0 0 4px rgba(158, 126, 107, 0.2));
        }
        @keyframes grow {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
      
      <div className="mt-12 text-center max-w-xs">
          <p className="font-mono text-[9px] text-wabi-stone uppercase tracking-widest leading-loose">
             Recovering latent causal mechanisms from unstructured context. The garden is taking form.
          </p>
      </div>
    </div>
  );
}
