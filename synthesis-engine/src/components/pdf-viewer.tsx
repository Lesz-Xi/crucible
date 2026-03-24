"use client";

interface PDFViewerProps {
  open: boolean;
  onClose: () => void;
  pdfUrl: string;
  fileName: string;
  page?: number | null;
}

export function PDFViewer({ open, onClose, pdfUrl, fileName, page }: PDFViewerProps) {
  if (!open) return null;

  const pageAwareUrl = page ? `${pdfUrl}#page=${page}` : pdfUrl;

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="max-w-5xl h-[85vh] mx-auto bg-gray-900 border border-gray-700 rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="text-sm text-gray-200 truncate">{fileName}{page ? ` - page ${page}` : ""}</div>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-200">Close</button>
        </div>
        <iframe src={pageAwareUrl} className="w-full h-[calc(85vh-49px)]" title={`PDF ${fileName}`} />
      </div>
    </div>
  );
}
