'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type {
  AssessmentScope,
  EpistemicKind,
  EvidenceRelation,
  SourceIndependence,
} from '@/types/claim-ledger';

type Disposition = 'accept_limited' | 'hold' | 'investigate' | 'reject' | 'unknown' | 'archive';

type EvidenceDraft = {
  evidenceRef: string;
  snippet: string;
  relation: EvidenceRelation;
  independence: SourceIndependence;
  sourceEpistemicKind: EpistemicKind;
};

const ASSESSMENT_SCOPE_OPTIONS: Array<{ value: AssessmentScope; label: string; hint: string }> = [
  { value: 'source_statement', label: 'What the source actually says', hint: 'You want to pin down the exact statement, not test it yet.' },
  { value: 'world_claim', label: 'Whether this is independently supported', hint: 'You want to know if it holds up beyond the source itself.' },
  { value: 'personal_experience', label: 'How this affects me personally', hint: 'You are examining your own reaction, not the outside claim.' },
];

const EPISTEMIC_KIND_OPTIONS: Array<{ value: EpistemicKind; label: string }> = [
  { value: 'observation', label: 'Something I directly observed' },
  { value: 'source_claim', label: 'Something a source stated' },
  { value: 'inference', label: 'My own interpretation or inference' },
  { value: 'hypothesis', label: 'An unconfirmed hypothesis' },
  { value: 'felt_state', label: 'A personal feeling or reaction' },
];

const RELATION_OPTIONS: Array<{ value: EvidenceRelation; label: string }> = [
  { value: 'supports', label: 'Supports it' },
  { value: 'contradicts', label: 'Contradicts it' },
  { value: 'contextualizes', label: 'Adds context' },
];

const INDEPENDENCE_OPTIONS: Array<{ value: SourceIndependence; label: string }> = [
  { value: 'primary', label: 'The source itself' },
  { value: 'independent', label: 'An independent confirmation' },
  { value: 'related_party', label: 'Someone connected to the source' },
  { value: 'unknown', label: 'Not sure' },
];

const DISPOSITION_OPTIONS: Array<{ value: Disposition; label: string }> = [
  { value: 'accept_limited', label: 'Accept, cautiously' },
  { value: 'hold', label: 'Hold — plausible but unresolved' },
  { value: 'investigate', label: 'Investigate further' },
  { value: 'reject', label: 'Reject — insufficiently supported' },
  { value: 'unknown', label: 'Remain unknown' },
  { value: 'archive', label: 'Archive without further action' },
];

function labelFor<T extends string>(options: Array<{ value: T; label: string }>, value: T | null): string {
  return options.find((o) => o.value === value)?.label ?? '—';
}

function emptyEvidence(): EvidenceDraft {
  return { evidenceRef: '', snippet: '', relation: 'supports', independence: 'unknown', sourceEpistemicKind: 'source_claim' };
}

const STEP_TITLES = [
  'Choose the object',
  'Name the question',
  'Separate the layers',
  'Ground the reading',
  'Disconfirmation',
  'Private disposition',
];

function Mirror({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-[var(--lab-border)] bg-[var(--lab-bg-elevated)] p-3 text-xs text-[var(--lab-text-secondary)]">
      <p className="mb-1 font-medium text-[var(--lab-text-primary)]">What I recorded</p>
      {children}
    </div>
  );
}

