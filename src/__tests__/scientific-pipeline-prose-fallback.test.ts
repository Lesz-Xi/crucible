import { describe, expect, it, vi } from 'vitest';

const saveDataPoints = vi.fn(async (rows: any[]) => rows.map((r, i) => ({ id: `d-${i + 1}`, ...r })));

vi.mock('@/lib/db/scientific-data-repository', () => ({
  ScientificDataRepository: class {
    createIngestion = async () => ({ id: 'ing-2', status: 'pending' });
    updateIngestionStatus = async () => undefined;
    saveExtractedTables = async () => [];
    saveDataPoints = saveDataPoints;
    findComputeRunByHash = async () => null;
    saveComputeRun = async (row: any) => ({ id: 'c-2', ...row });
  },
}));

vi.mock('@/lib/extractors/table-extractor', () => ({
  extractTablesFromPDF: async () => [],
  filterTrustedTables: () => ({ trusted: [], flagged: [] }),
}));

vi.mock('@/lib/extractors/metadata-extractor', () => ({
  extractMetadataFromPDF: async () => ({ pageCount: 1, title: 'Sample' }),
}));

vi.mock('@/lib/extractors/pdf-to-markdown', () => ({
  convertPDFToMarkdown: async () => 'Results: precision/recall=84.5/79.2, F1 ranged 81-86, latency 12.3 ms.',
}));

vi.mock('@/lib/compute/scientific-compute-engine', () => ({
  runFullAnalysis: async () => ({
    regression: { slope: 1.5, intercept: 0, rSquared: 0.8 },
    trend: { direction: 'increasing' },
    anomalies: [],
    deterministicHash: 'hash-prose',
  }),
}));

vi.mock('@/lib/compute/graph-reasoning-engine', () => ({
  buildReasoningGraph: () => ({ nodes: [], edges: [], claims: [], summary: 'ok' }),
}));

import { runIngestionPipeline } from '@/lib/pipeline/ingestion-pipeline';

describe('scientific ingestion pipeline prose fallback', () => {
  it('extracts numeric points from prose when tables are unavailable', async () => {
    const result = await runIngestionPipeline(new ArrayBuffer(8), 'paper.pdf', 'user-1');

    expect(saveDataPoints).toHaveBeenCalled();
    expect(result.dataPoints.length).toBeGreaterThanOrEqual(2);
    expect(result.warnings.join(' ')).toContain('prose numeric extraction fallback');
    expect(result.dataPoints.some((dp: any) => dp.metadata?.extractionVersion === '2.1.0')).toBe(true);
  });
});
