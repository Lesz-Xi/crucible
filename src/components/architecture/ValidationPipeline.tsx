import { CheckCircle, Shield, Activity, TrendingUp } from "lucide-react";

const validationStages = [
  {
    stage: "Pre-Audit Gating",
    icon: Shield,
    checks: [
      "Tier 1 SCM: Universal physics (energy conservation, entropy, causality)",
      "Tier 2 SCM: Domain templates (11 frameworks across gene → systems scale)",
      "Vector similarity: >90% match to prior rejections triggers skip",
      "Resource validation: Token budget, memory constraints",
    ],
    outcome: "~15% ideas auto-rejected, 80% false positive reduction",
    color: "text-blue-600",
  },
  {
    stage: "Epistemic Audit",
    icon: CheckCircle,
    checks: [
      "Epistemologist: Falsifiability, evidence quality, methodological rigor",
      "Skeptic: Biases, logical fallacies, alternative explanations",
      "Architect: Synthesis with remediation constraints, executable protocols",
      "Confidence calibration: Log-concave quality concentration",
    ],
    outcome: "Validity threshold ≥70/100, publication grade ≥85/100",
    color: "text-green-600",
  },
  {
    stage: "Causal Layer Validation",
    icon: Activity,
    checks: [
      "Layer 1 (Observation): Structural causal model consistency",
      "Layer 2 (Intervention): do-calculus via Pyodide sandbox execution",
      "Layer 3 (Counterfactuals): Boundary conditions, confounders, reversed causality",
      "Causal credit: Fault aggregation across all layers",
    ],
    outcome: "Mechanism_fault >0.7 triggers failure pattern storage",
    color: "text-purple-600",
  },
  {
    stage: "Chemical Entity Validation",
    icon: TrendingUp,
    checks: [
      "PubChem CID alignment: Verify compounds exist in reality",
      "Pyodide execution: Monte Carlo simulations with NumPy, SciPy, NetworkX",
      "Statistical metrics: p-values (<0.05), Bayes factors (>3.0)",
      "Protocol security: WebAssembly sandbox (no filesystem, network, process access)",
    ],
    outcome: "82.1% chemical validation rate, 30-second timeout",
    color: "text-amber-600",
  },
];

const benchmarks = [
  {
    metric: "Hallucination Rejection",
    value: "88.4%",
    description: "Adversarial counter-factual rejection rate. Audit loop acts as corrective filter.",
  },
  {
    metric: "Novelty Velocity",
    value: "0.68",
    description: "Learning slope in sequential synthesis. Sovereign Memory improves quality over time.",
  },
  {
    metric: "Chemical Validation",
    value: "82.1%",
    description: "PubChem CID alignment. Moving from creative writing to valid syntax.",
  },
  {
    metric: "False Positive Rate",
    value: "<5%",
    description: "Physically impossible ideas (down from ~25% pre-Phase 28).",
  },
];

export function ValidationPipeline() {
  return (
    <section className="bg-[var(--bg-secondary)] py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-12 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[var(--accent-rust)]" />
            <span className="hd-kicker">Quality Assurance</span>
          </div>
          <h2 className="font-serif text-4xl text-[var(--text-primary)] md:text-5xl">
            Multi-Stage Validation Pipeline
          </h2>
          <p className="mt-6 text-[1rem] leading-8 text-[var(--text-secondary)]">
            Every hypothesis passes through four sequential validation stages before reaching
            the user. This gatekeeper architecture ensures only causally grounded, empirically
            testable ideas survive.
          </p>
        </div>

        {/* Validation Stages */}
        <div className="space-y-6">
          {validationStages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <div key={stage.stage} className="hd-panel rounded-2xl p-8">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--bg-secondary)]">
                    <Icon className={`h-6 w-6 ${stage.color}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Stage {String(index + 1).padStart(2, "0")}
                    </div>
                    <h3 className="mb-2 font-serif text-2xl text-[var(--text-primary)]">
                      {stage.stage}
                    </h3>
                    <div className={`inline-flex rounded-full px-3 py-1 font-mono text-xs ${stage.color.replace("text-", "bg-")}/10 ${stage.color}`}>
                      {stage.outcome}
                    </div>
                  </div>
                </div>

                <ul className="grid gap-3 md:grid-cols-2">
                  {stage.checks.map((check) => (
                    <li key={check} className="flex items-start gap-2">
                      <div className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${stage.color.replace("text-", "bg-")}`} />
                      <span className="text-sm leading-6 text-[var(--text-secondary)]">
                        {check}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Benchmark Results */}
        <div className="mt-12 rounded-2xl border border-[var(--border-subtle)] bg-white p-8">
          <h3 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-rust)]">
            Empirical Benchmarks (January 2026)
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {benchmarks.map((benchmark) => (
              <div key={benchmark.metric} className="space-y-2">
                <div className="text-3xl font-bold text-[var(--accent-rust)]">
                  {benchmark.value}
                </div>
                <div className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {benchmark.metric}
                </div>
                <p className="text-xs leading-5 text-[var(--text-secondary)]">
                  {benchmark.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-green-50 p-6">
            <h4 className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-green-700">
              Architectural Significance
            </h4>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              Phase 28 elevated MASA from <em>"statistically plausible reasoning"</em> to{" "}
              <em>"causally grounded reasoning."</em> By implementing Pearl's complete framework
              as a pre-filter, the system now rejects ideas that violate known physical laws or
              domain-specific causal structures <strong>before</strong> wasting epistemic
              reasoning resources.
            </p>
          </div>
        </div>

        {/* Limitations Callout */}
        <div className="mt-8 rounded-2xl bg-amber-50 p-8">
          <h4 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-amber-700">
            Current Limitations
          </h4>
          <div className="space-y-4 text-sm leading-7 text-[var(--text-secondary)]">
            <p>
              <strong>In Silico Validation:</strong> MASA currently operates at the computational
              simulation tier. Integration with robotic labs for <em>In Vivo</em> validation
              represents future work.
            </p>
            <p>
              <strong>Chemical Entity Validation:</strong> While the system verifies that
              compounds exist (the <em>nouns</em>), it does not guarantee that reaction protocols
              (the <em>verbs</em>) are safe or feasible. Integration with Opentrons and
              Lab-as-Code interfaces is planned.
            </p>
            <p>
              <strong>Epistemological Caveat:</strong> Evaluator agents are bound by fundamental
              training gaps of the base model and cannot verify mechanisms that fall entirely
              outside its latent representation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
