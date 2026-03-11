"use client";

import { useRef } from "react";

export function ObsidianVault() {
  const containerRef = useRef(null);

  return (
    <section ref={containerRef} className="hd-section bg-[var(--bg-tertiary)] py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="relative overflow-hidden px-0 py-0">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-center">
            <div className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 shadow-[var(--shadow-soft)]">
              <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-emphasis)] px-6 py-7 md:px-7 md:py-8">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                  <p className="hd-kicker">Storage Layer</p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Audit-ready
                  </span>
                </div>

                <h2 className="mt-6 font-serif text-4xl leading-tight tracking-tight text-[var(--text-primary)] md:text-5xl">
                  The Obsidian <em className="text-[var(--accent-rust)]">Vault</em>
                </h2>
                <p className="mt-6 max-w-md text-[1rem] leading-8 text-[var(--text-secondary)]">
                  Hardened truth. Axioms that withstood the audit. Stored in an immutable
                  lattice of high-density causal graphs.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    ["Integrity state", "Immutable"],
                    ["Graph density", "0.91"],
                    ["Retention mode", "Persistent"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {label}
                      </span>
                      <span className="font-serif text-xl text-[var(--text-primary)]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 shadow-[var(--shadow-soft)]">
              <div className="relative h-[420px] overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-emphasis)] md:h-[500px]">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
                  <div>
                    <p className="hd-kicker">Immutable core</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      Dense storage lattice
                    </p>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    01 / sealed
                  </p>
                </div>

                <div className="pointer-events-none absolute inset-[22px] z-10 rounded-[18px] border border-[rgba(255,244,230,0.08)]" />
                <div className="pointer-events-none absolute left-1/2 top-[72px] bottom-[64px] z-10 w-px -translate-x-1/2 bg-[rgba(255,244,230,0.08)]" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-between border-t border-[var(--border-subtle)] px-5 py-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Refractive density
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Stable / 0.91
                  </span>
                </div>

                <div className="absolute inset-[58px_34px_54px] overflow-hidden rounded-[22px] border border-[rgba(255,244,230,0.08)] bg-[linear-gradient(180deg,#1a1410_0%,#0f0d0b_100%)] shadow-[inset_0_1px_0_rgba(255,244,230,0.08),0_30px_60px_rgba(0,0,0,0.24)]">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(224,163,108,0.16)_0%,rgba(255,244,230,0.05)_18%,rgba(255,244,230,0)_38%,rgba(8,8,8,0.18)_50%,rgba(255,244,230,0.04)_72%,rgba(224,163,108,0.12)_100%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(255,244,230,0.12),rgba(255,255,255,0)_34%),radial-gradient(circle_at_50%_86%,rgba(196,136,84,0.22),rgba(255,255,255,0)_38%)]" />
                  <div className="absolute inset-x-[14%] top-[9%] bottom-[9%] rounded-[28px] border border-[rgba(255,244,230,0.14)] bg-[linear-gradient(180deg,rgba(42,31,23,0.95)_0%,rgba(23,20,17,0.92)_42%,rgba(53,39,28,0.92)_72%,rgba(17,13,11,0.98)_100%)] shadow-[inset_0_0_0_1px_rgba(255,244,230,0.06),inset_0_0_80px_rgba(196,136,84,0.12),0_30px_60px_rgba(0,0,0,0.24)]" />
                  <div className="absolute inset-x-[18%] top-[14%] bottom-[14%] rounded-[24px] bg-[linear-gradient(90deg,rgba(255,244,230,0.18)_0%,rgba(196,136,84,0.18)_20%,rgba(32,27,23,0.18)_49%,rgba(224,163,108,0.16)_74%,rgba(255,244,230,0.18)_100%)] opacity-95 shadow-[inset_0_0_0_1px_rgba(255,244,230,0.08)]" />
                  <div className="absolute inset-y-[14%] left-1/2 w-[1px] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,244,230,0),rgba(196,136,84,0.28),rgba(255,244,230,0))]" />
                  <div className="obsidian-loader-scan absolute inset-y-[8%] left-[24%] w-[16%] rounded-full bg-[linear-gradient(90deg,rgba(255,244,230,0),rgba(224,163,108,0.42),rgba(255,244,230,0))] opacity-60 blur-[18px]" />

                  <div className="absolute left-[7%] top-[10%] flex flex-col gap-2">
                    {["Reflectance", "Parity", "Archive"].map((label) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-rust)]/70" />
                        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="absolute right-[7%] top-[12%] text-right">
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Specular mirror
                    </p>
                    <p className="mt-2 font-serif text-[28px] leading-none text-[var(--text-primary)]">
                      0.91
                    </p>
                  </div>

                  <div className="absolute bottom-[13%] left-[8%] right-[8%] flex items-end justify-between gap-6">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Reflection state
                      </p>
                      <p className="mt-2 font-serif text-lg text-[var(--text-primary)]">
                        Technological mirror
                      </p>
                    </div>
                    <div className="max-w-[220px] text-right">
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Scan discipline
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        Refracts verified truth back into the interface without visual noise.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
