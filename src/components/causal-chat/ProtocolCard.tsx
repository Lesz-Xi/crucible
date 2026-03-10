'use client';

import { cn } from '@/lib/utils';

type ProtocolIconKind = 'discovery' | 'intervention' | 'audit';

interface ProtocolCardProps {
  tag: string;
  title: string;
  description: string;
  iconKind: ProtocolIconKind;
  onClick: () => void;
  variant?: 'default' | 'featured';
}

function ProtocolIcon({ kind }: { kind: ProtocolIconKind }) {
  if (kind === 'discovery') {
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="8" cy="8" r="2.5" />
        <path d="M3 3l2.8 2.8M10.2 10.2L13 13M3 13l2.8-2.8M10.2 5.8L13 3" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'intervention') {
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M2 12.5l4-5 3 3.5 5-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M8 2v12M2 8h12" strokeLinecap="round" />
      <circle cx="8" cy="8" r="3.5" strokeDasharray="2.5 2" />
    </svg>
  );
}

export function ProtocolCard({ tag, title, description, iconKind, onClick, variant = 'default' }: ProtocolCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "protocol-card-shell group",
        variant === 'featured' && "is-featured"
      )}
    >
      <div className="protocol-icon">
        <ProtocolIcon kind={iconKind} />
      </div>

      <div className="protocol-card-copy">
        <div className="protocol-tag">{tag}</div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="protocol-card-footer">
        <span />
        <span className="protocol-arrow" aria-hidden="true">→</span>
      </div>
    </button>
  );
}
