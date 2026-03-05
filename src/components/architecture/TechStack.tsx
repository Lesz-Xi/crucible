import { Code, Database, Cpu, Globe, Shield, Zap } from "lucide-react";

const stackLayers = [
  {
    layer: "Frontend",
    icon: Code,
    technologies: [
      { name: "Next.js 15", detail: "App Router, Server Components, SSE streaming" },
      { name: "React 19", detail: "Concurrent rendering, Server Actions" },
      { name: "TypeScript", detail: "Type-safe architecture with strict mode" },
      { name: "Tailwind CSS", detail: "Utility-first design system" },
    ],
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    layer: "AI Orchestration",
    icon: Cpu,
    technologies: [
      { name: "Claude 4.5 Sonnet", detail: "Primary reasoning engine for generation and audit" },
      { name: "Gemini", detail: "Embedding generation and semantic search" },
      { name: "OpenAI", detail: "Fallback model for specific use cases" },
      { name: "LLM Factory", detail: "Unified interface with provider abstraction" },
    ],
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    layer: "Database & Memory",
    icon: Database,
    technologies: [
      { name: "Supabase", detail: "PostgreSQL with real-time subscriptions" },
      { name: "pgvector", detail: "Vector similarity search for Sovereign Memory" },
      { name: "Edge Functions", detail: "Serverless execution for API routes" },
      { name: "Row-Level Security", detail: "Fine-grained access control" },
    ],
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    layer: "Validation & Execution",
    icon: Shield,
    technologies: [
      { name: "Pyodide", detail: "WebAssembly Python runtime for sandboxed execution" },
      { name: "NumPy", detail: "Numerical computing for Monte Carlo simulations" },
      { name: "SciPy", detail: "Statistical analysis, p-values, Bayes factors" },
      { name: "NetworkX", detail: "Graph-based causal modeling" },
    ],
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    layer: "External APIs",
    icon: Globe,
    technologies: [
      { name: "Semantic Scholar", detail: "Prior art search and novelty evaluation" },
      { name: "Brave Search", detail: "Multi-source retrieval for evidence-grounded analysis" },
      { name: "PubChem", detail: "Chemical entity validation (CID lookup)" },
      { name: "Anthropic API", detail: "Claude model access with streaming" },
    ],
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
  {
    layer: "SCM Registry",
    icon: Zap,
    technologies: [
      { name: "JSON Graph Storage", detail: "Canonical framework definitions (11 SCMs)" },
      { name: "Schema Validation", detail: "Automated consistency checks and validation" },
      { name: "Database Seeding", detail: "Version-controlled truth cartridge deployment" },
      { name: "UI Integration", detail: "Real-time framework selection and visualization" },
    ],
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
];

const architecturePatterns = [
  {
    pattern: "Server-Side Streaming",
    description:
      "SSE (Server-Sent Events) enables real-time synthesis progress updates with minimal client overhead.",
  },
  {
    pattern: "Optimistic UI Updates",
    description:
      "Immediate feedback with server reconciliation for smooth user experience during long-running operations.",
  },
  {
    pattern: "Edge-First Architecture",
    description:
      "Edge Functions for low-latency API routes with automatic geographic distribution.",
  },
  {
    pattern: "Type-Safe Contracts",
    description:
      "End-to-end TypeScript ensures compile-time safety from database schema to UI components.",
  },
];

export function TechStack() {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-12 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[var(--accent-rust)]" />
            <span className="hd-kicker">Technology</span>
          </div>
          <h2 className="font-serif text-4xl text-[var(--text-primary)] md:text-5xl">
            Modern AI Stack
          </h2>
          <p className="mt-6 text-[1rem] leading-8 text-[var(--text-secondary)]">
            MASA is built on cutting-edge technologies that enable real-time streaming,
            distributed execution, and secure sandboxed validation.
          </p>
        </div>

        {/* Stack Layers */}
        <div className="space-y-6">
          {stackLayers.map((layer) => {
            const Icon = layer.icon;
            return (
              <div key={layer.layer} className="hd-panel rounded-2xl p-8">
                <div className="mb-6 flex items-center gap-4">
                  <div className={`rounded-xl ${layer.bgColor} p-3`}>
                    <Icon className={`h-6 w-6 ${layer.color}`} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-2xl text-[var(--text-primary)]">
                    {layer.layer}
                  </h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {layer.technologies.map((tech) => (
                    <div
                      key={tech.name}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4"
                    >
                      <div className="mb-1 font-mono text-sm font-semibold text-[var(--text-primary)]">
                        {tech.name}
                      </div>
                      <div className="text-xs leading-5 text-[var(--text-secondary)]">
                        {tech.detail}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Architecture Patterns */}
        <div className="mt-12 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-8">
          <h3 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-rust)]">
            Architecture Patterns
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            {architecturePatterns.map((item) => (
              <div key={item.pattern} className="rounded-xl bg-white p-6">
                <h4 className="mb-2 font-serif text-lg text-[var(--text-primary)]">
                  {item.pattern}
                </h4>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Open Source Note */}
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] p-8 text-center">
          <h4 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-blue)]">
            Research & Development
          </h4>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            MASA is under active development with regular architectural updates documented in
            the white paper. Contributions to SCM frameworks, validation pipelines, and
            theoretical foundations are welcomed through our research collaboration program.
          </p>
        </div>
      </div>
    </section>
  );
}
