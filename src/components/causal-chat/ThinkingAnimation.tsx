'use client';

import { motion } from 'framer-motion';
import { Microscope, BrainCircuit, ScanSearch, FlaskConical, FileCheck } from 'lucide-react';

interface ThinkingAnimationProps {
  stageLabel: string;
  stageIndex: number;
}

const STAGES = [
  'Observation framing',
  'Hypothesis synthesis',
  'Prediction drafting',
  'Falsification checks',
  'Test-plan compilation',
] as const;

const ICONS = [
  Microscope,
  BrainCircuit,
  ScanSearch,
  FlaskConical,
  FileCheck,
];

export function ThinkingAnimation({ stageLabel, stageIndex }: ThinkingAnimationProps) {
  const CurrentIcon = ICONS[stageIndex % ICONS.length];

  return (
    <div className="flex flex-col items-center justify-center w-full py-6 space-y-4">
      {/* Icon & Pulse Container */}
      <div className="relative flex items-center justify-center w-16 h-16">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl"
        />
        <motion.div
          key={stageIndex}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 p-3 rounded-xl bg-slate-900/50 border border-indigo-500/30 backdrop-blur-sm"
        >
          <CurrentIcon className="w-6 h-6 text-indigo-400" />
        </motion.div>
      </div>

      {/* Loading Text */}
      <div className="text-center space-y-1">
        <motion.p
          key={stageLabel}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium text-slate-300 font-mono tracking-wide"
        >
          {stageLabel}
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ...
          </motion.span>
        </motion.p>
        <p className="text-xs text-slate-500 font-sans">
          Automated Scientist Engine v2.1
        </p>
      </div>

      {/* Progress Indicators */}
      <div className="flex space-x-2 mt-2">
        {STAGES.map((_, index) => (
          <motion.div
            key={index}
            animate={{
              backgroundColor: index === stageIndex ? '#818cf8' : index < stageIndex ? '#4f46e5' : '#334155',
              scale: index === stageIndex ? 1.2 : 1,
            }}
            className="w-1.5 h-1.5 rounded-full"
          />
        ))}
      </div>
    </div>
  );
}