function Choice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string; hint?: string }>;
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg border p-3 text-left text-sm transition-colors ${
            value === option.value
              ? 'border-[var(--lab-accent-earth)] text-[var(--lab-text-primary)]'
              : 'border-[var(--lab-border)] text-[var(--lab-text-secondary)] hover:border-[var(--lab-accent-moss)]'
          }`}
        >
          <span className="block">{option.label}</span>
          {option.hint && <span className="mt-0.5 block text-xs text-[var(--lab-text-tertiary)]">{option.hint}</span>}
        </button>
      ))}
    </div>
  );
}

export default function CompanionPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [claimText, setClaimText] = useState('');
  const [sourceSays, setSourceSays] = useState('');
  const [assessmentScope, setAssessmentScope] = useState<AssessmentScope | null>(null);
  const [epistemicKind, setEpistemicKind] = useState<EpistemicKind | null>(null);
  const [evidence, setEvidence] = useState<EvidenceDraft[]>([emptyEvidence()]);
  const [missingOrConflicting, setMissingOrConflicting] = useState('');
  const [wouldChange, setWouldChange] = useState('');
  const [strongestReading, setStrongestReading] = useState('');
  const [inferenceBoundary, setInferenceBoundary] = useState('');
  const [disposition, setDisposition] = useState<Disposition | null>(null);
  const [showFullReview, setShowFullReview] = useState(false);

  const canAdvance = useMemo(() => {
    switch (step) {
      case 0:
        return claimText.trim().length > 0;
      case 1:
        return assessmentScope !== null;
      case 2:
        return epistemicKind !== null;
      case 3:
        return true; // evidence is optional
      case 4:
        return wouldChange.trim().length > 0;
      case 5:
        return strongestReading.trim().length > 0 && disposition !== null;
      default:
        return false;
    }
  }, [step, claimText, assessmentScope, epistemicKind, wouldChange, strongestReading, disposition]);

  const usableEvidence = evidence.filter((e) => e.evidenceRef.trim().length > 0);

  function updateEvidence(index: number, patch: Partial<EvidenceDraft>) {
    setEvidence((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function removeEvidence(index: number) {
    setEvidence((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch('/api/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimText,
          sourceSays: sourceSays.trim() || undefined,
          assessmentScope,
          epistemicKind,
          evidence: usableEvidence.map((e) => ({
            evidenceRef: e.evidenceRef.trim(),
            snippet: e.snippet.trim() || undefined,
            relation: e.relation,
            independence: e.independence,
            sourceEpistemicKind: e.sourceEpistemicKind,
          })),
          missingOrConflicting: missingOrConflicting.trim() || undefined,
          wouldChange,
          strongestReading,
          inferenceBoundary: inferenceBoundary.trim() || undefined,
          disposition,
        }),
      });
      const payload = (await response.json()) as { success?: boolean; error?: string; claimId?: string };
      if (!response.ok || !payload.success || !payload.claimId) {
        throw new Error(payload.error || `Could not record this case (${response.status})`);
      }
      router.push(`/companion/${payload.claimId}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not record this case');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <header className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-bg)] p-4">
        <p className="text-xs text-[var(--lab-text-secondary)]">Reasoning Companion</p>
        <h1 className="text-sm font-semibold text-[var(--lab-text-primary)]">
          Step {step + 1} of {STEP_TITLES.length}: {STEP_TITLES[step]}
        </h1>
        <div className="mt-3 flex gap-1">
          {STEP_TITLES.map((title, i) => (
            <span
              key={title}
              className={`h-1 flex-1 rounded ${i <= step ? 'bg-[var(--lab-accent-earth)]' : 'bg-[var(--lab-border)]'}`}
            />
          ))}
        </div>
      </header>

      <section className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-bg)] p-4">
        {step === 0 && (
          <div>
            <p className="text-sm text-[var(--lab-text-primary)]">What report or claim would you like to examine?</p>
            <textarea
              className="lab-textarea mt-3 w-full"
              rows={4}
              placeholder="Bring one bounded claim — a statistic, a statement, a passage from a report…"
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
            />
            <p className="mt-3 text-sm text-[var(--lab-text-primary)]">
              What does the source actually say, in its own words? <span className="text-[var(--lab-text-tertiary)]">(optional, if different)</span>
            </p>
            <textarea
              className="lab-textarea mt-2 w-full"
              rows={2}
              placeholder="Leave blank if the claim above already is the source's own words."
              value={sourceSays}
              onChange={(e) => setSourceSays(e.target.value)}
            />
            {claimText.trim() && (
              <Mirror>
                <p className="italic">&ldquo;{claimText.trim()}&rdquo;</p>
              </Mirror>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="mb-3 text-sm text-[var(--lab-text-primary)]">
              What do you want to know right now?
            </p>
            <Choice options={ASSESSMENT_SCOPE_OPTIONS} value={assessmentScope} onChange={setAssessmentScope} />
            {assessmentScope && (
              <Mirror>
                <p>Examining: {labelFor(ASSESSMENT_SCOPE_OPTIONS, assessmentScope)}</p>
              </Mirror>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="mb-3 text-sm text-[var(--lab-text-primary)]">Which best describes this claim right now?</p>
            <Choice options={EPISTEMIC_KIND_OPTIONS} value={epistemicKind} onChange={setEpistemicKind} />
            {epistemicKind && (
              <Mirror>
                <p>Recorded as: {labelFor(EPISTEMIC_KIND_OPTIONS, epistemicKind)}</p>
              </Mirror>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="mb-3 text-sm text-[var(--lab-text-primary)]">
              What accessible evidence supports, contradicts, or adds context to this? You can skip this if you don&apos;t have any yet.
            </p>
            <div className="space-y-4">
              {evidence.map((item, index) => (
                <div key={index} className="rounded-lg border border-[var(--lab-border)] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[var(--lab-text-secondary)]">Evidence {index + 1}</p>
                    {evidence.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEvidence(index)}
                        className="text-xs text-[var(--lab-text-tertiary)] underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    className="mt-2 w-full rounded border border-[var(--lab-border)] bg-transparent p-2 text-xs text-[var(--lab-text-primary)]"
                    placeholder="URL, citation, or reference"
                    value={item.evidenceRef}
                    onChange={(e) => updateEvidence(index, { evidenceRef: e.target.value })}
                  />
                  <textarea
                    className="mt-2 w-full rounded border border-[var(--lab-border)] bg-transparent p-2 text-xs text-[var(--lab-text-primary)]"
                    rows={2}
                    placeholder="Relevant snippet (optional)"
                    value={item.snippet}
                    onChange={(e) => updateEvidence(index, { snippet: e.target.value })}
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <select
                      className="rounded border border-[var(--lab-border)] bg-transparent p-2 text-xs text-[var(--lab-text-primary)]"
                      value={item.relation}
                      onChange={(e) => updateEvidence(index, { relation: e.target.value as EvidenceRelation })}
                    >
                      {RELATION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <select
                      className="rounded border border-[var(--lab-border)] bg-transparent p-2 text-xs text-[var(--lab-text-primary)]"
                      value={item.independence}
                      onChange={(e) => updateEvidence(index, { independence: e.target.value as SourceIndependence })}
                    >
                      {INDEPENDENCE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>Who: {o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setEvidence((prev) => [...prev, emptyEvidence()])}
              className="mt-3 text-xs text-[var(--lab-accent-earth)] underline"
            >
              + Add another piece of evidence
            </button>

            <p className="mt-4 text-sm text-[var(--lab-text-primary)]">What&apos;s missing or conflicting? <span className="text-[var(--lab-text-tertiary)]">(optional)</span></p>
            <textarea
              className="lab-textarea mt-2 w-full"
              rows={2}
              value={missingOrConflicting}
              onChange={(e) => setMissingOrConflicting(e.target.value)}
            />
          </div>
        )}

        {step === 4 && (
          <div>
            <p className="text-sm text-[var(--lab-text-primary)]">What would change this reading?</p>
            <p className="mt-1 text-xs text-[var(--lab-text-tertiary)]">
              Every material conclusion needs a stated condition that would weaken or overturn it.
            </p>
            <textarea
              className="lab-textarea mt-3 w-full"
              rows={3}
              placeholder="e.g. If an independent outlet failed to reproduce the number, or the source retracted it…"
              value={wouldChange}
              onChange={(e) => setWouldChange(e.target.value)}
            />
            {wouldChange.trim() && (
              <Mirror>
                <p>{wouldChange.trim()}</p>
              </Mirror>
            )}
          </div>
        )}

        {step === 5 && (
          <div>
            <p className="text-sm text-[var(--lab-text-primary)]">What&apos;s the strongest defensible reading right now?</p>
            <textarea
              className="lab-textarea mt-2 w-full"
              rows={3}
              value={strongestReading}
              onChange={(e) => setStrongestReading(e.target.value)}
            />
            <p className="mt-3 text-sm text-[var(--lab-text-primary)]">
              Where does this go beyond what&apos;s directly supported? <span className="text-[var(--lab-text-tertiary)]">(optional)</span>
            </p>
            <textarea
              className="lab-textarea mt-2 w-full"
              rows={2}
              value={inferenceBoundary}
              onChange={(e) => setInferenceBoundary(e.target.value)}
            />
            <p className="mt-4 mb-2 text-sm text-[var(--lab-text-primary)]">What&apos;s your private disposition?</p>
            <Choice options={DISPOSITION_OPTIONS} value={disposition} onChange={setDisposition} />

            <button
              type="button"
              onClick={() => setShowFullReview((v) => !v)}
              className="mt-4 text-xs text-[var(--lab-accent-earth)] underline"
            >
              {showFullReview ? 'Hide full review' : 'Review everything so far'}
            </button>
            {showFullReview && (
              <Mirror>
                <ul className="space-y-1">
                  <li>Claim: {claimText.trim() || '—'}</li>
                  {sourceSays.trim() && <li>Source says: {sourceSays.trim()}</li>}
                  <li>Examining: {labelFor(ASSESSMENT_SCOPE_OPTIONS, assessmentScope)}</li>
                  <li>Recorded as: {labelFor(EPISTEMIC_KIND_OPTIONS, epistemicKind)}</li>
                  <li>Evidence items: {usableEvidence.length}</li>
                  {missingOrConflicting.trim() && <li>Missing/conflicting: {missingOrConflicting.trim()}</li>}
                  <li>Would change this reading: {wouldChange.trim() || '—'}</li>
                </ul>
              </Mirror>
            )}
            {submitError && <p className="mt-3 text-xs text-red-700">{submitError}</p>}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push('/claims')}
          className="text-xs text-[var(--lab-text-tertiary)] underline"
        >
          Exit without saving
        </button>
        <div className="flex gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded border border-[var(--lab-border)] px-3 py-2 text-xs text-[var(--lab-text-secondary)]"
            >
              Back
            </button>
          )}
          {step < STEP_TITLES.length - 1 ? (
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}
              className="rounded bg-[var(--lab-accent-earth)] px-3 py-2 text-xs text-[var(--lab-bg)] disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={!canAdvance || submitting}
              onClick={handleSubmit}
              className="rounded bg-[var(--lab-accent-earth)] px-3 py-2 text-xs text-[var(--lab-bg)] disabled:opacity-40"
            >
              {submitting ? 'Recording…' : 'Record this case'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
