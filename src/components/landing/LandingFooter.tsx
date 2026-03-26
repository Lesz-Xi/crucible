"use client";

import Link from "next/link";
import Image from "next/image";
import { Twitter, Github, Linkedin } from "lucide-react";
import { FlickeringGrid } from "./FlickeringGrid";

// ── Link data ────────────────────────────────────────────────────────────────

const footerLinks = [
  {
    title: "Research",
    links: [
      { label: "Causal Workbench", href: "/chat" },
      { label: "Hybrid Synthesis", href: "/hybrid" },
      { label: "Lab", href: "/lab" },
      { label: "Legal Causation", href: "/legal" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "White Paper", href: "/masa-white-paper.html", external: true },
      { label: "Architecture", href: "/#architecture" },
      { label: "MASA Engine", href: "/#engine" },
      { label: "Contact", href: "/#contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Risk Disclosures", href: "/disclosures" },
    ],
  },
];

const socialIcons = [
  { Icon: Twitter, href: "https://twitter.com/wuweism",           label: "Twitter"  },
  { Icon: Github,  href: "https://github.com/wuweism",            label: "GitHub"   },
  { Icon: Linkedin,href: "https://linkedin.com/company/wuweism",  label: "LinkedIn" },
];

// ── Component ────────────────────────────────────────────────────────────────

export function LandingFooter() {
  return (
    <footer
      id="footer"
      className="w-full bg-[var(--bg-primary)] border-t border-[var(--border-subtle)]"
    >
      {/* ── Top — brand + navigation columns ──────────────────────────────── */}
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-start md:justify-between gap-8 px-10 md:px-16 pt-10 pb-6">

        {/* Brand column */}
        <div className="flex flex-col gap-3 max-w-xs">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/wu-wei-mark-true-alpha.png"
              alt="Wu-Weism"
              width={40}
              height={32}
              unoptimized
              className="opacity-75"
            />
          </Link>

          <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[var(--text-muted)] leading-relaxed">
            Building the infrastructure for
            <br />
            automated causal science.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-4 mt-1">
            {socialIcons.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="text-[var(--text-tertiary)] hover:text-[var(--accent-rust)] transition-colors duration-200"
              >
                <Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Navigation columns */}
        <div className="flex flex-col sm:flex-row gap-10 md:gap-16">
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h5 className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-5">
                {col.title}
              </h5>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      {...("external" in link && link.external
                        ? { target: "_blank", rel: "noreferrer" }
                        : {})}
                      className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Flickering dot-matrix text band ───────────────────────────────── */}
      <div className="relative h-32 md:h-40 overflow-hidden">
        {/* Gradient fades the grid into the footer above and below */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "linear-gradient(to bottom, var(--bg-primary) 0%, transparent 25%, transparent 75%, var(--bg-primary) 100%)",
          }}
        />
        <FlickeringGrid
          text="CAUSAL SCIENCE"
          fontSize={76}
          fontWeight={600}
          color="#c8965a"
          squareSize={2}
          gridGap={3}
          maxOpacity={0.38}
          flickerChance={0.09}
          className="absolute inset-0 h-full w-full"
        />
      </div>

      {/* ── Disclaimer + copyright ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl border-t border-[var(--border-subtle)] px-10 md:px-16 pt-6 pb-8">
        <p className="mb-3 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
          Disclaimer
        </p>
        <p className="text-[0.65rem] leading-[1.9] text-[var(--text-tertiary)] text-justify max-w-4xl">
          This website is for informational purposes only. MASA (Methods of
          Automated Scientific Analysis) is a research tool and does not
          constitute legal, medical, or investment advice. All outputs are
          generated through automated causal inference pipelines and must be
          reviewed by qualified professionals before any reliance or action.
          Results may be incomplete, context-sensitive, or subject to model
          limitations.
        </p>
        <p className="mt-3 text-[0.65rem] leading-[1.9] text-[var(--text-tertiary)] text-justify max-w-4xl">
          Wu-Weism does not guarantee the accuracy, completeness, or fitness
          for purpose of any analysis produced by MASA. Use of this platform
          implies acceptance of our Terms of Service and acknowledgment that
          causal inference is probabilistic in nature. Not available to users
          in jurisdictions where automated research tools are restricted by law.
        </p>
        <p className="mt-8 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-[var(--text-tertiary)] text-center">
          © 2026 Wu-Weism · wuweism.com · All rights reserved.
        </p>
      </div>
    </footer>
  );
}
