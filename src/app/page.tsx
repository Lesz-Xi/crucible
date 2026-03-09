import Link from "next/link";

const PROTOCOLS = [
  {
    href: "/hybrid",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="9" r="3.5"/>
        <circle cx="15" cy="15" r="3.5"/>
        <path d="M12 9l3 6" strokeLinecap="round"/>
      </svg>
    ),
    title: "Causal Discovery",
    body: "Ingest observational data or papers to extract Structural Causal Models (SCM).",
  },
  {
    href: "/epistemic",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 17l4-8 4 5 3-3 4 6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="19" cy="5" r="2"/>
      </svg>
    ),
    title: "Intervention Planning",
    body: "Simulate do-calculus interventions (do(X)=y) to predict system behavior.",
  },
  {
    href: "/pdf-synthesis",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="8" height="8" rx="1.5"/>
        <rect x="13" y="3" width="8" height="8" rx="1.5"/>
        <rect x="3" y="13" width="8" height="8" rx="1.5"/>
        <rect x="13" y="13" width="8" height="8" rx="1.5"/>
      </svg>
    ),
    title: "Counterfactual Audit",
    body: "Verify specific claims against the causal graph logic and evidence.",
  },
];

export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100%",
        padding: "40px 32px",
        gap: 40,
      }}
    >
      {/* Heading */}
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "var(--font-size-hero)",
            fontWeight: 400,
            color: "var(--text-1)",
            lineHeight: "var(--line-height-tight)",
            letterSpacing: "var(--letter-spacing-snug)",
            marginBottom: 10,
          }}
        >
          Scientific Workbench
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: "var(--line-height-relaxed)" }}>
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
          maxWidth: 820,
        }}
      >
        {PROTOCOLS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            style={{
              display: "block",
              padding: "28px 24px",
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              textDecoration: "none",
              transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
            }}
            className="protocol-card"
          >
            <div
              style={{
                width: 46, height: 46,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-3)",
                marginBottom: 18,
              }}
            >
              {p.icon}
            </div>
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 16,
                fontWeight: 600,
                color: "var(--text-1)",
                marginBottom: 10,
                lineHeight: "var(--line-height-snug)",
              }}
            >
              {p.title}
            </h2>
            <p style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: "var(--line-height-relaxed)" }}>
              {p.body}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
