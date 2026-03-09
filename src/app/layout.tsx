import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crucible — Automated Scientist",
  description:
    "A causal research workbench for contradiction-driven synthesis, novelty proofing, and scientific governance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <div className="shell">
          {/* ── Sidebar ── */}
          <nav className="sidebar" aria-label="Primary navigation">
            {/* Wordmark */}
            <div className="topbar">
              {/* MASA wordmark chip — twin wave strokes */}
              <div
                style={{
                  width: 24, height: 24,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--accent-dim)",
                  border: "1px solid var(--accent-border-2)",
                  color: "var(--accent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
                  <path d="M4 2.5C4 2.5 3 5 5 7c2 2 1 4.5 1 4.5" strokeLinecap="round"/>
                  <path d="M7.5 2.5C7.5 2.5 6.5 5 8.5 7c2 2 1 4.5 1 4.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 14,
                  color: "var(--text-1)",
                  letterSpacing: "0.01em",
                }}
              >
                Crucible
              </span>
            </div>

            {/* Nav items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              <p
                className="label-mono"
                style={{ color: "var(--text-4)", padding: "14px 18px 5px" }}
              >
                Protocols
              </p>
              {[
                { href: "/hybrid",        label: "Hybrid Synthesis" },
                { href: "/epistemic",     label: "Epistemic Analysis" },
                { href: "/pdf-synthesis", label: "Protocol Ingestion" },
              ].map((item) => (
                <a key={item.href} href={item.href} className="nav-link">
                  {item.label}
                </a>
              ))}
            </div>

            {/* User row */}
            <div
              className="topbar"
              style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}
            >
              <div
                style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "var(--accent-dim)",
                  border: "1px solid var(--accent-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-mono)", fontSize: 8.5, color: "var(--accent)",
                }}
              >
                WU
              </div>
              <span style={{ fontSize: 12, color: "var(--text-2)" }}>
                wuweism.com
              </span>
            </div>
          </nav>

          {/* ── Main Content ── */}
          <main className="main" style={{ position: "relative" }}>
            <div style={{ position: "relative", zIndex: 1 }}>
              {children}
            </div>
          </main>

          {/* ── Evidence Rail ── */}
          <aside className="rail" aria-label="Evidence rail">
            {/* Rail header */}
            <div className="rail-header">
              <div className="rail-indicator live" />
              <span className="label-mono" style={{ color: "var(--text-3)" }}>
                Evidence
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "var(--font-mono)", fontSize: 8.5,
                  color: "var(--text-4)", letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Idle
              </span>
            </div>

            {/* Rail body */}
            <div style={{ flex: 1, overflowY: "auto" }}>

              {/* ── Causal Density Section ── */}
              <div className="rail-section">
                <div className="rail-section-head">
                  <span className="status-dot amber" />
                  Causal Density
                </div>
                <div className="rung-bars">
                  {[
                    { id: "L1", name: "Association",    pct: "42%", active: false },
                    { id: "L2", name: "Intervention",   pct: "18%", active: true  },
                    { id: "L3", name: "Counterfactual", pct: "0%",  active: false },
                  ].map((rung) => (
                    <div key={rung.id} className={`rung-bar-row${rung.active ? " active" : ""}`}>
                      <span className="rung-label">{rung.id}</span>
                      <div className="rung-track">
                        <div className="rung-fill" style={{ width: rung.pct }} />
                      </div>
                      <span className="rung-name">{rung.name}</span>
                    </div>
                  ))}
                </div>
                <div className="rung-status-line">
                  <strong>Pearl L2</strong> active — do-calculus scaffolding primed.
                  Awaiting source ingestion to advance to L3.
                </div>
              </div>

              {/* ── Synthesis Confidence Section ── */}
              <div className="rail-section">
                <div className="rail-section-head">
                  <span className="status-dot idle" />
                  Synthesis Confidence
                </div>
                <div className="confidence-label">
                  <span>Novelty Score</span>
                  <strong>—</strong>
                </div>
                <div className="meter-track">
                  <div className="meter-fill amber" style={{ width: "0%" }} />
                </div>
              </div>

              {/* ── Sources Section ── */}
              <div className="rail-section">
                <div className="rail-section-head">
                  <span className="status-dot idle" />
                  Sources
                </div>
                <div className="unavail">
                  <strong>No protocol active</strong>
                  Select a research mode to begin ingesting sources.
                </div>
              </div>

            </div>
          </aside>
        </div>
      </body>
    </html>
  );
}
