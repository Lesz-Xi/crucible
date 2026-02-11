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
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer
          ${isDragActive
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-gray-700 hover:border-gray-600 bg-gray-900/50"
          }
          ${isProcessing || files.length >= maxFiles
            ? "opacity-50 cursor-not-allowed"
            : ""
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4">
          <div
            className={`
              p-4 rounded-full transition-all duration-300
              ${isDragActive ? "bg-indigo-500/20" : "bg-gray-800"}
            `}
          >
            <Upload
              className={`w-8 h-8 ${isDragActive ? "text-indigo-400" : "text-gray-400"}`}
            />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-200">
              {isDragActive
                ? "Drop PDFs here..."
                : files.length >= maxFiles
                  ? `Maximum ${maxFiles} files reached`
                  : "Drag & drop PDFs here"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse • Max {maxFiles} files • PDF only
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">
            {files.length} of {maxFiles} files selected
          </p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200 truncate max-w-[200px] sm:max-w-[300px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
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
