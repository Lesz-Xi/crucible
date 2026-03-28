"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BrainCircuit,
  Database,
  FlaskConical,
  GitBranch,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";

type PillarStatus = "active" | "monitoring" | "gated";

interface PillarDefinition {
  id: string;
  label: string;
  detail: string;
  meta: string;
  metricLabel: string;
  metricValue: number;
  status: PillarStatus;
  relatedIds: string[];
  icon: LucideIcon;
}

const pillars: readonly PillarDefinition[] = [
  {
    id: "scm",
    label: "Causal SCM",
    detail:
      "Builds the structural model so every inference stays tied to explicit variables, edges, and mechanisms.",
    meta: "SCM Registry",
    metricLabel: "Trace Coverage",
    metricValue: 96,
    status: "active",
    relatedIds: ["contradiction", "gate"],
    icon: GitBranch,
  },
  {
    id: "contradiction",
    label: "Contradiction Engine",
    detail:
      "Forces competing explanations into conflict until only the mechanisms that survive pressure remain in play.",
    meta: "Conflict Runtime",
    metricLabel: "Pressure Level",
    metricValue: 82,
    status: "monitoring",
    relatedIds: ["scm", "critique"],
    icon: BrainCircuit,
  },
  {
    id: "memory",
    label: "Sovereign Memory",
    detail:
      "Commits validated traces and rejected paths into auditable memory without severing provenance.",
    meta: "Persistence Layer",
    metricLabel: "Commit Fidelity",
    metricValue: 74,
    status: "monitoring",
    relatedIds: ["gate", "scm"],
    icon: Database,
  },
  {
    id: "critique",
    label: "Multi-Agent Critique",
    detail:
      "Runs adversarial specialist review so methods, assumptions, and causal claims get stress-tested before trust.",
    meta: "Review Stack",
    metricLabel: "Challenge Depth",
    metricValue: 68,
    status: "gated",
    relatedIds: ["contradiction", "memory"],
    icon: FlaskConical,
  },
  {
    id: "gate",
    label: "Falsifiability Gate",
    detail:
      "Blocks claims that cannot say what evidence would disconfirm them before they reach action or memory.",
    meta: "Refutation Lock",
    metricLabel: "Governance Readiness",
    metricValue: 88,
    status: "active",
    relatedIds: ["scm", "memory"],
    icon: ShieldCheck,
  },
] as const;

function getStatusLabel(status: PillarStatus) {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "monitoring":
      return "LIVE";
    case "gated":
      return "GATED";
  }
}

function getStatusClass(status: PillarStatus) {
  switch (status) {
    case "active":
      return "five-pillars-status-active";
    case "monitoring":
      return "five-pillars-status-monitoring";
    case "gated":
      return "five-pillars-status-gated";
  }
}

export function FivePillars() {
  const shouldReduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <section
      id="architecture"
      className="hd-section overflow-hidden bg-[var(--bg-primary)] py-28 md:py-36"
    >
      <div className="mx-auto max-w-7xl px-8 md:px-12 lg:px-16">
        <div className="five-pillars-layout">
          <div className="five-pillars-editorial">
            <div className="mb-6 flex items-center gap-3">
              <span className="block h-px w-8 flex-shrink-0 bg-[var(--accent-rust)]" />
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Architecture
              </span>
            </div>

            <h2
              className="hd-serif-display text-[var(--text-primary)]"
              style={{ fontSize: "clamp(2.2rem, 4vw, 4rem)" }}
            >
              Five Pillars.{" "}
              <em className="italic text-[var(--accent-rust)]">One Causal Engine.</em>
            </h2>

            <p className="mt-6 max-w-[36rem] text-[0.98rem] leading-[1.95] text-[var(--text-muted)]">
              Every capability is purpose-built for causal governance. Together they
              form a closed-loop automated scientist: one governed runtime, five
              operational disciplines, no ungoverned path to output.
            </p>

            <div className="five-pillars-editorial-note mt-8">
              <p className="five-pillars-editorial-kicker">Runtime Ledger</p>
              <p className="mt-3 max-w-[28rem] text-[0.84rem] leading-[1.85] text-[var(--text-secondary)]">
                Each lane monitors one discipline. Focus a pillar to inspect its
                role, signal strength, and immediate dependencies inside the same
                governed board.
              </p>
            </div>
          </div>

          <div className="five-pillars-ledger" role="list" aria-label="Five pillars ledger">
            <div className="five-pillars-ledger-header">
              <p className="five-pillars-ledger-kicker">Governed Runtime Board</p>
              <div className="five-pillars-ledger-columns" aria-hidden="true">
                <span>Pillar</span>
                <span>Status</span>
                <span>Metric</span>
              </div>
            </div>

            <div className="five-pillars-ledger-rows">
              {pillars.map((pillar, index) => {
                const isActive = pillar.id === activeId;
                const Icon = pillar.icon;

                return (
                  <motion.button
                    key={pillar.id}
                    type="button"
                    aria-pressed={isActive}
                    aria-label={`Focus ${pillar.label}`}
                    className={`five-pillars-ledger-row ${isActive ? "is-active" : ""}`}
                    onClick={() =>
                      setActiveId((currentId) =>
                        currentId === pillar.id ? null : pillar.id,
                      )
                    }
                    initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
                    whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{
                      duration: 0.48,
                      delay: shouldReduceMotion ? 0 : index * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <div className="five-pillars-ledger-row-main">
                      <div className="five-pillars-ledger-row-title-wrap">
                        <span className="five-pillars-ledger-row-icon">
                          <Icon className="h-4 w-4" strokeWidth={1.9} />
                        </span>

                        <div className="min-w-0">
                          <div className="five-pillars-ledger-row-title-line">
                            <h3 className="five-pillars-ledger-row-title">{pillar.label}</h3>
                          </div>

                          <p className="five-pillars-ledger-row-meta">{pillar.meta}</p>
                        </div>
                      </div>

                      <div className="five-pillars-ledger-row-status">
                        <span
                          className={`five-pillars-status-chip ${getStatusClass(pillar.status)}`}
                        >
                          {getStatusLabel(pillar.status)}
                        </span>
                      </div>

                      <div className="five-pillars-ledger-row-metric">
                        <div className="five-pillars-ledger-row-metric-top">
                          <span className="five-pillars-metric-label">
                            <Zap className="h-3.5 w-3.5" strokeWidth={1.8} />
                            {pillar.metricLabel}
                          </span>
                          <span className="five-pillars-metric-value">
                            {pillar.metricValue}%
                          </span>
                        </div>

                        <div className="five-pillars-meter-track" aria-hidden="true">
                          <div
                            className="five-pillars-meter-fill"
                            style={{ width: `${pillar.metricValue}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
