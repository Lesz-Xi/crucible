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
        "protocol-card-shell group",
        variant === 'featured' && "is-featured"
      )}
    >
      <div className="protocol-icon">
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 space-y-0">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="protocol-arrow">
        <ArrowRight className="h-5 w-5 text-[var(--lab-text-tertiary)]" />
      </div>
    </button>
  );
}
