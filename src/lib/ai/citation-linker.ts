import { EvidenceSnippet } from "@/types";
import { PagedText } from "@/lib/extractors/pdf-extractor";

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function overlapScore(a: string, b: string): number {
  const aWords = new Set(normalize(a).split(" ").filter(Boolean));
  const bWords = new Set(normalize(b).split(" ").filter(Boolean));
  if (aWords.size === 0 || bWords.size === 0) return 0;
  let overlap = 0;
  for (const word of aWords) {
    if (bWords.has(word)) overlap++;
  }
  return overlap / aWords.size;
}

export function findSnippetPage(
  snippet: string,
  pagedText: PagedText
): { page: number; offset: number; confidence: number } | null {
  const target = normalize(snippet);
  if (!target) return null;

  let best: { page: number; offset: number; confidence: number } | null = null;
  for (const page of pagedText.pageMap) {
    const pageText = normalize(page.text || "");
    if (!pageText) continue;

    const exactOffset = pageText.indexOf(target);
    if (exactOffset >= 0) {
      return { page: page.page, offset: exactOffset, confidence: 1 };
    }

    const score = overlapScore(target, pageText);
    if (!best || score > best.confidence) {
      best = { page: page.page, offset: 0, confidence: score };
    }
  }

  if (!best || best.confidence < 0.35) return null;
  return best;
}

export function linkSnippetsToPDF(
  snippets: string[],
  pagedText?: PagedText,
  sourceName?: string
): EvidenceSnippet[] {
  return snippets.map((snippet) => {
    const located = pagedText ? findSnippetPage(snippet, pagedText) : null;
    return {
      snippet,
      page: located?.page ?? null,
      offset: located?.offset ?? null,
      confidence: located?.confidence ?? 0,
      sourceName,
    };
  });
}
