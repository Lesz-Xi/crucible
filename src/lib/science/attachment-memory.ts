function normalizeFileName(value: string): string {
  return value.trim();
}

export function dedupeAttachmentFileNames(fileNames: string[]): string[] {
  return Array.from(
    new Set(
      fileNames
        .map((name) => (typeof name === "string" ? normalizeFileName(name) : ""))
        .filter((name) => name.length > 0),
    ),
  );
}

export function extractAttachmentNamesFromAssistantContent(content: string): string[] {
  if (typeof content !== "string" || content.length === 0) return [];
  const lines = content.split("\n");
  const out: string[] = [];
  let inSourceBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^source files\s*:/i.test(line.replace(/\*/g, ""))) {
      inSourceBlock = true;
      continue;
    }
    if (!inSourceBlock) continue;
    if (!line.startsWith("-")) break;
    const name = line.replace(/^-+\s*/, "").trim();
    if (name) out.push(name);
  }

  return dedupeAttachmentFileNames(out);
}

export function isAttachmentTitleFollowUp(question: string): boolean {
  const normalized = typeof question === "string" ? question.trim().toLowerCase() : "";
  if (!normalized) return false;

  return (
    /what\s+(?:was|is)\s+the\s+(?:title|name)\s+of\s+the\s+(?:pdf|file|document)/i.test(normalized) ||
    /what\s+(?:pdf|file|document)\s+did\s+i\s+(?:just\s+)?upload/i.test(normalized) ||
    /which\s+(?:pdf|file|document)\s+did\s+i\s+(?:just\s+)?upload/i.test(normalized) ||
    /remind\s+me\s+(?:of\s+)?the\s+(?:pdf|file|document)\s+(?:title|name)/i.test(normalized)
  );
}

export function buildAttachmentTitleMemoryAnswer(
  question: string,
  fileNames: string[],
): string | null {
  const normalizedNames = dedupeAttachmentFileNames(fileNames);
  if (normalizedNames.length === 0 || !isAttachmentTitleFollowUp(question)) {
    return null;
  }

  if (normalizedNames.length === 1) {
    return `The uploaded PDF in this session was "${normalizedNames[0]}".`;
  }

  return `The uploaded PDFs I still have in this session are: ${normalizedNames.join(", ")}.`;
}
