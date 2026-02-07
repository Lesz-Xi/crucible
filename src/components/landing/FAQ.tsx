"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export function FAQ() {
  const faqs = [
    {
      q: "How does the engine handle data privacy?",
      a: "All ingested data is processed within an ephemeral container. We do not train our core models on user-submitted context.",
    },
    {
      q: "Can I export the synthesis results?",
      a: "Yes. Results can be exported as Markdown, LaTeX, or raw JSON for integration into your existing accumulation workflows.",
    },
    {
      q: "What is 'Causal Flux'?",
      a: "It is our proprietary metric for measuring the rate of change in semantic relationships between concepts over time.",
    },
    {
      q: "Is there an API available?",
      a: "Yes. The Scholar and Institute tiers include full API access for automated pipeline integration.",
    },
  ];

  return (
    <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 mb-20">
      <h2 className="font-serif text-3xl text-wabi-sumi mb-12 text-center">Inquiries</h2>
      
      <div className="space-y-4">
         {faqs.map((item, idx) => (
            <FAQItem key={idx} question={item.q} answer={item.a} />
         ))}
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
   const [isOpen, setIsOpen] = useState(false);

   return (
      <div className="border border-wabi-sand/30 bg-white/40 backdrop-blur-sm rounded-2xl overflow-hidden active:scale-[0.99] transition-transform">
         <button 
           onClick={() => setIsOpen(!isOpen)}
           className="w-full flex items-center justify-between p-6 text-left"
         >
            <span className="font-serif text-lg text-wabi-sumi">{question}</span>
            {isOpen ? <Minus className="w-4 h-4 text-wabi-clay" /> : <Plus className="w-4 h-4 text-wabi-stone" />}
         </button>
         {isOpen && (
            <div className="px-6 pb-6 text-sm text-wabi-ink-light leading-relaxed">
               {answer}
            </div>
         )}
      </div>
   );
}
