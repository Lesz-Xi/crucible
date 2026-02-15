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
        "scientific-protocol-card group relative flex flex-col items-start gap-3 p-5 text-left transition-all duration-300",
        "rounded-xl border border-[var(--lab-border)] bg-[var(--lab-panel)] hover:border-[var(--lab-text-secondary)]",
        variant === 'featured' && "bg-[var(--lab-panel)]"
      )}
    >
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors group-hover:scale-110",
        "bg-[var(--lab-panel)] border border-[var(--lab-border)] text-[var(--lab-text-primary)]"
      )}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="space-y-2 flex-1">
        <h3 className="font-semibold text-[var(--lab-text-primary)]">
          {title}
        </h3>
        <p className="text-sm text-[var(--lab-text-secondary)] leading-relaxed transition-colors group-hover:text-[var(--lab-text-primary)]">
          {description}
        </p>
      </div>

      <div className="absolute top-5 right-5 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
        <ArrowRight className="h-5 w-5 text-[var(--lab-text-tertiary)]" />
      </div>
    </button>
  );
}
