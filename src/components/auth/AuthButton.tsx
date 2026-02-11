'use client';

import { useEffect, useMemo, useState } from 'react';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { getCurrentUser, signInWithGoogle, signOut } from '@/lib/auth/actions';
import { collectLocalHistoryExport } from '@/lib/migration/local-history-export';
import type { AppAuthUser } from '@/types/auth';

const IMPORT_SENTINEL_PREFIX = 'history-import-complete';

interface AuthButtonProps {
  className?: string;
  compact?: boolean;
  autoImport?: boolean;
}

export function AuthButton({ className, compact = false, autoImport = true }: AuthButtonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AppAuthUser | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const userLabel = useMemo(() => {
    if (!user) return 'Sign in with Google';
    return user.fullName || user.email || 'Signed in';
  }, [user]);

  const refreshUser = async () => {
    setIsLoading(true);
    const current = await getCurrentUser();
    setUser(current);
    setIsLoading(false);
  };

  useEffect(() => {
    void refreshUser();
  }, []);

  useEffect(() => {
    if (!autoImport || !user?.id) return;

    const sentinelKey = `${IMPORT_SENTINEL_PREFIX}:${user.id}`;
    const alreadyDone = window.localStorage.getItem(sentinelKey) === 'true';
    if (alreadyDone) return;

    const runImport = async () => {
      try {
        setStatusMessage('Importing local history to cloud...');
        const exportPayload = collectLocalHistoryExport();
        const response = await fetch('/api/history/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exportPayload),
        });

        const body = await response.json();
        if (response.ok && body?.success) {
          window.localStorage.setItem(sentinelKey, 'true');
          setStatusMessage('Local history imported.');
          window.dispatchEvent(new Event('historyImported'));
          setTimeout(() => setStatusMessage(null), 3000);
          return;
        }

        setStatusMessage(body?.error || 'History import failed');
      } catch {
        setStatusMessage('History import failed');
      }
    };

    void runImport();
  }, [autoImport, user?.id]);

  const handleSignIn = async () => {
    setIsBusy(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setStatusMessage(error);
      setIsBusy(false);
      return;
    }
  };

  const handleSignOut = async () => {
    setIsBusy(true);
    const { error } = await signOut();
    setIsBusy(false);

    if (error) {
      setStatusMessage(error);
      return;
    }

    setUser(null);
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className={className}>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading...
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {user ? (
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--paper-050)]/80 px-3 py-1.5 text-xs text-[var(--text-primary)] transition hover:bg-[var(--paper-050)]"
            title={user.email || undefined}
          >
            {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
            {!compact ? userLabel : 'Sign out'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--paper-050)]/80 px-3 py-1.5 text-xs text-[var(--text-primary)] transition hover:bg-[var(--paper-050)]"
          >
            {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
            {compact ? 'Google' : userLabel}
          </button>
        )}
      </div>
      {statusMessage && <p className="mt-1 text-[10px] text-[var(--text-secondary)]">{statusMessage}</p>}
    </div>
  );
}
