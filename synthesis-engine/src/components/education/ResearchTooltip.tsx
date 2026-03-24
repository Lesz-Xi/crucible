/**
 * Research Tooltip Component
 * 
 * Displays research-backed explanations on hover/click
 * Every claim linked to learning science evidence
 */

'use client';

import React, { useState } from 'react';
import { Info, ExternalLink, BookOpen } from 'lucide-react';

interface ResearchTooltipProps {
  children: React.ReactNode;
  title: string;
  description: string;
  research: {
    citation: string;
    url?: string;
  };
  className?: string;
}

export function ResearchTooltip({
  children,
  title,
  description,
  research,
  className = ''
}: ResearchTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative inline-block group">
      {/* Trigger */}
      <div
        className={`inline-flex items-center gap-1 cursor-help ${className}`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
        <Info className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      {/* Tooltip Card */}
      {isOpen && (
        <div className="absolute z-50 w-80 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shadow-lg left-0 top-full mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Title */}
          <h4 className="font-serif text-base text-[var(--text-primary)] mb-2">
            {title}
          </h4>
          
          {/* Description */}
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
            {description}
          </p>
          
          {/* Research Citation */}
          <div className="pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-wabi-clay/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-3 h-3 text-wabi-clay" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-[var(--text-tertiary)] mb-1">
                  Research Evidence:
                </p>
                {research.url ? (
                  <a
                    href={research.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-wabi-clay hover:text-wabi-clay/80 flex items-center gap-1 transition-colors"
                  >
                    <span className="truncate">{research.citation}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                ) : (
                  <p className="text-xs text-[var(--text-secondary)]">
                    {research.citation}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Pointer Arrow */}
          <div className="absolute -top-2 left-4 w-4 h-4 bg-[var(--bg-secondary)] border-l border-t border-[var(--border-subtle)] transform rotate-45" />
        </div>
      )}
    </div>
  );
}

/**
 * Simplified inline tooltip for quick hints
 */
interface QuickTooltipProps {
  text: string;
  children: React.ReactNode;
}

export function QuickTooltip({ text, children }: QuickTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-block group">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      
      {isVisible && (
        <div className="absolute z-50 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] whitespace-nowrap left-1/2 -translate-x-1/2 top-full mt-2 animate-in fade-in duration-150">
          {text}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--bg-tertiary)] border-l border-t border-[var(--border-subtle)] transform rotate-45" />
        </div>
      )}
    </div>
  );
}
