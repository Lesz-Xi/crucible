/**
 * Intake Form Progress Indicator
 * 
 * Shows students where they are in the intake process
 * Reduces cognitive load by chunking the form into manageable steps
 */

'use client';

import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

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
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]">
            Progress
          </span>
          <span className="font-mono text-sm text-[var(--text-primary)]">
            Step {currentStep} of {steps.length}
          </span>
        </div>
        
        {/* Visual Progress Bar */}
        <div className="relative h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-wabi-clay to-wabi-moss transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* ASCII-style Progress */}
        <div className="font-mono text-xs text-[var(--text-tertiary)] flex items-center gap-1">
          {Array.from({ length: steps.length }).map((_, idx) => (
            <span key={idx} className={idx < currentStep ? 'text-wabi-clay' : 'text-[var(--text-tertiary)]'}>
              {idx < currentStep ? '▓' : '░'}
            </span>
          ))}
        </div>
      </div>
      
      {/* Step List */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                isCurrent 
                  ? 'bg-wabi-clay/10 border border-wabi-clay/30' 
                  : isCompleted
                    ? 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)] opacity-60'
                    : 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)] opacity-40'
              }`}
            >
              {/* Step Icon/Number */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm transition-all ${
                isCurrent
                  ? 'bg-wabi-clay text-[var(--bg-primary)] shadow-lg shadow-wabi-clay/30'
                  : isCompleted
                    ? 'bg-wabi-clay/20 text-wabi-clay'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : isCurrent ? (
                  <span className="animate-pulse">{step.icon || stepNumber}</span>
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>
              
              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-mono text-sm ${
                    isCurrent ? 'text-wabi-clay font-semibold' : 'text-[var(--text-secondary)]'
                  }`}>
                    {step.title}
                  </h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full bg-wabi-clay/20 text-wabi-clay text-[10px] font-mono uppercase tracking-wider">
                      Current
                    </span>
                  )}
                </div>
                <p className={`text-xs ${
                  isCurrent ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
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
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono text-xs text-[var(--text-tertiary)]">
        Step {currentStep}/{totalSteps}:
      </span>
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
              idx < currentStep 
                ? 'bg-wabi-clay' 
                : idx === currentStep 
                  ? 'bg-wabi-clay/50 animate-pulse'
                  : 'bg-[var(--bg-tertiary)]'
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
