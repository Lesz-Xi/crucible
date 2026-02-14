// Resilient PDF.js loader for server runtimes (Next/Vercel/local)
// Tries multiple pdfjs-dist entrypoints to avoid module resolution drift.

const PDFJS_ENTRYPOINTS = [
  "pdfjs-dist/legacy/build/pdf.mjs",
  "pdfjs-dist/build/pdf.mjs",
] as const;

export async function loadPdfJs(): Promise<any> {
  let lastError: unknown;

  for (const entry of PDFJS_ENTRYPOINTS) {
    try {
      const mod = await import(entry);
      return mod;
    } catch (error) {
      lastError = error;
    }
  }

  const details = lastError instanceof Error ? `${lastError.name}: ${lastError.message}` : String(lastError);
  throw new Error(
    `PDF module loading error: unable to load pdfjs-dist runtime from known entrypoints (${PDFJS_ENTRYPOINTS.join(
      ", ",
    )}). Last error: ${details}`,
  );
}

export function buildPdfDocumentOptions(buffer: ArrayBuffer) {
  return {
    data: new Uint8Array(buffer),
    disableWorker: true,
    isEvalSupported: false,
  };
}
