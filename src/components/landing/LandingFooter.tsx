import Link from "next/link";
import Image from "next/image";

const footerLinks = [
  { href: "/masa-white-paper.html", label: "White Paper", external: true },
  { href: "/how-it-works", label: "Architecture" },
  { href: "/chat", label: "Open Instrument" },
];

export function LandingFooter() {
  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)]">
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-14 md:py-16">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
          <div>
            <Image
              src="/wu-wei-mark-true-alpha.png"
              alt="Wu-Weism"
              width={64}
              height={49}
              unoptimized
            />
            <p className="mt-4 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--text-muted)] max-w-[22rem] leading-6">
              MASA — Methods of Automated Scientific Analysis.<br />
              Causal governance for disciplined inquiry.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-5">
            <nav className="flex gap-6">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <p className="font-mono text-[0.62rem] tracking-[0.14em] text-[var(--text-tertiary)]">
              © 2026 Wu-Weism · wuweism.com
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
