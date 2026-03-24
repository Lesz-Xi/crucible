'use client';

import { useEffect, useState } from 'react';
import { FileText, Database, ShieldCheck, Microscope } from 'lucide-react';
import type { EpistemicScientificEvidence } from '@/lib/science/epistemic-data-bridge';
import { formatDistanceToNow } from 'date-fns';

export function ScientificEvidenceList() {
  const [evidence, setEvidence] = useState<EpistemicScientificEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvidence() {
      try {
        const response = await fetch('/api/epistemic/scientific-evidence');
        if (!response.ok) throw new Error('Failed to load evidence');
        const data = await response.json();
        setEvidence(data.evidence);
      } catch (err) {
        console.error('Error fetching scientific evidence:', err);
        setError('Could not load recent evidence');
      } finally {
        setLoading(false);
      }
    }

    fetchEvidence();
  }, []);

  if (loading) {
    return (
      <div className="lab-metric-tile animate-pulse">
        <div className="h-4 w-24 bg-[var(--lab-bg-elevated)] rounded mb-2"></div>
        <div className="h-10 bg-[var(--lab-bg-elevated)] rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lab-metric-tile">
        <p className="text-xs text-red-500">{error}</p>
      </div>
    );
  }

  if (evidence.length === 0) {
    return null;
  }

  return (
    <div className="lab-metric-tile">
      <div className="mb-2 flex items-center gap-2">
        <Microscope className="h-4 w-4 text-[var(--lab-accent-violet)]" />
        <p className="lab-section-title !mb-0">Scientific Evidence</p>
      </div>
      
      <div className="space-y-2">
        {evidence.map((item) => (
          <div 
            key={item.ingestionId}
            className="group block rounded-md border border-[var(--lab-border)] p-2 transition hover:bg-[var(--lab-bg-elevated)]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <FileText className="h-3 w-3 flex-shrink-0 text-[var(--lab-text-tertiary)]" />
                <p className="truncate text-xs font-medium text-[var(--lab-text-primary)]" title={item.fileName}>
                  {item.fileName}
                </p>
              </div>
              <span className="flex-shrink-0 text-[10px] text-[var(--lab-text-tertiary)]">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </span>
            </div>

            <div className="mt-2 flex gap-3 text-[10px] text-[var(--lab-text-secondary)]">
              <div className="flex items-center gap-1" title="Data Points Extracted">
                <Database className="h-3 w-3" />
                <span>{item.dataPointCount}</span>
              </div>
              <div className="flex items-center gap-1" title="High Confidence Tables">
                <ShieldCheck className="h-3 w-3" />
                <span>{item.trustedTableCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
