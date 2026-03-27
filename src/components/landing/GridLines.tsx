type GridSegment = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity?: number;
  width?: number;
  pulse?: boolean;
  delay?: string;
  duration?: string;
};

const FRAME_SEGMENTS: readonly GridSegment[] = [
  { id: "top-left", x1: 0, y1: 4, x2: 67, y2: 4, opacity: 0.66, width: 0.1 },
  { id: "top-right", x1: 67, y1: 4, x2: 100, y2: 4, opacity: 0.78, width: 0.1, pulse: true, delay: "1.2s", duration: "18s" },
  { id: "right-top", x1: 86, y1: 4, x2: 86, y2: 46, opacity: 0.72, width: 0.1 },
  { id: "right-bottom", x1: 86, y1: 46, x2: 86, y2: 92, opacity: 0.46, width: 0.08 },
  { id: "left-main", x1: 8, y1: 4, x2: 8, y2: 100, opacity: 0.44, width: 0.08 },
  { id: "mid-column", x1: 28, y1: 30, x2: 28, y2: 100, opacity: 0.34, width: 0.08 },
  { id: "mid-column-two", x1: 47, y1: 4, x2: 47, y2: 100, opacity: 0.26, width: 0.08 },
  { id: "low-horizontal", x1: 0, y1: 68, x2: 72, y2: 68, opacity: 0.6, width: 0.1 },
  { id: "bottom-horizontal", x1: 0, y1: 92, x2: 100, y2: 92, opacity: 0.36, width: 0.08 },
  { id: "bottom-left-column", x1: 28, y1: 68, x2: 28, y2: 92, opacity: 0.28, width: 0.08 },
];

const DETAIL_SEGMENTS: readonly GridSegment[] = [
  { id: "detail-h-1", x1: 0, y1: 18, x2: 100, y2: 18, opacity: 0.18, width: 0.06 },
  { id: "detail-h-2", x1: 0, y1: 43, x2: 100, y2: 43, opacity: 0.18, width: 0.06 },
  { id: "detail-v-1", x1: 17, y1: 4, x2: 17, y2: 100, opacity: 0.16, width: 0.06 },
  { id: "detail-v-2", x1: 67, y1: 4, x2: 67, y2: 100, opacity: 0.14, width: 0.06 },
  { id: "detail-v-3", x1: 58, y1: 54, x2: 58, y2: 100, opacity: 0.1, width: 0.05 },
  { id: "detail-h-3", x1: 49, y1: 54, x2: 100, y2: 54, opacity: 0.1, width: 0.05 },
];

const PULSE_SEGMENTS: readonly GridSegment[] = [
  { id: "pulse-top", x1: 69, y1: 4, x2: 88, y2: 4, opacity: 0.3, width: 0.1, pulse: true, delay: "0s", duration: "20s" },
  { id: "pulse-right", x1: 86, y1: 18, x2: 86, y2: 37, opacity: 0.24, width: 0.08, pulse: true, delay: "6s", duration: "16s" },
  { id: "pulse-mid", x1: 28, y1: 68, x2: 47, y2: 68, opacity: 0.16, width: 0.08, pulse: true, delay: "3s", duration: "14s" },
  { id: "pulse-left", x1: 8, y1: 18, x2: 8, y2: 43, opacity: 0.18, width: 0.08, pulse: true, delay: "9s", duration: "18s" },
];

function renderSegments(segments: readonly GridSegment[], stroke: string) {
  return segments.map((segment) => (
    <line
      key={segment.id}
      x1={segment.x1}
      y1={segment.y1}
      x2={segment.x2}
      y2={segment.y2}
      stroke={stroke}
      strokeWidth={segment.width ?? 0.08}
      strokeLinecap="square"
      opacity={segment.opacity ?? 1}
    >
      {segment.pulse ? (
        <>
          <animate
            attributeName="opacity"
            values={`${Math.max((segment.opacity ?? 0.18) * 0.35, 0.06)};${Math.min((segment.opacity ?? 0.18) * 1.8, 0.88)};${Math.max((segment.opacity ?? 0.18) * 0.35, 0.06)}`}
            dur={segment.duration ?? "16s"}
            begin={segment.delay ?? "0s"}
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-width"
            values={`${segment.width ?? 0.08};${(segment.width ?? 0.08) + 0.02};${segment.width ?? 0.08}`}
            dur={segment.duration ?? "16s"}
            begin={segment.delay ?? "0s"}
            repeatCount="indefinite"
          />
        </>
      ) : null}
    </line>
  ));
}

export function GridLines() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 25,
        pointerEvents: "none",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="landing-grid-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--landing-grid-line-strong)" />
            <stop offset="100%" stopColor="var(--landing-grid-line-soft)" />
          </linearGradient>
          <linearGradient id="landing-grid-detail" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--landing-grid-line-soft)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="landing-grid-pulse" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--landing-grid-line-pulse)" />
            <stop offset="100%" stopColor="var(--landing-grid-line-strong)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="100" height="100" fill="transparent" />
        <g>{renderSegments(FRAME_SEGMENTS, "url(#landing-grid-stroke)")}</g>
        <g>{renderSegments(DETAIL_SEGMENTS, "url(#landing-grid-detail)")}</g>
        <g>{renderSegments(PULSE_SEGMENTS, "url(#landing-grid-pulse)")}</g>
      </svg>
    </div>
  );
}
