"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const faqs = [
  {
    num: "01",
    question: "What makes MASA different from a standard AI assistant?",
    answer:
      "A standard AI assistant generates plausible text. MASA generates falsifiable hypotheses. Every claim passes through Pearl's do-calculus before it's committed to memory — meaning causal structure, not correlation, drives the output. The system explicitly tracks what it doesn't know, flags contradictions, and refuses to paper over them with confident-sounding prose.",
  },
  {
    num: "02",
    question: "Is my research data and API key private?",
    answer:
      "Yes. MASA operates on a Bring Your Own Key model — your Anthropic, OpenAI, or Gemini credentials are stored only in your browser session and never transmitted to our servers. Uploaded documents and research corpora are processed ephemerally. We do not store, train on, or log your research content.",
  },
  {
    num: "03",
    question: "What is Pearl's do-calculus and why does it matter?",
    answer:
      "Judea Pearl's do-calculus is a formal mathematical framework for reasoning about causation rather than correlation. It asks: 'What would happen if I intervened?' rather than 'What tends to co-occur?' This distinction is the difference between medicine and astrology — MASA uses it to ensure every causal claim is logically grounded, not statistically coincident.",
  },
  {
    num: "04",
    question: "Do I need a technical background to use MASA?",
    answer:
      "No. MASA is designed for any researcher who cares about the rigour of their conclusions — biologists, lawyers, economists, social scientists. The Causal Workbench handles the structural causal modelling under the hood. You provide the question; MASA enforces the epistemology.",
  },
  {
    num: "05",
    question: "Which AI providers does MASA support?",
    answer:
      "Anthropic (Claude), OpenAI (GPT-4 series), and Google (Gemini). You connect your own API key directly in the model settings panel. MASA is model-agnostic at the inference layer — the causal governance layer sits above the LLM and applies regardless of which provider you use.",
  },
  {
    num: "06",
    question: "What is the 'Falsifiability Gate'?",
    answer:
      "The Falsifiability Gate is the final checkpoint before any hypothesis enters sovereign memory. It verifies that the claim makes a testable, refutable prediction — i.e. it specifies conditions under which it would be proven wrong. Claims that cannot be falsified are rejected or flagged as speculative. This is MASA's commitment to Karl Popper, applied in code.",
  },
];

function FAQItem({ item, isOpen, onToggle }: {
  item: (typeof faqs)[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const shouldReduce = useReducedMotion();

  return (
    <div className="border-b border-dashed border-[var(--border-subtle)] last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-5 py-6 text-left transition-colors hover:text-[var(--accent-rust)]"
        aria-expanded={isOpen}
      >
        {/* Number */}
        <span className="shrink-0 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)] pt-0.5">
          {item.num}
        </span>

        {/* Question */}
        <span
          className="flex-1 text-[1rem] font-light leading-[1.5] text-[var(--text-primary)] transition-colors"
          style={{ fontFamily: "var(--font-lora, Georgia, serif)" }}
        >
          {item.question}
        </span>

        {/* Chevron */}
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className="mt-1 shrink-0 text-[var(--accent-rust)] transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Answer — AnimatePresence for smooth collapse */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={shouldReduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={shouldReduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-7 pl-10 text-[0.88rem] leading-[1.85] text-[var(--text-secondary)]">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ResearchFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) =>
    setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <section className="hd-section bg-[var(--bg-secondary)] py-24 md:py-32">
      <div className="mx-auto max-w-4xl px-8 md:px-12 lg:px-16">
        {/* Header */}
        <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="hd-kicker mb-4 uppercase">Common Questions</p>
            <h2
              className="hd-serif-display text-[var(--text-primary)]"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              What researchers{" "}
              <em className="italic text-[var(--accent-rust)]">ask.</em>
            </h2>
          </div>
          <a
            href="/masa-white-paper.html"
            target="_blank"
            rel="noreferrer"
            className="self-start border-b border-[var(--border-subtle)] pb-0.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent-rust)] hover:text-[var(--accent-rust)] md:self-end"
          >
            Full white paper →
          </a>
        </div>

        {/* Accordion */}
        <div className="border-t border-dashed border-[var(--border-subtle)]">
          {faqs.map((item, i) => (
            <FAQItem
              key={item.num}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
