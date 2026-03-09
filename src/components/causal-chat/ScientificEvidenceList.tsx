'use client';

import { useEffect, useState } from 'react';
import { Database, FileText, ShieldCheck, Microscope } from 'lucide-react';
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

    void fetchEvidence();
  }, []);

  return (
    <section className="rail-section">
      <div className="rail-section-head">
        <Microscope className="h-3 w-3" />
        <span>Scientific Evidence</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-10 rounded-[8px] border border-[var(--lab-border)] bg-[var(--bg-2)]" />
          <div className="h-10 rounded-[8px] border border-[var(--lab-border)] bg-[var(--bg-2)]" />
        </div>
      ) : error ? (
        <p className="text-xs text-[var(--lab-error)]">{error}</p>
      ) : evidence.length === 0 ? (
        <div className="unavail">
          <strong>Unavailable</strong>
          No recent scientific evidence is available for this workspace.
        </div>
      ) : (
        <div>
          {evidence.map((item) => (
            <div key={item.ingestionId} className="evidence-file">
              <div className="file-icon">
                <FileText className="h-3 w-3" />
              </div>
              <div className="file-info">
                <div className="file-name" title={item.fileName}>{item.fileName}</div>
                <div className="file-meta">
                  <span className="inline-flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    {item.dataPointCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    {item.trustedTableCount}
                  </span>
                  <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
