'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type ClaimReconstruction = {
  claim?: Record<string, unknown>;
  evidenceLinks?: Array<Record<string, unknown>>;
  gateDecisions?: Array<Record<string, unknown>>;
  counterfactualTests?: Array<Record<string, unknown>>;
  receipts?: Array<Record<string, unknown>>;
};

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function ClaimReconstructionPage({ params }: { params: Promise<{ claimId: string }> }) {
  const [claimId, setClaimId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ClaimReconstruction | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const resolved = await params;
        if (!active) return;
        setClaimId(resolved.claimId);

        const response = await fetch(`/api/claims/${resolved.claimId}`);
        const payload = (await response.json()) as {
          success?: boolean;
          error?: string;
          reconstruction?: ClaimReconstruction;
        };

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || `Failed to load claim (${response.status})`);
        }

        if (!active) return;
        setData(payload.reconstruction || null);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load claim reconstruction');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [params]);

  const summary = useMemo(() => {
    if (!data) return null;
    return {
      evidence: data.evidenceLinks?.length || 0,
      gates: data.gateDecisions?.length || 0,
      counterfactuals: data.counterfactualTests?.length || 0,
      receipts: data.receipts?.length || 0,
    };
  }, [data]);

  if (loading) {
    return <main className="mx-auto max-w-5xl p-6 text-sm">Loading claim reconstruction…</main>;
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-6 text-sm">
        <p className="text-red-700">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-6">
      <header className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-bg)] p-4">
        <p className="text-xs text-[var(--lab-text-secondary)]">Claim Reconstruction</p>
        <h1 className="font-mono text-sm text-[var(--lab-text-primary)] break-all">{claimId}</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--lab-text-secondary)]">
          <span>Evidence: {summary?.evidence ?? 0}</span>
          <span>Gates: {summary?.gates ?? 0}</span>
          <span>Counterfactuals: {summary?.counterfactuals ?? 0}</span>
          <span>Receipts: {summary?.receipts ?? 0}</span>
        </div>
        <div className="mt-2 text-xs">
          <Link className="underline text-[var(--lab-accent-earth)]" href={`/api/claims/${claimId}`} target="_blank">
            Open raw JSON
          </Link>
        </div>
      </header>

      {[
        { title: 'Claim', value: data?.claim },
        { title: 'Evidence Links', value: data?.evidenceLinks },
        { title: 'Gate Decisions', value: data?.gateDecisions },
        { title: 'Counterfactual Tests', value: data?.counterfactualTests },
        { title: 'Receipts', value: data?.receipts },
      ].map((section) => (
        <section key={section.title} className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-bg)] p-4">
          <h2 className="mb-2 text-sm font-semibold">{section.title}</h2>
          <pre className="overflow-x-auto rounded bg-black/90 p-3 text-xs text-slate-100">{pretty(section.value)}</pre>
        </section>
      ))}
    </main>
  );
}
