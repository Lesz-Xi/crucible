"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 mb-20 border-t border-black/5">
      <h2 className="font-sans font-bold text-3xl text-mistral-dark mb-12 text-center">Inquiries</h2>
      
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
      <div className="bg-white border-b border-black/5 hover:bg-mistral-sand transition-colors">
         <button 
           onClick={() => setIsOpen(!isOpen)}
           className="w-full flex items-center justify-between p-6 text-left"
         >
            <span className="font-sans font-bold text-lg text-mistral-dark">{question}</span>
            {isOpen ? <Minus className="w-5 h-5 text-mistral-orange transition-all duration-300 transform rotate-180" /> : <Plus className="w-5 h-5 text-mistral-dark/50 transition-all duration-300 transform rotate-0" />}
         </button>
         <AnimatePresence initial={false}>
           {isOpen && (
              <motion.div
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: "auto", opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 transition={{ duration: 0.3, ease: "easeInOut" }}
                 className="overflow-hidden"
              >
                 <div className="px-6 pb-6 text-sm font-sans text-mistral-dark/80 leading-relaxed">
                    {answer}
                 </div>
              </motion.div>
           )}
         </AnimatePresence>
      </div>
   );
}
