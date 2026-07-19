'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type EvidenceRef = { ref: string; snippet: string | null; independence: string };

type ReasoningCard = {
  claimExamined: string;
  sourceSays: string | null;
  availableSupport: EvidenceRef[];
  conflictingOrContradicting: EvidenceRef[];
  inferenceBoundary: string | null;
  missingOrConflicting: string | null;
  strongestDefensibleReading: string;
  wouldChangeThisReading: string;
  privateDisposition: string;
};

const DISPOSITION_LABELS: Record<string, string> = {
  accept_limited: 'Accept, cautiously',
  hold: 'Hold — plausible but unresolved',
  investigate: 'Investigate further',
  reject: 'Reject — insufficiently supported',
  unknown: 'Remain unknown',
  archive: 'Archive without further action',
};

function CardRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[var(--lab-border)] py-3 last:border-0">
      <p className="text-xs font-medium text-[var(--lab-text-secondary)]">{label}</p>
      <div className="mt-1 text-sm text-[var(--lab-text-primary)]">{children}</div>
    </div>
  );
}

function EvidenceList({ items }: { items: EvidenceRef[] }) {
  if (items.length === 0) return <p className="text-[var(--lab-text-tertiary)]">None recorded.</p>;
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-xs">
          <span className="text-[var(--lab-text-primary)]">{item.ref}</span>
          <span className="text-[var(--lab-text-tertiary)]"> — {item.independence}</span>
          {item.snippet && <p className="mt-0.5 text-[var(--lab-text-secondary)]">&ldquo;{item.snippet}&rdquo;</p>}
        </li>
      ))}
    </ul>
  );
}

export default function CompanionCardPage({ params }: { params: Promise<{ claimId: string }> }) {
  const [claimId, setClaimId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<ReasoningCard | null>(null);
  const [expanded, setExpanded] = useState(false);

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
          reconstruction?: { receipts?: Array<{ receipt_type: string; receipt_json?: { card?: ReasoningCard } }> };
        };

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || `Failed to load case (${response.status})`);
        }

        const emission = payload.reconstruction?.receipts?.find((r) => r.receipt_type === 'emission');
        const found = emission?.receipt_json?.card ?? null;
        if (!active) return;
        if (!found) throw new Error('This case has no reasoning card yet.');
        setCard(found);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load case');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [params]);

  if (loading) {
    return <main className="mx-auto max-w-2xl p-6 text-sm text-[var(--lab-text-secondary)]">Loading case…</main>;
  }

  if (error || !card) {
    return (
      <main className="mx-auto max-w-2xl p-6 text-sm">
        <p className="text-red-700">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <header className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-bg)] p-4">
        <p className="text-xs text-[var(--lab-text-secondary)]">Reasoning Card</p>
        <h1 className="text-sm font-semibold text-[var(--lab-text-primary)]">{card.claimExamined}</h1>
      </header>

      <section className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-bg)] p-4">
        <CardRow label="Source says">{card.sourceSays ?? <span className="text-[var(--lab-text-tertiary)]">Not distinguished from the claim above.</span>}</CardRow>
        <CardRow label="Available support"><EvidenceList items={card.availableSupport} /></CardRow>
        {card.conflictingOrContradicting.length > 0 && (
          <CardRow label="Conflicting or contradicting"><EvidenceList items={card.conflictingOrContradicting} /></CardRow>
        )}
        {card.inferenceBoundary && <CardRow label="Inference boundary">{card.inferenceBoundary}</CardRow>}
        {card.missingOrConflicting && <CardRow label="Missing or conflicting evidence">{card.missingOrConflicting}</CardRow>}
        <CardRow label="Strongest defensible reading">{card.strongestDefensibleReading}</CardRow>
        <CardRow label="Would change this reading">{card.wouldChangeThisReading}</CardRow>
        <CardRow label="Private disposition">
          <span className="rounded border border-[var(--lab-accent-earth)] px-2 py-1 text-xs text-[var(--lab-accent-earth)]">
            {DISPOSITION_LABELS[card.privateDisposition] ?? card.privateDisposition}
          </span>
        </CardRow>
      </section>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-xs text-[var(--lab-accent-earth)] underline"
      >
        {expanded ? 'Hide full ledger' : 'Expand full ledger'}
      </button>
      {expanded && (
        <p className="text-xs text-[var(--lab-text-secondary)]">
          <Link className="underline text-[var(--lab-accent-earth)]" href={`/claims/${claimId}`}>
            Open the full claim ledger for this case →
          </Link>
        </p>
      )}
    </main>
  );
}
