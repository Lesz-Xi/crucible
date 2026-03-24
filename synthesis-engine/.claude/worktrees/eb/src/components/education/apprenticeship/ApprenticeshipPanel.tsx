'use client';

import { GraduationCap, Sparkles } from 'lucide-react';
import { ApprenticeshipSession, ApprenticeshipWeekProgress } from '@/types/education';
import { ApprenticeshipSessionCard } from './ApprenticeshipSessionCard';

interface ApprenticeshipPanelProps {
  focusNode?: string | null;
  interventionName?: string | null;
  sessions: ApprenticeshipSession[];
  progress?: ApprenticeshipWeekProgress | null;
  loading?: boolean;
  notice?: string | null;
  onStartLab: () => Promise<void>;
  onOpenSession: (session: ApprenticeshipSession) => void;
}

export function ApprenticeshipPanel({
  focusNode,
  interventionName,
  sessions,
  progress,
  loading = false,
  notice,
  onStartLab,
  onOpenSession,
}: ApprenticeshipPanelProps) {
  const hasSessions = sessions.length > 0;

  return (
    <section id="apprenticeship-lab" className="edu-card p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h3 className="font-serif text-lg flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-wabi-clay" />
          Causal Apprenticeship
        </h3>
        <span className="edu-chip">2 x 25 min weekly</span>
      </div>

      <p className="text-xs text-[var(--text-secondary)] mb-4">
        Practice one intervention through guided lab sessions. Learn by doing, not just reading recommendations.
      </p>

      <div className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Current Focus</p>
            <p className="font-serif text-base">{interventionName || 'Top intervention'}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Node: {focusNode || 'Practice Quality'}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Week Progress</p>
            <p className="font-serif text-xl">
              {progress ? `${progress.completedSessions}/${progress.totalSessions}` : '0/2'}
            </p>
          </div>
        </div>
      </div>

      {!hasSessions ? (
        <button
          type="button"
          onClick={onStartLab}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono uppercase tracking-[0.2em] hover:opacity-90"
          disabled={loading}
        >
          <Sparkles className="w-3 h-3" />
          {loading ? 'Starting...' : 'Start Apprenticeship Lab'}
        </button>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <ApprenticeshipSessionCard key={session.id} session={session} onOpen={onOpenSession} />
          ))}
        </div>
      )}

      {notice && <p className="text-xs text-[var(--text-tertiary)] mt-3">{notice}</p>}
    </section>
  );
}
