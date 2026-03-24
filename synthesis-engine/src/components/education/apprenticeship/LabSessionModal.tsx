'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, X } from 'lucide-react';
import { ApprenticeshipMood, ApprenticeshipSession } from '@/types/education';

interface LabSessionModalProps {
  open: boolean;
  session: ApprenticeshipSession | null;
  saving?: boolean;
  onClose: () => void;
  onComplete: (payload: { intentNote?: string; mood: ApprenticeshipMood; reflectionNote?: string }) => Promise<void>;
}

function formatTimer(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export function LabSessionModal({ open, session, saving = false, onClose, onComplete }: LabSessionModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [intentNote, setIntentNote] = useState('');
  const [mood, setMood] = useState<ApprenticeshipMood | null>(null);
  const [reflectionNote, setReflectionNote] = useState('');
  const [running, setRunning] = useState(false);

  const totalSeconds = useMemo(() => (session?.durationMinutes ?? 25) * 60, [session]);
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);

  useEffect(() => {
    if (!open || !session) return;
    setStep(1);
    setIntentNote(session.intentNote ?? '');
    setMood(session.mood ?? null);
    setReflectionNote(session.reflectionNote ?? '');
    setRunning(false);
    setRemainingSeconds((session.durationMinutes ?? 25) * 60);
  }, [open, session]);

  useEffect(() => {
    if (!running || !open) return;
    const id = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, open]);

  if (!open || !session) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl edu-card p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="font-serif text-xl">Lab Session {session.sessionNumber}</p>
            <p className="text-xs text-[var(--text-secondary)]">Three-step apprenticeship flow: Intent → Practice → Reflection</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full border border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((index) => (
            <span
              key={index}
              className={`w-8 h-8 rounded-full text-xs font-mono flex items-center justify-center border ${
                step >= index ? 'border-wabi-clay/50 bg-wabi-clay/10 text-wabi-clay' : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
              }`}
            >
              {index}
            </span>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Step 1 · Intent</p>
            <p className="text-sm text-[var(--text-secondary)]">What is one specific behavior you will practice in this session?</p>
            <textarea
              value={intentNote}
              onChange={(event) => setIntentNote(event.target.value)}
              rows={3}
              placeholder="Example: I will run active recall on 20 key concepts."
              className="w-full rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-3 text-sm"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Step 2 · Practice</p>
            <p className="text-sm text-[var(--text-secondary)]">Optional timer to hold a focused 25-minute lab block.</p>

            <div className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div>
                <p className="font-mono text-3xl">{formatTimer(remainingSeconds)}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Local timer only</p>
              </div>
              <button
                type="button"
                onClick={() => setRunning((prev) => !prev)}
                className="px-4 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono uppercase tracking-[0.2em] inline-flex items-center gap-2"
              >
                {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {running ? 'Pause' : 'Start'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Step 3 · Reflection</p>
            <p className="text-sm text-[var(--text-secondary)]">How did this lab feel?</p>

            <div className="flex gap-2">
              {[
                { id: 'low' as const, label: 'Heavy' },
                { id: 'mid' as const, label: 'Okay' },
                { id: 'high' as const, label: 'Light' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setMood(option.id)}
                  className={`px-3 py-2 rounded-full border text-[10px] font-mono uppercase tracking-[0.2em] ${
                    mood === option.id
                      ? 'border-wabi-clay/60 text-wabi-clay bg-wabi-clay/10'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <textarea
              value={reflectionNote}
              onChange={(event) => setReflectionNote(event.target.value)}
              rows={3}
              placeholder="One-line takeaway from this lab session."
              className="w-full rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-3 text-sm"
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev))}
            className="px-3 py-2 rounded-full border border-[var(--border-subtle)] text-[10px] font-mono uppercase tracking-[0.2em]"
            disabled={step === 1}
          >
            Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev))}
              className="px-4 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] font-mono uppercase tracking-[0.2em]"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                if (!mood) return;
                await onComplete({ intentNote, mood, reflectionNote });
              }}
              disabled={!mood || saving}
              className="px-4 py-2 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] font-mono uppercase tracking-[0.2em] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Mark Session Complete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
