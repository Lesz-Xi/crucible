import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  Table,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ScientificAnalysisResponse,
  ScientificNumericEvidenceItem,
} from '@/lib/science/scientific-analysis-service';

interface ScientificTableCardProps {
  analysis: ScientificAnalysisResponse;
  className?: string;
}

function EvidenceRow({ item }: { item: ScientificNumericEvidenceItem }) {
  return (
    <div className="scientific-card-evidence-row">
      <span className="scientific-card-evidence-value">{item.value}</span>
      <span className="scientific-card-evidence-context" title={item.contextSnippet}>
        {item.contextSnippet || 'No contextual excerpt available.'}
      </span>
    </div>
  );
}

export function ScientificTableCard({ analysis, className }: ScientificTableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { summary, numericEvidence, warnings, observability } = analysis;

  const metrics = useMemo(
    () => numericEvidence.filter((item) => item.source === 'table'),
    [numericEvidence]
  );
  const prose = useMemo(
    () => numericEvidence.filter((item) => item.source === 'prose'),
    [numericEvidence]
  );

  const summaryText = `${summary.trustedTableCount}/${summary.tableCount} trusted tables • ${summary.dataPointCount} extracted points • ${prose.length} prose claims`;
  const statusTone =
    analysis.status === 'failed' ? 'is-failed' : analysis.status === 'partial' ? 'is-partial' : 'is-completed';
  const primaryWarning = warnings[0];

  return (
    <section className={cn('scientific-card', className)}>
      <button
        type="button"
        className="scientific-card-toggle"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
      >
        <div className="scientific-card-leading">
          <div className="scientific-card-icon">
            <FileText className="h-4 w-4" />
          </div>
          <div className="scientific-card-heading">
            <span className="scientific-card-kicker">Scientific Artifact</span>
            <div className="scientific-card-title-row">
              <h4 className="scientific-card-title">{observability.fileName}</h4>
              <span className={cn('scientific-card-status', statusTone)}>{analysis.status}</span>
            </div>
            <p className="scientific-card-summary">{summaryText}</p>
            <div className="scientific-card-overview">
              <span className="scientific-card-overview-item">{summary.trustedTableCount}/{summary.tableCount} trusted tables</span>
              <span className="scientific-card-overview-item">{summary.dataPointCount} points restored</span>
              {analysis.provenance?.methodVersion ? (
                <span className="scientific-card-overview-item">method {analysis.provenance.methodVersion}</span>
              ) : null}
            </div>
            {primaryWarning ? (
              <div className="scientific-card-alert">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{primaryWarning}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="scientific-card-meta">
          <span className="scientific-card-meta-chip">
            <Table className="h-3.5 w-3.5" />
            {summary.tableCount} tables
          </span>
          <span className="scientific-card-meta-chip">
            <Database className="h-3.5 w-3.5" />
            {summary.dataPointCount} points
          </span>
          {warnings.length > 0 ? (
            <span className="scientific-card-meta-chip is-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              {warnings.length} warnings
            </span>
          ) : null}
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>

      {isExpanded ? (
        <div className="scientific-card-panel">
          {analysis.provenance ? (
            <div className="scientific-card-provenance">
              <div className="scientific-card-section-head">
                <Database className="h-3.5 w-3.5" />
                <span>Lineage</span>
              </div>
              <p className="scientific-card-provenance-copy">
                Ingestion {analysis.provenance.ingestionId.slice(0, 8)} • {analysis.provenance.sourceTableIds.length} source tables • {analysis.provenance.dataPointIds.length} data points.
              </p>
            </div>
          ) : null}

          {warnings.length > 0 ? (
            <div className="scientific-card-section is-warning">
              <div className="scientific-card-section-head">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Warnings</span>
              </div>
              <ul className="scientific-card-warning-list">
                {warnings.slice(0, 4).map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="scientific-card-grid">
            {metrics.length > 0 ? (
              <div className="scientific-card-section">
                <div className="scientific-card-section-head">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Table Metrics</span>
                </div>
                <div className="scientific-card-evidence-list">
                  {metrics.slice(0, 4).map((item, index) => (
                    <EvidenceRow key={`metric-${index}`} item={item} />
                  ))}
                </div>
              </div>
            ) : null}

            {prose.length > 0 ? (
              <div className="scientific-card-section">
                <div className="scientific-card-section-head">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Prose Claims</span>
                </div>
                <div className="scientific-card-evidence-list">
                  {prose.slice(0, 3).map((item, index) => (
                    <EvidenceRow key={`prose-${index}`} item={item} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="scientific-card-footer">
            <span className="scientific-card-footer-chip">Ingestion {analysis.ingestionId.slice(0, 8)}</span>
            <span className="scientific-card-footer-chip">{Math.round(observability.durationMs)} ms</span>
            <span className="scientific-card-footer-chip">{observability.warningsCount} warnings observed</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
