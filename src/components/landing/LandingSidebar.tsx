"use client";

import Link from "next/link";
import Image from "next/image";
import { FlaskConical, GitMerge, Scale, BookOpen, MessageSquare } from "lucide-react";

const navIcons = [
  { href: "#laboratory", Icon: FlaskConical, label: "Laboratory" },
  { href: "#surfaces", Icon: MessageSquare, label: "Research Surfaces" },
  { href: "#architecture", Icon: GitMerge, label: "Architecture" },
  { href: "#pipeline", Icon: Scale, label: "Pipeline" },
  { href: "#docs", Icon: BookOpen, label: "Documentation" },
];

export function LandingSidebar() {
  return (
    <aside
      className="fixed left-0 top-0 z-50 flex h-screen w-[70px] flex-col items-center justify-between border-r border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 pb-8 pt-8 backdrop-blur-md"
      style={{ backdropFilter: "blur(12px)" }}
    >
      {/* Logo Mark */}
      <Link href="/" className="group flex flex-col items-center gap-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--text-primary)]">
          <Image
            src="/wu-wei-mark-true-alpha.png"
            alt="Wu-Weism"
            width={28}
            height={28}
            unoptimized
            className="h-auto w-6 invert"
          />
        </div>
      </Link>

      {/* Section Nav Icons */}
      <nav className="flex flex-col items-center gap-5">
        {navIcons.map(({ href, Icon, label }) => (
          <a
            key={href}
            href={href}
            title={label}
            className="group relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--accent-rust-soft)] hover:text-[var(--accent-rust)]"
          >
            <Icon size={16} strokeWidth={1.5} />
            {/* Tooltip */}
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-primary)] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
              {label}
            </span>
          </a>
        ))}
      </nav>

      {/* Open Instrument */}
      <Link
        href="/chat"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-muted)] transition-all hover:border-[var(--accent-rust)] hover:text-[var(--accent-rust)]"
        title="Open Instrument"
      >
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em]">GO</span>
      </Link>
    </aside>
  );
}
