// =============================================================
// Automated Scientist: Table Extractor
// Phase B — Extraction Pipeline
// Heuristic extraction from positioned text items via pdfjs-dist.
// =============================================================

import "./polyfill";
import { buildPdfDocumentOptions, loadPdfJs } from "./pdfjs-loader";

// ── Types ────────────────────────────────────────────────────

export interface TextItem {
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontName: string;
}

export interface RawTableResult {
    pageNumber: number;
    tableIndex: number;
    headers: string[];
    rows: string[][];
    confidence: number;
    parseStatus: "parsed" | "partial" | "failed";
    qaFlags: string[];
}

// ── Configuration ────────────────────────────────────────────

const ROW_Y_TOLERANCE = 3;       // px tolerance for grouping items into rows
const MIN_COLUMNS = 2;           // minimum columns to qualify as a table
const MIN_ROWS = 2;              // minimum data rows (excluding header)
const MIN_CONFIDENCE = 0.3;      // below this, mark as failed
const COLUMN_GAP_RATIO = 0.15;   // min gap between columns relative to page width

// ── Core Logic ───────────────────────────────────────────────

/**
 * Group text items into rows by y-coordinate proximity.
 */
function groupItemsByRow(items: TextItem[]): TextItem[][] {
    if (items.length === 0) return [];

    // Sort by y (top to bottom), then x (left to right)
    const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);

    const rows: TextItem[][] = [];
    let currentRow: TextItem[] = [sorted[0]];
    let currentY = sorted[0].y;

    for (let i = 1; i < sorted.length; i++) {
        const item = sorted[i];
        if (Math.abs(item.y - currentY) <= ROW_Y_TOLERANCE) {
            currentRow.push(item);
        } else {
            rows.push(currentRow);
            currentRow = [item];
            currentY = item.y;
        }
    }
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }

    return rows;
}

/**
 * Detect column boundaries from aligned text items across rows.
 * Returns array of x-coordinate ranges for each column.
 */
function detectColumns(rows: TextItem[][]): { start: number; end: number }[] {
    // Collect all distinct x-positions
    const xPositions: number[] = [];
    for (const row of rows) {
        for (const item of row) {
            xPositions.push(item.x);
        }
    }

    if (xPositions.length === 0) return [];

    // Sort and cluster x-positions
    xPositions.sort((a, b) => a - b);

    const clusters: number[][] = [];
    let currentCluster = [xPositions[0]];

    for (let i = 1; i < xPositions.length; i++) {
        // Items within 15px of each other belong to the same column
        if (xPositions[i] - xPositions[i - 1] < 15) {
            currentCluster.push(xPositions[i]);
        } else {
            clusters.push(currentCluster);
            currentCluster = [xPositions[i]];
        }
    }
    clusters.push(currentCluster);

    // Build column boundaries from clusters
    return clusters.map((cluster) => ({
        start: Math.min(...cluster) - 2,
        end: Math.max(...cluster) + 50, // extend right to capture text width
    }));
}

/**
 * Assign text items in a row to columns based on x-position.
 */
function assignToColumns(
    row: TextItem[],
    columns: { start: number; end: number }[]
): string[] {
    const cells: string[] = new Array(columns.length).fill("");

    for (const item of row) {
        let bestCol = -1;
        let bestDist = Infinity;

        for (let c = 0; c < columns.length; c++) {
            const mid = (columns[c].start + columns[c].end) / 2;
            const dist = Math.abs(item.x - mid);
            if (item.x >= columns[c].start - 5 && dist < bestDist) {
                bestDist = dist;
                bestCol = c;
            }
        }

        if (bestCol >= 0) {
            cells[bestCol] = cells[bestCol]
                ? `${cells[bestCol]} ${item.str.trim()}`
                : item.str.trim();
        }
    }

    return cells;
}

/**
 * Calculate confidence score for a detected table.
 * Higher score = more likely to be a genuine table.
 */
