import { describe, expect, it } from "vitest";
import { findSnippetPage, linkSnippetsToPDF } from "../citation-linker";
import { PagedText } from "@/lib/extractors/pdf-extractor";

const pagedText: PagedText = {
  fullText: "Page one alpha.\n\nPage two beta mechanism.\n\nPage three gamma.",
  pageMap: [
    { page: 1, startOffset: 0, endOffset: 15, text: "Page one alpha." },
    { page: 2, startOffset: 17, endOffset: 41, text: "Page two beta mechanism." },
    { page: 3, startOffset: 43, endOffset: 60, text: "Page three gamma." },
  ],
};

describe("citation-linker", () => {
  it("finds exact match page", () => {
    const match = findSnippetPage("beta mechanism", pagedText);
    expect(match?.page).toBe(2);
    expect(match?.confidence).toBe(1);
  });

  it("returns null for unrelated snippet", () => {
    const match = findSnippetPage("unrelated quantum phrase", pagedText);
    expect(match).toBeNull();
  });

  it("links snippets with metadata", () => {
    const linked = linkSnippetsToPDF(["beta mechanism", "unknown"], pagedText, "doc.pdf");
    expect(linked[0].page).toBe(2);
    expect(linked[1].page).toBeNull();
    expect(linked[0].sourceName).toBe("doc.pdf");
  });
});
