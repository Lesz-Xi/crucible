"use client";

import { EpistemicCards } from "@/components/landing/EpistemicCards";
import { motion } from "framer-motion";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative h-screen min-h-[900px] flex flex-col items-center justify-center overflow-hidden bg-mistral-dark transition-colors duration-500">
      
      
      {/* Mistral Vibrant Atmospheric Gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none transition-colors duration-[3000ms]">
          
          {/* Base Texture Overlay */}
           <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08] noise-overlay-light pointer-events-none mix-blend-multiply dark:mix-blend-normal"></div>

          {/* Base Grain */}
          <div className="absolute inset-0 noise-overlay-subtle mix-blend-multiply opacity-50"></div>
          
          {/* Mistral Orange Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff5500] via-mistral-orange to-mistral-orange-light opacity-90 mix-blend-screen"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-mistral-dark via-mistral-dark/80 to-transparent opacity-90"></div>
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
          className="font-sans text-6xl md:text-8xl lg:text-[10rem] text-white font-bold leading-[0.9] tracking-tighter mb-8 whitespace-nowrap"
        >
          Automated <span className="text-white">Scientist.</span>
        </motion.h1>

        {/* The Description - Haiku of Function */}
        <motion.p 
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
          className="font-sans text-lg md:text-2xl text-white/90 leading-relaxed max-w-2xl mx-auto mb-12 tracking-tight"
        >
          Traversing the rungs of Judea Pearl’s Ladder. <br className="hidden md:block"/>
          From observation to intervention—distilling truth from the flux.
        </motion.p>

        {/* Main CTA - Mistral Flat Style */}
        <motion.div 
          variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } } }}
          className="mb-16 flex gap-4"
        >
          <motion.a 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/studio"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-mistral-dark font-sans font-medium text-sm rounded hover:bg-white/90 transition-colors"
          >
            <span>Start building</span>
            <span>→</span>
          </motion.a>
          <motion.a 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/masa-white-paper.html" 
            target="_blank"
            className="inline-flex items-center gap-2 px-8 py-4 border border-white text-white font-sans font-medium text-sm hover:bg-white/10 rounded transition-colors"
          >
            <span>Contact Sales</span>
            <span>→</span>
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
