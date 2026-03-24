import { describe, expect, it, vi } from 'vitest';

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: () => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: async () => ({
        getTextContent: async () => ({
          items: [
            // Header row (y=100)
            { str: 'X', transform: [1, 0, 0, 1, 10, 100], width: 10, height: 12, fontName: 'F1' },
            { str: 'Y', transform: [1, 0, 0, 1, 120, 100], width: 10, height: 12, fontName: 'F1' },
            // Row 1 (y=120)
            { str: '1', transform: [1, 0, 0, 1, 10, 120], width: 8, height: 12, fontName: 'F1' },
            { str: '2', transform: [1, 0, 0, 1, 120, 120], width: 8, height: 12, fontName: 'F1' },
            // Row 2 (y=140)
            { str: '2', transform: [1, 0, 0, 1, 10, 140], width: 8, height: 12, fontName: 'F1' },
            { str: '4', transform: [1, 0, 0, 1, 120, 140], width: 8, height: 12, fontName: 'F1' },
          ],
        }),
      }),
    }),
  }),
}));

import { extractTablesFromPDF, filterTrustedTables } from '../table-extractor';

describe('table-extractor', () => {
  it('extracts a basic table with confidence score', async () => {
    const buffer = new ArrayBuffer(8);
    const tables = await extractTablesFromPDF(buffer);

    expect(tables.length).toBeGreaterThan(0);
    expect(tables[0].headers.length).toBeGreaterThanOrEqual(2);
    expect(tables[0].rows.length).toBeGreaterThanOrEqual(2);
    expect(tables[0].confidence).toBeGreaterThan(0);
    expect(tables[0].confidence).toBeLessThanOrEqual(1);
  });

  it('splits trusted vs flagged by threshold', () => {
    const result = filterTrustedTables(
      [
        { pageNumber: 1, tableIndex: 0, headers: ['A'], rows: [['1']], confidence: 0.8, parseStatus: 'parsed', qaFlags: [] },
        { pageNumber: 1, tableIndex: 1, headers: ['B'], rows: [['2']], confidence: 0.4, parseStatus: 'partial', qaFlags: [] },
      ],
      0.6,
    );

    expect(result.trusted).toHaveLength(1);
    expect(result.flagged).toHaveLength(1);
  });
});
