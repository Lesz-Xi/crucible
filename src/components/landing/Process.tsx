"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function Process() {
  const steps = [
    {
      num: "01",
      title: "Ingestion",
      desc: "Raw unstructured data (PDFs, text, logs) is absorbed into the substrate.",
    },
    {
      num: "02",
      title: "Deconstruction",
      desc: "Information is broken down into atomic concepts, discarding noise.",
    },
    {
      num: "03",
      title: "Synthesis",
      desc: "Atomic concepts are reassembled into novel configurations using causal logic.",
    },
    {
      num: "04",
      title: "Crystallization",
      desc: "The final output is calibrated for truth and novelty, then rendered.",
    },
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end center"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="process" ref={containerRef} className="relative z-10 w-full py-24 lg:py-40 bg-white border-t border-black/5">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
        <div>
          <div className="inline-flex items-center gap-2 mb-8">
            <div className="w-2 h-2 rounded bg-[#E65C00]"></div>
            <span className="font-sans font-medium text-xs uppercase tracking-widest text-[#E65C00]">
              Protocol
            </span>
          </div>
          <h2 className="font-sans font-bold text-5xl md:text-6xl text-mistral-dark mb-8 tracking-tighter leading-none">
            The Synthesis Pipeline.
          </h2>
          <p className="font-sans text-xl font-light text-mistral-dark/70 leading-relaxed max-w-md">
            We do not simply retrieve information. We transmute it.
            Our pipeline mimics the cognitive leap of a disciplined mind, moving
            from observation to insight.
          </p>
        </div>

        <div className="relative space-y-12">
           {/* Static background line */}
           <div className="absolute left-[1.65rem] top-4 bottom-4 w-px bg-mistral-sand -z-10" />
           
           {/* Animated fill line */}
           <motion.div 
             className="absolute left-[1.65rem] top-4 bottom-4 w-px bg-mistral-orange -z-10 origin-top"
             style={{ height: lineHeight }}
           />

           {steps.map((step, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.7, delay: idx * 0.15, ease: "easeOut" }}
                className="relative pl-20 group"
              >
                 {/* Node */}
                 <div className="absolute left-[1.3rem] top-2 w-3 h-3 rounded bg-white border-2 border-mistral-sand group-hover:border-mistral-orange transition-colors duration-500 z-10" />
                 
                 <div className="space-y-3">
                    <span className="font-sans font-bold text-xs text-mistral-orange uppercase tracking-wider block mb-2">Step {step.num}</span>
                    <h3 className="font-sans font-bold text-2xl text-mistral-dark transition-colors duration-300 tracking-tight">{step.title}</h3>
                    <p className="font-sans text-base text-mistral-dark/70 leading-relaxed max-w-sm">{step.desc}</p>
                 </div>
              </motion.div>
           ))}
        </div>
      </div>
    </section>
  );
}
