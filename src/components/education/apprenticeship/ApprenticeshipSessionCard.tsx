'use client';

import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { ApprenticeshipSession } from '@/types/education';

interface ApprenticeshipSessionCardProps {
  session: ApprenticeshipSession;
  onOpen: (session: ApprenticeshipSession) => void;
}

export function ApprenticeshipSessionCard({ session, onOpen }: ApprenticeshipSessionCardProps) {
  const completed = session.status === 'completed';

  return (
    <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {completed ? (
            <CheckCircle2 className="w-4 h-4 text-wabi-moss" />
          ) : (
            <Circle className="w-4 h-4 text-[var(--text-muted)]" />
          )}
          <p className="font-serif text-base truncate">Lab Session {session.sessionNumber}</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] font-mono uppercase tracking-[0.15em]">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {session.durationMinutes} min
          </span>
          <span>{completed ? 'Completed' : 'Not started'}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(session)}
        className="px-3 py-2 rounded-full border border-[var(--border-subtle)] text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-[var(--bg-secondary)]"
      >
        {completed ? 'Review' : 'Start'}
      </button>
    </div>
  );
}
