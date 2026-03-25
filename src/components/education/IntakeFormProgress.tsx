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
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-3)]">
            Intake Status
          </span>
          <span className="font-mono text-xs text-[var(--accent)]">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        
        {/* Visual Progress Bar */}
        <div className="relative h-1.5 bg-[var(--bg-3)] rounded-full overflow-hidden border border-[var(--border)]">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-[var(--accent)] rounded-full"
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
                  ? 'bg-[var(--bg-2)] border border-[var(--border-2)] shadow-[var(--shadow)]' 
                  : isCompleted
                    ? 'bg-[var(--bg-2)] border border-[var(--border)] opacity-70'
                    : 'bg-[var(--bg)] border border-transparent opacity-40 hover:opacity-60'
              }`}
            >
              {/* Step Icon/Number */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm transition-all duration-500 ${
                isCurrent
                  ? 'bg-[var(--accent)] text-white'
                  : isCompleted
                    ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                    : 'bg-[var(--bg-3)] text-[var(--text-4)]'
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
                    isCurrent ? 'text-[var(--text-1)] font-medium' : 'text-[var(--text-2)]'
                  }`}>
                    {step.title}
                  </h3>
                  {isCurrent && (
                    <span className="relative flex h-2 w-2 ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
                    </span>
                  )}
                </div>
                <p className={`text-xs leading-relaxed ${
                  isCurrent ? 'text-[var(--text-2)]' : 'text-[var(--text-3)]'
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
      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
        Step {currentStep}/{totalSteps}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <div
            key={idx}
            className={`h-1 w-8 rounded-full transition-all duration-500 ${
              idx < currentStep 
                ? 'bg-[var(--accent)]' 
                : idx === currentStep 
                  ? 'bg-[var(--accent-dim)] animate-pulse'
                  : 'bg-[var(--bg-3)]'
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
