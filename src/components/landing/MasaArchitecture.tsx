"use client";

interface MasaArchitectureProps {
  className?: string;
}

type RouteDefinition = {
  id: string;
  d: string;
  label: string;
  labelX: number;
  labelY: number;
  anchor?: "start" | "middle" | "end";
  color: string;
  markerStart?: boolean;
  pulseDur: string;
  pulseDelay: string;
  travelerDur: string;
  travelerDelay: string;
};

type SignalDefinition = {
  x: number;
  y: number;
  color: string;
  delay: string;
};

type SwitchDefinition = {
  x: number;
  y: number;
  angle: number;
  color: string;
};

const ROUTES: readonly RouteDefinition[] = [
  {
    id: "scm-loop",
    d: "M 14 22 H 52 Q 58 22 58 28 V 34 Q 58 40 64 40 H 96 Q 102 40 102 34 V 16 Q 102 10 108 10 H 154",
    label: "SCM LOOP",
    labelX: 14,
    labelY: 18,
    anchor: "start",
    color: "var(--landing-masa-route-azure)",
    markerStart: true,
    pulseDur: "11s",
    pulseDelay: "0s",
    travelerDur: "8.4s",
    travelerDelay: "0.2s",
  },
  {
    id: "evidence-rail",
    d: "M 8 38 H 48 Q 54 38 54 44 V 46 Q 54 52 60 52 H 128 Q 134 52 134 46 V 38 H 188",
    label: "EVIDENCE BUS",
    labelX: 8,
    labelY: 34,
    anchor: "start",
    color: "var(--landing-masa-route-cyan)",
    markerStart: true,
    pulseDur: "9.2s",
    pulseDelay: "1s",
    travelerDur: "7.2s",
    travelerDelay: "1.4s",
  },
  {
    id: "critique-line",
    d: "M 24 68 H 72 Q 78 68 78 62 V 58 Q 78 52 84 52 H 100",
    label: "CRITIQUE GATE",
    labelX: 24,
    labelY: 72.5,
    anchor: "start",
    color: "var(--landing-masa-route-amber)",
    markerStart: true,
    pulseDur: "8.6s",
    pulseDelay: "2.3s",
    travelerDur: "6.4s",
    travelerDelay: "2.8s",
  },
  {
    id: "counterfactual-main",
    d: "M 64 78 H 118 Q 124 78 124 72 V 68 Q 124 62 130 62 H 188",
    label: "COUNTERFACTUAL",
    labelX: 188,
    labelY: 58.5,
    anchor: "end",
    color: "var(--landing-masa-route-violet)",
    pulseDur: "12.2s",
    pulseDelay: "0.8s",
    travelerDur: "8.8s",
    travelerDelay: "0.6s",
  },
  {
    id: "memory-lane",
    d: "M 112 56 H 142 Q 148 56 148 62 V 76 Q 148 82 154 82 H 186",
    label: "MEMORY",
    labelX: 186,
    labelY: 86.5,
    anchor: "end",
    color: "var(--landing-masa-route-green)",
    pulseDur: "10.4s",
    pulseDelay: "1.8s",
    travelerDur: "7.8s",
    travelerDelay: "2.2s",
  },
  {
    id: "intervention-branch",
    d: "M 106 52 H 126 Q 132 52 132 46 V 24 Q 132 18 138 18 H 188",
    label: "INTERVENTION",
    labelX: 188,
    labelY: 14,
    anchor: "end",
    color: "var(--landing-masa-route-rose)",
    pulseDur: "9.6s",
    pulseDelay: "3.1s",
    travelerDur: "7.1s",
    travelerDelay: "3.6s",
  },
  {
    id: "provenance-spine",
    d: "M 96 90 V 56",
    label: "PROVENANCE",
    labelX: 96,
    labelY: 96,
    anchor: "middle",
    color: "var(--landing-masa-route-amber)",
    pulseDur: "7.8s",
    pulseDelay: "2.8s",
    travelerDur: "5.4s",
    travelerDelay: "3.4s",
  },
  {
    id: "signal-column",
    d: "M 116 8 V 44",
    label: "SIGNAL STATE",
    labelX: 116,
    labelY: 4,
    anchor: "middle",
    color: "var(--landing-masa-route-blue)",
    pulseDur: "8.8s",
    pulseDelay: "4.1s",
    travelerDur: "6.2s",
    travelerDelay: "4.4s",
  },
] as const;

