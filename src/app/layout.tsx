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
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <div className="shell">
          {/* ── Sidebar ── */}
          <nav className="sidebar" aria-label="Primary navigation">
            {/* Wordmark */}
            <div className="topbar">
              <div
                style={{
                  width: 24, height: 24,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--accent-dim)",
                  border: "1px solid var(--accent-border)",
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
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--text-1)", letterSpacing: "0.01em" }}>
                Crucible
              </span>
            </div>

            {/* Nav items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              <p className="label-mono" style={{ color: "var(--text-4)", padding: "14px 18px 5px" }}>
                Protocols
              </p>
              {[
                { href: "/",              label: "Scientific Workbench" },
                { href: "/hybrid",        label: "Hybrid Synthesis" },
                { href: "/epistemic",     label: "Epistemic Analysis" },
                { href: "/pdf-synthesis", label: "Protocol Ingestion" },
              ].map((item) => (
                <a key={item.href} href={item.href} className="nav-link">
                  {item.label}
                </a>
              ))}
            </div>

            {/* Bottom actions */}
            <div style={{ padding: "8px 0", borderTop: "1px solid var(--border)" }}>
              {[
                { label: "Dark mode" },
                { label: "Documentation" },
                { label: "Model Settings" },
              ].map((item) => (
                <div key={item.label} className="nav-link" style={{ cursor: "pointer" }}>
                  {item.label}
                </div>
              ))}
            </div>

            {/* User row */}
            <div className="topbar" style={{ borderTop: "1px solid var(--border)", borderBottom: "none" }}>
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
                Evidence Rail
              </span>
            </div>

            {/* Sub-label */}
            <div style={{ padding: "8px 14px 0", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: 11, color: "var(--text-3)", paddingBottom: 10 }}>
                Live causal posture and provenance
              </p>
            </div>

            {/* Rail body */}
            <div style={{ flex: 1, overflowY: "auto" }}>

              {/* ── Causal Density — L1/L2/L3 pill tabs ── */}
              <div className="rail-section">
                <div className="rail-section-head">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5 }}>
                    <circle cx="5" cy="5" r="3.5"/>
                    <path d="M5 2.5V5l1.5 1" strokeLinecap="round"/>
                  </svg>
                  Causal Density
                </div>
                {/* L1/L2/L3 Pill-Tab Strip */}
                <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                  {[
                    { id: "L1", name: "Association" },
                    { id: "L2", name: "Intervention" },
                    { id: "L3", name: "Counterfactual" },
                  ].map((rung, i) => (
                    <div
                      key={rung.id}
                      style={{
                        flex: 1, textAlign: "center", padding: "7px 6px",
                        borderRadius: "var(--radius-sm)",
                        background: i === 1 ? "var(--bg-2)" : "var(--bg-3)",
                        border: `1px solid ${i === 1 ? "var(--border-2)" : "var(--border)"}`,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: i === 1 ? "var(--text-1)" : "var(--text-3)", letterSpacing: "0.04em" }}>
                        {rung.id}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--text-4)", letterSpacing: "0.04em", marginTop: 1 }}>
                        {rung.name}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rung-status-line">
                  <strong>Active rung: unavailable</strong>{" "}
                  Awaiting scored output
                </div>
              </div>

              {/* ── Alignment Posture ── */}
              <div className="rail-section">
                <div className="rail-section-head">
                  <span className="status-dot green" />
                  Alignment Posture
                </div>
                <div className="rail-info-card green">
                  No unaudited intervention claims without identifiability gates.
                </div>
              </div>

              {/* ── Model Provenance ── */}
              <div className="rail-section">
                <div className="rail-section-head">
                  <span className="status-dot idle" />
                  Model Provenance
                </div>
                <div className="unavail">
                  <strong>unavailable</strong>
                  No verified model provenance was emitted for this run.
                </div>
              </div>

              {/* ── Active Domain ── */}
              <div className="rail-section">
                <div className="rail-section-head">
                  <span className="status-dot idle" />
                  Active Domain
                </div>
                <div className="unavail">unavailable</div>
              </div>

              {/* ── Scientific Evidence ── */}
              <div className="rail-section" style={{ borderBottom: "none" }}>
                <div className="rail-section-head">
                  <span className="status-dot idle" />
                  Scientific Evidence
                </div>
                {[
                  { name: "AI-Alignment-Failure.pdf",    meta: "15 days ago" },
                  { name: "Disagreement-AI-Alignment.pdf", meta: "22 days ago" },
                  { name: "Anomaly-Detection.pdf",       meta: "29 days ago" },
                ].map((f) => (
                  <div key={f.name} className="evidence-file">
                    <div className="file-icon">
                      <svg width="11" height="11" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <rect x="1" y="1" width="10" height="12" rx="1.5"/>
                        <path d="M3.5 5h5M3.5 7.5h5M3.5 10h3" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="file-name">{f.name}</div>
                      <div className="file-meta">{f.meta}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </aside>
        </div>
      </body>
    </html>
  );
}
