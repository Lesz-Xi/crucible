import { describe, expect, it } from "vitest";
import {
  buildAttachmentTitleMemoryAnswer,
  extractAttachmentNamesFromAssistantContent,
  isAttachmentTitleFollowUp,
} from "../attachment-memory";

describe("attachment-memory", () => {
  it("extracts source files from rendered attachment report content", () => {
    const names = extractAttachmentNamesFromAssistantContent(`
**Section 1: All Explicit Numbers with Context**

**Source files**:
- Anomaly-Detection.pdf
- Disagreement-AI-Alignment.pdf

### Potential metrics
- 15 - RCA time reduced to fifteen minutes.
`);

    expect(names).toEqual(["Anomaly-Detection.pdf", "Disagreement-AI-Alignment.pdf"]);
  });

  it("detects attachment title follow-up questions", () => {
    expect(isAttachmentTitleFollowUp("What was the title of the PDF I just uploaded?")).toBe(true);
    expect(isAttachmentTitleFollowUp("Which PDF did I just upload?")).toBe(true);
    expect(isAttachmentTitleFollowUp("Summarize the paper again.")).toBe(false);
  });

  it("builds a deterministic answer from attachment memory", () => {
    expect(
      buildAttachmentTitleMemoryAnswer("What was the title of the PDF I just uploaded?", [
        "Anomaly-Detection.pdf",
      ]),
    ).toBe('The uploaded PDF in this session was "Anomaly-Detection.pdf".');

    expect(
      buildAttachmentTitleMemoryAnswer("Which PDF did I just upload?", [
        "Anomaly-Detection.pdf",
        "Disagreement-AI-Alignment.pdf",
      ]),
    ).toBe(
      "The uploaded PDFs I still have in this session are: Anomaly-Detection.pdf, Disagreement-AI-Alignment.pdf.",
    );
  });
});
