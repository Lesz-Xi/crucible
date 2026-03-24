'use client';

import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Download, FlaskConical, Lightbulb, Network, Scale, XCircle } from 'lucide-react';

export interface HybridSource {
  name: string;
  type: 'pdf' | 'company' | string;
  mainThesis: string;
}

export interface HybridContradiction {
  id?: string;
  concept: string;
  sourceA: string;
  claimA: string;
  sourceB: string;
  claimB: string;
  semanticConflictScore?: number;
  mechanismConflictTag?: string;
  highConfidence?: boolean;
}

export interface HybridNoveltyProof {
  ideaId: string;
  ideaThesis: string;
  contradictionIds: string[];
  priorArtDistance: number;
  contradictionResolvedScore: number;
  mechanismDifferentiationScore: number;
  interventionValueScore: number;
  falsifiabilityScore: number;
  blockedReasons: string[];
  proofStatus: 'pass' | 'blocked';
  closestPriorArt?: Array<{ title: string; similarity: number; url?: string }>;
  falsificationPlan?: {
    disconfirmingExperiment: string;
    expectedFailureSignal: string;
    requiredAssumptions: string[];
    confoundersToControl: string[];
  };
}

export interface HybridIdea {
  id?: string;
  title?: string;
  summary?: string;
  thesis?: string;
  description?: string;
  mechanism?: string;
  implementation?: string;
  noveltyScore?: number;
}

export interface HybridResultData {
  sources: HybridSource[];
  contradictions: HybridContradiction[];
  contradictionMatrix?: HybridContradiction[];
  novelIdeas: HybridIdea[];
  noveltyProof?: HybridNoveltyProof[];
  noveltyGate?: {
    decision: 'pass' | 'recover' | 'fail';
    threshold: number;
    passingIdeas: number;
    blockedIdeas: number;
    reasons: string[];
  } | null;
  recoveryPlan?: {
    message: string;
    diagnosis: string[];
    suggestedSources: string[];
    suggestedInterventions: string[];
    rerunRecipe: {
      inputDelta: string[];
      expectedEpistemicLift: string;
    };
  } | null;
  structuredApproach?: {
    objective?: string;
    phases?: string[];
    risks?: string[];
  };
}

export interface HybridResultPanelV2Props {
  result: HybridResultData | null;
  stage: 'input' | 'processing' | 'stabilizing' | 'results';
}

