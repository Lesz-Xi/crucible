/**
 * Intake Form Progress Indicator
 *
 * Shows students where they are in the intake process.
 * Reduces cognitive load by chunking the form into manageable steps.
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
  className = '',
}: IntakeFormProgressProps) {
  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--lab-text-tertiary)]">
            Progress
          </span>
          <span className="font-mono text-sm text-[var(--lab-text-primary)]">
            Step {currentStep} of {steps.length}
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="relative h-px bg-[var(--lab-border-strong)] overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-[var(--lab-accent-clay)] transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* ASCII-style Progress */}
        <div className="font-mono text-xs text-[var(--lab-text-tertiary)] flex items-center gap-1">
          {Array.from({ length: steps.length }).map((_, idx) => (
            <span
              key={idx}
              className={idx < currentStep ? 'text-[var(--lab-accent-clay)]' : 'text-[var(--lab-text-tertiary)]'}
            >
              {idx < currentStep ? '▓' : '░'}
            </span>
          ))}
        </div>
      </div>

      {/* Step List */}
      <div className="space-y-1">
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 py-3 px-3 transition-all duration-300 rounded-sm ${
                isCurrent
                  ? 'border-l-2 border-l-[var(--lab-accent-clay)] border border-[var(--lab-border)] bg-transparent'
                  : isCompleted
                  ? 'border border-[var(--lab-border)] bg-transparent opacity-60'
                  : 'border border-transparent bg-transparent opacity-40'
              }`}
            >
              {/* Step Icon/Number */}
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs transition-all ${
                  isCurrent
                    ? 'bg-[var(--lab-accent-clay)] text-[#1A0F04]'
                    : isCompleted
                    ? 'bg-[var(--lab-accent-dim)] text-[var(--lab-accent-clay)]'
                    : 'bg-transparent border border-[var(--lab-border-strong)] text-[var(--lab-text-tertiary)]'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : isCurrent ? (
                  <span className="animate-pulse">{step.icon || stepNumber}</span>
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3
                    className={`font-mono text-sm ${
                      isCurrent
                        ? 'text-[var(--lab-accent-clay)] font-semibold'
                        : 'text-[var(--lab-text-secondary)]'
                    }`}
                  >
                    {step.title}
                  </h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--lab-accent-dim)] text-[var(--lab-accent-clay)] text-[10px] font-mono uppercase tracking-wider">
                      Current
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs ${
                    isCurrent
                      ? 'text-[var(--lab-text-secondary)]'
                      : 'text-[var(--lab-text-tertiary)]'
                  }`}
                >
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
  className = '',
}: CompactProgressProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono text-xs text-[var(--lab-text-tertiary)]">
        Step {currentStep}/{totalSteps}:
      </span>
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <div
            key={idx}
            className={`h-px w-6 transition-all duration-300 ${
              idx < currentStep
                ? 'bg-[var(--lab-accent-clay)]'
                : idx === currentStep
                ? 'bg-[var(--lab-accent-clay)] opacity-40 animate-pulse'
                : 'bg-[var(--lab-border-strong)]'
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
