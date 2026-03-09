import Link from "next/link";
import { Plus, Activity, ChevronDown, Settings, Play } from "lucide-react";

const PROTOCOLS = [
  {
    href: "/hybrid",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="3" y="3" width="18" height="18" rx="4"/>
        <path d="M8 12h8M12 8v8" strokeLinecap="round"/>
      </svg>
    ),
    title: "Causal Discovery",
    body: "Ingest observational data or papers to extract Structural Causal Models (SCM).",
  },
  {
    href: "/epistemic",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="3" y="3" width="18" height="18" rx="4"/>
        <path d="M8 16l3-6 4 4 3-6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Intervention Planning",
    body: "Simulate do-calculus interventions (do(X)=y) to predict system behavior.",
  },
  {
    href: "/pdf-synthesis",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="3" y="3" width="18" height="18" rx="4"/>
        <path d="M12 8v8M8 12h8" strokeLinecap="round"/>
      </svg>
    ),
    title: "Counterfactual Audit",
    body: "Verify specific claims against the causal graph logic and evidence.",
  },
];

export default function Home() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* ── Center Content ── */}
      <div 
        style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          padding: "40px 32px 0", 
          gap: 40 
        }}
      >
        {/* Heading */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 32,
              fontWeight: 400,
              color: "var(--text-1)",
              lineHeight: "var(--line-height-tight)",
              letterSpacing: "var(--letter-spacing-snug)",
              marginBottom: 10,
            }}
          >
            Scientific Workbench
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: "var(--line-height-relaxed)" }}>
            Select a research protocol to begin your inquiry.
          </p>
        </div>

        {/* Protocol Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            width: "100%",
            maxWidth: 860,
          }}
        >
          {PROTOCOLS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              style={{
                display: "block",
                padding: "24px",
                background: "var(--bg-1)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                textDecoration: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              className="protocol-card"
            >
              <div
                style={{
                  width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-2)",
                  background: "var(--bg-2)",
                  borderRadius: "8px",
                  border: "1px solid var(--border-2)",
                  marginBottom: 16,
                }}
              >
                {p.icon}
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-1)",
                  marginBottom: 8,
                }}
              >
                {p.title}
              </h2>
              <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: "1.5" }}>
                {p.body}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Sticky Chat Input Footer ── */}
      <div style={{ padding: "40px 32px 32px", width: "100%", maxWidth: 900, margin: "0 auto", flexShrink: 0 }}>
        <div 
          style={{ 
            background: "var(--bg)", 
            border: "1px solid var(--border-3)", 
            borderRadius: "16px", 
            boxShadow: "var(--shadow-lg)", 
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}
        >
          <textarea 
            placeholder="Describe the real-world situation, what changed, and what outcome you need..." 
            style={{ 
              width: "100%", 
              background: "transparent", 
              border: "none", 
              resize: "none", 
              outline: "none", 
              fontSize: "14px", 
              color: "var(--text-1)", 
              minHeight: "50px",
              fontFamily: "var(--font-sans)"
            }} 
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            
            {/* Left Actions */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "100px", color: "var(--text-2)", fontSize: "11px", fontWeight: 500, cursor: "pointer" }}>
                <Plus size={12} /> Attach
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "100px", color: "var(--text-2)", fontSize: "11px", fontWeight: 500, cursor: "pointer" }}>
                <Activity size={12} /> DiagnoseActValidate
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "100px", color: "var(--text-2)", fontSize: "11px", fontWeight: 500, cursor: "pointer" }}>
                Scenarios <ChevronDown size={12} />
              </button>
            </div>

            {/* Right Actions */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", background: "transparent", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-3)", cursor: "pointer" }}>
                <Plus size={14} />
              </button>
              <button style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", background: "transparent", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-3)", cursor: "pointer" }}>
                <Settings size={14} />
              </button>
              
              <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-4)", padding: "0 8px" }}>
                Enter to send
              </span>
              
              <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--text-1)", color: "var(--bg)", padding: "8px 16px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                <Play size={10} fill="currentColor" /> Send
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
