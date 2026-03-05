"use client";

import Image from "next/image";
import Link from "next/link";
import { Github, Linkedin, MessagesSquare } from "lucide-react";
import { PixelChevronDownIcon } from "@/components/landing/PixelIcons";

const footerGroups = [
  {
    title: "Why Wu-Weism",
    links: [
      { href: "#features", label: "Capabilities" },
      { href: "#process", label: "Protocol" },
      { href: "#contact", label: "Contact us" },
      { href: "/masa-white-paper.html", label: "White paper", external: true },
    ],
  },
  {
    title: "Explore",
    links: [
      { href: "/chat", label: "Chat" },
      { href: "/hybrid", label: "Hybrid" },
      { href: "/legal", label: "Legal" },
      { href: "/education", label: "Learn" },
    ],
  },
  {
    title: "Build",
    links: [
      { href: "/lab", label: "Lab" },
      { href: "/benchmarks", label: "Benchmarks" },
      { href: "/epistemic", label: "Epistemic" },
      { href: "/pdf-synthesis", label: "PDF Synthesis" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "#pricing", label: "Pricing" },
      { href: "#contact", label: "Inquiry" },
      { href: "https://docs.openclaw.ai", label: "Documentation", external: true },
      { href: "/legal", label: "Brand" },
    ],
  },
];

const socialLinks = [
  { href: "https://docs.openclaw.ai", label: "Docs", icon: MessagesSquare },
  { href: "https://github.com", label: "GitHub", icon: Github },
  { href: "https://linkedin.com", label: "LinkedIn", icon: Linkedin },
];

export function Footer() {
  return (
    <footer className="relative mt-24 bg-[#efe1b5] text-[#1c1a17]">
      <div className="h-6 bg-[#eb1700]" />

      <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)]">
          <div className="flex flex-col gap-10">
            <div className="space-y-6">
              <div className="relative h-10 w-10">
                <Image
                  src="/wu-wei-mark-transparent.png"
                  alt="Wu-Weism mark"
                  fill
                  className="object-contain brightness-0"
                  unoptimized
                />
              </div>

              <p className="max-w-sm text-lg leading-8 text-[#332c25]/78">
                Causal instruments for disciplined inquiry, legal reasoning, and audited
                synthesis.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/masa-white-paper.html"
                target="_blank"
                className="inline-flex items-center rounded-[10px] bg-black px-5 py-3 text-sm font-medium text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                Read White Paper
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center rounded-[10px] bg-black px-5 py-3 text-sm font-medium text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                Open Chat
              </Link>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="text-[0.95rem] text-[#ff5d1d]">{group.title}</p>
                <ul className="mt-4 space-y-3 text-[1.05rem] leading-8 text-[#1c1a17]">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                        className="transition-colors duration-200 hover:text-[#ff5d1d]"
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

        <div className="mt-20 grid gap-10 border-t border-black/10 pt-10 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <p className="text-xl text-[#1c1a17]">Wu-Weism AI © 2026</p>

          <button
            type="button"
            className="inline-flex w-fit items-center gap-3 border-t border-black/65 pt-4 text-[2rem] leading-none text-[#1c1a17]"
          >
            <span>EN</span>
            <PixelChevronDownIcon className="h-5 w-5 text-[#ff5d1d]" />
          </button>

          <div className="flex items-center gap-5 md:justify-end">
            {socialLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="transition-transform duration-200 hover:-translate-y-0.5 hover:text-[#ff5d1d]"
              >
                <Icon className="h-7 w-7" strokeWidth={1.8} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
