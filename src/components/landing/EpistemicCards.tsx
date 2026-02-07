"use client";

import { motion, Variants } from "framer-motion";
import { Eye, Hand, GitMerge } from "lucide-react";

const cards = [
  {
    level: "L1",
    label: "Association",
    sub: "Observation",
    desc: "Detecting patterns in raw data",
    icon: Eye,
    color: "text-wabi-stone",
    border: "border-wabi-stone/30",
    bg: "bg-wabi-stone/5"
  },
  {
    level: "L2",
    label: "Intervention",
    sub: "do(x) Operator",
    desc: "Changing the world to learn",
    icon: Hand,
    color: "text-wabi-rust",
    border: "border-wabi-rust/40",
    bg: "bg-wabi-rust/5"
  },
  {
    level: "L3",
    label: "Counterfactual",
    sub: "Imagination",
    desc: "Reasoning about alternative realities",
    icon: GitMerge,
    color: "text-wabi-gold",
    border: "border-wabi-gold/50",
    bg: "bg-wabi-gold/5"
  }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 1.2
    }
  }
};

const cardVariants: Variants = {
  hidden: { y: 20, opacity: 0, filter: "blur(5px)" },
  visible: { 
    y: 0, 
    opacity: 1, 
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20
    }
  }
};

export function EpistemicCards() {
  return (
    <motion.div 
      className="flex flex-col md:flex-row gap-4 md:gap-6 mb-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.level}
            variants={cardVariants}
            className={`
              relative group overflow-hidden
              w-64 h-40 p-6 rounded-2xl
              backdrop-blur-md bg-glass-card
              border ${card.border}
              flex flex-col justify-between
              transition-all duration-500 hover:-translate-y-1 hover:shadow-wabi
            `}
          >
            {/* Ambient Background Glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${card.bg}`} />
            
            {/* Header */}
            <div className="relative z-10 flex justify-between items-start">
              <span className={`font-mono text-xs uppercase tracking-widest ${card.color}`}>
                {card.level}
              </span>
              <Icon className={`w-5 h-5 ${card.color} opacity-80`} strokeWidth={1.5} />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <h3 className="font-serif text-lg text-[var(--text-primary)] leading-none mb-1">
                {card.label}
              </h3>
              <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-tight">
                {card.sub}
              </p>
            </div>
            
            {/* Decoration (Removed for cleanliness) */}
            {/* <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full ${card.bg} blur-2xl pointer-events-none opacity-40`} /> */}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
