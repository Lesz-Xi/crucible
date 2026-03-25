"use client";

import Link from "next/link";
import { BookOpen, MessageSquare, GitMerge, Scale, Cpu, Key, Thermometer, ArrowLeft } from "lucide-react";

export default function DocsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text-1)",
        fontFamily: "var(--font-sans)",
        padding: "0 0 80px",
      }}
    >
      {/* Topbar */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "0 32px",
          height: 52,
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "var(--bg)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <BookOpen style={{ width: 15, height: 15, color: "var(--text-3)" }} />
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)" }}>
          MASA Docs
        </span>
        <div style={{ flex: 1 }} />
        <Link
          href="/chat"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "var(--text-2)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft style={{ width: 13, height: 13 }} />
          Back to Workbench
        </Link>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "56px 32px 0" }}>

        {/* Hero */}
        <div style={{ marginBottom: 56 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: 16,
            }}
          >
            Methods of Automated Scientific Analysis
          </div>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: "var(--text-1)",
              margin: "0 0 16px",
            }}
          >
            MASA Documentation
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--text-2)", maxWidth: 600 }}>
            MASA is a causal research workbench — it reasons causally, surfaces falsifiable
            hypotheses, and maintains scientific governance through Pearl-style causal inference,
            contradiction detection, and novelty proofing.
          </p>
        </div>

        {/* Section: Research Modes */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={styles.sectionHeading}>Research Modes</h2>
          <p style={{ ...styles.body, marginBottom: 24 }}>
            MASA provides three purpose-built interfaces for different types of causal analysis.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {[
              {
                icon: MessageSquare,
                title: "Causal Workbench",
                route: "/chat",
                label: "CHAT",
                desc: "Causal dialogue with intervention framing. Ask questions, form hypotheses, and explore causal mechanisms through structured conversation.",
              },
              {
                icon: GitMerge,
                title: "Hybrid Synthesis",
                route: "/hybrid",
                label: "HYBRID",
                desc: "Contradiction-driven synthesis and novelty proofing. Reconcile conflicting evidence and surface genuinely novel conclusions.",
              },
              {
                icon: Scale,
                title: "Legal Causation",
                route: "/legal",
                label: "LEGAL",
                desc: "Causation analysis under but-for and proximate cause logic. Apply causal reasoning to legal and regulatory frameworks.",
              },
            ].map(({ icon: Icon, title, route, label, desc }) => (
              <Link
                key={route}
                href={route}
                style={{
                  display: "block",
                  padding: "20px 20px 22px",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  background: "var(--bg-2)",
                  textDecoration: "none",
                  transition: "border-color 150ms ease, background 150ms ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-border)";
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated, var(--bg-2))";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-2)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Icon style={{ width: 14, height: 14, color: "var(--accent)" }} />
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--accent)",
                    }}
                  >
                    {label}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 8 }}>
                  {title}
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-2)" }}>{desc}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section: Model Configuration */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={styles.sectionHeading}>Model Configuration (BYOK)</h2>
          <p style={{ ...styles.body, marginBottom: 20 }}>
            MASA uses a Bring Your Own Key (BYOK) model. Your API keys are stored locally in your
            browser and are never sent to our servers. Access Model Settings from the account menu
            in the sidebar.
          </p>

          <div style={styles.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Cpu style={{ width: 14, height: 14, color: "var(--text-3)" }} />
              <span style={styles.label}>Supported Providers</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { name: "Anthropic Claude", models: "claude-sonnet-4-6, claude-haiku-4-5, claude-opus-4-6" },
                { name: "OpenAI GPT", models: "gpt-4o, gpt-4o-mini" },
                { name: "Google Gemini", models: "gemini-2.5-pro, gemini-2.0-flash" },
              ].map(({ name, models }) => (
                <div key={name} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>{name}</span>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-3)", letterSpacing: "0.02em" }}>{models}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...styles.card, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Key style={{ width: 14, height: 14, color: "var(--text-3)" }} />
              <span style={styles.label}>API Key Setup</span>
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Click your user avatar in the bottom-left sidebar",
                'Click "Model Settings" in the account menu',
                "Select your AI provider (Claude, OpenAI, or Gemini)",
                "Paste your API key into the key field",
                'Click "Save Params" — your key is saved to localStorage',
              ].map((step, i) => (
                <li key={i} style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-2)" }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div style={{ ...styles.card, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Thermometer style={{ width: 14, height: 14, color: "var(--text-3)" }} />
              <span style={styles.label}>Temperature</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-2)", margin: 0 }}>
              Controls response variability. Lower values (0.0–0.3) produce deterministic, precise
              outputs — ideal for evidence synthesis and legal analysis. Higher values (0.7–1.0)
              allow more exploratory, creative hypothesis generation. Default: 0.7.
            </p>
          </div>
        </section>

        {/* Section: Key Concepts */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={styles.sectionHeading}>Key Concepts</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              {
                term: "Causal SCM",
                definition:
                  "Structural Causal Model — a directed acyclic graph (DAG) representing causal relationships between variables. MASA builds and queries SCMs during analysis.",
              },
              {
                term: "Intervention",
                definition:
                  'A do-calculus operation: "What happens to Y if we force X = x?" Distinct from conditioning, interventions simulate real-world actions on the causal graph.',
              },
              {
                term: "Counterfactual",
                definition:
                  "A hypothetical: "Would Y have occurred if X had been different?" Used extensively in Legal Causation for but-for analysis.",
              },
              {
                term: "Novelty Proof",
                definition:
                  "MASA's mechanism for verifying that a synthesized conclusion is genuinely new — not a restatement of existing literature or a logical tautology.",
              },
              {
                term: "Evidence Rail",
                definition:
                  "The right-side panel in the Causal Workbench that tracks live evidence, confidence scores, and source provenance during a session.",
              },
            ].map(({ term, definition }) => (
              <div key={term} style={{ display: "flex", gap: 16 }}>
                <div
                  style={{
                    flexShrink: 0,
                    width: 160,
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--accent)",
                    paddingTop: 1,
                  }}
                >
                  {term}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text-2)" }}>{definition}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-3)", letterSpacing: "0.08em" }}>
            WUWEISM.COM — MASA PLATFORM
          </span>
          <Link
            href="/chat"
            style={{
              fontSize: 12,
              color: "var(--accent)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Open Causal Workbench →
          </Link>
        </div>
      </div>
    </main>
  );
}

const styles = {
  sectionHeading: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    color: "var(--text-1)",
    margin: "0 0 8px",
  } as React.CSSProperties,
  body: {
    fontSize: 14,
    lineHeight: 1.65,
    color: "var(--text-2)",
    margin: 0,
  } as React.CSSProperties,
  label: {
    fontSize: 10,
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--text-3)",
    fontWeight: 700,
  } as React.CSSProperties,
  card: {
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "18px 20px",
    background: "var(--bg-2)",
  } as React.CSSProperties,
};
