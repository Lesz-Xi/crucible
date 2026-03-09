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

export function ProtocolCard({ title, description, icon: Icon, onClick, variant = 'default', tag = 'PROTOCOL' }: ProtocolCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn("protocol-card w-full text-left", variant === 'featured' && "selected")}
    >
      <div className="card-icon"><Icon size={16} /></div>
      <div className="card-tag">{tag}</div>
      <div style={{ color: 'var(--text-1)', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>{title}</div>
      <div style={{ color: 'var(--text-2)', fontSize: '12px', lineHeight: 1.5 }}>{description}</div>
    </button>
  );
}