function metricToPercent(value: number): string {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function downloadReceipt(result: HybridResultData): void {
  const markdown = [
    '# Scientific Receipt',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Novelty Gate',
    `- Decision: ${result.noveltyGate?.decision || 'unknown'}`,
    `- Threshold: ${result.noveltyGate?.threshold ?? 'n/a'}`,
    `- Passing Ideas: ${result.noveltyGate?.passingIdeas ?? 0}`,
    `- Blocked Ideas: ${result.noveltyGate?.blockedIdeas ?? 0}`,
    '',
    '## Contradiction Matrix',
    ...(result.contradictionMatrix || result.contradictions || []).map(
      (row, index) =>
        `- [${row.id || `row-${index + 1}`}] ${row.concept}: ${row.sourceA} vs ${row.sourceB} (score=${row.semanticConflictScore ?? 'n/a'})`,
    ),
    '',
    '## Novelty Proof',
    ...(result.noveltyProof || []).flatMap((proof, index) => [
      `### Candidate ${index + 1}`,
      `- Thesis: ${proof.ideaThesis}`,
      `- Status: ${proof.proofStatus}`,
      `- Prior-art distance: ${metricToPercent(proof.priorArtDistance)}`,
      `- Contradiction bridge: ${metricToPercent(proof.contradictionResolvedScore)}`,
      `- Falsifiability: ${metricToPercent(proof.falsifiabilityScore)}`,
      `- Intervention value: ${metricToPercent(proof.interventionValueScore)}`,
      `- Block reasons: ${proof.blockedReasons.join(', ') || 'none'}`,
      '',
    ]),
  ].join('\n');

  const payload = {
    generatedAt: new Date().toISOString(),
    result,
  };

  const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const mdBlob = new Blob([markdown], { type: 'text/markdown' });

  const jsonUrl = URL.createObjectURL(jsonBlob);
  const mdUrl = URL.createObjectURL(mdBlob);

  const jsonLink = document.createElement('a');
  jsonLink.href = jsonUrl;
  jsonLink.download = `scientific-receipt-${Date.now()}.json`;
  jsonLink.click();

  const mdLink = document.createElement('a');
  mdLink.href = mdUrl;
  mdLink.download = `scientific-receipt-${Date.now()}.md`;
  mdLink.click();

  URL.revokeObjectURL(jsonUrl);
  URL.revokeObjectURL(mdUrl);
}

export function HybridResultPanelV2({ result, stage }: HybridResultPanelV2Props) {
  const contradictionRows = result?.contradictionMatrix || result?.contradictions || [];

  const gateVisual = useMemo(() => {
    const decision = result?.noveltyGate?.decision;
    if (decision === 'pass') {
      return {
        icon: <CheckCircle2 className="h-5 w-5 text-[var(--lab-accent-moss)]" />,
        label: 'Novelty Gate Passed',
        tone: 'text-[var(--lab-accent-moss)]',
      };
    }
    if (decision === 'recover') {
      return {
        icon: <AlertTriangle className="h-5 w-5 text-[var(--lab-accent-earth)]" />,
        label: 'Recovery Mode Required',
        tone: 'text-[var(--lab-accent-earth)]',
      };
    }
    return {
      icon: <XCircle className="h-5 w-5 text-red-700" />,
      label: 'Novelty Gate Failed',
      tone: 'text-red-700',
    };
  }, [result?.noveltyGate?.decision]);

  if (!result || stage !== 'results') {
    return (
      <div className="lab-empty-state h-full">
        <p className="font-serif text-2xl text-[var(--lab-text-primary)]">Dialectical Synthesis Canvas</p>
        <p className="mt-2 text-sm">Upload sources and run synthesis to render contradiction matrix, novelty proof, and falsification protocol.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2">
      <section className="lab-card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {gateVisual.icon}
            <p className={`lab-section-title !mb-0 ${gateVisual.tone}`}>{gateVisual.label}</p>
          </div>
          <button type="button" className="lab-button-secondary" onClick={() => downloadReceipt(result)}>
            <Download className="h-4 w-4" />
            Scientific Receipt
          </button>
        </div>
        <p className="text-sm text-[var(--lab-text-secondary)]">
          {result.noveltyGate?.reasons?.length
            ? `Decision rationale: ${result.noveltyGate.reasons.join(', ')}`
            : 'No novelty gate rationale returned.'}
        </p>
      </section>

      <section className="lab-card">
        <div className="mb-3 flex items-center gap-2">
          <Scale className="h-4 w-4 text-[var(--lab-accent-earth)]" />
          <p className="lab-section-title !mb-0">Contradiction Matrix ({contradictionRows.length})</p>
        </div>
        <div className="space-y-2">
          {contradictionRows.map((item, index) => (
            <article key={`${item.id || item.concept}-${index}`} className="lab-card-interactive !p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--lab-text-primary)]">{item.concept}</p>
                <span className="lab-chip-mono">
                  {(item.highConfidence ? 'high' : 'candidate')} · {(item.semanticConflictScore ?? 0).toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--lab-text-secondary)]">{item.sourceA}: {item.claimA}</p>
              <p className="text-xs text-[var(--lab-text-secondary)]">{item.sourceB}: {item.claimB}</p>
            </article>
          ))}
          {contradictionRows.length === 0 ? <p className="text-sm text-[var(--lab-text-tertiary)]">No contradiction matrix rows returned.</p> : null}
        </div>
      </section>

      <section className="lab-card">
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-[var(--lab-accent-moss)]" />
          <p className="lab-section-title !mb-0">Novelty Proof Cards ({result.noveltyProof?.length || 0})</p>
        </div>
        <div className="grid gap-3">
          {(result.noveltyProof || []).map((proof) => (
            <article key={proof.ideaId} className="lab-card-interactive">
              <div className="flex items-start justify-between gap-3">
                <p className="font-serif text-xl text-[var(--lab-text-primary)]">{proof.ideaThesis}</p>
                <span className="lab-chip-mono" data-state={proof.proofStatus}>{proof.proofStatus}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--lab-text-secondary)] md:grid-cols-5">
                <div className="lab-kpi-card"><p>Prior Art Distance</p><p className="font-semibold text-[var(--lab-text-primary)]">{metricToPercent(proof.priorArtDistance)}</p></div>
                <div className="lab-kpi-card"><p>Contradiction Bridge</p><p className="font-semibold text-[var(--lab-text-primary)]">{metricToPercent(proof.contradictionResolvedScore)}</p></div>
                <div className="lab-kpi-card"><p>Mechanism Diff.</p><p className="font-semibold text-[var(--lab-text-primary)]">{metricToPercent(proof.mechanismDifferentiationScore)}</p></div>
                <div className="lab-kpi-card"><p>Intervention Value</p><p className="font-semibold text-[var(--lab-text-primary)]">{metricToPercent(proof.interventionValueScore)}</p></div>
                <div className="lab-kpi-card"><p>Falsifiability</p><p className="font-semibold text-[var(--lab-text-primary)]">{metricToPercent(proof.falsifiabilityScore)}</p></div>
              </div>

              {proof.closestPriorArt?.length ? (
                <div className="mt-3">
                  <p className="lab-section-title !mb-1">Closest prior art</p>
                  <ul className="space-y-1 text-xs text-[var(--lab-text-secondary)]">
                    {proof.closestPriorArt.slice(0, 3).map((entry) => (
                      <li key={`${proof.ideaId}-${entry.title}`}>
                        {entry.title} ({Math.round(entry.similarity > 1 ? entry.similarity : entry.similarity * 100)}% overlap)
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {proof.blockedReasons.length ? (
                <p className="mt-3 text-xs text-[var(--lab-accent-earth)]">Blocked reasons: {proof.blockedReasons.join(', ')}</p>
              ) : null}
            </article>
          ))}

          {(result.noveltyProof || []).length === 0 ? (
            <p className="text-sm text-[var(--lab-text-tertiary)]">No novelty proof cards returned for this run.</p>
          ) : null}
        </div>
      </section>

      <section className="lab-card">
        <div className="mb-3 flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-[var(--lab-accent-earth)]" />
          <p className="lab-section-title !mb-0">Falsification Protocol</p>
        </div>
        <div className="space-y-3">
          {(result.noveltyProof || []).map((proof) => (
            <article key={`falsifier-${proof.ideaId}`} className="lab-card-interactive !p-3">
              <p className="text-sm font-semibold text-[var(--lab-text-primary)]">{proof.ideaThesis}</p>
              <p className="mt-1 text-xs text-[var(--lab-text-secondary)]">
                <strong>Disconfirming experiment:</strong> {proof.falsificationPlan?.disconfirmingExperiment || 'Not provided'}
              </p>
              <p className="text-xs text-[var(--lab-text-secondary)]">
                <strong>Failure signal:</strong> {proof.falsificationPlan?.expectedFailureSignal || 'Not provided'}
              </p>
            </article>
          ))}
          {(result.noveltyProof || []).length === 0 ? (
            <p className="text-sm text-[var(--lab-text-tertiary)]">No falsification protocol available.</p>
          ) : null}
        </div>
      </section>

      {result.recoveryPlan ? (
        <section className="lab-card border-[rgba(139,94,60,0.4)] bg-[rgba(158,126,107,0.08)]">
          <div className="mb-3 flex items-center gap-2">
            <Network className="h-4 w-4 text-[var(--lab-accent-earth)]" />
            <p className="lab-section-title !mb-0">Recovery Plan</p>
          </div>
          <p className="text-sm text-[var(--lab-text-secondary)]">{result.recoveryPlan.message}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className="lab-section-title !mb-1">Diagnosis</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--lab-text-secondary)]">
                {result.recoveryPlan.diagnosis.map((line, index) => (
                  <li key={`diag-${index}`}>{line}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="lab-section-title !mb-1">Rerun recipe</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--lab-text-secondary)]">
                {result.recoveryPlan.rerunRecipe.inputDelta.map((line, index) => (
                  <li key={`delta-${index}`}>{line}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-[var(--lab-text-tertiary)]">{result.recoveryPlan.rerunRecipe.expectedEpistemicLift}</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
