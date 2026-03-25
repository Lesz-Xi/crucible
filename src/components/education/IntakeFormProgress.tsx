/**
 * Intake Form Progress Indicator
 * 
 * Shows students where they are in the intake process
 * Reduces cognitive load by chunking the form into manageable steps
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
  className = '' 
}: IntakeFormProgressProps) {
  const progressPercentage = ((currentStep) / steps.length) * 100;
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center mb-1">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
            Intake Status
          </span>
          <span className="font-mono text-xs text-[#5B8DB8]">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        
        {/* Glowing Visual Progress Bar */}
        <div className="relative h-1.5 bg-black/20 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#5B8DB8]/50 via-[#5B8DB8] to-[#7EB4D8] shadow-[0_0_15px_#5B8DB8]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
          />
        </div>
      </div>
      
      {/* Step List */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={step.id}
              className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-500 ${
                isCurrent 
                  ? 'bg-[#0A0A0A] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] ring-1 ring-white/5' 
                  : isCompleted
                    ? 'bg-black/20 border border-white/5 opacity-70'
                    : 'bg-black/10 border border-transparent opacity-40 hover:opacity-60'
              }`}
            >
              {/* Step Icon/Number */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm transition-all duration-500 ${
                isCurrent
                  ? 'bg-[#5B8DB8] text-white shadow-[0_0_20px_rgba(91,141,184,0.4)]'
                  : isCompleted
                    ? 'bg-[#5B8DB8]/20 text-[#5B8DB8]'
                    : 'bg-white/5 text-white/30'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : isCurrent ? (
                  <span className="animate-pulse flex items-center justify-center scale-110">{step.icon || stepNumber}</span>
                ) : (
                  <span className="text-xs">{stepNumber}</span>
                )}
              </div>
              
              {/* Step Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className={`font-mono text-sm tracking-tight ${
                    isCurrent ? 'text-white font-medium' : 'text-white/60'
                  }`}>
                    {step.title}
                  </h3>
                  {isCurrent && (
                    <span className="relative flex h-2 w-2 ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5B8DB8] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5B8DB8]"></span>
                    </span>
                  )}
                </div>
                <p className={`text-xs leading-relaxed ${
                  isCurrent ? 'text-white/60' : 'text-white/40'
                }`}>
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
  className = '' 
}: CompactProgressProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
        Step {currentStep}/{totalSteps}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <div
            key={idx}
            className={`h-1w-8 rounded-full transition-all duration-500 ${
              idx < currentStep 
                ? 'bg-[#5B8DB8] shadow-[0_0_8px_#5B8DB8]' 
                : idx === currentStep 
                  ? 'bg-[#5B8DB8]/40 animate-pulse'
                  : 'bg-white/10'
            }`}
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
    icon: '👤'
  },
  {
    id: 'motivation',
    title: 'Motivation Profile',
    description: 'What drives your learning',
    icon: '🎯'
  },
  {
    id: 'environment',
    title: 'Study Environment',
    description: 'Context and support systems',
    icon: '🏠'
  },
  {
    id: 'learning',
    title: 'Learning Profile',
    description: 'Style, confidence, and knowledge',
    icon: '🧠'
  }
];
