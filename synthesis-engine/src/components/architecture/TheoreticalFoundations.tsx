import { BookOpen, Zap, Target } from "lucide-react";

const foundations = [
  {
    icon: BookOpen,
    source: "Carina Hong's Combinatorics",
    papers: [
      "Length-Four Pattern Avoidance (arXiv:2112.15081)",
      "Nekrasov-Okounkov Polynomials (arXiv:2008.10069)",
      "Pop-Stack-Sorting on Tamari Lattices",
      "Markov Chain on Edge-Colorings (arXiv:2103.11990)",
    ],
    mappings: [
      {
        theory: "Pattern Avoidance → Sovereign Memory",
        detail:
          "Wilf equivalence classes filter hypothesis space. Ideas with ≥90% cosine similarity to prior rejections are pattern-avoiding sequences.",
      },
      {
        theory: "Log-Concavity → Confidence Calibration",
        detail:
          "Quality distributions concentrate at single peak (A²ₙ,ₖ ≥ Aₙ,ₖ₋₁ · Aₙ,ₖ₊₁). Optimal ideas lie at k ≈ n^(1/6)/log(n).",
      },
      {
        theory: "Pop-Stack-Sorting → Dialectical Refinement",
        detail:
          "Thesis → Antithesis → Synthesis iterates toward minimal element 0̂. Convergence is t-Pop-sortable with predictable bounds.",
      },
      {
        theory: "Markov Chain → MCTS Exploration",
        detail:
          "Irreducible chain with linear diameter guarantees any valid hypothesis is reachable. Bounded acceptance ratio: O(|V|²).",
      },
    ],
    color: "text-[var(--accent-rust)]",
    bgColor: "bg-[var(--accent-rust-soft)]",
  },
  {
    icon: Zap,
    source: "Thermodynamic Basis Expansion",
    papers: ["Meta-Discovery: MASA Self-Analysis (January 2026)", "Random Matrix Theory Application"],
    mappings: [
      {
        theory: "Spectral Gap Detection",
        detail:
          "System triggers expansion when λₘᵢₙ < 1/√L (Lipschitz constant). High-temperature MCMC (T=1.5) breaks local optima.",
      },
      {
        theory: "Coherence Trap Escape",
        detail:
          "Covariance matrix eigenvalue monitoring provides early warning 5-10 ideas before stagnation. 100% adherence to cooldown constraints.",
      },
      {
        theory: "UI Telemetry Integration",
        detail:
          "Real-time visualization in Synthesis Disagreement Engine. Spectral gap events visible to users during generation.",
      },
    ],
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    icon: Target,
    source: "Epistemological Foundations",
    papers: [
      "Karl Popper: Falsificationism",
      "David Deutsch: The Beginning of Infinity",
      "Deutsch: Hard-to-Vary Explanations",
    ],
    mappings: [
      {
        theory: "Good Explanations Are Hard-to-Vary",
        detail:
          "Skeptic Agent asks: Can this hypothesis survive if we change the mechanism? Infinitely malleable ideas are rejected.",
      },
      {
        theory: "Fallibilism: All Knowledge Is Conjectural",
        detail:
          "Rejection-aware RAG stores past failures for future filtering. Multi-agent dialectical refinement implements error correction.",
      },
      {
        theory: "The Reach of Explanations",
        detail:
          "MASA prioritizes ideas connecting multiple epistemic domains. Contradiction-seeded synthesis searches for explanatory reach.",
      },
    ],
    color: "text-[#7b8a78]",
    bgColor: "bg-[rgba(123,138,120,0.12)]",
  },
];

const guarantees = [
  {
    property: "Completeness",
    foundation: "Markov chain irreducibility",
    guarantee: "Any valid hypothesis is reachable",
  },
  {
    property: "Concentration",
    foundation: "Log-concavity",
    guarantee: "Quality peaks predictably",
  },
  {
    property: "Termination",
    foundation: "t-Pop-sortability",
    guarantee: "Finite refinement iterations",
  },
  {
    property: "Efficiency",
    foundation: "Bounded acceptance ratio",
    guarantee: "Polynomial exploration time",
  },
];

export function TheoreticalFoundations() {
  return (
    <section className="bg-[var(--bg-primary)] py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-12 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[var(--accent-rust)]" />
            <span className="hd-kicker">Mathematical Foundations</span>
          </div>
          <h2 className="font-serif text-4xl text-[var(--text-primary)] md:text-5xl">
            Combinatorial, Causal, and Cybernetic
          </h2>
          <p className="mt-6 text-[1rem] leading-8 text-[var(--text-secondary)]">
            MASA's architecture is mathematically grounded in three complementary frameworks:
            Hong's Combinatorics for hypothesis space exploration, Pearl's Causal Inference for
            reasoning depth, and Maltz's Psycho-Cybernetics for goal-directed self-correction.
          </p>
        </div>

        {/* Foundations */}
        <div className="space-y-12">
          {foundations.map((foundation) => {
            const Icon = foundation.icon;
            return (
              <div key={foundation.source} className="hd-panel rounded-2xl p-8">
                <div className="mb-6 flex items-start gap-4">
                  <div className={`rounded-xl ${foundation.bgColor} p-3`}>
                    <Icon className={`h-6 w-6 ${foundation.color}`} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="mb-2 font-serif text-2xl text-[var(--text-primary)]">
                      {foundation.source}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {foundation.papers.map((paper) => (
                        <span
                          key={paper}
                          className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-1 font-mono text-xs text-[var(--text-muted)]"
                        >
                          {paper}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {foundation.mappings.map((mapping) => (
                    <div
                      key={mapping.theory}
                      className="border-l-2 border-[var(--border-subtle)] pl-6"
                    >
                      <h4 className={`mb-2 font-mono text-xs uppercase tracking-[0.2em] ${foundation.color}`}>
                        {mapping.theory}
                      </h4>
                      <p className="text-sm leading-6 text-[var(--text-secondary)]">
                        {mapping.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Theoretical Guarantees */}
        <div className="mt-12 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-8">
          <h3 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-rust)]">
            Theoretical Guarantees
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {guarantees.map((item) => (
              <div key={item.property} className="rounded-xl bg-[var(--bg-elevated)] p-4">
                <div className="mb-2 font-serif text-lg text-[var(--text-primary)]">
                  {item.property}
                </div>
                <div className="mb-1 font-mono text-xs text-[var(--text-muted)]">
                  {item.foundation}
                </div>
                <div className="text-sm text-[var(--text-secondary)]">{item.guarantee}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--accent-rust-soft)] p-4">
            <div className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-rust)]">
              Current Status
            </div>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              These theoretical correspondences are architecturally motivated—empirical
              validation of the quantitative bounds (e.g., exact convergence rates matching
              Hong's generating functions) remains future work.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
