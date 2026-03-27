"use client";

interface MasaArchitectureProps {
  className?: string;
  text?: string;
}

interface PinDefinition {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  rotate?: number;
  cx?: number;
  cy?: number;
}

interface PortDefinition {
  px: number;
  py: number;
  lx: number;
  ly: number;
  anchor: "start" | "middle" | "end";
  label: string;
}

const ROUTES = [
  { d: "M 14 22 H 104.5 Q 111 22 111 28.5 V 52", cx: 14, cy: 22 },
  { d: "M 186 10 H 108.5 Q 102 10 102 16.5 V 52", cx: 186, cy: 10 },
  { d: "M 136 22 V 45.5 Q 136 52 129.5 52 H 116", cx: 136, cy: 22 },
  { d: "M 170 90 V 67.5 Q 170 61 163.5 61 H 116", cx: 170, cy: 90 },
  { d: "M 142 68 H 156 Q 162 68 162 74 V 84 Q 162 90 156 90 H 116.5 Q 110 90 110 83.5 V 61", cx: 142, cy: 68 },
  { d: "M 100 98 V 62", cx: 100, cy: 98 },
  { d: "M 91 93 V 74 Q 91 68 85 68 H 74 Q 68 68 68 62 V 54 Q 68 48 74 48 H 86", cx: 91, cy: 93 },
  { d: "M 34 34 H 56 Q 62 34 62 40 V 46.5 Q 62 52 68 52 H 84", cx: 34, cy: 34 },
] as const;

const CHIP_X = 83;
const CHIP_Y = 37;
const CHIP_W = 38;
const CHIP_H = 30;
const CHIP_CENTER_X = CHIP_X + CHIP_W / 2;

const PORTS: readonly PortDefinition[] = [
  { px: 136, py: 22, lx: 136, ly: 14, anchor: "middle", label: "SCM Model" },
  { px: 170, py: 10, lx: 170, ly: 2, anchor: "middle", label: "Causal DAG" },
  { px: 186, py: 10, lx: 191, ly: 10, anchor: "start", label: "Inference" },
  { px: 170, py: 90, lx: 175, ly: 90, anchor: "start", label: "Memory" },
  { px: 142, py: 68, lx: 146, ly: 99, anchor: "middle", label: "Falsifiability" },
  { px: 100, py: 98, lx: 100, ly: 106, anchor: "middle", label: "Provenance" },
  { px: 91, py: 93, lx: 76, ly: 90, anchor: "end", label: "Critique" },
  { px: 34, py: 34, lx: 26, ly: 34, anchor: "end", label: "Grounding" },
] as const;

const PINS: readonly PinDefinition[] = [
  { x: 94.5, y: 31.6, w: 3.2, h: 7, rx: 0.8 },
  { x: 106.3, y: 31.6, w: 3.2, h: 7, rx: 0.8 },
  { x: 121.3, y: 47.2, w: 3.2, h: 7, rx: 0.8, rotate: 90, cx: 122.9, cy: 50.7 },
  { x: 121.3, y: 60.2, w: 3.2, h: 7, rx: 0.8, rotate: 90, cx: 122.9, cy: 63.7 },
  { x: 94.5, y: 65.4, w: 3.2, h: 7, rx: 0.8 },
  { x: 106.3, y: 65.4, w: 3.2, h: 7, rx: 0.8 },
  { x: 79.5, y: 47.2, w: 3.2, h: 7, rx: 0.8, rotate: 90, cx: 81.1, cy: 50.7 },
  { x: 79.5, y: 60.2, w: 3.2, h: 7, rx: 0.8, rotate: 90, cx: 81.1, cy: 63.7 },
] as const;

