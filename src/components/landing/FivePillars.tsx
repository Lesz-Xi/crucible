"use client";

import { motion, useReducedMotion } from "framer-motion";

const TWO_PI = Math.PI * 2;

const pillars = [
  {
    id: "scm",
    num: "01",
    label: "Causal SCM",
    sub: "Structural Causal Models · DAG construction",
    angle: -Math.PI / 2, // top
  },
  {
    id: "contradiction",
    num: "02",
    label: "Contradiction Engine",
    sub: "Hong recombination · Novelty proofing",
    angle: -Math.PI / 2 + TWO_PI * (1 / 5),
  },
  {
    id: "memory",
    num: "03",
    label: "Sovereign Memory",
    sub: "Rejection-aware RAG · Pyodide sandbox",
    angle: -Math.PI / 2 + TWO_PI * (2 / 5),
  },
  {
    id: "critique",
    num: "04",
    label: "Multi-Agent Critique",
    sub: "Epistemologist · Skeptic · Architect",
    angle: -Math.PI / 2 + TWO_PI * (3 / 5),
  },
  {
    id: "gate",
    num: "05",
    label: "Falsifiability Gate",
    sub: "Physical-reality validation · Memory commit",
    angle: -Math.PI / 2 + TWO_PI * (4 / 5),
  },
] as const;

const CX = 160;
const CY = 160;
const R  = 108; // orbit radius

// Pre-compute node positions
const nodes = pillars.map((p) => ({
  ...p,
  nx: CX + R * Math.cos(p.angle),
  ny: CY + R * Math.sin(p.angle),
}));

