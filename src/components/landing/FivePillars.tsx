"use client";

import { motion, useReducedMotion } from "framer-motion";

// 5 nodes positioned at 72° intervals around a center hub
// Starting at top (270°) and going clockwise
const TWO_PI = Math.PI * 2;
const pillars = [
  {
    id: "scm",
    label: "Causal SCM",
    sub: "Structural Causal Models · DAG construction",
    angle: -Math.PI / 2, // top
  },
  {
    id: "contradiction",
    label: "Contradiction Engine",
    sub: "Hong recombination · Novelty proofing",
    angle: -Math.PI / 2 + TWO_PI * (1 / 5),
  },
  {
    id: "memory",
    label: "Sovereign Memory",
    sub: "Rejection-aware RAG · Pyodide sandbox",
    angle: -Math.PI / 2 + TWO_PI * (2 / 5),
  },
  {
    id: "critique",
    label: "Multi-Agent Critique",
    sub: "Epistemologist · Skeptic · Architect",
    angle: -Math.PI / 2 + TWO_PI * (3 / 5),
  },
  {
    id: "gate",
    label: "Falsifiability Gate",
    sub: "Physical-reality validation · Memory commit",
    angle: -Math.PI / 2 + TWO_PI * (4 / 5),
  },
];

const ORBIT_R = 200; // px — radius of orbit

function OrbitalDiagram() {
  const shouldReduce = useReducedMotion();

  return (
    <div
      className="relative mx-auto"
      style={{ width: 480, height: 480, maxWidth: "100%" }}
    >
      {/* Orbit ring */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--border-subtle)]"
        style={{ width: ORBIT_R * 2, height: ORBIT_R * 2 }}
      />

      {/* Center hub */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border border-[var(--accent-rust)]/30 bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-secondary)] shadow-[0_0_0_8px_var(--accent-rust-soft),0_0_32px_rgba(166,124,82,0.08)]">
          <span
            className="text-[1rem] font-light tracking-[-0.02em] text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-lora, Georgia, serif)" }}
          >
            MASA
          </span>
          <span className="mt-0.5 font-mono text-[0.52rem] uppercase tracking-[0.14em] text-[var(--accent-rust)]">
            Engine
          </span>
        </div>
      </div>

      {/* Spoke lines + nodes */}
      {pillars.map((p, i) => {
        const cx = 240; // diagram center
        const cy = 240;
        const nx = cx + ORBIT_R * Math.cos(p.angle);
        const ny = cy + ORBIT_R * Math.sin(p.angle);

        // Node card offset so it's centered on the orbital point
        const nodeW = 140;
        const nodeH = 64;

        const Wrap = shouldReduce ? "div" : motion.div;
        const motionProps = shouldReduce
          ? {}
          : {
              initial: { opacity: 0, scale: 0.85 },
              whileInView: { opacity: 1, scale: 1 },
              viewport: { once: true },
              transition: {
                duration: 0.55,
                delay: i * 0.08,
                ease: [0.34, 1.56, 0.64, 1],
              },
            };

        return (
          <div key={p.id}>
            {/* SVG spoke */}
            <svg
              className="pointer-events-none absolute inset-0"
              width="480"
              height="480"
              style={{ maxWidth: "100%" }}
            >
              <line
                x1={cx}
                y1={cy}
                x2={nx}
                y2={ny}
                stroke="var(--border-subtle)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Node card */}
            <Wrap
              {...(motionProps as object)}
              className="absolute flex flex-col items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2.5 text-center shadow-[var(--shadow-soft)]"
              style={{
                left: nx - nodeW / 2,
                top: ny - nodeH / 2,
                width: nodeW,
              }}
            >
              <span className="text-[0.78rem] font-medium leading-tight text-[var(--text-primary)]">
                {p.label}
              </span>
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.1em] text-[var(--text-muted)] leading-tight">
                {p.sub}
              </span>
            </Wrap>
          </div>
        );
      })}
    </div>
  );
}

export function FivePillars() {
  return (
    <section
      id="architecture"
      className="hd-section overflow-hidden bg-[var(--bg-secondary)] py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-8 md:px-12 lg:px-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="hd-kicker mb-4 uppercase">Architecture</p>
          <h2
            className="hd-serif-display mx-auto max-w-xl text-[var(--text-primary)]"
            style={{ fontSize: "clamp(2rem, 4vw, 3.4rem)" }}
          >
            Five Pillars.{" "}
            <em className="italic text-[var(--accent-rust)]">
              One Causal Engine.
            </em>
          </h2>
          <p className="mx-auto mt-5 max-w-[32rem] text-[0.9rem] leading-[1.8] text-[var(--text-muted)]">
            Every capability is purpose-built for causal governance. Together
            they form a closed-loop automated scientist.
          </p>
        </div>

        {/* Orbital diagram */}
        <OrbitalDiagram />

        {/* Pillar list — shown on mobile / small screens where diagram overflows */}
        <div className="mt-10 grid grid-cols-1 gap-3 md:hidden">
          {pillars.map((p) => (
            <div
              key={p.id}
              className="flex items-start gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
            >
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-rust)]" />
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
