import { Eye, Sliders, GitBranch, TrendingUp } from "lucide-react";

const layers = [
  {
    layer: "Layer 1",
    icon: Eye,
    title: "Observation",
    subtitle: "Structural Causal Models",
    description:
      "Two-tier validation: Tier 1 checks universal physics (conservation of energy, entropy ≥ 0, causality), Tier 2 applies domain-specific constraints from Truth Cartridge Library.",
    examples: [
      "Ecology: Network cooperation τ > 0.3",
      "Selfish Gene: Hamilton's Rule rB > C",
      "Cognitive: Loss aversion λ ≈ 2.25",
      "Scaling Laws: Beta regime boundaries",
    ],
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    layer: "Layer 2",
    icon: Sliders,
    title: "Intervention",
    subtitle: "do-calculus via Pyodide",
    description:
      "Tests interventional hypotheses (\"If we do X, then Y\") by extracting Python code and executing in WebAssembly sandbox with Monte Carlo simulations.",
    examples: [
      "Complexity claims: O(n²) → O(n log n)",
      "Performance tests: Input scaling validation",
      "Statistical evidence: p-values, Bayes factors",
      "Reproducible execution: Deterministic seeds",
    ],
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    layer: "Layer 3",
    icon: GitBranch,
    title: "Counterfactuals",
    subtitle: "Mechanism Robustness",
    description:
      "Generates adversarial scenarios to test mechanism completeness: boundary conditions, confounding variables, and reversed causality.",
    examples: [
      "Edge cases: What if n = 0 or n = ∞?",
      "Hidden variables: Unmeasured confounders",
      "Causal direction: Is X → Y or Y → X?",
      "Completeness scoring: 4D mechanism audit",
    ],
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    layer: "Integration",
    icon: TrendingUp,
    title: "Causal Credit",
    subtitle: "Meta-Learning Signal",
    description:
      "Aggregates fault signals across all layers. High mechanism_fault (>0.7) triggers failure pattern storage for domain-specific meta-learning.",
    examples: [
      "Mechanism fault: 1 - completeness",
      "Evidence fault: 1 - confounder handling",
      "Novelty fault: Prior art conflicts",
      "Formulation fault: Boundary awareness",
    ],
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
];

const metrics = [
  { label: "False Positive Rate", before: "~25%", after: "<5%", improvement: "80% reduction" },
  { label: "Audit Cost Savings", before: "—", after: "~15%", improvement: "Pre-filter efficiency" },
  { label: "Domain Coverage", before: "0", after: "11 frameworks", improvement: "Gene → Systems" },
];

export function CausalBlueprint() {
  return (
    <section className="bg-[var(--bg-secondary)] py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-12 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[var(--accent-rust)]" />
            <span className="hd-kicker">Phase 28 Implementation</span>
          </div>
          <h2 className="font-serif text-4xl text-[var(--text-primary)] md:text-5xl">
            Pearl's Causal Blueprint
          </h2>
          <p className="mt-6 text-[1rem] leading-8 text-[var(--text-secondary)]">
            MASA implements Judea Pearl&apos;s complete &ldquo;Ladder of Causation&rdquo; as a gatekeeper layer
            that validates ideas <em>before</em> expensive epistemic agent audits. This
            transition from purely epistemic to causal-first validation occurred in January
            2026.
          </p>
        </div>

        {/* The Three Layers */}
        <div className="space-y-6">
          {layers.map((layer, index) => {
            const Icon = layer.icon;
            return (
              <div
                key={layer.layer}
                className="hd-panel rounded-2xl p-8"
              >
                <div className="grid gap-8 lg:grid-cols-[300px,1fr]">
                  <div>
                    <div className={`mb-4 inline-flex items-center gap-3 rounded-xl ${layer.bgColor} p-3`}>
                      <Icon className={`h-6 w-6 ${layer.color}`} strokeWidth={1.5} />
                    </div>
                    <div className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      {layer.layer}
                    </div>
                    <h3 className="mb-1 font-serif text-2xl text-[var(--text-primary)]">
                      {layer.title}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">{layer.subtitle}</p>
                  </div>

                  <div>
                    <p className="mb-6 text-sm leading-7 text-[var(--text-secondary)]">
                      {layer.description}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {layer.examples.map((example) => (
                        <div
                          key={example}
                          className="flex items-start gap-2 rounded-lg bg-[var(--bg-secondary)] p-3"
                        >
                          <div className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${layer.color.replace("text-", "bg-")}`} />
                          <span className="font-mono text-xs leading-5 text-[var(--text-secondary)]">
                            {example}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Impact */}
        <div className="mt-12 rounded-2xl border border-[var(--border-subtle)] bg-white p-8">
          <h3 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-rust)]">
            Performance Impact (Phase 28)
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="space-y-2">
                <div className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {metric.label}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-[var(--text-muted)] line-through">
                    {metric.before}
                  </span>
                  <span className="text-2xl font-semibold text-[var(--accent-rust)]">
                    {metric.after}
                  </span>
                </div>
                <div className="text-xs text-green-600">{metric.improvement}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Truth Cartridge Callout */}
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#fef3e8] to-[#f5e6d3] p-8">
          <h4 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-rust)]">
            Truth Cartridge Library
          </h4>
          <p className="mb-4 text-sm leading-7 text-[var(--text-secondary)]">
            Multi-scale validation architecture with 11 frameworks (4 domain templates + 7
            consciousness/theoretical). Each framework provides falsifiable constraints
            extracted from authoritative sources.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "Biological Ecology",
              "Selfish Gene",
              "Cognitive Psychology",
              "Scaling Laws",
              "IIT (Consciousness)",
              "Higher-Order Thought",
              "Chalmers Phenomenal",
              "Neural Topology",
              "Interpretable Epistemology",
              "Neural Dynamics",
              "Alignment Problem",
            ].map((framework) => (
              <span
                key={framework}
                className="rounded-full bg-white px-3 py-1 font-mono text-xs text-[var(--text-secondary)]"
              >
                {framework}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
