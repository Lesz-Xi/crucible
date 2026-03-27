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

const CHIP_X = 87;
const CHIP_Y = 41;
const CHIP_W = 30;
const CHIP_H = 22;

const PINS: readonly PinDefinition[] = [
  { x: 95, y: 37, w: 2.4, h: 5, rx: 0.7 },
  { x: 104.6, y: 37, w: 2.4, h: 5, rx: 0.7 },
  { x: 118.2, y: 46, w: 2.4, h: 5, rx: 0.7, rotate: 90, cx: 119.4, cy: 48.5 },
  { x: 118.2, y: 55.4, w: 2.4, h: 5, rx: 0.7, rotate: 90, cx: 119.4, cy: 57.9 },
  { x: 95, y: 62.8, w: 2.4, h: 5, rx: 0.7 },
  { x: 104.6, y: 62.8, w: 2.4, h: 5, rx: 0.7 },
  { x: 84.2, y: 46, w: 2.4, h: 5, rx: 0.7, rotate: 90, cx: 85.4, cy: 48.5 },
  { x: 84.2, y: 55.4, w: 2.4, h: 5, rx: 0.7, rotate: 90, cx: 85.4, cy: 57.9 },
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
            <stop offset="0%" stopColor="rgba(25, 24, 24, 0.96)" />
            <stop offset="100%" stopColor="rgba(30, 29, 29, 0.92)" />
          </linearGradient>

          <linearGradient id="masa-chip-edge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </linearGradient>

          <linearGradient id="masa-text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f0ece6" />
            <stop offset="55%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#d7d0c7" />
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

        {ROUTES.map((route, index) => (
          <g key={`marker-${index}`} filter="url(#masa-endpoint-shadow)">
            <circle
              cx={route.cx}
              cy={route.cy}
              r="1.45"
              fill="rgba(18, 18, 18, 0.98)"
            >
              <animate
                attributeName="opacity"
                values="0;1;1"
                dur="0.55s"
                begin={`${index * 0.07}s`}
                fill="freeze"
              />
            </circle>
            <circle
              cx={route.cx}
              cy={route.cy}
              r="1.9"
              fill="none"
              stroke="rgba(45, 45, 45, 0.22)"
              strokeWidth="0.26"
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
              fill="rgba(44, 43, 43, 0.82)"
              transform={pin.rotate ? `rotate(${pin.rotate} ${pin.cx} ${pin.cy})` : undefined}
            />
          ))}

          <rect
            x={CHIP_X}
            y={CHIP_Y}
            width={CHIP_W}
            height={CHIP_H}
            rx="3"
            fill="url(#masa-chip-fill)"
          />
          <rect
            x={CHIP_X + 0.4}
            y={CHIP_Y + 0.4}
            width={CHIP_W - 0.8}
            height={CHIP_H - 0.8}
            rx="2.6"
            fill="none"
            stroke="url(#masa-chip-edge)"
            strokeWidth="0.35"
          />

          <text
            x={CHIP_X + CHIP_W / 2}
            y={CHIP_Y + 12}
            textAnchor="middle"
            fill="url(#masa-text-grad)"
            fontFamily="var(--font-inter, Inter, sans-serif)"
            fontSize="9.5"
            fontWeight="700"
            letterSpacing="0.08em"
          >
            {text}
          </text>
          <text
            x={CHIP_X + CHIP_W / 2}
            y={CHIP_Y + 17.6}
            textAnchor="middle"
            fill="rgba(228, 220, 210, 0.68)"
            fontFamily="var(--font-ibm-plex-mono, monospace)"
            fontSize="2.6"
            letterSpacing="0.24em"
          >
            CAUSAL ENGINE
          </text>
        </g>
      </svg>
    </div>
  );
}
