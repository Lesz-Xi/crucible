"use client";

// PDF Upload Component with Drag & Drop
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2 } from "lucide-react";

interface PDFFile {
  file: File;
  name: string;
  size: number;
  status: "pending" | "processing" | "complete" | "error";
}

interface PDFUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  isProcessing?: boolean;
}

export function PDFUpload({
  onFilesSelected,
  maxFiles = 5,
  isProcessing = false,
}: PDFUploadProps) {
  const [files, setFiles] = useState<PDFFile[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles
        .filter(
          (file) =>
            file.type === "application/pdf" &&
            files.length + acceptedFiles.indexOf(file) < maxFiles
        )
        .map((file) => ({
          file,
          name: file.name,
          size: file.size,
          status: "pending" as const,
        }));

      const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
      setFiles(updatedFiles);
      onFilesSelected(updatedFiles.map((f) => f.file));
    },
    [files, maxFiles, onFilesSelected]
  );

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles.map((f) => f.file));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: maxFiles - files.length,
    disabled: isProcessing || files.length >= maxFiles,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full space-y-4">
      {/* Dropzone */}
      {/* Dropzone - Hidden when limit reached */}
      {files.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`
            relative overflow-hidden rounded-3xl p-12 transition-all duration-500 cursor-pointer group wabi-glass-panel
            border-stone-200
            ${isDragActive ? "scale-[1.01] border-wabi-clay/60" : "hover:shadow-2xl hover:scale-[1.005] hover:border-wabi-clay/40"}
            ${isProcessing ? "opacity-50 cursor-not-allowed grayscale" : ""}
          `}
        >
          {/* Animated Gradient Background */}
          <div className={`absolute inset-0 bg-gradient-to-br from-[#9E7E6B]/10 via-[#F5F5F4]/40 to-[#FAFAF9]/70 transition-opacity duration-500 ${isDragActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`} />
          
          {/* Glow Blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/10 transition-all duration-700" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:bg-amber-500/10 transition-all duration-700" />
          
          <input {...getInputProps()} />
          
          <div className="relative z-10 flex flex-col items-center justify-center gap-6">
            {/* Glowing Orb Icon Container */}
            <div className="relative">
              <div className={`absolute inset-0 bg-orange-500/30 blur-xl rounded-full transition-all duration-500 ${isDragActive ? "scale-150 opacity-100" : "scale-100 opacity-0 group-hover:opacity-50"}`} />
              <div
                className={`
                  relative w-20 h-20 rounded-full flex items-center justify-center
                  bg-[#FAFAF9] border border-stone-200 shadow-[0_8px_32px_rgba(158,126,107,0.12)]
                  backdrop-blur-md transition-all duration-500
                  ${isDragActive ? "scale-110 shadow-[0_8px_32px_rgba(158,126,107,0.25)] border-wabi-clay/50" : "group-hover:scale-105 group-hover:shadow-[0_8px_32px_rgba(158,126,107,0.2)] group-hover:border-wabi-clay/40"}
                `}
              >
                <Upload className={`w-8 h-8 transition-colors duration-300 ${isDragActive ? "text-wabi-clay" : "text-wabi-stone group-hover:text-wabi-clay"}`} />
              </div>
              {/* Orbiting particles (optional aesthetic touch) */}
              <div className="absolute inset-0 -m-1 border border-orange-500/20 rounded-full w-22 h-22 animate-[spin_10s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderTopColor: 'transparent', borderBottomColor: 'transparent' }} />
            </div>

            <div className="text-center space-y-2">
              <p className="text-2xl font-mono text-wabi-sumi tracking-tight">
                {isDragActive
                  ? "Drop Files Now"
                  : "Drag & Drop PDFs Here"}
              </p>
              <p className="text-wabi-ink-light font-medium tracking-wide text-xs uppercase opacity-80">
                or click to browse • Max {maxFiles} files
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3 pt-2">
          <p className="text-xs text-wabi-ink-light font-bold uppercase tracking-wider px-2">
            Selected Documents ({files.length}/{maxFiles})
          </p>
          <div className="grid gap-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-4 wabi-glass-panel border-stone-200 rounded-xl shadow-sm hover:shadow-md hover:border-wabi-clay/30 transition-all duration-300 group/file"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-wabi-clay/10 rounded-lg group-hover/file:bg-wabi-clay/20 transition-colors">
                    <FileText className="w-5 h-5 text-wabi-clay" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-wabi-sumi truncate max-w-[200px] sm:max-w-[300px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-wabi-ink-light font-medium">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="p-2 hover:bg-red-500/10 text-neutral-500 hover:text-red-500 rounded-lg transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
