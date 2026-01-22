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
            relative overflow-hidden rounded-3xl p-12 transition-all duration-500 cursor-pointer group
            border border-white/10 shadow-xl bg-[#0A0A0A]
            ${isDragActive ? "scale-[1.01] border-orange-500/50" : "hover:shadow-2xl hover:scale-[1.005] hover:border-orange-500/30"}
            ${isProcessing ? "opacity-50 cursor-not-allowed grayscale" : ""}
          `}
        >
          {/* Animated Gradient Background */}
          <div className={`absolute inset-0 bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-red-500/5 transition-opacity duration-500 ${isDragActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`} />
          
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
                  bg-[#111] border border-white/10 shadow-[0_8px_32px_rgba(249,115,22,0.1)]
                  backdrop-blur-md transition-all duration-500
                  ${isDragActive ? "scale-110 shadow-[0_8px_32px_rgba(249,115,22,0.2)] border-orange-500/50" : "group-hover:scale-105 group-hover:shadow-[0_8px_32px_rgba(249,115,22,0.15)] group-hover:border-orange-500/30"}
                `}
              >
                <Upload className={`w-8 h-8 transition-colors duration-300 ${isDragActive ? "text-orange-500" : "text-neutral-500 group-hover:text-orange-500"}`} />
              </div>
              {/* Orbiting particles (optional aesthetic touch) */}
              <div className="absolute inset-0 -m-1 border border-orange-500/20 rounded-full w-22 h-22 animate-[spin_10s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderTopColor: 'transparent', borderBottomColor: 'transparent' }} />
            </div>

            <div className="text-center space-y-2">
              <p className="text-2xl font-mono text-neutral-300 tracking-tight">
                {isDragActive
                  ? "Drop Files Now"
                  : "Drag & Drop PDFs Here"}
              </p>
              <p className="text-neutral-500 font-medium tracking-wide text-xs uppercase opacity-80">
                or click to browse • Max {maxFiles} files
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3 pt-2">
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider px-2">
            Selected Documents ({files.length}/{maxFiles})
          </p>
          <div className="grid gap-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-white/5 rounded-xl shadow-sm hover:shadow-md hover:border-orange-500/20 transition-all duration-300 group/file"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-orange-500/10 rounded-lg group-hover/file:bg-orange-500/20 transition-colors">
                    <FileText className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-300 truncate max-w-[200px] sm:max-w-[300px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-neutral-500 font-medium">
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