function OrbitalSVG() {
  return (
    <svg
      viewBox="0 0 320 320"
      width="320"
      height="320"
      aria-hidden="true"
      style={{ overflow: "visible", maxWidth: "100%" }}
    >
      <defs>
        {/* Amber radial glow for center hub */}
        <radialGradient id="fp-hub-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#292524" />
          <stop offset="100%" stopColor="#0e0d0c" />
        </radialGradient>
        <radialGradient id="fp-center-ring" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#c8965a" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#c8965a" stopOpacity="0"    />
        </radialGradient>
        {/* Amber dot glow */}
        <radialGradient id="fp-dot-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#c8965a" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#c8965a" stopOpacity="0"   />
        </radialGradient>
      </defs>

      {/* Orbit ring — solid amber, low opacity */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="#c8965a"
        strokeWidth="0.7"
        strokeOpacity="0.22"
      />

      {/* Spoke lines — solid amber */}
      {nodes.map((n) => (
        <line
          key={`spoke-${n.id}`}
          x1={CX} y1={CY}
          x2={n.nx} y2={n.ny}
          stroke="#c8965a"
          strokeWidth="0.6"
          strokeOpacity="0.18"
        />
      ))}

      {/* Center hub ambient glow disc */}
      <circle cx={CX} cy={CY} r="56"
        fill="url(#fp-center-ring)" />

      {/* Center hub body */}
      <circle
        cx={CX} cy={CY} r="38"
        fill="url(#fp-hub-glow)"
        stroke="#c8965a"
        strokeWidth="0.8"
        strokeOpacity="0.4"
      />

      {/* Center hub inner ring */}
      <circle
        cx={CX} cy={CY} r="32"
        fill="none"
        stroke="#c8965a"
        strokeWidth="0.4"
        strokeOpacity="0.18"
      />

      {/* Center label */}
      <text
        x={CX} y={CY - 4}
        textAnchor="middle"
        fill="#c8965a"
        fontFamily="var(--font-lora, Georgia, serif)"
        fontSize="11"
        fontWeight="400"
        letterSpacing="0.06em"
      >
        MASA
      </text>
      <text
        x={CX} y={CY + 10}
        textAnchor="middle"
        fill="#5a5148"
        fontFamily="var(--font-ibm-plex-mono, monospace)"
        fontSize="5.5"
        letterSpacing="0.22em"
      >
        ENGINE
      </text>

      {/* Orbital dots + node number labels */}
      {nodes.map((n, i) => (
        <g key={`node-${n.id}`}>
          {/* Glow halo */}
          <circle cx={n.nx} cy={n.ny} r="10"
            fill="url(#fp-dot-glow)" opacity="0.45" />
          {/* Solid dot */}
          <circle cx={n.nx} cy={n.ny} r="3.2"
            fill="#c8965a" opacity="0.9">
            <animate
              attributeName="r"
              values="0; 4; 3.2"
              dur="0.45s"
              begin={`${i * 0.1 + 0.3}s`}
              fill="freeze"
            />
          </circle>
          {/* Number badge beside dot */}
          <text
            x={n.nx + (Math.cos(n.angle) * 18)}
            y={n.ny + (Math.sin(n.angle) * 18) + 2}
            textAnchor="middle"
            fill="#5a5148"
            fontFamily="var(--font-ibm-plex-mono, monospace)"
            fontSize="6"
            letterSpacing="0.1em"
          >
            {n.num}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function FivePillars() {
  const shouldReduce = useReducedMotion();

  return (
    <section
      id="architecture"
      className="hd-section overflow-hidden bg-[var(--bg-primary)] py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-8 md:px-12 lg:px-16">

        {/* Header */}
        <div className="mb-16 lg:mb-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="block h-px w-8 bg-[var(--accent-rust)] flex-shrink-0" />
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Architecture
            </span>
          </div>
          <h2
            className="hd-serif-display text-[var(--text-primary)] max-w-xl"
            style={{ fontSize: "clamp(2rem, 4vw, 3.4rem)" }}
          >
            Five Pillars.{" "}
            <em className="italic text-[var(--accent-rust)]">
              One Causal Engine.
            </em>
          </h2>
          <p className="mt-5 max-w-[32rem] text-[0.9rem] leading-[1.8] text-[var(--text-muted)]">
            Every capability is purpose-built for causal governance. Together
            they form a closed-loop automated scientist.
          </p>
        </div>

        {/* Body — orbital diagram (left) + pillar list (right) */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">

          {/* Left — orbital SVG */}
          <div className="flex items-center justify-center lg:justify-start">
            <OrbitalSVG />
          </div>

          {/* Right — numbered pillar cards */}
          <div className="flex flex-col gap-0">
            {pillars.map((p, i) => {
              const Wrap = shouldReduce ? "div" : motion.div;
              const motionProps = shouldReduce
                ? {}
                : {
                    initial: { opacity: 0, x: 16 },
                    whileInView: { opacity: 1, x: 0 },
                    viewport: { once: true },
                    transition: {
                      duration: 0.5,
                      delay: i * 0.07,
                      ease: [0.25, 0.1, 0.5, 1],
                    },
                  };

              return (
                <Wrap
                  key={p.id}
                  {...(motionProps as object)}
                  className="group flex items-start gap-5 border-b border-[var(--border-subtle)] py-5 last:border-b-0"
                >
                  {/* Number */}
                  <span
                    className="shrink-0 mt-0.5 font-mono text-[0.62rem] tracking-[0.18em] text-[var(--accent-rust)] opacity-70"
                    aria-hidden="true"
                  >
                    {p.num}
                  </span>

                  {/* Content */}
                  <div className="min-w-0">
                    <p className="text-[0.92rem] font-medium leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent-rust)] transition-colors duration-200">
                      {p.label}
                    </p>
                    <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-[var(--text-muted)] leading-relaxed">
                      {p.sub}
                    </p>
                  </div>

                  {/* Amber accent line — slides in on hover */}
                  <div className="ml-auto shrink-0 self-stretch flex items-center">
                    <div className="h-full w-px bg-[var(--accent-rust)] opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                  </div>
                </Wrap>
              );
            })}
          </div>
        </div>

        {/* Mobile fallback — simple card grid (shown only on small screens) */}
        <div className="mt-10 grid grid-cols-1 gap-3 lg:hidden">
          {pillars.map((p) => (
            <div
              key={`mob-${p.id}`}
              className="flex items-start gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4"
            >
              <span className="shrink-0 font-mono text-[0.62rem] tracking-[0.18em] text-[var(--accent-rust)]">
                {p.num}
              </span>
              <div>
                <p className="text-[0.88rem] font-medium text-[var(--text-primary)]">
                  {p.label}
                </p>
                <p className="mt-0.5 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  {p.sub}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
