// MasaArchitecture — MASA-branded chip/circuit diagram for the hero right column.
// Adapted from the CPU architecture SVG concept. Pure inline SVG, no external deps.
// All colors draw exclusively from the MASA amber/stone palette — no rainbow.
//
// "use client" is required only because this component is rendered inside Hero.tsx
// which is a client component tree (uses useEffect / useRouter).

"use client";

interface MasaArchitectureProps {
  className?: string;
  text?: string;
}

// 8 port positions — pulled closer to chip for a compact layout
// Each port: dot position + label position + text anchor
const PORTS = [
  // Top edge
  { px: 160, py: 78,  lx: 160, ly: 58,  anchor: "middle" as const, label: "SCM"        },
  { px: 240, py: 78,  lx: 240, ly: 58,  anchor: "middle" as const, label: "DAG"        },
  // Right edge
  { px: 322, py: 160, lx: 348, ly: 163, anchor: "start"  as const, label: "INFERENCE"  },
  { px: 322, py: 240, lx: 348, ly: 243, anchor: "start"  as const, label: "MEMORY"     },
  // Bottom edge
  { px: 240, py: 322, lx: 240, ly: 342, anchor: "middle" as const, label: "FALSIFY"    },
  { px: 160, py: 322, lx: 160, ly: 342, anchor: "middle" as const, label: "PROVENANCE" },
  // Left edge
  { px: 78,  py: 240, lx: 52,  ly: 243, anchor: "end"    as const, label: "CRITIQUE"   },
  { px: 78,  py: 160, lx: 52,  ly: 163, anchor: "end"    as const, label: "GROUNDING"  },
] as const;

// Chip geometry
const CX = 200; // center x
const CY = 200; // center y
const R  = 90;  // half-size of chip square

