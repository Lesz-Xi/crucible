"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

interface ModuleProps {
  x: number;
  y: number;
  label: string;
  type: string;
  description: string;
  specs: string;
  delay: number;
}

const modules: ModuleProps[] = [
  {
    x: 20, y: 30,
    label: "Causal Discovery",
    type: "INFERENCE_ENGINE",
    description: "Infers directional cause-effect relationships from purely observational data using PC-Stable algorithms.",
    specs: "NODES: 14k // DEPTH: 12 Layers",
    delay: 0
  },
  {
    x: 75, y: 20,
    label: "Temporal Dynamics",
    type: "TIME_SERIES",
    description: "Models time-lagged causal effects to distinguish instantaneous correlation from true causation.",
    specs: "LAG_ORDER: t-4 // RESOLUTION: High",
    delay: 0.2
  },
  {
    x: 30, y: 70,
    label: "Counterfactual Engine",
    type: "SIMULATION_CORE",
    description: "Simulates 'What If' scenarios by mathematically detaching causal parents and injecting interventions.",
    specs: "DO_CALCULUS: Active // BRANCHES: ∞",
    delay: 0.4
  },
  {
    x: 80, y: 65,
    label: "Axiom Validator",
    type: "LOGIC_GATE",
    description: "Enforces hard constraints based on laws of physics and logic to prevent hallucinations.",
    specs: "SAFETY: Hard // LATENCY: <1ms",
    delay: 0.6
  }
];

export function CausalLattice() {
  const [activeNode, setActiveNode] = useState<number | null>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
    const { clientX, clientY, currentTarget } = event;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    
    const x = (clientX - left - width / 2) / (width / 2);
    const y = (clientY - top - height / 2) / (height / 2);
    
    mouseX.set(x);
    mouseY.set(y);
  }

  const parallaxX = useTransform(springX, [-1, 1], [-15, 15]);
  const parallaxY = useTransform(springY, [-1, 1], [-15, 15]);

  return (
    <section 
       className="relative z-10 w-full py-32 overflow-hidden min-h-[800px] flex flex-col items-center bg-mistral-sand"
       onMouseMove={handleMouseMove}
       onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
    >


      {/* Header */}
      <div className="relative z-20 text-center mb-16">
         <h2 className="font-sans font-bold text-4xl text-mistral-dark mb-2 tracking-tight">System Architecture</h2>
         <p className="font-sans text-sm text-mistral-dark/70 font-medium tracking-wide">
            The High-Dense Causal Blueprint
         </p>
      </div>

      {/* Desktop Graph (md+) */}
      <motion.div 
         style={{ x: parallaxX, y: parallaxY }}
         className="hidden md:block absolute inset-0 top-32 w-full h-full max-w-6xl mx-auto"
      >
         {/* SVG Connections Layer */}
         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60 dark:opacity-80">
            {/* Draw lines between nodes */}
             <motion.path 
                initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                d="M 20% 30% L 75% 20%" stroke="#C4A77D" strokeWidth="1" strokeDasharray="4 4"
             />
             <motion.path 
                initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeInOut", delay: 0.4 }}
                d="M 20% 30% L 30% 70%" stroke="#C4A77D" strokeWidth="1" strokeDasharray="4 4" 
             />
             <motion.path 
                initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeInOut", delay: 0.6 }}
                d="M 30% 70% L 80% 65%" stroke="#C4A77D" strokeWidth="1"
             />
             <motion.path 
                initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeInOut", delay: 0.8 }}
                d="M 75% 20% L 80% 65%" stroke="#C4A77D" strokeWidth="1" strokeDasharray="4 4"
             />
         </svg>

         {/* Interactive Nodes */}
         {modules.map((node, i) => {
            const isRight = node.x > 50;
            const isBottom = node.y > 50;

            return (
               <motion.div
                  key={i}
                  className="absolute origin-center"
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", bounce: 0.5, delay: node.delay + 0.3 }}
                  whileHover={{ scale: 1.05, zIndex: 10 }} 
                  onMouseEnter={() => setActiveNode(i)}
                  onMouseLeave={() => setActiveNode(null)}
               >
                  {/* The Node Point */}
                  <div className="relative flex items-center justify-center cursor-pointer group w-6 h-6 -ml-3 -mt-3">
                     <div className="w-3 h-3 bg-wabi-sumi rounded-full border border-wabi-gold shadow-[0_0_15px_rgba(196,167,125,0.3)] group-hover:scale-150 transition-transform duration-300"></div>
                     
                     {/* Label (Always Visible) */}
                     <div className={`absolute ${isBottom ? 'top-6' : 'bottom-6'} whitespace-nowrap font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)] bg-[var(--bg-card)]/80 backdrop-blur-sm px-2 py-1 rounded border border-[var(--border-subtle)]/30 transition-all duration-300 ${activeNode === i ? 'opacity-100 border-wabi-gold/50' : 'opacity-70'}`}>
                        {node.label}
                     </div>

                     {/* Expanded Card (On Hover) - Smart Positioning */}
                     <div className={`absolute ${isBottom ? 'bottom-8' : 'top-8'} ${isRight ? 'right-0' : 'left-0'} w-[400px] pointer-events-none transition-all duration-500 ease-out z-20 ${
                        activeNode === i 
                           ? 'opacity-100 translate-y-0' 
                           : `opacity-0 ${isBottom ? 'translate-y-4' : '-translate-y-4'}`
                     }`}>
                        <div className="bg-glass-card backdrop-blur-sm border border-wabi-gold/30 p-6 shadow-2xl relative overflow-hidden rounded-sm transition-colors duration-500">
                             {/* Decorative Vein */}
                             <div className="absolute top-0 left-0 w-1 h-full bg-wabi-gold/50"></div>
                             
                             <div className="font-mono text-[9px] text-[var(--text-muted)] mb-3 flex justify-between">
                                 <span>{node.specs}</span>
                                 <span className="text-wabi-gold">ACTIVE</span>
                             </div>
                             <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">
                                {node.label}
                             </h3>
                             <p className="font-sans text-sm text-[var(--text-secondary)] leading-relaxed">
                                {node.description}
                             </p>
                             <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]/10 font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
                                {node.type}
                             </div>
                         </div>
                     </div>
                  </div>
               </motion.div>
            );
         })}
      </motion.div>

      {/* Mobile Feed (Vertical Trace) */}
      <div className="md:hidden w-full px-6 relative">
          <div className="absolute left-9 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-wabi-gold/30 to-transparent"></div>
          
          <div className="space-y-16">
             {modules.map((node, i) => (
                <div key={i} className="relative pl-12">
                   {/* Node Dot */}
                   <div className="absolute left-[9px] top-6 w-1.5 h-1.5 -ml-[3px] bg-wabi-sumi rounded-full border border-wabi-gold"></div>
                   
                   <div className="bg-glass-card backdrop-blur-sm border border-wabi-sand/20 p-6 rounded-sm">
                      <div className="font-mono text-[9px] text-wabi-ink/40 mb-2">{node.specs}</div>
                      <h3 className="font-serif text-lg text-wabi-sumi mb-2">{node.label}</h3>
                      <p className="font-sans text-sm text-wabi-sumi/80 leading-relaxed mb-4">{node.description}</p>
                      <div className="font-mono text-wabi-ink-light text-[10px] uppercase border-t border-wabi-sand/10 pt-2">
                          {node.type}
                      </div>
                   </div>
                </div>
             ))}
          </div>
      </div>

    </section>
  );
}
