"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { FileText, Activity, GitCommit, ArrowRight } from "lucide-react";
import { useRef } from "react";
import Image from "next/image";

const artifacts = [
  {
    title: "The Causal Graph",
    description: "A directed acyclic graph (DAG) representing confirmed dependencies.",
    icon: Activity,
    meta: "FORMAT: .JSON / .SVG",
    color: "bg-mistral-orange/10 text-mistral-orange",
    delay: 0
  },
  {
    title: "The LaTeX Manuscript",
    description: "Publication-ready academic prose with BibTeX citations.",
    icon: FileText,
    meta: "FORMAT: .TEX / .PDF",
    color: "bg-mistral-dark/10 text-mistral-dark",
    delay: 0.2
  },
  {
    title: "The Epistemic Audit",
    description: "Step-by-step verification log of every logical inference.",
    icon: GitCommit,
    meta: "FORMAT: .LOG / .MD",
    color: "bg-blue-600/10 text-blue-600",
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
    <section ref={targetRef} className="relative z-10 w-full h-[250vh] bg-white">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        
        {/* Full width container for the content moving horizontally */}
        <motion.div style={{ x }} className="flex gap-16 px-6 lg:px-24 w-max items-center">
          
          {/* Header section acting as the first horizontal element */}
          <div className="w-[300px] md:w-[400px] flex-shrink-0 pr-8">
             <h2 className="font-sans font-bold text-5xl text-mistral-dark mb-6 tracking-tight">Evidence of Truth</h2>
             <p className="font-sans text-xl text-mistral-dark/70 leading-relaxed font-light">
                We do not sell "features". We provide the instruments to generate <span className="font-medium">verified artifacts</span>.
             </p>
          </div>

          {/* Artifact Cards */}
          <div className="flex gap-8">
             {artifacts.map((item, i) => (
                <div
                   key={i}
                   className="group relative bg-white border border-black/5 p-10 min-h-[360px] w-[320px] md:w-[380px] flex-shrink-0 flex flex-col justify-between overflow-hidden transition-all duration-500 hover:shadow-mistral hover:-translate-y-1 rounded-xl"
                >
                   {/* Background Texture/Gradient */}
                   <div className="absolute inset-0 bg-gradient-to-br from-mistral-sand/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                   
                   {/* Top Meta */}
                   <div className="relative z-10 flex justify-between items-start mb-8">
                      <div className={`p-3 rounded transition-colors ${item.color}`}>
                         <item.icon className="w-6 h-6" strokeWidth={2} />
                      </div>
                      <span className="font-sans font-medium text-[11px] uppercase tracking-wider text-mistral-dark/40 group-hover:text-mistral-dark/60 transition-colors">
                         {item.meta}
                      </span>
                   </div>

                   {/* Content */}
                   <div className="relative z-10">
                      <h3 className="font-sans font-bold text-2xl text-mistral-dark mb-3 tracking-tight">
                         {item.title}
                      </h3>
                      <p className="font-sans text-base text-mistral-dark/70 leading-relaxed">
                         {item.description}
                      </p>
                   </div>

                   {/* Bottom Action */}
                   <button type="button" className="relative z-10 mt-8 w-max flex items-center gap-2 px-4 py-2 bg-mistral-sand/50 hover:bg-mistral-sand text-sm font-sans font-medium text-mistral-dark rounded transition-colors duration-300">
                      <span>View Sample</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                   </button>
                </div>
             ))}
          </div>

           {/* End Spacer */}
           <div className="w-[100px] flex-shrink-0"></div>

        </motion.div>
      </div>
    </section>
  );
}
