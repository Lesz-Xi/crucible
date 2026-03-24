/**
 * Intake Form Progress Indicator
 *
 * Shows students where they are in the intake process.
 * Reduces cognitive load by chunking the form into manageable steps.
 */

'use client';

import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

export interface FormStep {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

interface IntakeFormProgressProps {
  currentStep: number;
  steps: FormStep[];
  className?: string;
}

export function IntakeFormProgress({
  currentStep,
  steps,
  className = '',
}: IntakeFormProgressProps) {
  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            Progress Tracking
          </span>
          <span className="font-mono text-xs text-white/80">
            <span className="text-emerald-400">{currentStep}</span> / {steps.length}
          </span>
        </div>

        {/* Cybernetic Progress Bar */}
        <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
          />
        </div>

        {/* ASCII-style Progress (Retained for thematic flavor but faded) */}
        <div className="font-mono text-[10px] text-white/20 flex items-center gap-1.5 opacity-60">
          {Array.from({ length: steps.length }).map((_, idx) => (
            <motion.span
              key={idx}
              animate={{
                color: idx < currentStep ? 'rgba(52, 211, 153, 0.8)' : 'rgba(255, 255, 255, 0.2)',
              }}
              className="tracking-tighter"
            >
              {idx < currentStep ? '▓▓' : '░░'}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Step List */}
      <div className="space-y-2 relative">
        {/* Connection Line */}
        <div className="absolute left-[15px] top-6 bottom-6 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent z-0" />

        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <motion.div
              key={step.id}
              initial={false}
              animate={{
                backgroundColor: isCurrent ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0)',
                borderColor: isCurrent ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0)',
                scale: isCurrent ? 1 : 0.98,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`relative z-10 flex items-start gap-4 py-3 px-3 rounded-lg border backdrop-blur-sm ${
                isCompleted ? 'opacity-70' : isCurrent ? 'opacity-100 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]' : 'opacity-40'
              }`}
            >
              {/* Step Icon/Number */}
              <motion.div
                animate={{
                  backgroundColor: isCurrent ? 'rgba(16, 185, 129, 0.15)' : isCompleted ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0)',
                  borderColor: isCurrent ? 'rgba(16, 185, 129, 0.5)' : isCompleted ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                  color: isCurrent ? 'rgba(52, 211, 153, 1)' : isCompleted ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)',
                  boxShadow: isCurrent ? '0 0 10px rgba(16, 185, 129, 0.2)' : 'none'
                }}
                className="flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center font-mono text-[11px] transition-colors"
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : isCurrent ? (
                  <span className="animate-pulse drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">{step.icon || stepNumber}</span>
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </motion.div>

              {/* Step Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={`font-mono text-xs ${
                      isCurrent
                        ? 'text-emerald-400 font-semibold drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                        : 'text-white/80'
                    }`}
                  >
                    {step.title}
                  </h3>
                  {isCurrent && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono uppercase tracking-widest"
                    >
                      Active
                    </motion.span>
                  )}
                </div>
                <p className={`text-[11px] leading-relaxed ${isCurrent ? 'text-white/60' : 'text-white/40'}`}>
                  {step.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact horizontal progress indicator (for inline use)
 */
interface CompactProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function CompactProgress({
  currentStep,
  totalSteps,
  className = '',
}: CompactProgressProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
        Step <span className="text-emerald-400">{currentStep}</span>/{totalSteps}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <motion.div
            key={idx}
            initial={false}
            animate={{
              backgroundColor: idx < currentStep ? 'rgba(16, 185, 129, 0.8)' : idx === currentStep ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)',
              boxShadow: idx <= currentStep ? '0 0 8px rgba(16, 185, 129, 0.3)' : 'none'
            }}
            className={`h-1 w-4 rounded-full ${idx === currentStep ? 'animate-pulse' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Default form steps for educational intake
 */
export const DEFAULT_INTAKE_STEPS: FormStep[] = [
  {
    id: 'background',
    title: 'Your Background',
    description: 'Academic level and prior experience',
    icon: '👤',
  },
  {
    id: 'motivation',
    title: 'Motivation Profile',
    description: 'What drives your learning',
    icon: '🎯',
  },
  {
    id: 'environment',
    title: 'Study Environment',
    description: 'Context and support systems',
    icon: '🏠',
  },
  {
    id: 'learning',
    title: 'Learning Profile',
    description: 'Style, confidence, and knowledge',
    icon: '🧠',
  },
];
