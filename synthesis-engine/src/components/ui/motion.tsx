"use client";

import { motion, AnimatePresence, HTMLMotionProps, Variants, Easing } from "framer-motion";
import React from "react";

// --- Primitives ---
export const MotionDiv = motion.div;
export const MotionSpan = motion.span;
export const MotionSection = motion.section;
export const MotionArticle = motion.article;
export const MotionButton = motion.button;
export { AnimatePresence, motion };

// --- Physics Constants (Apple/Vercel feel) ---
export const SPRING_SMOOTH = { type: "spring", stiffness: 300, damping: 30 };
export const EASE_OUT_EXPO = [0.19, 1, 0.22, 1] as Easing; // "Expo Out" for snappy entrances
export const EASE_IN_OUT_CUBIC = [0.65, 0, 0.35, 1] as Easing;


// --- Standard Variants ---

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.4, ease: EASE_OUT_EXPO } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.2, ease: "easeIn" } 
  },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: EASE_OUT_EXPO } 
  },
  exit: { 
    opacity: 0, 
    y: 10, 
    transition: { duration: 0.3, ease: "easeIn" } 
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.5, ease: EASE_OUT_EXPO } 
  },
  exit: { 
    opacity: 0, 
    x: 10, 
    transition: { duration: 0.3, ease: "easeIn" } 
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.4, ease: EASE_OUT_EXPO } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: { duration: 0.2, ease: "easeIn" } 
  },
};

// --- Stagger Utilities ---

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

// --- Component Wrappers ---

interface FadeInProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const FadeIn = ({ children, className, delay = 0, ...props }: FadeInProps) => (
  <MotionDiv
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={fadeIn}
    transition={{ delay }}
    className={className}
    {...props}
  >
    {children}
  </MotionDiv>
);

export const SlideUp = ({ children, className, delay = 0, ...props }: FadeInProps) => (
  <MotionDiv
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={slideUp}
    transition={{ delay, ease: EASE_OUT_EXPO, duration: 0.5 }}
    className={className}
    {...props}
  >
    {children}
  </MotionDiv>
);

export const StaggeredList = ({ children, className, delay = 0, ...props }: FadeInProps) => (
  <MotionDiv
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={staggerContainer}
    transition={{ delay }}
    className={className}
    {...props}
  >
    {children}
  </MotionDiv>
);
