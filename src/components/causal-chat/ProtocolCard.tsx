'use client';

import { LucideIcon, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProtocolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'featured';
}

export function ProtocolCard({ title, description, icon: Icon, onClick, variant = 'default' }: ProtocolCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-start gap-3 p-5 text-left transition-all duration-300",
        "rounded-xl border border-[var(--lab-border)] bg-[var(--lab-bg-secondary)] hover:border-[var(--lab-text-secondary)] hover:shadow-md",
        variant === 'featured' && "bg-gradient-to-br from-[var(--lab-bg-secondary)] to-[var(--lab-bg-tertiary)] border-indigo-500/20"
      )}
    >
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors group-hover:scale-110",
        "bg-[var(--lab-bg-primary)] border border-[var(--lab-border)] shadow-sm text-[var(--lab-text-primary)]"
      )}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="space-y-1.5 flex-1">
        <h3 className="font-semibold text-[var(--lab-text-primary)] flex items-center gap-2">
          {title}
          <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-[var(--lab-text-tertiary)]" />
        </h3>
        <p className="text-sm text-[var(--lab-text-secondary)] leading-relaxed">
          {description}
        </p>
      </div>

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="h-1.5 w-1.5 rounded-full bg-[var(--lab-accent-earth)] shadow-[0_0_8px_rgba(139,94,60,0.6)]" />
      </div>
    </button>
  );
}
