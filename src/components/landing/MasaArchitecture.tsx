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

// Warm amber-bronze signal lights — softer than chip amber, feels like dim instrument indicators
const PORT_COLOR = "#cba86e";
const DOT_COLOR  = "#dfbb80";

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
            <stop offset="0%"   stopColor="#b8904e" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#b8904e" stopOpacity="0.04" />
          </linearGradient>

          {/* Chip body: subtle radial from stone-800 to near-black */}
          <radialGradient id="masa-chip-bg" cx="50%" cy="40%" r="60%">
            <stop offset="0%"   stopColor="#4b4540" />
            <stop offset="100%" stopColor="#3a342f" />
          </radialGradient>

          {/* Ambient glow on MASA text */}
          <filter id="masa-text-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Tighter glow filter — crisper, less bloom */}
          <filter id="masa-dot-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Warm platinum halo gradient — reduced center opacity for softer bloom */}
          <radialGradient id="masa-port-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={PORT_COLOR} stopOpacity="0.7" />
            <stop offset="100%" stopColor={PORT_COLOR} stopOpacity="0" />
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
          stroke="#cba86e"
              strokeWidth="0.8"
              strokeOpacity="0.38"
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
          stroke="#c39a61"
          strokeWidth="0.6"
          strokeOpacity="0.54"
        />

        {/* ── Inner circuit grid (5 × 5 faint lines) ────────────────── */}
        {[-36, -18, 0, 18, 36].map((offset) => (
          <g key={`cg-${offset}`}>
            <line
              x1={CX - R + 6} y1={CY + offset}
              x2={CX + R - 6} y2={CY + offset}
              stroke="rgba(223,187,128,0.08)" strokeWidth="0.4"
            />
            <line
              x1={CX + offset} y1={CY - R + 6}
              x2={CX + offset} y2={CY + R - 6}
              stroke="rgba(223,187,128,0.08)" strokeWidth="0.4"
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
            stroke="#d2ad78"
            strokeWidth="0.9"
            strokeOpacity="0.62"
          />
        ))}

        {/* ── Connection pins on chip edges ──────────────────────────── */}
        {/* Top pins */}
        <rect x={155} y={CY - R - 4} width="3" height="5" rx="0.6"
          fill="#d2ad78" fillOpacity="0.56" />
        <rect x={242} y={CY - R - 4} width="3" height="5" rx="0.6"
          fill="#d2ad78" fillOpacity="0.56" />
        {/* Right pins */}
        <rect x={CX + R - 1} y={155} width="5" height="3" rx="0.6"
          fill="#d2ad78" fillOpacity="0.56" />
        <rect x={CX + R - 1} y={242} width="5" height="3" rx="0.6"
          fill="#d2ad78" fillOpacity="0.56" />
        {/* Bottom pins */}
        <rect x={155} y={CY + R - 1} width="3" height="5" rx="0.6"
          fill="#d2ad78" fillOpacity="0.56" />
        <rect x={242} y={CY + R - 1} width="3" height="5" rx="0.6"
          fill="#d2ad78" fillOpacity="0.56" />
        {/* Left pins */}
        <rect x={CX - R - 4} y={155} width="5" height="3" rx="0.6"
          fill="#d2ad78" fillOpacity="0.56" />
        <rect x={CX - R - 4} y={242} width="5" height="3" rx="0.6"
          fill="#d2ad78" fillOpacity="0.56" />

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
          fill="#b79a72"
          fontFamily="var(--font-ibm-plex-mono, monospace)"
          fontSize="6.5"
          letterSpacing="0.22em"
        >
          CAUSAL ENGINE
        </text>

        {/* ── Port glow markers — pulsing amber ─────────────────────── */}
        {PORTS.map((port, i) => (
          <g key={`port-${i}`}>
            {/* Outer glow halo — softer, smaller bloom */}
            <circle cx={port.px} cy={port.py} r="10"
              fill="url(#masa-port-glow)" opacity="0.35">
              <animate attributeName="r"
                values="8;12;8" dur="2.8s" begin={`${i * 0.35}s`}
                repeatCount="indefinite" calcMode="spline"
                keyTimes="0;0.5;1" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" />
              <animate attributeName="opacity"
                values="0.15;0.40;0.15" dur="2.8s" begin={`${i * 0.35}s`}
                repeatCount="indefinite" />
            </circle>
            {/* Inner solid dot — warm white, crisp, subtle pulse */}
            <circle cx={port.px} cy={port.py} r="2.8"
              fill={DOT_COLOR} opacity="0.85"
              filter="url(#masa-dot-glow)">
              {/* Pop-in on load */}
              <animate attributeName="r" values="0;4;2.8" dur="0.4s"
                begin={`${0.05 * i + 0.5}s`} fill="freeze" />
              {/* Continuous radius pulse — tighter range */}
              <animate attributeName="r"
                values="2.8;3.3;2.8" dur="2.8s"
                begin={`${0.05 * i + 0.9}s`} repeatCount="indefinite"
                calcMode="spline" keyTimes="0;0.5;1"
                keySplines="0.4 0 0.2 1;0.4 0 0.2 1" />
              {/* Continuous opacity pulse — quieter */}
              <animate attributeName="opacity"
                values="0.65;0.90;0.65" dur="2.8s"
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
            fill="#6c5d52"
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
