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
            className={cn(
              "marketing-card relative flex flex-col justify-between overflow-hidden",
              compact ? "min-h-[152px] rounded-[22px] p-5" : "min-h-[176px] rounded-[24px] p-6",
              index === 2 ? "md:col-span-2" : ""
            )}
          >
            <div className={`pointer-events-none absolute right-5 top-5 rounded-full px-2.5 py-1 ${card.bg}`}>
              <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${card.color}`}>
                {card.level}
              </span>
            </div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div className={`marketing-icon-chip ${card.border} ${card.bg}`}>
                <Icon className={`${compact ? "h-[18px] w-[18px]" : "h-5 w-5"} ${card.color} opacity-90`} strokeWidth={1.5} />
              </div>
            </div>

            <div className="relative z-10">
              <h3 className={`mb-1 font-serif leading-none text-[var(--text-primary)] ${compact ? "text-[1.45rem]" : "text-[1.65rem]"}`}>
                {card.label}
              </h3>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {card.sub}
              </p>
              <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                {card.desc}
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