export function MasaArchitecture({ className, text = "MASA" }: MasaArchitectureProps) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 200 110"
        width="100%"
        aria-label="MASA processor architecture"
        style={{ overflow: "visible" }}
      >
        <defs>
          <filter id="masa-cpu-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="rgba(40, 31, 24, 0.12)" />
          </filter>

          <filter id="masa-endpoint-shadow" x="-100%" y="-100%" width="300%" height="300%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor="rgba(58, 46, 34, 0.18)" />
          </filter>

          <linearGradient id="masa-route-line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(92, 78, 64, 0.1)" />
            <stop offset="100%" stopColor="rgba(92, 78, 64, 0.18)" />
          </linearGradient>

          <linearGradient id="masa-chip-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--landing-masa-chip-fill-start)" />
            <stop offset="100%" stopColor="var(--landing-masa-chip-fill-end)" />
          </linearGradient>

          <linearGradient id="masa-chip-edge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--landing-masa-chip-edge-highlight)" />
            <stop offset="100%" stopColor="var(--landing-masa-chip-edge-shadow)" />
          </linearGradient>

          <linearGradient id="masa-text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-rust)" />
            <stop offset="55%" stopColor="var(--accent-rust-strong)" />
            <stop offset="100%" stopColor="var(--accent-rust)" />
          </linearGradient>
        </defs>

        <g
          stroke="url(#masa-route-line)"
          fill="none"
          strokeWidth="0.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="100 100"
          pathLength="100"
        >
          {ROUTES.map((route, index) => (
            <path key={index} d={route.d} strokeDasharray="100 100" pathLength="100">
              <animate
                attributeName="stroke-dashoffset"
                from="100"
                to="0"
                dur="1.1s"
                begin={`${index * 0.06}s`}
                fill="freeze"
                calcMode="spline"
                keySplines="0.25,0.1,0.5,1"
                keyTimes="0;1"
              />
            </path>
          ))}
        </g>

        {PORTS.map((port, index) => (
          <text
            key={`label-${index}`}
            x={port.lx}
            y={port.ly}
            textAnchor={port.anchor}
            dominantBaseline="middle"
            fill="var(--landing-masa-label)"
            fontFamily="var(--font-ibm-plex-mono, monospace)"
            fontSize="4.2"
            letterSpacing="0.16em"
          >
            {port.label}
          </text>
        ))}

        {ROUTES.map((route, index) => (
          <g key={`marker-${index}`} filter="url(#masa-endpoint-shadow)">
            <circle
              cx={route.cx}
              cy={route.cy}
              r="3.3"
              fill="var(--landing-masa-dot-halo)"
              opacity="0.12"
            >
              <animate
                attributeName="r"
                values="2.7;3.5;2.7"
                dur="2.8s"
                begin={`${0.18 * index}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.08;0.18;0.08"
                dur="2.8s"
                begin={`${0.18 * index}s`}
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx={route.cx}
              cy={route.cy}
              r="1.9"
              fill="var(--landing-masa-dot-core)"
            >
              <animate
                attributeName="r"
                values="1.75;2.15;1.75"
                dur="2.8s"
                begin={`${0.18 * index}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.72;1;0.72"
                dur="2.8s"
                begin={`${0.18 * index}s`}
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx={route.cx}
              cy={route.cy}
              r="2.4"
              fill="none"
              stroke="var(--landing-masa-dot-ring)"
              strokeWidth="0.28"
            />
          </g>
        ))}

        <g filter="url(#masa-cpu-shadow)">
          {PINS.map((pin, index) => (
            <rect
              key={index}
              x={pin.x}
              y={pin.y}
              width={pin.w}
              height={pin.h}
              rx={pin.rx}
              fill="var(--landing-masa-pin-fill)"
              transform={pin.rotate ? `rotate(${pin.rotate} ${pin.cx} ${pin.cy})` : undefined}
            />
          ))}

          <rect
            x={CHIP_X}
            y={CHIP_Y}
            width={CHIP_W}
            height={CHIP_H}
            rx="4"
            fill="url(#masa-chip-fill)"
          />
          <rect
            x={CHIP_X + 0.4}
            y={CHIP_Y + 0.4}
            width={CHIP_W - 0.8}
            height={CHIP_H - 0.8}
            rx="3.6"
            fill="none"
            stroke="url(#masa-chip-edge)"
            strokeWidth="0.35"
          />

          <text
            x={CHIP_X + CHIP_W / 2}
            y={CHIP_Y + 16.8}
            textAnchor="middle"
            fill="url(#masa-text-grad)"
            fontFamily="var(--font-inter, Inter, sans-serif)"
            fontSize="13.8"
            fontWeight="700"
            letterSpacing="0.07em"
          >
            {text}
          </text>
          <text
            x={CHIP_CENTER_X}
            y={CHIP_Y + 24}
            textAnchor="middle"
            fill="var(--landing-masa-sub-label)"
            fontFamily="var(--font-ibm-plex-mono, monospace)"
            fontSize="3.3"
            letterSpacing="0.2em"
          >
            CAUSAL ENGINE
          </text>
        </g>
      </svg>
    </div>
  );
}
