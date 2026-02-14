import { describe, expect, it, vi } from 'vitest';

const saveExtractedTables = vi.fn(async (rows: any[]) =>
  rows.map((r, i) => ({ id: `t-${i + 1}`, ...r })),
);
const saveDataPoints = vi.fn(async (rows: any[]) =>
  rows.map((r, i) => ({ id: `d-${i + 1}`, ...r })),
);
const saveComputeRun = vi.fn(async (row: any) => ({ id: 'c-1', ...row }));

vi.mock('@/lib/db/scientific-data-repository', () => ({
  ScientificDataRepository: class {
    createIngestion = async () => ({ id: 'ing-1', status: 'pending' });
    updateIngestionStatus = async () => undefined;
    saveExtractedTables = saveExtractedTables;
    saveDataPoints = saveDataPoints;
    findComputeRunByHash = async () => null;
    saveComputeRun = saveComputeRun;
  },
}));

vi.mock('@/lib/extractors/table-extractor', () => ({
  extractTablesFromPDF: async () => [
    {
      pageNumber: 1,
      tableIndex: 0,
      headers: ['x', 'y'],
      rows: [['1', '2'], ['2', '4']],
      confidence: 0.9,
      parseStatus: 'parsed',
      qaFlags: [],
    },
  ],
  filterTrustedTables: (tables: any[]) => ({ trusted: tables, flagged: [] }),
}));

vi.mock('@/lib/extractors/metadata-extractor', () => ({
  extractMetadataFromPDF: async () => ({ pageCount: 1, title: 'Sample' }),
}));

vi.mock('@/lib/extractors/pdf-to-markdown', () => ({
  convertPDFToMarkdown: async () => '# Sample',
}));

vi.mock('@/lib/compute/scientific-compute-engine', () => ({
  runFullAnalysis: async () => ({
    regression: { slope: 2, intercept: 0, rSquared: 1 },
    trend: { direction: 'increasing' },
    anomalies: [],
    deterministicHash: 'hash-1',
  }),
}));

vi.mock('@/lib/compute/graph-reasoning-engine', () => ({
  buildReasoningGraph: () => ({ nodes: [], edges: [], claims: [], summary: 'ok' }),
}));

import { runIngestionPipeline } from '@/lib/pipeline/ingestion-pipeline';

describe('scientific ingestion pipeline', () => {
  it('runs extract -> compute -> persist flow', async () => {
    const result = await runIngestionPipeline(new ArrayBuffer(8), 'paper.pdf', 'user-1');

    expect(result.ingestion.id).toBe('ing-1');
    expect(result.tables.trusted.length).toBeGreaterThan(0);
    expect(result.dataPoints.length).toBeGreaterThan(0);
    expect(result.computeRun).toBeTruthy();
    expect(saveExtractedTables).toHaveBeenCalled();
    expect(saveDataPoints).toHaveBeenCalled();
    expect(saveComputeRun).toHaveBeenCalled();
  });
});
