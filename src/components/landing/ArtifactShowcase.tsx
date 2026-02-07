"use client";

import { motion } from "framer-motion";
import { FileText, Activity, GitCommit, ArrowRight } from "lucide-react";

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
  return (
    <section className="relative z-10 w-full py-32 flex flex-col items-center">
      
      {/* Header */}
      <div className="relative z-20 text-center mb-20 max-w-2xl px-6">
         <h2 className="font-serif text-4xl text-wabi-sumi mb-4">Evidence of Truth</h2>
         <p className="font-sans text-lg text-wabi-sumi/70 leading-relaxed">
            We do not sell "features". We provide the instruments to generate <span className="text-wabi-gold italic">verified artifacts</span>.
         </p>
      </div>

      {/* Artifact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6 w-full">
         {artifacts.map((item, i) => (
            <motion.div
               key={i}
               className="group relative bg-wabi-washi border border-wabi-sand/20 p-8 min-h-[320px] flex flex-col justify-between overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: item.delay }}
               viewport={{ once: true }}
            >
               {/* Background Texture/Gradient */}
               <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-wabi-sand/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               
               {/* Top Meta */}
               <div className="relative z-10 flex justify-between items-start mb-8">
                  <div className={`p-3 rounded-sm ${item.color} backdrop-blur-sm`}>
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
               <div className="relative z-10 mt-8 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-wabi-ink/40 group-hover:text-wabi-sumi transition-colors duration-300 cursor-pointer">
                  <span>View Sample</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
               </div>
            </motion.div>
         ))}
      </div>

    </section>
  );
}
