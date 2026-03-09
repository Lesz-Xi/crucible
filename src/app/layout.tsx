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
          {/* Sidebar — Navigation & History */}
          <nav className="sidebar" aria-label="Primary navigation">
            {/* Wordmark */}
            <div className="topbar">
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--accent-dim)",
                  border: "1px solid var(--accent-border-2)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                }}
              >
                ✦
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

            {/* Nav items injected by route-level components */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              <p
                className="label-mono"
                style={{
                  color: "var(--text-4)",
                  padding: "14px 18px 5px",
                }}
              >
                Protocols
              </p>
              {[
                { href: "/hybrid", label: "Hybrid Synthesis" },
                { href: "/epistemic", label: "Epistemic Analysis" },
                { href: "/pdf-synthesis", label: "Protocol Ingestion" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="nav-link"
                >
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
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "var(--accent-dim)",
                  border: "1px solid var(--accent-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: 8.5,
                  color: "var(--accent)",
                }}
              >
                WU
              </div>
              <span style={{ fontSize: 12, color: "var(--text-2)" }}>
                wuweism.com
              </span>
            </div>
          </nav>

          {/* Main Content — Feature Views */}
          <main className="main" style={{ position: "relative" }}>
            <div style={{ position: "relative", zIndex: 1 }}>
              {children}
            </div>
          </main>

          {/* Evidence Rail — Telemetry & Confidence */}
          <aside className="rail" aria-label="Evidence rail">
            <div className="topbar">
              <span className="label-mono" style={{ color: "var(--text-4)" }}>
                Evidence
              </span>
              <div className="live-indicator" style={{ marginLeft: "auto" }} />
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <p
                className="label-mono"
                style={{ color: "var(--text-4)", marginBottom: 4 }}
              >
                Telemetry
              </p>
              <p style={{ fontSize: 11, color: "var(--text-3)" }}>
                No active protocol. Select a research mode to begin.
              </p>
            </div>
          </aside>
        </div>
      </body>
    </html>
  );
}
