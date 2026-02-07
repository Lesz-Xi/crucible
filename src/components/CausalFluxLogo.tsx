"use client";

export function CausalFluxLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <filter id="ink-texture" x="-20%" y="-20%" width="140%" height="140%">
           <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
           <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
        </filter>
        <filter id="paper-shadow" x="-20%" y="-20%" width="140%" height="140%">
           <feDropShadow dx="0.5" dy="1" stdDeviation="0.5" floodColor="#000000" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* 1. The Enso (Zen Circle) - Representation of the closed world/system */}
      <path 
        d="M 50 10 C 20 10, 5 35, 10 60 C 15 85, 40 95, 65 92 C 90 89, 95 60, 90 35 C 85 20, 70 12, 60 12" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round" 
        className="opacity-80 text-[#2A2621]"
        style={{ filter: "url(#ink-texture)" }}
      />
      
      {/* 2. Causal Nodes (Ceramic Stones) */}
      <g style={{ filter: "url(#paper-shadow)" }}>
        {/* Node A (Cause) */}
        <path d="M 25 35 L 35 30 L 40 38 L 30 42 Z" fill="#E8E4D9" stroke="#4A443B" strokeWidth="0.5" />
        <text x="32" y="38" fontSize="6" fontFamily="serif" fill="#4A443B" textAnchor="middle">A</text>

        {/* Node C (Outcome) */}
        <path d="M 65 65 L 75 62 L 78 72 L 68 75 Z" fill="#E8E4D9" stroke="#4A443B" strokeWidth="0.5" />
        <text x="71" y="71" fontSize="6" fontFamily="serif" fill="#4A443B" textAnchor="middle">C</text>

        {/* Node B (Intervention Target) - Central */}
        <path d="M 45 50 L 55 45 L 60 55 L 50 60 Z" fill="#E8E4D9" stroke="#4A443B" strokeWidth="0.5" />
        <text x="52" y="55" fontSize="8" fontFamily="serif" fontWeight="bold" fill="#4A443B" textAnchor="middle">B</text>
      </g>

      {/* 3. Causal Arrows */}
      <path d="M 38 38 L 47 48" stroke="#4A443B" strokeWidth="1" markerEnd="url(#arrowhead)" />
      <path d="M 58 52 L 67 64" stroke="#4A443B" strokeWidth="1" markerEnd="url(#arrowhead)" />

      {/* 4. The Intervention Tag 'do(B)' */}
      <g transform="rotate(-15, 60, 40)">
         {/* String */}
         <path d="M 55 45 Q 60 35, 65 30" stroke="#8B5E3C" strokeWidth="0.5" fill="none" />
         {/* Tag */}
         <rect x="62" y="25" width="22" height="10" fill="#F2EFE9" stroke="#8B5E3C" strokeWidth="0.5" rx="1" />
         <text x="73" y="32" fontSize="5" fontFamily="monospace" fill="#8B5E3C" textAnchor="middle">do(B)</text>
         {/* Hole punch */}
         <circle cx="64" cy="30" r="1" fill="#2A2621" />
      </g>

      {/* Arrow Marker Definition */}
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="#4A443B" />
        </marker>
      </defs>
    </svg>
  );
}
