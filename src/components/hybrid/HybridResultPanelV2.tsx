'use client';

import { Lightbulb, Network, Scale } from 'lucide-react';

export interface HybridSource {
  name: string;
  type: 'pdf' | 'company' | string;
  mainThesis: string;
}

export interface HybridContradiction {
  concept: string;
  sourceA: string;
  claimA: string;
  sourceB: string;
  claimB: string;
}

export interface HybridIdea {
  title?: string;
  summary?: string;
  mechanism?: string;
  implementation?: string;
  noveltyScore?: number;
}

export interface HybridResultData {
  sources: HybridSource[];
  contradictions: HybridContradiction[];
  novelIdeas: HybridIdea[];
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

export function HybridResultPanelV2({ result, stage }: HybridResultPanelV2Props) {
  if (!result || stage !== 'results') {
    return (
      <div className="lab-empty-state h-full">
        <p className="font-serif text-2xl text-[var(--lab-text-primary)]">Dialectical Synthesis Canvas</p>
        <p className="mt-2 text-sm">Upload sources and run synthesis to render contradictions, hypotheses, and structured plans.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2">
      <section className="lab-card">
        <div className="mb-3 flex items-center gap-2">
          <Scale className="h-4 w-4 text-[var(--lab-accent-earth)]" />
          <p className="lab-section-title !mb-0">Conceptual Contradictions ({result.contradictions.length})</p>
        </div>
        <div className="space-y-2">
          {result.contradictions.map((item, index) => (
            <article key={`${item.concept}-${index}`} className="lab-card-interactive !p-3">
              <p className="text-sm font-semibold text-[var(--lab-text-primary)]">{item.concept}</p>
              <p className="mt-1 text-xs text-[var(--lab-text-secondary)]">{item.sourceA}: {item.claimA}</p>
              <p className="text-xs text-[var(--lab-text-secondary)]">{item.sourceB}: {item.claimB}</p>
            </article>
          ))}
          {result.contradictions.length === 0 ? <p className="text-sm text-[var(--lab-text-tertiary)]">No contradictions surfaced.</p> : null}
        </div>
      </section>

      <section className="lab-card">
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-[var(--lab-accent-moss)]" />
          <p className="lab-section-title !mb-0">Novel Idea Set ({result.novelIdeas.length})</p>
        </div>
        <div className="grid gap-3">
          {result.novelIdeas.map((idea, index) => (
            <article key={`${idea.title || 'idea'}-${index}`} className="lab-card-interactive">
              <p className="font-serif text-xl text-[var(--lab-text-primary)]">{idea.title || `Hypothesis ${index + 1}`}</p>
              <p className="mt-2 text-sm text-[var(--lab-text-secondary)]">{idea.summary || idea.mechanism || 'Summary unavailable.'}</p>
              {typeof idea.noveltyScore === 'number' ? (
                <p className="mt-2 text-xs text-[var(--lab-text-tertiary)]">Novelty score: {(idea.noveltyScore * 100).toFixed(0)}%</p>
              ) : null}
            </article>
          ))}
          {result.novelIdeas.length === 0 ? <p className="text-sm text-[var(--lab-text-tertiary)]">No novel ideas returned.</p> : null}
        </div>
      </section>

      <section className="lab-card">
        <div className="mb-3 flex items-center gap-2">
          <Network className="h-4 w-4 text-[var(--lab-accent-earth)]" />
          <p className="lab-section-title !mb-0">Structured Approach</p>
        </div>
        <p className="text-sm text-[var(--lab-text-secondary)]">{result.structuredApproach?.objective || 'No explicit objective returned.'}</p>
        {result.structuredApproach?.phases?.length ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--lab-text-secondary)]">
            {result.structuredApproach.phases.map((phase, index) => (
              <li key={`${phase}-${index}`}>{phase}</li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
