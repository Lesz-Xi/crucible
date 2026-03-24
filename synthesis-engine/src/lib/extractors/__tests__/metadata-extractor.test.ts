import { describe, expect, it, vi } from 'vitest';

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: () => ({
    promise: Promise.resolve({
      numPages: 1,
      getMetadata: async () => ({
        info: {
          Title: 'Causal Systems Paper',
          Author: 'Alice Doe, Bob Roe',
          Keywords: 'causality, intervention',
        },
      }),
      getPage: async () => ({
        getTextContent: async () => ({
          items: [
            { str: 'Abstract: This paper studies intervention effects in systems.' },
            { str: 'DOI 10.1234/abcd.2026.01' },
            { str: 'Keywords: causality, intervention, graph' },
          ],
        }),
      }),
    }),
  }),
}));

import { extractMetadataFromPDF } from '../metadata-extractor';

describe('metadata-extractor', () => {
  it('extracts title, authors, doi, and keywords', async () => {
    const result = await extractMetadataFromPDF(new ArrayBuffer(8));

    expect(result.title).toContain('Causal');
    expect(result.authors?.length).toBeGreaterThan(0);
    expect(result.doi).toContain('10.1234/abcd.2026.01');
    expect(result.keywords?.length).toBeGreaterThan(0);
    expect(result.pageCount).toBe(1);
  });
});
