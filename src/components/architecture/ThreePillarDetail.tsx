import { Lightbulb, ShieldCheck, Database } from "lucide-react";

const pillars = [
  {
    id: "generator",
    icon: Lightbulb,
    title: "Generator: Novel Idea Engine",
    accent: "rust",
    accentColor: "text-[var(--accent-rust)]",
    accentBg: "bg-[var(--accent-rust-soft)]",
    description:
      "Synthesizes hypotheses from contradictions across heterogeneous evidence sources. Uses Hong-inspired combinatorial recombination to bridge conflicting claims with testable mechanisms.",
    components: [
      {
        name: "Concept Extraction",
        detail: "Structured parsing of PDF documents and domain data into thesis, arguments, methodology, and evidence quality metrics.",
      },
      {
        name: "Contradiction Detection",
        detail: "Cross-source analysis identifies dialectical tensions that become seeds for novel synthesis.",
      },
      {
        name: "Hong Recombination",
        detail: "MCTS-like exploration of hypothesis space using Markov Chain patterns from Carina Hong's edge-coloring research.",
      },
      {
        name: "Rejection Filtering",
        detail: "Vector similarity (≥90% threshold) against Sovereign Memory prevents regenerating known-bad ideas.",
      },
    ],
    metrics: [
      { label: "Novelty Score", value: "0-100" },
      { label: "Prior Art Check", value: "Semantic Scholar" },
      { label: "Complexity Budget", value: "O(n log n)" },
    ],
  },
  {
    id: "evaluator",
    icon: ShieldCheck,
    title: "Evaluator: MASA Auditor",
    accent: "moss",
    accentColor: "text-[#7b8a78]",
    accentBg: "bg-[rgba(123,138,120,0.12)]",
    description:
      "Multi-agent critique system with calibrated confidence scoring. Three specialized personas validate epistemic rigor, falsifiability, and architectural soundness through dialectical refinement.",
    components: [
      {
        name: "Epistemologist Agent",
        detail: "Evaluates falsifiability, evidence quality, and methodological rigor against scientific standards.",
      },
      {
        name: "Skeptic Agent",
        detail: "Devil's advocate seeking biases, logical fallacies, and alternative explanations. Implements Deutsch's hard-to-vary criterion.",
      },
      {
        name: "Architect Agent",
        detail: "Final synthesis with remediation constraints. Produces executable Python protocols and lab manuals.",
      },
      {
        name: "Confidence Calibration",
        detail: "Log-concave quality distributions (Nekrasov-Okounkov) ensure scores concentrate predictably at optimal ideas.",
      },
    ],
    metrics: [
      { label: "Validity Threshold", value: "≥70/100" },
      { label: "Publication Grade", value: "≥85/100" },
      { label: "Audit Stages", value: "3 agents" },
    ],
  },
  {
    id: "update",
    icon: Database,
    title: "Update Mechanism: Sovereign Memory",
    accent: "blue",
    accentColor: "text-[var(--accent-blue)]",
    accentBg: "bg-[var(--accent-blue-soft)]",
    description:
      "Vector-based persistent memory with simulation validation. Learns from rejections, validates predictions against reality, and accumulates causal knowledge across sessions.",
    components: [
      {
        name: "pgvector Embeddings",
        detail: "Thesis+mechanism representations stored with semantic similarity search for rejection-aware RAG filtering.",
      },
      {
        name: "Pyodide Sandbox",
        detail: "WebAssembly-based Python runtime executes generated protocols in isolation with no filesystem, network, or process access.",
      },
      {
        name: "Chemical Entity Validation",
        detail: "PubChem CID alignment verifies that generated chemical compounds exist in reality (82.1% validation rate).",
      },
      {
        name: "Failure Pattern Learning",
        detail: "When mechanism_fault > 0.7, system records domain-specific failure patterns for meta-learning.",
      },
    ],
    metrics: [
      { label: "Rejection Cache", value: ">90% similarity" },
      { label: "Chemical Validation", value: "82.1% PubChem" },
      { label: "Sandbox Timeout", value: "30 seconds" },
    ],
  },
];

export function ThreePillarDetail() {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-12 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[var(--accent-rust)]" />
            <span className="hd-kicker">Core Components</span>
          </div>
          <h2 className="font-serif text-4xl text-[var(--text-primary)] md:text-5xl">
            Three Pillars in Detail
          </h2>
        </div>

        <div className="space-y-16">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.id}
                className="grid gap-8 lg:grid-cols-[1fr,2fr]"
              >
                {/* Left: Overview */}
                <div>
                  <div className={`mb-6 inline-flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] ${pillar.accentBg} p-4`}>
                    <Icon className={`h-8 w-8 ${pillar.accentColor}`} strokeWidth={1.5} />
                    <span className="font-mono text-sm uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      Pillar {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mb-4 font-serif text-3xl text-[var(--text-primary)]">
                    {pillar.title}
                  </h3>
                  <p className="mb-8 text-sm leading-7 text-[var(--text-secondary)]">
                    {pillar.description}
                  </p>

                  {/* Metrics */}
                  <div className="space-y-3 border-t border-[var(--border-subtle)] pt-6">
                    {pillar.metrics.map((metric) => (
                      <div key={metric.label} className="flex items-baseline justify-between">
                        <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          {metric.label}
                        </span>
                        <span className={`font-mono text-sm ${pillar.accentColor}`}>
                          {metric.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Components */}
                <div className="space-y-4">
                  {pillar.components.map((component) => (
                    <div
                      key={component.name}
                      className="hd-panel rounded-xl p-6"
                    >
                      <h4 className={`mb-2 font-mono text-xs uppercase tracking-[0.2em] ${pillar.accentColor}`}>
                        {component.name}
                      </h4>
                      <p className="text-sm leading-6 text-[var(--text-secondary)]">
                        {component.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
