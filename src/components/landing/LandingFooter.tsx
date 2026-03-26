import Link from "next/link";
import Image from "next/image";

const columns = [
  {
    heading: "Research",
    links: [
      { label: "Causal Workbench", href: "/chat" },
      { label: "Hybrid Synthesis", href: "/hybrid" },
      { label: "Legal Causation", href: "/legal" },
      { label: "Lab", href: "/lab" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "White Paper", href: "/masa-white-paper.html", external: true },
      { label: "Architecture", href: "#architecture" },
      { label: "Documentation", href: "/docs" },
      { label: "Education", href: "/education" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Wu-Weism", href: "/" },
      { label: "Philosophy", href: "/masa-white-paper.html", external: true },
      { label: "Contact", href: "mailto:hello@wuweism.com" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer style={{ background: "#1a1614" }}>
      {/* Top edge rule */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-6xl px-8 pb-12 pt-16 md:px-12 lg:px-16">
        {/* 4-column grid */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Col 1 — Brand */}
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/wu-wei-mark-true-alpha.png"
              alt="Wu-Weism"
              width={52}
              height={40}
              unoptimized
              className="mb-5 opacity-80 invert"
            />
            <p className="max-w-[18rem] font-mono text-[0.62rem] uppercase leading-[1.9] tracking-[0.14em] text-white/35">
              MASA — Methods of Automated
              <br />
              Scientific Analysis.
              <br />
              Causal governance for
              <br />
              disciplined inquiry.
            </p>
          </div>

          {/* Cols 2–4 — Nav */}
          {columns.map((col) => (
            <div key={col.heading}>
              <p className="mb-5 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-white/30">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      {...("external" in link && link.external
                        ? { target: "_blank", rel: "noreferrer" }
                        : {})}
                      className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-white/45 transition-colors hover:text-[#c8965a]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/8 pt-8 md:flex-row md:items-center">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-white/25">
            © 2026 Wu-Weism · wuweism.com
          </p>
          <nav className="flex gap-6">
            {[
              { label: "White Paper", href: "/masa-white-paper.html", external: true },
              { label: "Open Instrument", href: "/chat" },
              { label: "Architecture", href: "#architecture" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                {...("external" in link && link.external
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
                className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-white/30 transition-colors hover:text-white/60"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
