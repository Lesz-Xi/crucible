'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ClaimKind, ClaimSourceFeature, ClaimStatus, ClaimUncertaintyLabel } from '@/types/claim-ledger';

type ClaimListItem = {
  id: string;
  source_feature: ClaimSourceFeature;
  claim_kind: ClaimKind;
  status: ClaimStatus;
  confidence_score: number | null;
  uncertainty_label: ClaimUncertaintyLabel | null;
  trace_id: string | null;
  session_id: string | null;
  created_at: string;
};

const SOURCE_FEATURES: Array<ClaimSourceFeature | 'all'> = ['all', 'chat', 'hybrid', 'legal'];

const UNCERTAINTY_STYLE: Record<string, string> = {
  low: 'text-emerald-600',
  medium: 'text-amber-600',
  high: 'text-red-600',
  unknown: 'text-[var(--lab-text-secondary)]',
};

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function ClaimsIndexPage() {
  const [claims, setClaims] = useState<ClaimListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceFeature, setSourceFeature] = useState<ClaimSourceFeature | 'all'>('all');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ limit: '50' });
    if (sourceFeature !== 'all') {
      params.set('sourceFeature', sourceFeature);
    }

    fetch(`/api/claims?${params.toString()}`)
      .then(async (response) => {
        const payload = (await response.json()) as { success?: boolean; error?: string; claims?: ClaimListItem[] };
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || `Failed to load claims (${response.status})`);
        }
        if (!active) return;
        setClaims(payload.claims || []);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load claims');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sourceFeature]);

  const emptyState = useMemo(() => !loading && !error && (claims?.length ?? 0) === 0, [loading, error, claims]);

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-6">
      <header className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-bg)] p-4">
        <p className="text-xs text-[var(--lab-text-secondary)]">Claim Ledger</p>
        <h1 className="text-sm font-semibold text-[var(--lab-text-primary)]">Claims</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {SOURCE_FEATURES.map((feature) => (
            <button
              key={feature}
              type="button"
              onClick={() => setSourceFeature(feature)}
              className={`rounded border px-2 py-1 text-xs ${
                sourceFeature === feature
                  ? 'border-[var(--lab-accent-earth)] text-[var(--lab-accent-earth)]'
                  : 'border-[var(--lab-border)] text-[var(--lab-text-secondary)]'
              }`}
            >
              {feature}
            </button>
          ))}
        </div>
      </header>

      {loading && <p className="text-sm text-[var(--lab-text-secondary)]">Loading claims…</p>}

      {error && (
        <p className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-bg)] p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {emptyState && (
        <p className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-bg)] p-4 text-sm text-[var(--lab-text-secondary)]">
          No claims recorded yet.
        </p>
      )}

      {!loading && !error && (claims?.length ?? 0) > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[var(--lab-border)] bg-[var(--lab-bg)]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--lab-border)] text-[var(--lab-text-secondary)]">
              <tr>
                <th className="p-3 font-medium">Claim</th>
                <th className="p-3 font-medium">Source</th>
                <th className="p-3 font-medium">Kind</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Uncertainty</th>
                <th className="p-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {claims!.map((claim) => (
                <tr key={claim.id} className="border-b border-[var(--lab-border)] last:border-0">
                  <td className="p-3 font-mono">
                    <Link className="underline text-[var(--lab-accent-earth)]" href={`/claims/${claim.id}`}>
                      {claim.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="p-3 text-[var(--lab-text-primary)]">{claim.source_feature}</td>
                  <td className="p-3 text-[var(--lab-text-primary)]">{claim.claim_kind}</td>
                  <td className="p-3 text-[var(--lab-text-primary)]">{claim.status}</td>
                  <td className={`p-3 ${UNCERTAINTY_STYLE[claim.uncertainty_label ?? 'unknown']}`}>
                    {claim.uncertainty_label ?? 'unknown'}
                  </td>
                  <td className="p-3 text-[var(--lab-text-secondary)]">{formatDate(claim.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
