"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "How does the engine handle data privacy?",
    a: "All ingested data is processed within an ephemeral container. We do not train the core models on user-submitted context.",
  },
  {
    q: "Can I export the synthesis results?",
    a: "Yes. Results can be exported as Markdown, LaTeX, or raw JSON for integration into existing accumulation workflows.",
  },
  {
    q: "What is Causal Flux?",
    a: "It is the internal metric for measuring the rate of change in semantic relationships between concepts over time.",
  },
  {
    q: "Is there an API available?",
    a: "Yes. The Scholar and Institute tiers include API access for automated pipeline integration.",
  },
];

export function FAQ() {
  return (
    <section className="hd-section py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-6 md:px-8">
        <div className="mb-10 text-center">
          <p className="hd-kicker inline-flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-rust)]" />
            Inquiries
          </p>
          <h2 className="mt-6 font-serif text-4xl tracking-tight text-[var(--text-primary)] md:text-5xl">
            Clarify the substrate.
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((item) => (
            <FAQItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="hd-panel rounded-[22px]">
      <button
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
      >
        <span className="font-serif text-2xl tracking-tight text-[var(--text-primary)]">
          {question}
        </span>
        {isOpen ? (
          <Minus className="h-4 w-4 text-[var(--accent-rust)]" />
        ) : (
          <Plus className="h-4 w-4 text-[var(--text-muted)]" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-[var(--border-subtle)] px-6 py-5 text-sm leading-7 text-[var(--text-secondary)]">
          {answer}
        </div>
      )}
    </div>
  );
}