const SIGNALS: readonly SignalDefinition[] = [
  { x: 14, y: 22, color: "var(--landing-masa-route-azure)", delay: "0s" },
  { x: 8, y: 38, color: "var(--landing-masa-route-cyan)", delay: "0.8s" },
  { x: 24, y: 68, color: "var(--landing-masa-route-amber)", delay: "1.2s" },
  { x: 188, y: 82, color: "var(--landing-masa-route-green)", delay: "1.8s" },
  { x: 188, y: 18, color: "var(--landing-masa-route-rose)", delay: "2.4s" },
  { x: 188, y: 38, color: "var(--landing-masa-route-violet)", delay: "3s" },
  { x: 96, y: 90, color: "var(--landing-masa-route-amber)", delay: "3.6s" },
  { x: 116, y: 8, color: "var(--landing-masa-route-blue)", delay: "4.2s" },
];

const SWITCHES: readonly SwitchDefinition[] = [
  { x: 54, y: 38, angle: 0, color: "var(--landing-masa-route-cyan)" },
  { x: 78, y: 68, angle: -32, color: "var(--landing-masa-route-amber)" },
  { x: 132, y: 24, angle: -32, color: "var(--landing-masa-route-rose)" },
  { x: 148, y: 62, angle: 32, color: "var(--landing-masa-route-green)" },
];

const PANEL_X = 10;
const PANEL_Y = 8;
const PANEL_W = 180;
const PANEL_H = 86;

const BOARD_X = 70;
const BOARD_Y = 27;
const BOARD_W = 54;
const BOARD_H = 34;
const HUD_Y = 82;