export function MasaArchitecture({ className, text = "MASA" }: MasaArchitectureProps) {
  return (
    <div className={className} style={{ color: "rgba(64, 53, 44, 0.22)" }}>
      <svg
        viewBox="0 0 400 360"
        width="100%"
        aria-label="MASA Automated Scientist Architecture"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Amber text shimmer */}
          <linearGradient id="masa-text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#9d7449" />
            <stop offset="50%"  stopColor="#edc788">
              <animate
                attributeName="offset"
                values="0.3; 0.7; 0.3"
                dur="4s"
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes="0; 0.5; 1"
                keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
              />
            </stop>
            <stop offset="100%" stopColor="#9d7449" />
          </linearGradient>

          {/* Trace line: amber-bronze → dark (fades into chip) */}
          <linearGradient id="masa-trace-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="var(--landing-masa-trace)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--landing-masa-trace)" stopOpacity="0.08" />
          </linearGradient>

          {/* Chip body: translucent smoky glass so the parchment grid shows through */}
          <radialGradient id="masa-chip-bg" cx="50%" cy="40%" r="60%">
            <stop offset="0%"   stopColor="rgba(82, 75, 69, 0.82)" />
            <stop offset="100%" stopColor="rgba(58, 52, 47, 0.68)" />
          </radialGradient>

          <linearGradient id="masa-chip-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* Ambient glow on MASA text */}
          <filter id="masa-text-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Tighter glow filter — crisper, less bloom */}
          <filter id="masa-dot-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Tight controlled halo for signal nodes */}
          <radialGradient id="masa-port-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="var(--landing-masa-dot-halo)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--landing-masa-dot-halo)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── Trace lines: port → chip edge ─────────────────────────── */}
        {PORTS.map((port, i) => {
          // Clamp endpoint to chip perimeter
          const ex = Math.max(CX - R, Math.min(CX + R, port.px));
          const ey = Math.max(CY - R, Math.min(CY + R, port.py));
          return (
            <line
              key={`trace-${i}`}
              x1={port.px} y1={port.py}
              x2={ex}      y2={ey}
              stroke="url(#masa-trace-grad)"
              strokeWidth="0.8"
              strokeOpacity="1"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset="1"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="1" to="0"
                dur="0.9s"
                fill="freeze"
                begin={`${0.05 * i}s`}
                calcMode="spline"
                keyTimes="0; 1"
                keySplines="0.25 0.1 0.5 1"
              />
            </line>
          );
        })}

        {/* ── Chip body ──────────────────────────────────────────────── */}
        <rect
          x={CX - R} y={CY - R}
          width={R * 2} height={R * 2}
          rx="6"
          fill="url(#masa-chip-bg)"
          stroke="var(--landing-masa-chip-edge)"
          strokeWidth="0.8"
          strokeOpacity="1"
        />
        <rect
          x={CX - R} y={CY - R}
          width={R * 2} height={R * 2}
          rx="6"
          fill="url(#masa-chip-sheen)"
          opacity="0.55"
        />

        {/* ── Inner circuit grid (5 × 5 faint lines) ────────────────── */}
        {[-36, -18, 0, 18, 36].map((offset) => (
          <g key={`cg-${offset}`}>
            <line
              x1={CX - R + 6} y1={CY + offset}
              x2={CX + R - 6} y2={CY + offset}
              stroke="var(--landing-masa-chip-grid)" strokeWidth="0.4"
            />
            <line
              x1={CX + offset} y1={CY - R + 6}
              x2={CX + offset} y2={CY + R - 6}
              stroke="var(--landing-masa-chip-grid)" strokeWidth="0.4"
            />
          </g>
        ))}

        {/* ── Corner brackets ────────────────────────────────────────── */}
        {([[1, 1], [1, -1], [-1, -1], [-1, 1]] as const).map(([sx, sy], i) => (
          <path
            key={`cb-${i}`}
            d={`M ${CX + sx * (R - 4)} ${CY + sy * (R - 16)}
                L ${CX + sx * (R - 4)} ${CY + sy * (R - 4)}
                L ${CX + sx * (R - 16)} ${CY + sy * (R - 4)}`}
            fill="none"
            stroke="var(--landing-masa-chip-edge)"
            strokeWidth="0.9"
            strokeOpacity="0.9"
          />
        ))}

        {/* ── Connection pins on chip edges ──────────────────────────── */}
        {/* Top pins */}
        <rect x={155} y={CY - R - 4} width="3" height="5" rx="0.6"
          fill="var(--landing-masa-chip-edge)" fillOpacity="0.84" />
        <rect x={242} y={CY - R - 4} width="3" height="5" rx="0.6"
          fill="var(--landing-masa-chip-edge)" fillOpacity="0.84" />
        {/* Right pins */}
        <rect x={CX + R - 1} y={155} width="5" height="3" rx="0.6"
          fill="var(--landing-masa-chip-edge)" fillOpacity="0.84" />
        <rect x={CX + R - 1} y={242} width="5" height="3" rx="0.6"
          fill="var(--landing-masa-chip-edge)" fillOpacity="0.84" />
        {/* Bottom pins */}
        <rect x={155} y={CY + R - 1} width="3" height="5" rx="0.6"
          fill="var(--landing-masa-chip-edge)" fillOpacity="0.84" />
        <rect x={242} y={CY + R - 1} width="3" height="5" rx="0.6"
          fill="var(--landing-masa-chip-edge)" fillOpacity="0.84" />
        {/* Left pins */}
        <rect x={CX - R - 4} y={155} width="5" height="3" rx="0.6"
          fill="var(--landing-masa-chip-edge)" fillOpacity="0.84" />
        <rect x={CX - R - 4} y={242} width="5" height="3" rx="0.6"
          fill="var(--landing-masa-chip-edge)" fillOpacity="0.84" />

        {/* ── Central MASA label ─────────────────────────────────────── */}
        <text
          x={CX} y={CY + 6}
          textAnchor="middle"
          fill="url(#masa-text-grad)"
          fontFamily="var(--font-ibm-plex-mono, 'JetBrains Mono', monospace)"
          fontSize="26"
          fontWeight="500"
          letterSpacing="0.14em"
          filter="url(#masa-text-glow)"
        >
          {text}
        </text>

        {/* Sub-label */}
        <text
          x={CX} y={CY + 22}
          textAnchor="middle"
          fill="var(--landing-masa-sub-label)"
          fontFamily="var(--font-ibm-plex-mono, monospace)"
          fontSize="6.5"
          letterSpacing="0.22em"
        >
          CAUSAL ENGINE
        </text>

        {/* ── Port glow markers — pulsing amber ─────────────────────── */}
        {PORTS.map((port, i) => (
          <g key={`port-${i}`}>
            <circle cx={port.px} cy={port.py} r="7.5"
              fill="url(#masa-port-glow)" opacity="0.2">
              <animate attributeName="r"
                values="6.6;8.4;6.6" dur="3s" begin={`${i * 0.25}s`}
                repeatCount="indefinite" calcMode="spline"
                keyTimes="0;0.5;1" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" />
              <animate attributeName="opacity"
                values="0.1;0.24;0.1" dur="3s" begin={`${i * 0.25}s`}
                repeatCount="indefinite" />
            </circle>
            <circle cx={port.px} cy={port.py} r="2.35"
              fill="var(--landing-masa-dot-core)" opacity="0.94"
              filter="url(#masa-dot-glow)">
              <animate attributeName="r" values="0;3;2.35" dur="0.35s"
                begin={`${0.05 * i + 0.5}s`} fill="freeze" />
              <animate attributeName="r"
                values="2.35;2.65;2.35" dur="3s"
                begin={`${0.05 * i + 0.9}s`} repeatCount="indefinite"
                calcMode="spline" keyTimes="0;0.5;1"
                keySplines="0.4 0 0.2 1;0.4 0 0.2 1" />
              <animate attributeName="opacity"
                values="0.78;0.96;0.78" dur="3s"
                begin={`${0.05 * i + 0.9}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}

        {/* ── Port labels ────────────────────────────────────────────── */}
        {PORTS.map((port, i) => (
          <text
            key={`lbl-${i}`}
            x={port.lx} y={port.ly}
            textAnchor={port.anchor}
            dominantBaseline="middle"
            fill="var(--landing-masa-label)"
            fontFamily="var(--font-ibm-plex-mono, monospace)"
            fontSize="6.5"
            letterSpacing="0.14em"
          >
            {port.label}
          </text>
        ))}

      </svg>
    </div>
  );
}
