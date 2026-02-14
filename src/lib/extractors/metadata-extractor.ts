// =============================================================
// Automated Scientist: Metadata Extractor
// Phase B — Extraction Pipeline
// Two-pass extraction: PDF metadata dict + regex enrichment.
// =============================================================

import "./polyfill";
import { extractText, getMeta } from "unpdf";
import { buildPdfDocumentOptions, loadPdfJs } from "./pdfjs-loader";
import type { DocumentMetadata } from "../../types/scientific-data";

// ── Regex Patterns ───────────────────────────────────────────

const DOI_PATTERN = /\b(10\.\d{4,9}\/[^\s,;]+)/i;
const ABSTRACT_PATTERN = /(?:abstract|summary)\s*[:\-]?\s*([\s\S]{50,2000}?)(?=\n\s*(?:keywords|introduction|1\.|1\s|background|\n\n))/i;
const AUTHORS_SEPARATOR = /[,;]\s*|\band\b/i;
const KEYWORDS_PATTERN = /(?:keywords?|key\s*words?|index\s+terms?)\s*[:\-]?\s*([^\n]{10,500})/i;
const DATE_PATTERN = /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/i;
const JOURNAL_PATTERN = /(?:journal|published\s+in|proceedings\s+of)\s*[:\-]?\s*([^\n]{5,200})/i;

// ── Core Logic ───────────────────────────────────────────────

/**
 * Extract DOI from text. Returns first match.
 */
function extractDOI(text: string): string | undefined {
    const match = text.match(DOI_PATTERN);
    return match ? match[1].replace(/[.)]+$/, "") : undefined;
}

/**
 * Extract abstract from text (best-effort).
 */
function extractAbstract(text: string): string | undefined {
    const match = text.match(ABSTRACT_PATTERN);
    return match ? match[1].trim() : undefined;
}

/**
 * Extract keywords from text.
 */
function extractKeywords(text: string): string[] | undefined {
    const match = text.match(KEYWORDS_PATTERN);
    if (!match) return undefined;

    return match[1]
        .split(/[,;]/)
        .map((kw) => kw.trim())
        .filter((kw) => kw.length > 1 && kw.length < 100);
}

/**
 * Extract publication date from text.
 */
function extractDate(text: string): string | undefined {
    const match = text.match(DATE_PATTERN);
    return match ? match[1] : undefined;
}

/**
 * Extract journal name from text.
 */
function extractJournal(text: string): string | undefined {
    const match = text.match(JOURNAL_PATTERN);
    return match ? match[1].trim() : undefined;
}

/**
 * Parse author block from metadata or first page text.
 * Handles "LastName, FirstName" and "FirstName LastName" formats.
 */
function parseAuthors(authorStr: string): string[] {
    if (!authorStr || authorStr.trim().length < 2) return [];

    return authorStr
        .split(AUTHORS_SEPARATOR)
        .map((a) => a.trim())
        .filter((a) => {
            // Filter out very short or obviously non-author strings
            if (a.length < 2 || a.length > 100) return false;
            // Filter out strings that are mostly numbers
            if (/^\d+$/.test(a)) return false;
            return true;
        });
}

// ── Public API ───────────────────────────────────────────────

/**
 * Extract metadata from a PDF buffer.
 * Pass 1: PDF metadata dictionary (title, author, keywords).
 * Pass 2: Regex enrichment from first 2 pages (DOI, abstract, date, journal).
 *
 * @param buffer - PDF file as ArrayBuffer
 * @returns DocumentMetadata with best-effort extracted fields
 */
export async function extractMetadataFromPDF(
    buffer: ArrayBuffer
): Promise<DocumentMetadata> {
    try {
        const pdfjsLib = await loadPdfJs();

        const loadingTask = pdfjsLib.getDocument(buildPdfDocumentOptions(buffer));
        const pdf = await loadingTask.promise;

        // ── Pass 1: PDF Metadata Dict ──
        const meta = await pdf.getMetadata();
        const info = (meta?.info ?? {}) as Record<string, unknown>;

        const result: DocumentMetadata = {
            title: (info.Title as string) || undefined,
            authors: info.Author ? parseAuthors(info.Author as string) : undefined,
            keywords: info.Keywords
                ? (info.Keywords as string).split(/[,;]/).map((k: string) => k.trim()).filter(Boolean)
                : undefined,
            pageCount: pdf.numPages,
        };

        // ── Pass 2: Regex Enrichment from first 2 pages ──
        const pagesToScan = Math.min(2, pdf.numPages);
        let firstPagesText = "";

        for (let pageNum = 1; pageNum <= pagesToScan; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str || "")
                .join(" ");
            firstPagesText += pageText + "\n\n";
        }

        // Enrich with regex-extracted fields
        if (!result.title && firstPagesText.length > 0) {
            // Heuristic: first substantial line is often the title
            const lines = firstPagesText.split("\n").filter((l) => l.trim().length > 10);
            if (lines.length > 0) {
                const candidate = lines[0].trim();
                if (candidate.length < 300) {
                    result.title = candidate;
                }
            }
        }

        result.doi = result.doi || extractDOI(firstPagesText);
        result.abstract = result.abstract || extractAbstract(firstPagesText);
        result.publicationDate = result.publicationDate || extractDate(firstPagesText);
        result.journal = result.journal || extractJournal(firstPagesText);

        if (!result.keywords || result.keywords.length === 0) {
            result.keywords = extractKeywords(firstPagesText);
        }

        if (!result.authors || result.authors.length === 0) {
            // Try to detect author block between title and abstract
            const titleEnd = firstPagesText.indexOf(result.title || "") + (result.title?.length || 0);
            const abstractStart = firstPagesText.toLowerCase().indexOf("abstract");
            if (titleEnd > 0 && abstractStart > titleEnd) {
                const authorBlock = firstPagesText.slice(titleEnd, abstractStart).trim();
                if (authorBlock.length > 3 && authorBlock.length < 500) {
                    result.authors = parseAuthors(authorBlock);
                }
            }
        }

        return result;
    } catch (error) {
        console.warn("[MetadataExtractor] Falling back to unpdf metadata/text extraction:", error);
        const bytes = new Uint8Array(buffer);
        const [meta, textResult] = await Promise.all([
            getMeta(bytes).catch(() => null),
            extractText(bytes, { mergePages: true }).catch(() => null),
        ]);

        const info = (meta?.info ?? {}) as Record<string, unknown>;
        const text = typeof textResult?.text === "string" ? textResult.text : "";

        return {
            title: (info.Title as string) || undefined,
            authors: info.Author ? parseAuthors(String(info.Author)) : undefined,
            doi: extractDOI(text),
            abstract: extractAbstract(text),
            journal: extractJournal(text),
            publicationDate: extractDate(text),
            keywords: extractKeywords(text),
            pageCount: textResult?.totalPages || undefined,
        };
    }
}