export function MasaArchitecture({ className }: MasaArchitectureProps) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 200 104"
        width="100%"
        aria-label="MASA mimic control board"
        style={{ overflow: "visible", display: "block" }}
      >
        <defs>
          <linearGradient id="masa-board-panel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--landing-masa-board-panel-top)" />
            <stop offset="100%" stopColor="var(--landing-masa-board-panel-bottom)" />
          </linearGradient>
          <linearGradient id="masa-board-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--landing-masa-board-stroke-start)" />
            <stop offset="100%" stopColor="var(--landing-masa-board-stroke-end)" />
          </linearGradient>
          <filter id="masa-board-shadow" x="-20%" y="-30%" width="140%" height="170%">
            <feDropShadow dx="0" dy="18" stdDeviation="14" floodColor="rgba(0, 0, 0, 0.48)" />
          </filter>
          <filter id="masa-traveler-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern
            id="masa-board-grid"
            x="0"
            y="0"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--landing-masa-board-grid)" strokeWidth="0.18" />
          </pattern>
          <radialGradient id="masa-panel-glow" cx="50%" cy="82%" r="65%">
            <stop offset="0%" stopColor="rgba(29, 154, 255, 0.08)" />
            <stop offset="38%" stopColor="rgba(17, 215, 209, 0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>

        <g filter="url(#masa-board-shadow)">
          <rect
            x={PANEL_X}
            y={PANEL_Y}
            width={PANEL_W}
            height={PANEL_H}
            rx="7"
            fill="url(#masa-board-panel)"
          />
          <rect
            x={PANEL_X + 0.7}
            y={PANEL_Y + 0.7}
            width={PANEL_W - 1.4}
            height={PANEL_H - 1.4}
            rx="6.3"
            fill="url(#masa-panel-glow)"
            stroke="url(#masa-board-stroke)"
            strokeWidth="0.42"
          />
          <rect
            x={PANEL_X + 2.4}
            y={PANEL_Y + 2.4}
            width={PANEL_W - 4.8}
            height={PANEL_H - 12}
            rx="5"
            fill="url(#masa-board-grid)"
            opacity="0.7"
          />
        </g>

        <g opacity="0.34">
          {Array.from({ length: 8 }).map((_, index) => (
            <line
              key={`guide-h-${index}`}
              x1={PANEL_X + 10}
              y1={PANEL_Y + 10 + index * 8}
              x2={PANEL_X + PANEL_W - 10}
              y2={PANEL_Y + 10 + index * 8}
              stroke="var(--landing-masa-board-grid)"
              strokeWidth="0.16"
            />
          ))}
        </g>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {ROUTES.map((route) => (
            <g key={`${route.id}-base`}>
              <path
                id={route.id}
                d={route.d}
                stroke="var(--landing-masa-route-base)"
                strokeWidth="0.6"
                opacity="0.66"
              />
              <path d={route.d} stroke={route.color} strokeWidth="0.42" opacity="0.9">
                <animate
                  attributeName="stroke-opacity"
                  values="0.55;1;0.55"
                  dur={route.pulseDur}
                  begin={route.pulseDelay}
                  repeatCount="indefinite"
                />
              </path>
            </g>
          ))}
        </g>

        <g>
          {SWITCHES.map((point, index) => (
            <g
              key={`switch-${index}`}
              transform={`translate(${point.x} ${point.y}) rotate(${point.angle})`}
            >
              <path
                d="M -1.5 -1.4 L 1.5 0 L -1.5 1.4"
                fill="none"
                stroke={point.color}
                strokeWidth="0.45"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.88"
              />
            </g>
          ))}
        </g>

        <g>
          {SIGNALS.map((signal, index) => (
            <g key={`signal-${index}`}>
              <circle
                cx={signal.x}
                cy={signal.y}
                r="2.55"
                fill="rgba(0,0,0,0)"
                stroke="var(--landing-masa-signal-ring)"
                strokeWidth="0.34"
              />
              <circle cx={signal.x} cy={signal.y} r="1.18" fill={signal.color}>
                <animate
                  attributeName="opacity"
                  values="0.5;1;0.5"
                  dur="3.8s"
                  begin={signal.delay}
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx={signal.x} cy={signal.y} r="1.95" fill={signal.color} opacity="0.1">
                <animate
                  attributeName="r"
                  values="1.6;2.45;1.6"
                  dur="3.8s"
                  begin={signal.delay}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.05;0.18;0.05"
                  dur="3.8s"
                  begin={signal.delay}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
        </g>

        <g filter="url(#masa-traveler-glow)">
          {ROUTES.map((route) => (
            <circle key={`traveler-${route.id}`} r="1.32" fill={route.color}>
              <animateMotion
                dur={route.travelerDur}
                begin={route.travelerDelay}
                repeatCount="indefinite"
                rotate="auto"
              >
                <mpath xlinkHref={`#${route.id}`} />
              </animateMotion>
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.08;0.92;1"
                dur={route.travelerDur}
                begin={route.travelerDelay}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>

        <g>
          {ROUTES.map((route) => (
            <text
              key={`label-${route.id}`}
              x={route.labelX}
              y={route.labelY}
              textAnchor={route.anchor ?? "start"}
              fill="var(--landing-masa-route-label)"
              fontFamily="var(--font-ibm-plex-mono, monospace)"
              fontSize="2.45"
              fontWeight="500"
              letterSpacing="0.24em"
              opacity="0.95"
            >
              {route.label}
            </text>
          ))}
        </g>

        <g>
          <rect
            x={BOARD_X}
            y={BOARD_Y}
            width={BOARD_W}
            height={BOARD_H}
            rx="5"
            fill="var(--landing-masa-center-bg)"
            stroke="var(--landing-masa-center-stroke)"
            strokeWidth="0.55"
          />
          <rect
            x={BOARD_X + 2}
            y={BOARD_Y + 2}
            width={BOARD_W - 4}
            height={BOARD_H - 4}
            rx="4"
            fill="none"
            stroke="var(--landing-masa-center-inner)"
            strokeWidth="0.22"
          />

          <g opacity="0.82">
            {[12, 24, 36, 48].map((offset) => (
              <line
                key={`bus-h-${offset}`}
                x1={BOARD_X + 5}
                y1={BOARD_Y + offset * 0.46}
                x2={BOARD_X + BOARD_W - 5}
                y2={BOARD_Y + offset * 0.46}
                stroke="var(--landing-masa-center-grid)"
                strokeWidth="0.14"
              />
            ))}
            {[12, 22, 32, 42].map((offset) => (
              <line
                key={`bus-v-${offset}`}
                x1={BOARD_X + offset}
                y1={BOARD_Y + 5}
                x2={BOARD_X + offset}
                y2={BOARD_Y + BOARD_H - 5}
                stroke="var(--landing-masa-center-grid)"
                strokeWidth="0.14"
              />
            ))}
          </g>

          <text
            x={BOARD_X + 8}
            y={BOARD_Y + 12}
            fill="var(--landing-masa-board-kicker)"
            fontFamily="var(--font-ibm-plex-mono, monospace)"
            fontSize="2.4"
            letterSpacing="0.24em"
          >
            LIVE CAUSAL BOARD
          </text>
          <text
            x={BOARD_X + 8}
            y={BOARD_Y + 23}
            fill="var(--landing-masa-board-title)"
            fontFamily="var(--font-inter, Inter, sans-serif)"
            fontSize="12.8"
            fontWeight="650"
            letterSpacing="0.05em"
          >
            MASA
          </text>
          <text
            x={BOARD_X + 8}
            y={BOARD_Y + 29.5}
            fill="var(--landing-masa-board-subtitle)"
            fontFamily="var(--font-ibm-plex-mono, monospace)"
            fontSize="2.75"
            letterSpacing="0.26em"
          >
            CAUSAL ENGINE
          </text>

          <line
            x1={BOARD_X + 8}
            y1={BOARD_Y + 33}
            x2={BOARD_X + BOARD_W - 8}
            y2={BOARD_Y + 33}
            stroke="var(--landing-masa-center-divider)"
            strokeWidth="0.22"
          />

          <text
            x={BOARD_X + 8}
            y={BOARD_Y + 39}
            fill="var(--landing-masa-board-meta)"
            fontFamily="var(--font-ibm-plex-mono, monospace)"
            fontSize="2.35"
            letterSpacing="0.16em"
          >
            EVIDENCE · CRITIQUE · DO(CAUSE) · COUNTERFACTUAL
          </text>
        </g>

        <g>
          <line
            x1={22}
            y1={HUD_Y}
            x2={178}
            y2={HUD_Y}
            stroke="var(--landing-masa-hud-rail)"
            strokeWidth="0.24"
          />
          <text
            x={22}
            y={HUD_Y - 2}
            fill="var(--landing-masa-hud-text)"
            fontFamily="var(--font-ibm-plex-mono, monospace)"
            fontSize="2.35"
            letterSpacing="0.16em"
          >
            LIVE BOARD STATUS
          </text>
          <text
            x={178}
            y={HUD_Y - 2}
            textAnchor="end"
            fill="var(--landing-masa-hud-value)"
            fontFamily="var(--font-ibm-plex-mono, monospace)"
            fontSize="2.35"
            letterSpacing="0.16em"
          >
            08 SIGNALS · 06 ACTIVE ROUTES · 01 ENGINE
          </text>
        </g>
      </svg>
    </div>
  );
}
