"use client";

import { motion, Variants } from "framer-motion";
import { Eye, Hand, GitMerge } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function EpistemicCards({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <motion.div 
      className={cn("grid gap-4 md:grid-cols-2", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.level}
            variants={cardVariants}
            className={`
              relative group overflow-hidden
              ${compact ? "min-h-[150px] rounded-[20px] p-5" : "min-h-[168px] rounded-[24px] p-6"}
              border border-[var(--border-subtle)] bg-[var(--bg-card-soft)] shadow-[var(--shadow-soft)]
              flex flex-col justify-between
              transition-all duration-500 hover:-translate-y-1 hover:border-[var(--border-glow)] hover:bg-[var(--bg-elevated)]
              ${index === 2 ? "md:col-span-2" : ""}
            `}
          >
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-px ${card.bg} opacity-70`} />
            
            <div className="relative z-10 flex justify-between items-start">
              <span className={`font-mono ${compact ? "text-[11px]" : "text-xs"} uppercase tracking-widest ${card.color}`}>
                {card.level}
              </span>
              <Icon className={`${compact ? "h-[18px] w-[18px]" : "w-5 h-5"} ${card.color} opacity-80`} strokeWidth={1.5} />
            </div>

            <div className="relative z-10">
              <h3 className={`mb-1 font-serif leading-none text-[var(--text-primary)] ${compact ? "text-[1.45rem]" : "text-lg"}`}>
                {card.label}
              </h3>
              <p className="font-mono text-[10px] uppercase tracking-tight text-[var(--text-muted)]">
                {card.sub}
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
