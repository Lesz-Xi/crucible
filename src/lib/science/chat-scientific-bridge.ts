import { DefaultScientificAnalysisService, type ScientificAnalysisResponse } from "./scientific-analysis-service";

export interface ChatAttachment {
  name: string;
  data: string; // base64 or data URL
  mimeType: string;
}

interface ChatScientificBridgeOptions {
  sessionId?: string;
  maxFiles?: number;
  maxFileSizeBytes?: number;
  maxTotalBytes?: number;
  timeoutMs?: number;
  concurrency?: number;
  onEvent?: (event:
    | { type: "started"; fileName: string }
    | { type: "complete"; fileName: string; analysis: ScientificAnalysisResponse }
    | { type: "failed"; fileName: string; error: string }
  ) => void;
}

export interface ChatScientificBridgeResult {
  analyses: ScientificAnalysisResponse[];
  warnings: string[];
  summaryForContext: string;
}

const DEFAULT_MAX_FILES = 3;
const DEFAULT_MAX_FILE_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_TOTAL_BYTES = 20 * 1024 * 1024;

function decodeBase64Payload(input: string): Uint8Array {
  const payload = input.includes(",") ? input.split(",").pop() || "" : input;
  const normalized = payload.trim();
  const binary = Buffer.from(normalized, "base64");
  if (binary.length === 0) {
    throw new Error("empty payload after base64 decode");
  }
  return new Uint8Array(binary);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function isCitationLikeNumericEvidence(value: number, snippet: string): boolean {
  const text = (snippet || "").toLowerCase();
  const hasMetricSignal = /%|\bms\b|\bsec\b|\bseconds\b|\bauc\b|\bf1\b|\brmse\b|\bmae\b|\bmape\b|\baccuracy\b|\bprecision\b|\brecall\b|\blatency\b|\bloss\b|±/.test(text);
  const citationContext = /(\[[0-9]{1,3}\]|\([0-9]{1,3}\)|\breferences?\b|\bbibliograph\w*\b|\bet al\.|\bdoi\b|\bssrn\b|\barxiv\b)/.test(text);
  const tinyOrdinal = Number.isInteger(value) && value >= 1 && value <= 12;

  if (hasMetricSignal) return false;
  if (citationContext) return true;
  if (tinyOrdinal && /\b(section|chapter|figure|table|source)\b/.test(text)) return true;
  return false;
}

function buildContextSummary(analyses: ScientificAnalysisResponse[]): string {
  if (analyses.length === 0) return "";

  const lines: string[] = [];
  analyses.forEach((entry, idx) => {
    lines.push(
      `Attachment #${idx + 1}: status=${entry.status}, tables=${entry.summary.tableCount}, trusted=${entry.summary.trustedTableCount}, data_points=${entry.summary.dataPointCount}`,
    );

    const warningPreview = entry.warnings.slice(0, 2);
    if (warningPreview.length > 0) {
      lines.push(`Warnings: ${warningPreview.join(" | ")}`);
    }

    if (entry.provenance) {
      lines.push(
        `Provenance: ingestion=${entry.provenance.ingestionId}, tables=${entry.provenance.sourceTableIds.length}, points=${entry.provenance.dataPointIds.length}, method=${entry.provenance.methodVersion}`,
      );
    }

    const numericEvidence = (entry.numericEvidence || []).filter((item) => !isCitationLikeNumericEvidence(item.value, item.contextSnippet || ""));
    if (numericEvidence.length > 0) {
      lines.push("Numeric evidence samples:");
      numericEvidence.slice(0, 8).forEach((item) => {
        const snippet = item.contextSnippet ? ` | context: ${item.contextSnippet}` : "";
        lines.push(`- value=${item.value} source=${item.source}${snippet}`);
      });
    } else if ((entry.numericEvidence || []).length > 0) {
      lines.push("Numeric evidence samples: suppressed citation/ordinal-only numerics.");
    }

    lines.push("---");
  });

  return lines.join("\n");
}

export async function processChatAttachments(
  attachments: ChatAttachment[],
  userId: string,
  options: ChatScientificBridgeOptions = {},
): Promise<ChatScientificBridgeResult> {
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  const maxFileSizeBytes = options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_BYTES;
  const maxTotalBytes = options.maxTotalBytes ?? DEFAULT_MAX_TOTAL_BYTES;
  const timeoutMs = options.timeoutMs ?? 20_000;
  const concurrency = options.concurrency ?? 2;

  const service = new DefaultScientificAnalysisService();
  const warnings: string[] = [];

  const pdfs = attachments
    .filter((item) => item?.mimeType === "application/pdf")
    .slice(0, maxFiles);

  if (attachments.length > maxFiles) {
    warnings.push(`Only first ${maxFiles} attachments were processed.`);
  }

  const prepared: Array<{ fileName: string; buffer: ArrayBuffer }> = [];
  let totalBytes = 0;

  for (const file of pdfs) {
    try {
      const bytes = decodeBase64Payload(file.data);
      if (bytes.byteLength > maxFileSizeBytes) {
        warnings.push(`Skipped ${file.name}: exceeds per-file limit.`);
        continue;
      }
      if (totalBytes + bytes.byteLength > maxTotalBytes) {
        warnings.push(`Skipped ${file.name}: exceeds total attachment budget.`);
        continue;
      }
      totalBytes += bytes.byteLength;
      prepared.push({ fileName: file.name, buffer: toArrayBuffer(bytes) });
    } catch (error) {
      warnings.push(
        `Skipped ${file.name}: invalid base64 payload (${error instanceof Error ? error.message : "decode error"}).`,
      );
    }
  }

  const analyses: ScientificAnalysisResponse[] = [];
  for (let i = 0; i < prepared.length; i += concurrency) {
    const chunk = prepared.slice(i, i + concurrency);
    const results = await Promise.all(
      chunk.map(async (file) => {
        options.onEvent?.({ type: "started", fileName: file.fileName });
        const analysis = await service.run({
          userId,
          pdfBuffer: file.buffer,
          fileName: file.fileName,
          context: { feature: "chat", sessionId: options.sessionId },
          options: { timeoutMs },
        });
        if (analysis.status === "failed") {
          options.onEvent?.({
            type: "failed",
            fileName: file.fileName,
            error: analysis.warnings[0] || "scientific analysis failed",
          });
        } else {
          options.onEvent?.({ type: "complete", fileName: file.fileName, analysis });
        }
        return analysis;
      }),
    );
    analyses.push(...results);
  }

  const allWarnings = [...warnings, ...analyses.flatMap((entry) => entry.warnings)];

  return {
    analyses,
    warnings: allWarnings,
    summaryForContext: buildContextSummary(analyses),
  };
}
