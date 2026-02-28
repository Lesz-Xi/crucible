"use client";

import { EpistemicCards } from "@/components/landing/EpistemicCards";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative h-screen min-h-[900px] flex flex-col items-center justify-center overflow-hidden bg-[var(--bg-primary)] transition-colors duration-500">
      
      
      {/* Living Washi Background - CSS Fog/Noise */}
      <div className="absolute inset-0 z-0 pointer-events-none transition-colors duration-[3000ms]">
          
          {/* Base Texture Overlay */}
           <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08] noise-overlay-light pointer-events-none mix-blend-multiply dark:mix-blend-normal"></div>

          {/* Base Grain */}
          <div className="absolute inset-0 noise-overlay-subtle mix-blend-multiply opacity-50"></div>
      </div>

      {/* Main Typography Content */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1, 
            transition: { staggerChildren: 0.3, delayChildren: 0.2 }
          }
        }}
        className="relative z-10 max-w-7xl mx-auto px-6 text-center flex flex-col items-center"
      >
        
        {/* Spacer for Cinematic "Ma" (Negative Space) */}
        <div className="h-[10vh]"></div>

        {/* Epistemic Cards - Sequential Reveal */}
        <motion.div 
          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: "easeOut" } } }}
          className="relative z-20 mb-16"
        >
           <EpistemicCards />
        </motion.div>

        {/* The Title - Single Line, Cinematic Scale */}
        <motion.h1 
          variants={{ hidden: { opacity: 0, y: 40, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } } }}
          className="font-serif text-6xl md:text-8xl lg:text-[10rem] text-[var(--text-primary)] leading-[0.9] tracking-tight mb-8 whitespace-nowrap"
        >
          Causal <span className="italic font-light text-[var(--text-primary)]">Architect</span>
        </motion.h1>

        {/* The Description - Haiku of Function */}
        <motion.p 
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
          className="font-sans text-sm md:text-base text-wabi-stone leading-relaxed max-w-lg mx-auto mb-10"
        >
          Traversing the rungs of Judea Pearl’s Ladder. <br className="hidden md:block"/>
          From observation to intervention—distilling truth from the flux.
        </motion.p>

        {/* MASA White Paper Call to Action */}
        <motion.div 
          variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } } }}
          className="mb-16"
        >
          <motion.a 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/masa-white-paper.html" 
            target="_blank"
            className="group relative inline-flex items-center gap-2 px-6 py-3 border border-[var(--text-primary)]/20 rounded-full 
                     hover:bg-[var(--text-primary)]/5 transition-colors duration-300
                     text-[var(--text-primary)] font-mono text-xs tracking-widest uppercase hover:tracking-[0.15em]"
          >
            <span>Read MASA White Paper</span>
            <span className="opacity-50 group-hover:opacity-100 transition-opacity">→</span>
          </motion.a>
        </motion.div>

        {/* Subtle Scroll Indicator */}
        <motion.div 
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 0.5, transition: { duration: 1, delay: 1.5 } } }}
          className="absolute bottom-[-150px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-[bounce_3s_infinite]"
        >
           <div className="w-[1px] h-12 bg-wabi-ink-light/20"></div>
           <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-wabi-ink-light">Explore</span>
        </motion.div>

      </motion.div>
    </section>
  );
}
