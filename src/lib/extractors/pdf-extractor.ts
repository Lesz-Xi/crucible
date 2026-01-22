
// PDF Extraction Pipeline
// Handles PDF upload, text extraction, chunking, and embedding generation
// Using unpdf (serverless-optimized PDF.js) for Next.js API routes

import "./polyfill"; // MUST be first to polyfill DOMMatrix
import { generateEmbedding } from "@/lib/ai/gemini";
import { ExtractedConcepts, Source } from "@/types";

// Import unpdf for serverless PDF text extraction (Replaces pdf2json for better Edge compatibility)
import { extractText, getDocumentProxy } from "unpdf";

// Semantic chunking configuration
const CHUNK_SIZE = 1500; // characters
const CHUNK_OVERLAP = 200; // characters

export interface PDFChunk {
  content: string;
  pageNumber: number;
  chunkIndex: number;
  embedding?: number[];
}

export interface PDFExtractionResult {
  fileName: string;
  totalPages: number;
  fullText: string;
  chunks: PDFChunk[];
  extractedConcepts?: ExtractedConcepts;
  sourceType?: 'pdf' | 'company';
}

/**
 * Extract text from PDF buffer using unpdf (serverless-optimized)
 * Works correctly in Next.js API routes without native dependencies
 */

// PDF processing timeout (90 seconds for large PDFs)
const PDF_PARSE_TIMEOUT_MS = 90000;

export async function extractTextFromPDF(
  buffer: ArrayBuffer,
  fileName: string
): Promise<Pick<PDFExtractionResult, "fileName" | "totalPages" | "fullText">> {
  return new Promise(async (resolve, reject) => {
    // Timeout protection
    const timeoutId = setTimeout(() => {
      reject(new Error(`PDF parsing timeout after ${PDF_PARSE_TIMEOUT_MS / 1000}s for ${fileName}`));
    }, PDF_PARSE_TIMEOUT_MS);

    try {
      // Copy the buffer data once to avoid detachment issues
      // ArrayBuffer gets detached after first use in some contexts
      const bufferCopy = new Uint8Array(buffer).slice();
      
      // Get document proxy to access page count
      const pdf = await getDocumentProxy(bufferCopy);
      const totalPages = pdf.numPages;
      
      // Extract text from the PDF (create fresh copy for this call)
      const bufferCopy2 = new Uint8Array(buffer).slice();
      const { text } = await extractText(bufferCopy2, { mergePages: true });
      
      clearTimeout(timeoutId);
      
      resolve({
        fileName,
        totalPages,
        fullText: (text || "").trim(),
      });
      
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
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
