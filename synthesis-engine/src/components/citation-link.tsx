"use client";

import { useState } from "react";
import { PDFViewer } from "./pdf-viewer";

interface CitationLinkProps {
  snippet: string;
  page: number | null;
  pdfUrl?: string;
  fileName: string;
}

export function CitationLink({ snippet, page, pdfUrl, fileName }: CitationLinkProps) {
  const [open, setOpen] = useState(false);
  const canOpen = Boolean(pdfUrl);

  return (
    <>
      <button
        type="button"
        disabled={!canOpen}
        onClick={() => canOpen && setOpen(true)}
        className="text-left w-full p-2 rounded-lg bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/20 transition-colors disabled:opacity-70"
        title={page !== null ? `Open ${fileName} page ${page}` : "Page unavailable, open full PDF"}
      >
        <span className="text-sm text-gray-200">{snippet}</span>
        <span className="ml-2 text-xs text-yellow-300/80">
          {page !== null ? `p.${page}` : "page unavailable"}
        </span>
      </button>
      {canOpen && (
        <PDFViewer
          open={open}
          onClose={() => setOpen(false)}
          pdfUrl={pdfUrl!}
          fileName={fileName}
          page={page}
        />
      )}
    </>
  );
}
