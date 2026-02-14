import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  convertPDFToMarkdown: vi.fn(),
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
import { convertPDFToMarkdown } from '@/lib/extractors/pdf-to-markdown';

const convertPDFToMarkdownMock = vi.mocked(convertPDFToMarkdown);

describe('scientific ingestion pipeline prose fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    convertPDFToMarkdownMock.mockResolvedValue('Results: precision/recall=84.5/79.2, F1 ranged 81-86, latency 12.3 ms.');
  });

  it('extracts numeric points from prose when tables are unavailable', async () => {
    const result = await runIngestionPipeline(new ArrayBuffer(8), 'paper.pdf', 'user-1');

    expect(saveDataPoints).toHaveBeenCalled();
    expect(result.dataPoints.length).toBeGreaterThanOrEqual(2);
    expect(result.warnings.join(' ')).toContain('prose numeric extraction fallback');
    expect(result.dataPoints.some((dp: any) => dp.metadata?.extractionVersion === '2.2.0')).toBe(true);
  });

  it('suppresses bibliographic-only numerics in prose fallback', async () => {
    convertPDFToMarkdownMock.mockResolvedValue(
      'World Journal of Advanced Research and Reviews, 2025, 26(02), 874-879. DOI 10.30574/wjarr.2025.26.2.1521. Creative Commons Attribution License 4.0.',
    );

    const result = await runIngestionPipeline(new ArrayBuffer(8), 'paper.pdf', 'user-1');

    expect(result.dataPoints.length).toBe(0);
    expect(result.warnings.join(' ')).toContain('Fewer than 2 numeric data points extracted');
  });

  it('uses weak prose lane when metric-scored numbers are insufficient', async () => {
    convertPDFToMarkdownMock.mockResolvedValue(
      'System observed values 14 and 18 across checkpoints; sequence remained stable under load.',
    );

    const result = await runIngestionPipeline(new ArrayBuffer(8), 'paper.pdf', 'user-1');

    expect(result.dataPoints.length).toBeGreaterThanOrEqual(2);
    expect(result.dataPoints.some((dp: any) => dp.metadata?.extractionLane === 'weak')).toBe(true);
    expect(result.warnings.join(' ')).toContain('lane=weak');
  });

  it('suppresses section ordinals without metric context', async () => {
    convertPDFToMarkdownMock.mockResolvedValue(
      '1. Introduction ... 5. Ethical and Implementation Considerations ... 6. Conclusion ...',
    );

    const result = await runIngestionPipeline(new ArrayBuffer(8), 'paper.pdf', 'user-1');

    expect(result.dataPoints.length).toBe(0);
    expect(result.warnings.join(' ')).toContain('Fewer than 2 numeric data points extracted');
  });

  it('suppresses citation/reference numerics', async () => {
    convertPDFToMarkdownMock.mockResolvedValue(
      'References [1] Adenekan (2024)... [2] Esposito (2024)... Available at SSRN 4859958. International Journal 2(4), 8-44.',
    );

    const result = await runIngestionPipeline(new ArrayBuffer(8), 'paper.pdf', 'user-1');

    expect(result.dataPoints.length).toBe(0);
    expect(result.warnings.join(' ')).toContain('Fewer than 2 numeric data points extracted');
  });
});
