'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProtocolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'featured';
  tag?: string;
}

export function ProtocolCard({ title, description, icon: Icon, onClick, variant = 'default', tag = '' }: ProtocolCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn("protocol-card w-full text-left", variant === 'featured' && "selected")}
    >
      <div className="card-icon"><Icon size={16} /></div>
      {tag ? <div className="card-tag">{tag}</div> : null}
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="card-footer">
        <span />
        <span className="card-arrow">→</span>
      </div>
    </button>
  );
}