function calculateConfidence(
    rows: string[][],
    headers: string[],
    columnCount: number
): { confidence: number; qaFlags: string[] } {
    const qaFlags: string[] = [];
    let score = 1.0;

    // Penalty: too few columns
    if (columnCount < MIN_COLUMNS) {
        score -= 0.4;
        qaFlags.push("too_few_columns");
    }

    // Penalty: too few rows
    if (rows.length < MIN_ROWS) {
        score -= 0.3;
        qaFlags.push("too_few_rows");
    }

    // Penalty: empty cells ratio
    const totalCells = rows.length * columnCount;
    const emptyCells = rows.reduce(
        (acc, row) => acc + row.filter((c) => !c.trim()).length,
        0
    );
    const emptyRatio = totalCells > 0 ? emptyCells / totalCells : 1;
    if (emptyRatio > 0.5) {
        score -= 0.3;
        qaFlags.push("high_empty_cell_ratio");
    } else if (emptyRatio > 0.25) {
        score -= 0.15;
        qaFlags.push("moderate_empty_cells");
    }

    // Bonus: consistent column count across rows
    const sameColumnCount = rows.every((r) => r.length === columnCount);
    if (sameColumnCount) {
        score += 0.1;
    } else {
        qaFlags.push("inconsistent_column_count");
    }

    // Penalty: headers all empty
    if (headers.every((h) => !h.trim())) {
        score -= 0.2;
        qaFlags.push("empty_headers");
    }

    return {
        confidence: Math.max(0, Math.min(1, score)),
        qaFlags,
    };
}

/**
 * Detect and extract table-like structures from positioned text items on a page.
 */
function detectTablesOnPage(
    items: TextItem[],
    pageNumber: number
): RawTableResult[] {
    if (items.length < 4) return []; // Not enough items for a table

    const rows = groupItemsByRow(items);
    if (rows.length < MIN_ROWS + 1) return []; // Need header + data

    const columns = detectColumns(rows);
    if (columns.length < MIN_COLUMNS) return [];

    // Build table: first qualifying row as header, rest as data
    const tableRows = rows.map((row) => assignToColumns(row, columns));

    // Find the first row with mostly non-empty cells as the header
    let headerIdx = 0;
    for (let i = 0; i < tableRows.length; i++) {
        const nonEmpty = tableRows[i].filter((c) => c.trim()).length;
        if (nonEmpty >= columns.length * 0.5) {
            headerIdx = i;
            break;
        }
    }

    const headers = tableRows[headerIdx];
    const dataRows = tableRows.slice(headerIdx + 1);

    if (dataRows.length < MIN_ROWS) return [];

    const { confidence, qaFlags } = calculateConfidence(
        dataRows,
        headers,
        columns.length
    );

    let parseStatus: "parsed" | "partial" | "failed" = "parsed";
    if (confidence < MIN_CONFIDENCE) {
        parseStatus = "failed";
    } else if (confidence < 0.6) {
        parseStatus = "partial";
    }

    return [
        {
            pageNumber,
            tableIndex: 0,
            headers,
            rows: dataRows,
            confidence,
            parseStatus,
            qaFlags,
        },
    ];
}

// ── Public API ───────────────────────────────────────────────

/**
 * Extract tables from a PDF buffer using pdfjs-dist positional text data.
 *
 * @param buffer - PDF file as ArrayBuffer
 * @returns Array of RawTableResult with confidence scores
 */
export async function extractTablesFromPDF(
    buffer: ArrayBuffer
): Promise<RawTableResult[]> {
    try {
        const pdfjsLib = await loadPdfJs();

        const loadingTask = pdfjsLib.getDocument(buildPdfDocumentOptions(buffer));
        const pdf = await loadingTask.promise;

        const allTables: RawTableResult[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Map pdfjs text items to our TextItem format
            const items: TextItem[] = textContent.items
                .filter((item: any) => item.str && item.str.trim())
                .map((item: any) => ({
                    str: item.str,
                    x: item.transform?.[4] ?? 0,       // x-position from transform matrix
                    y: item.transform?.[5] ?? 0,       // y-position from transform matrix
                    width: item.width ?? 0,
                    height: item.height ?? item.transform?.[0] ?? 12,
                    fontName: item.fontName ?? "",
                }));

            if (items.length === 0) continue;

            // Detect tables on this page
            const pageTables = detectTablesOnPage(items, pageNum);

            // Assign sequential table indexes per page
            pageTables.forEach((table, idx) => {
                table.tableIndex = idx;
            });

            allTables.push(...pageTables);
        }

        return allTables;
    } catch (error) {
        console.warn("[TableExtractor] PDF.js unavailable; returning no extracted tables:", error);
        return [];
    }
}

/**
 * Filter tables to only include those above the trust threshold.
 *
 * @param tables - All detected tables
 * @param minConfidence - Minimum confidence to pass (default: 0.6 per v2 plan)
 */
export function filterTrustedTables(
    tables: RawTableResult[],
    minConfidence = 0.6
): { trusted: RawTableResult[]; flagged: RawTableResult[] } {
    const trusted: RawTableResult[] = [];
    const flagged: RawTableResult[] = [];

    for (const table of tables) {
        if (table.confidence >= minConfidence) {
            trusted.push(table);
        } else {
            flagged.push(table);
        }
    }

    return { trusted, flagged };
}
