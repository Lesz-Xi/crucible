// =============================================================
// Automated Scientist: PDF-to-Markdown Converter
// Phase B — Extraction Pipeline
// Best-effort readability artifact (non-canonical per v2 plan).
// =============================================================

import "./polyfill";
import { extractText } from "unpdf";
import { buildPdfDocumentOptions, loadPdfJs } from "./pdfjs-loader";

// ── Types ────────────────────────────────────────────────────

interface AnnotatedTextItem {
    str: string;
    x: number;
    y: number;
    fontSize: number;
    fontName: string;
}

// ── Configuration ────────────────────────────────────────────

const HEADING_FONT_RATIO = 1.3;  // Min font size ratio vs body to be a heading
const LINE_Y_TOLERANCE = 2;      // px tolerance for same-line grouping
const PARAGRAPH_GAP = 18;        // px gap threshold for new paragraph

// ── Core Logic ───────────────────────────────────────────────

/**
 * Detect the median (body) font size across all items.
 */
function detectBodyFontSize(items: AnnotatedTextItem[]): number {
    if (items.length === 0) return 12;

    const sizes = items.map((i) => i.fontSize).sort((a, b) => a - b);
    return sizes[Math.floor(sizes.length / 2)];
}

/**
 * Determine heading level based on font size relative to body.
 * Returns 0 if not a heading, 1-3 for heading levels.
 */
function getHeadingLevel(fontSize: number, bodySize: number): number {
    const ratio = fontSize / bodySize;
    if (ratio >= 2.0) return 1;    // ## H1 equivalent
    if (ratio >= 1.6) return 2;    // ### H2 equivalent
    if (ratio >= HEADING_FONT_RATIO) return 3; // #### H3 equivalent
    return 0;
}

/**
 * Detect if font name indicates bold text.
 */
function isBold(fontName: string): boolean {
    const lower = fontName.toLowerCase();
    return lower.includes("bold") || lower.includes("heavy") || lower.includes("black");
}

/**
 * Detect if font name indicates italic text.
 */
function isItalic(fontName: string): boolean {
    const lower = fontName.toLowerCase();
    return lower.includes("italic") || lower.includes("oblique");
}

/**
 * Group text items into lines by y-coordinate proximity.
 */
function groupIntoLines(
    items: AnnotatedTextItem[]
): AnnotatedTextItem[][] {
    if (items.length === 0) return [];

    // Sort by y descending (PDF y-axis goes up), then x ascending
    const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

    const lines: AnnotatedTextItem[][] = [];
    let currentLine: AnnotatedTextItem[] = [sorted[0]];
    let currentY = sorted[0].y;

    for (let i = 1; i < sorted.length; i++) {
        const item = sorted[i];
        if (Math.abs(item.y - currentY) <= LINE_Y_TOLERANCE) {
            currentLine.push(item);
        } else {
            // Sort line by x before storing
            currentLine.sort((a, b) => a.x - b.x);
            lines.push(currentLine);
            currentLine = [item];
            currentY = item.y;
        }
    }
    if (currentLine.length > 0) {
        currentLine.sort((a, b) => a.x - b.x);
        lines.push(currentLine);
    }

    return lines;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Convert a PDF buffer to best-effort Markdown.
 * Preserves headings (via font size), bold/italic, paragraphs, and page breaks.
 *
 * @param buffer - PDF file as ArrayBuffer
 * @returns Markdown string
 */
export async function convertPDFToMarkdown(
    buffer: ArrayBuffer
): Promise<string> {
    try {
        const pdfjsLib = await loadPdfJs();

        const loadingTask = pdfjsLib.getDocument(buildPdfDocumentOptions(buffer));
        const pdf = await loadingTask.promise;

        const markdownParts: string[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Build annotated text items
            const items: AnnotatedTextItem[] = textContent.items
                .filter((item: any) => item.str && item.str.trim())
                .map((item: any) => ({
                    str: item.str,
                    x: item.transform?.[4] ?? 0,
                    y: item.transform?.[5] ?? 0,
                    fontSize: Math.abs(item.transform?.[0] ?? 12),
                    fontName: item.fontName ?? "",
                }));

            if (items.length === 0) continue;

            const bodySize = detectBodyFontSize(items);
            const lines = groupIntoLines(items);

            let lastY = Infinity;

            for (const line of lines) {
                // Detect paragraph gap
                const lineY = line[0].y;
                const gap = Math.abs(lastY - lineY);

                if (gap > PARAGRAPH_GAP && markdownParts.length > 0) {
                    markdownParts.push("");
                }
                lastY = lineY;

                // Build line text with formatting
                const lineText = line
                    .map((item) => {
                        let text = item.str.trim();
                        if (!text) return "";

                        // Apply inline formatting
                        if (isBold(item.fontName) && isItalic(item.fontName)) {
                            text = `***${text}***`;
                        } else if (isBold(item.fontName)) {
                            text = `**${text}**`;
                        } else if (isItalic(item.fontName)) {
                            text = `*${text}*`;
                        }
                        return text;
                    })
                    .join(" ")
                    .trim();

                if (!lineText) continue;

                // Detect heading from first item's font size
                const headingLevel = getHeadingLevel(line[0].fontSize, bodySize);
                if (headingLevel > 0) {
                    const prefix = "#".repeat(headingLevel);
                    // Remove bold markers from headings (redundant)
                    const cleanHeading = lineText.replace(/\*\*/g, "");
                    markdownParts.push(`${prefix} ${cleanHeading}`);
                } else {
                    markdownParts.push(lineText);
                }
            }

            // Page separator
            if (pageNum < pdf.numPages) {
                markdownParts.push("");
                markdownParts.push("---");
                markdownParts.push("");
            }
        }

        return markdownParts.join("\n");
    } catch (error) {
        console.warn("[PDFMarkdown] Falling back to unpdf text extraction:", error);
        const bytes = new Uint8Array(buffer);
        const textResult = await extractText(bytes, { mergePages: true }).catch(() => null);
        if (!textResult || typeof textResult.text !== "string") return "";
        return textResult.text;
    }
}
