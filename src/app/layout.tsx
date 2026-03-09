import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { 
  Search, PanelRight, MessageSquare, Atom, FileText, 
  Plus, FolderPlus, Sun, Moon, Settings, ChevronDown, 
  Paperclip, Activity, Zap, File
} from "lucide-react";
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
  title: "Bio-Lab Notebook",
  description:
    "A causal research workbench for contradiction-driven synthesis, novelty proofing, and scientific governance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // We determine light/dark mode later or let it be light by default.
  // We'll leave out `.dark` for now, or just let CSS variables handle it.
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <div className="shell">
          {/* ── Sidebar ── */}
          <nav className="sidebar" aria-label="Primary navigation">
            {/* Wordmark & Quick Actions */}
            <div className="topbar" style={{ justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ color: "#D4A96C" }}>
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                </div>
                <div style={{ display: "flex", flexDirection: "column", fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: "bold", letterSpacing: "0.15em", lineHeight: "1.2", color: "var(--text-1)", textTransform: "uppercase" }}>
                  <span>Bio-Lab</span>
                  <span>Notebook</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", color: "var(--text-3)" }}>
                <Search size={14} style={{ cursor: "pointer" }} />
                <PanelRight size={14} style={{ cursor: "pointer" }} />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {/* Main Nav */}
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <a href="/" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px", borderRadius: "6px", background: "var(--bg-3)", color: "var(--text-1)", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
                  <MessageSquare size={16} />
                  Chat
                </a>
                <a href="/hybrid" className="nav-link" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px", borderRadius: "6px", color: "var(--text-2)", fontSize: "13px", textDecoration: "none" }}>
                  <Atom size={16} />
                  Hybrid
                </a>
                <div className="nav-link" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: "6px", color: "var(--text-2)", fontSize: "13px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <FileText size={16} />
                    Relics
                  </div>
                  <ChevronDown size={14} />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ padding: "0 14px 16px", display: "flex", gap: "8px" }}>
                <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "6px 0", background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-2)", fontSize: "11px", fontFamily: "var(--font-mono)", cursor: "pointer" }}>
                  <Plus size={12} /> New chat
                </button>
                <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "6px 0", background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-2)", fontSize: "11px", fontFamily: "var(--font-mono)", cursor: "pointer" }}>
                  <FolderPlus size={12} /> New folder
                </button>
              </div>

              {/* Folders & History */}
              <div style={{ padding: "0 14px 12px" }}>
                <p className="label-mono" style={{ color: "var(--text-4)", padding: "0 4px 8px" }}>Folders</p>
                {/* Empty folders for now */}
              </div>
              <div style={{ padding: "0 14px", flex: 1 }}>
                <p className="label-mono" style={{ color: "var(--text-4)", padding: "0 4px 8px" }}>History</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {[
                    "# From Persia to the Modern M...",
                    "Why do you think your system ...",
                    "Prompt (Nuanced, evidence-fir...",
                    "Prompt (Nuanced, evidence-fir...",
                    "Prompt (Nuanced, evidence-fir...",
                    "Do a web search on what is Op...",
                    "Do you have Causal architecture?",
                    "What would happen if AGI wer...",
                  ].map((item, i) => (
                    <div key={i} style={{ padding: "6px 8px", fontSize: "12px", color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer", borderRadius: "4px" }} className="nav-link">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "2px" }}>
              <div className="nav-link" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "6px", color: "var(--text-2)", fontSize: "12px", cursor: "pointer" }}>
                <Sun size={14} /> Dark mode
              </div>
              <div className="nav-link" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "6px", color: "var(--text-2)", fontSize: "12px", cursor: "pointer" }}>
                <FileText size={14} /> Documentation
              </div>
              <div className="nav-link" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "6px", color: "var(--text-2)", fontSize: "12px", cursor: "pointer" }}>
                <Settings size={14} /> Model Settings
              </div>
            </div>

            {/* User row */}
            <div className="topbar" style={{ borderTop: "1px solid var(--border)", borderBottom: "none", cursor: "pointer", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: "var(--accent-dim)",
                    border: "1px solid var(--accent-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-mono)", fontSize: "8px", color: "var(--accent)",
                  }}
                >
                  CO
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-2)" }}>
                  codewithafar@gmail.com
                </span>
              </div>
              <ChevronDown size={14} style={{ color: "var(--text-3)" }} />
            </div>
          </nav>

          {/* ── Main Content ── */}
          <main className="main" style={{ position: "relative", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
              {children}
            </div>
          </main>

          {/* ── Evidence Rail ── */}
          <aside className="rail" aria-label="Evidence rail">
            {/* Rail header */}
            <div className="rail-header" style={{ padding: "14px 18px", borderBottom: "none" }}>
              <span className="label-mono" style={{ color: "var(--text-2)", fontSize: "10px" }}>
                Evidence Rail
              </span>
            </div>
            <div style={{ padding: "0 18px 14px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: "12px", color: "var(--text-3)" }}>
                Live causal posture and provenance
              </p>
            </div>

            {/* Rail body */}
            <div style={{ flex: 1, overflowY: "auto" }}>

              {/* ── Causal Density ── */}
              <div className="rail-section">
                <div className="rail-section-head">
                  <Activity size={14} style={{ opacity: 0.5 }} />
                  Causal Density
                </div>
                {/* L1/L2/L3 Pill-Tab Strip */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {[
                    { id: "L1", name: "Association" },
                    { id: "L2", name: "Intervention" },
                    { id: "L3", name: "Counterfactual" },
                  ].map((rung, i) => (
                    <div
                      key={rung.id}
                      style={{
                        flex: 1, textAlign: "center", padding: "12px 6px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--bg-1)",
                        border: "1px solid var(--border)",
                        opacity: 0.5,
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text-1)", marginBottom: 2 }}>
                        {rung.id}
                      </div>
                      <div style={{ fontSize: 9, color: "var(--text-3)" }}>
                        {rung.name}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rung-status-line" style={{ color: "var(--text-3)", fontSize: "12px" }}>
                  Active rung: <strong>unavailable</strong><br/>
                  Awaiting scored output
                </div>
              </div>

              {/* ── Alignment Posture ── */}
              <div className="rail-section">
                <div className="rail-section-head">
                  <span className="status-dot green" />
                  Alignment Posture
                </div>
                <div className="rail-info-card green" style={{ fontSize: "12px", background: "rgba(78, 158, 122, 0.1)", border: "1px solid rgba(78, 158, 122, 0.2)", color: "var(--text-2)", padding: "16px" }}>
                  No unaudited intervention claims without identifiability gates.
                </div>
              </div>

              {/* ── Model Provenance ── */}
              <div className="rail-section">
                <div className="rail-section-head">
                  <span className="status-dot idle" />
                  Model Provenance
                </div>
                <div className="unavail" style={{ fontSize: "12px" }}>
                  <strong>unavailable</strong><br/>
                  <span style={{ color: "var(--text-3)" }}>No verified model provenance was emitted for this run.</span>
                </div>
              </div>

              {/* ── Active Domain ── */}
              <div className="rail-section">
                <div className="rail-section-head">
                  <span className="status-dot idle" />
                  Active Domain
                </div>
                <div className="unavail" style={{ fontSize: "12px" }}>unavailable</div>
              </div>

              {/* ── Scientific Evidence ── */}
              <div className="rail-section" style={{ borderBottom: "none" }}>
                <div className="rail-section-head">
                  <FileText size={14} style={{ opacity: 0.5 }} />
                  Scientific Evidence
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                  {[
                    { name: "AI-Alignment-Failure.pdf",    meta: "54", time: "14 days ago" },
                    { name: "Disagreement-AI-Alignment.pdf", meta: "58", time: "21 days ago" },
                    { name: "Anomaly-Detection.pdf",       meta: "151", time: "22 days ago" },
                  ].map((f) => (
                    <div key={f.name} style={{ display: "flex", gap: "10px", padding: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg-1)" }}>
                      <File size={16} style={{ color: "var(--text-3)", marginTop: "2px", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "12px", color: "var(--text-1)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                        <div style={{ fontSize: "10px", color: "var(--text-4)", marginTop: "4px", display: "flex", gap: "6px", alignItems: "center" }}>
                          <File size={10} /> {f.meta}
                          <span style={{ color: "transparent" }}>.</span>
                          {f.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </aside>
        </div>
      </body>
    </html>
  );
}
