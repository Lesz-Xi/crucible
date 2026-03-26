// Wu-Weism brand mark — inline SVG, fully transparent background
// W constellation: 5 nodes (amber dots) connected by rust lines

interface WuWeiMarkProps {
  className?: string;
  color?: string;
}

export function WuWeiMark({
  className,
  color = "#c8965a",
}: WuWeiMarkProps) {
  // Five nodes forming a W: top-left, valley-left, center-peak, valley-right, top-right
  const nodes = [
    { x: 6,  y: 6  },  // top-left
    { x: 20, y: 40 },  // valley-left
    { x: 34, y: 16 },  // center-peak
    { x: 48, y: 40 },  // valley-right
    { x: 62, y: 6  },  // top-right
  ];

  const points = nodes.map((n) => `${n.x},${n.y}`).join(" ");

  return (
    <svg
      viewBox="0 0 68 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`block ${className ?? ""}`}
      aria-label="Wu-Weism"
    >
      {/* Connecting lines */}
      <polyline
        points={points}
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />

      {/* Node dots */}
      {nodes.map((n, i) => (
        <circle
          key={i}
          cx={n.x}
          cy={n.y}
          r={i === 0 || i === 4 ? 3.2 : 2.6}
          fill={color}
          opacity={i === 2 ? 1 : 0.85}
        />
      ))}
    </svg>
  );
}
