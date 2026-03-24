
// PDF Extraction Pipeline
// Handles PDF upload, text extraction, chunking, and embedding generation

import "./polyfill"; // MUST be first to polyfill DOMMatrix for pdf-parse
import { generateEmbedding } from "@/lib/ai/gemini";
import { ExtractedConcepts, Source } from "@/types";
// Removed unused PDFParse import

// Semantic chunking configuration
const CHUNK_SIZE = 1500; // characters
const CHUNK_OVERLAP = 200; // characters

export interface PDFChunk {
  content: string;
  pageNumber: number;
  chunkIndex: number;
  embedding?: number[];
}

export interface PageMapEntry {
  page: number;
  startOffset: number;
  endOffset: number;
  text: string;
}

export interface PagedText {
  fullText: string;
  pageMap: PageMapEntry[];
}

export interface PDFExtractionResult {
  fileName: string;
  sourceType?: "pdf" | "company";
  totalPages: number;
  fullText: string;
  pagedText?: PagedText;
  chunks: PDFChunk[];
  extractedConcepts?: ExtractedConcepts;
}

/**
 * Extract text from PDF buffer using pdf-parse
 */
/**
 * Extract text from PDF buffer using pdf2json (Pure Node.js)
 */
import fs from "fs";
import path from "path";
import PDFParser from "pdf2json";

export async function extractTextFromPDF(
  buffer: ArrayBuffer,
  fileName: string
): Promise<Pick<PDFExtractionResult, "fileName" | "totalPages" | "fullText" | "pagedText">> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true); // text-only mode

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      reject(new Error(errData.parserError));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      // Extract raw text from the parsed JSON data
      // pdf2json returns URL-encoded text, needs decoding
      let fullText = "";

      try {
        // According to pdf2json docs, the raw text content is in pdfData.formImage.Pages
        // BUT when using mode 1 (text only), it gives a txt format in .getRawTextContent()
        // However, the event gives us the JSON structure.
        // Let's rely on the built-in text content extraction
        fullText = pdfParser.getRawTextContent();
      } catch (e) {
        // Fallback or if getRawTextContent isn't available on the instance in this context
        // Try accessing the page texts manually
        if (pdfData && pdfData.formImage && pdfData.formImage.Pages) {
          fullText = pdfData.formImage.Pages.map((page: any) => {
            return page.Texts.map((txt: any) => decodeURIComponent(txt.R[0].T)).join(" ");
          }).join("\n\n");
        }
      }

      const pages = Array.isArray(pdfData?.formImage?.Pages) ? pdfData.formImage.Pages : [];
      const pageTexts = pages.map((page: any) =>
        Array.isArray(page?.Texts)
          ? page.Texts
            .map((txt: any) => decodeURIComponent(txt?.R?.[0]?.T || ""))
            .join(" ")
            .trim()
          : ""
      );

      const fullTextFromPages = pageTexts.filter(Boolean).join("\n\n");
      const canonicalFullText = (fullTextFromPages || fullText || "").trim();

      let offset = 0;
      const pageMap: PageMapEntry[] = pageTexts.map((text: string, idx: number) => {
        const clean = text || "";
        const startOffset = offset;
        const endOffset = startOffset + clean.length;
        offset = endOffset + 2;
        return {
          page: idx + 1,
          startOffset,
          endOffset,
          text: clean,
        };
      });

      resolve({
        fileName,
        totalPages: pages.length || 0,
        fullText: canonicalFullText,
        pagedText: {
          fullText: canonicalFullText,
          pageMap,
        },
      });
    });

    // Parse the buffer
    pdfParser.parseBuffer(Buffer.from(buffer));
  });
}



/**
 * Split text into chunks with overlap
 */
function chunkText(text: string): string[] {
  if (!text) return [];

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + CHUNK_SIZE, text.length);
    chunks.push(text.slice(startIndex, endIndex));

    // Move forward by chunk size minus overlap
    startIndex += (CHUNK_SIZE - CHUNK_OVERLAP);

    // Break if we're at the end to avoid infinite loops in edge cases
    if (startIndex >= text.length) break;
  }

  return chunks;
}

/**
 * Embed chunks (Mock or Real)
 * Currently just mapping to objects, actual embedding happens in synthesis usually, 
 * or we can restore the gemini embedding call if needed. 
 * For now, aligning with the interface.
 */
async function embedChunks(textChunks: string[]): Promise<PDFChunk[]> {
  // In a real scenario, we would batch call generateEmbedding here.
  // For now, we'll return the chunks structure.
  return Promise.all(textChunks.map(async (text, index) => ({
    content: text,
    pageNumber: 0, // Semantic chunking loses page alignment typically
    chunkIndex: index,
    // embedding: await generateEmbedding(text) // Optional: uncomment if we want immediate embeddings
  })));
}

/**
 * Full PDF processing pipeline
 */
export async function processPDF(
  buffer: ArrayBuffer,
  fileName: string
): Promise<PDFExtractionResult> {
  try {
    // Step 1: Extract text
    const extraction = await extractTextFromPDF(buffer, fileName);

    // Step 2: Chunk the text
    const textChunks = chunkText(extraction.fullText);

    // Step 3: Generate embeddings
    const chunks = await embedChunks(textChunks);

    return {
      ...extraction,
      chunks,
    };
  } catch (error) {
    console.error(`Error processing PDF ${fileName}:`, error);
    throw error;
  }
}

/**
 * Process multiple PDFs in parallel
 */
export async function processMultiplePDFs(
  files: { buffer: ArrayBuffer; name: string }[]
): Promise<{ successful: PDFExtractionResult[]; failed: { name: string; error: string }[] }> {
  const results = await Promise.allSettled(
    files.map((file) => processPDF(file.buffer, file.name))
  );

  const successful: PDFExtractionResult[] = [];
  const failed: { name: string; error: string }[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successful.push(result.value);
    } else {
      const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.error(`Failed to process PDF ${files[index].name}:`, errorMsg);
      failed.push({
        name: files[index].name,
        error: errorMsg,
      });
    }
  });

  return { successful, failed };
}
