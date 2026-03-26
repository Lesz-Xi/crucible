import Link from "next/link";
import Image from "next/image";
import { Twitter, Github, Linkedin } from "lucide-react";

const researchLinks = [
  { label: "Causal Workbench", href: "/chat" },
  { label: "Hybrid Synthesis", href: "/hybrid" },
  { label: "Legal Causation", href: "/legal" },
  { label: "Lab", href: "/lab" },
];

const legalLinks = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "White Paper", href: "/masa-white-paper.html", external: true },
  { label: "Risk Disclosures", href: "/disclosures" },
];

const socialIcons = [
  { Icon: Twitter, href: "https://twitter.com/wuweism", label: "Twitter" },
  { Icon: Github, href: "https://github.com/wuweism", label: "GitHub" },
  { Icon: Linkedin, href: "https://linkedin.com/company/wuweism", label: "LinkedIn" },
];

export function LandingFooter() {
  return (
    <footer className="bg-stone-900 text-stone-400 py-24 px-12 lg:px-24">
      {/* 4-column grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

        {/* Col 1 — Brand */}
        <div className="col-span-1">
          <Image
            src="/wu-wei-mark-true-alpha.png"
            alt="Wu-Weism"
            width={52}
            height={40}
            unoptimized
            className="mb-6 opacity-70 invert"
          />
          <p className="text-xs text-stone-500 leading-relaxed">
            Building the infrastructure for
            <br />
            automated causal science.
          </p>
        </div>

        {/* Col 2 — Research */}
        <div>
          <h5 className="text-white text-xs uppercase tracking-widest mb-6">
            Research
          </h5>
          <ul className="space-y-4 text-xs">
            {researchLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3 — Legal */}
        <div>
          <h5 className="text-white text-xs uppercase tracking-widest mb-6">
            Legal
          </h5>
          <ul className="space-y-4 text-xs">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  {...("external" in link && link.external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                  className="hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4 — Social */}
        <div>
          <h5 className="text-white text-xs uppercase tracking-widest mb-6">
            Social
          </h5>
          <div className="flex gap-4">
            {socialIcons.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="w-4 h-4 hover:text-white cursor-pointer transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer + copyright */}
      <div className="max-w-7xl mx-auto border-t border-stone-800 pt-12 text-[10px] text-stone-600 leading-loose text-justify">
        <p className="mb-4 font-bold uppercase tracking-widest">Disclaimer</p>
        <p>
          This website is for informational purposes only. MASA (Methods of
          Automated Scientific Analysis) is a research tool and does not
          constitute legal, medical, or investment advice. All outputs are
          generated through automated causal inference pipelines and must be
          reviewed by qualified professionals before any reliance or action.
          Results may be incomplete, context-sensitive, or subject to model
          limitations.
        </p>
        <p className="mt-3">
          Wu-Weism does not guarantee the accuracy, completeness, or fitness for
          purpose of any analysis produced by MASA. Use of this platform implies
          acceptance of our Terms of Service and acknowledgment that causal
          inference is probabilistic in nature. Not available to users in
          jurisdictions where automated research tools are restricted by law.
        </p>
        <p className="mt-8 text-center tracking-widest">
          © 2026 Wu-Weism · wuweism.com · All rights reserved.
        </p>
      </div>
    </footer>
  );
}
