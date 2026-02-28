"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { FileText, Activity, GitCommit, ArrowRight } from "lucide-react";
import { useRef } from "react";

const artifacts = [
  {
    title: "The Causal Graph",
    description: "A directed acyclic graph (DAG) representing confirmed dependencies.",
    icon: Activity,
    meta: "FORMAT: .JSON / .SVG",
    color: "bg-wabi-gold/10 text-wabi-gold",
    delay: 0
  },
  {
    title: "The LaTeX Manuscript",
    description: "Publication-ready academic prose with BibTeX citations.",
    icon: FileText,
    meta: "FORMAT: .TEX / .PDF",
    color: "bg-wabi-sumi/5 text-wabi-sumi",
    delay: 0.2
  },
  {
    title: "The Epistemic Audit",
    description: "Step-by-step verification log of every logical inference.",
    icon: GitCommit,
    meta: "FORMAT: .LOG / .MD",
    color: "bg-blue-900/10 text-blue-900",
    delay: 0.4
  }
];

export function ArtifactShowcase() {
  const targetRef = useRef<HTMLDivElement | null>(null);
  
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  // Transform scroll position into horizontal movement
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);

  return (
    <section ref={targetRef} className="relative z-10 w-full h-[250vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        
        {/* Full width container for the content moving horizontally */}
        <motion.div style={{ x }} className="flex gap-16 px-6 lg:px-24 w-max items-center">
          
          {/* Header section acting as the first horizontal element */}
          <div className="w-[300px] md:w-[400px] flex-shrink-0 pr-8">
             <h2 className="font-serif text-4xl text-wabi-sumi mb-4">Evidence of Truth</h2>
             <p className="font-sans text-lg text-wabi-sumi/70 leading-relaxed">
                We do not sell "features". We provide the instruments to generate <span className="text-wabi-gold italic">verified artifacts</span>.
             </p>
          </div>

          {/* Artifact Cards */}
          <div className="flex gap-8">
             {artifacts.map((item, i) => (
                <div
                   key={i}
                   className="group lg-card relative bg-wabi-washi border border-wabi-sand/20 p-8 min-h-[360px] w-[320px] md:w-[380px] flex-shrink-0 flex flex-col justify-between overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
                >
                   {/* Background Texture/Gradient */}
                   <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-wabi-sand/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                   
                   {/* Top Meta */}
                   <div className="relative z-10 flex justify-between items-start mb-8">
                      <div className={`lg-control p-3 rounded-sm ${item.color}`}>
                         <item.icon className="w-6 h-6" strokeWidth={1.5} />
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-wabi-ink/30 group-hover:text-wabi-ink/50 transition-colors">
                         {item.meta}
                      </span>
                   </div>

                   {/* Content */}
                   <div className="relative z-10">
                      <h3 className="font-serif text-2xl text-wabi-sumi mb-3 group-hover:text-wabi-gold transition-colors duration-300">
                         {item.title}
                      </h3>
                      <p className="font-sans text-sm text-wabi-sumi/60 leading-relaxed group-hover:text-wabi-sumi/80 transition-colors">
                         {item.description}
                      </p>
                   </div>

                   {/* Bottom Action */}
                   <button type="button" className="relative z-10 mt-8 lg-control w-max flex items-center gap-2 rounded-xl px-2 py-1 text-xs font-mono uppercase tracking-widest text-wabi-ink/40 transition-colors duration-300 group-hover:text-wabi-sumi">
                      <span>View Sample</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                   </button>
                </div>
             ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
