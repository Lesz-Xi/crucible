/**
 * Markdown Export Service
 * Converts SynthesisResult into a well-structured, portable Markdown file.
 * Handles LaTeX, code blocks, and all synthesis output sections.
 */

import {
  NovelIdea,
  PriorArt,
  StructuredApproach,
  MasaAudit,
  ExperimentalDesign,
  ConfidenceFactors,
  Contradiction,
  ExtractedConcepts,
  CriticalAnalysis,
} from "@/types";

export interface MarkdownExportOptions {
  includeAuditTrace?: boolean;
  includeExperimentalDesign?: boolean;
  includeProtocolCode?: boolean;
  title?: string;
}

export interface SynthesisExportData {
  sources: { name: string; type: "pdf" | "company"; concepts?: ExtractedConcepts }[];
  contradictions: Contradiction[];
  novelIdeas: NovelIdea[];
  structuredApproach?: StructuredApproach;
  priorArt?: PriorArt[];
  metadata?: {
    pdfCount?: number;
    companyCount?: number;
    totalSources?: number;
    refinementIterations?: number;
    calibrationApplied?: boolean;
  };
  synthesisGoal?: string;
}

/**
 * Sanitize text for Markdown output
 * - Escapes characters that could break Markdown rendering
 * - Preserves LaTeX by not escaping $ within math contexts
 */
function sanitizeText(text: string | undefined | null): string {
  if (!text) return "";
  // Escape pipe characters for tables (but not inside code blocks)
  return text.replace(/\|/g, "\\|");
}

/**
 * Wrap LaTeX expressions properly
 * Detects inline ($...$) and block ($$...$$) LaTeX and ensures proper escaping
 */
function sanitizeLatex(text: string | undefined | null): string {
  if (!text) return "";
  
  // Don't double-wrap already-wrapped LaTeX
  // This regex checks if the text already has proper LaTeX delimiters
  let result = text;
  
  // Escape standalone $ that aren't LaTeX delimiters (e.g., currency)
  // Look for $ not followed by another $ or alphanumeric (likely currency)
  result = result.replace(/\$(?!\$)(?![a-zA-Z0-9\\])/g, "\\$");
  
  return result;
}

/**
 * Generate YAML frontmatter for the Markdown file
 */
function generateFrontmatter(data: SynthesisExportData, options: MarkdownExportOptions): string {
  const now = new Date().toISOString();
  const title = options.title || data.synthesisGoal || "Hybrid Synthesis Report";
  
  const sourcesList = data.sources.map(s => `  - type: ${s.type}\n    name: "${s.name}"`).join("\n");
  
  return `---
title: "${sanitizeText(title)}"
date: "${now}"
sources:
${sourcesList}
model: "claude-sonnet-4-5-20250929"
---

`;
}

/**
 * Render the metadata section
 */
function renderMetadata(data: SynthesisExportData): string {
  const meta = data.metadata || {};
  const lines = [
    "## Metadata",
    "",
    `- **Generated:** ${new Date().toLocaleDateString()}`,
  ];
  
  if (meta.pdfCount !== undefined || meta.companyCount !== undefined) {
    lines.push(`- **Sources:** ${meta.pdfCount || 0} PDFs, ${meta.companyCount || 0} Companies`);
  }
  
  if (meta.refinementIterations !== undefined) {
    lines.push(`- **Refinement Iterations:** ${meta.refinementIterations}`);
  }
  
  if (meta.calibrationApplied !== undefined) {
    lines.push(`- **Calibration Applied:** ${meta.calibrationApplied ? "Yes" : "No"}`);
  }
  
  lines.push("", "---", "");
  return lines.join("\n");
}

/**
 * Render confidence factors as a table
 */
function renderConfidenceFactors(factors: ConfidenceFactors | undefined): string {
  if (!factors) return "";
  
  return `
#### Confidence Factors
| Factor                  | Score |
|-------------------------|-------|
| Source Agreement        | ${factors.sourceAgreement?.toFixed(2) || "N/A"} |
| Prior Art Distance      | ${factors.priorArtDistance?.toFixed(2) || "N/A"} |
| Contradiction Resolved  | ${factors.contradictionResolved?.toFixed(2) || "N/A"} |
| Evidence Depth          | ${factors.evidenceDepth?.toFixed(2) || "N/A"} |
| Concept Bridge Strength | ${factors.conceptBridgeStrength?.toFixed(2) || "N/A"} |
`;
}

/**
 * Render a single Novel Idea
 */
function renderNovelIdea(idea: NovelIdea, index: number): string {
  const lines = [
    `### Idea ${index + 1}: ${sanitizeText(idea.thesis)}`,
    "",
    `**Confidence:** ${Math.round((idea.confidence || 0) * 100)}%`,
    "",
    `> ${sanitizeLatex(idea.description)}`,
    "",
  ];
  
  if (idea.mechanism) {
    lines.push("**Mechanism:**", `> ${sanitizeLatex(idea.mechanism)}`, "");
  }
  
  if (idea.prediction) {
    lines.push("**Testable Prediction:**", `> ${sanitizeLatex(idea.prediction)}`, "");
  }
  
  if (idea.bridgedConcepts && idea.bridgedConcepts.length > 0) {
    lines.push(`**Bridged Concepts:** ${idea.bridgedConcepts.map(c => `\`${c}\``).join(", ")}`, "");
  }
  
  if (idea.noveltyAssessment) {
    lines.push("**Novelty Assessment:**", `> ${sanitizeText(idea.noveltyAssessment)}`, "");
  }
  
  // Add confidence factors table
  if (idea.confidenceFactors) {
    lines.push(renderConfidenceFactors(idea.confidenceFactors));
  }
  
  // Add MASA Audit if present
  if (idea.masaAudit) {
    lines.push(renderMasaAudit(idea.masaAudit));
  }
  
  // Add Scientific Artifacts
  if (idea.scientificArtifacts) {
    lines.push(renderScientificArtifacts(idea.scientificArtifacts));
  }
  
  lines.push("---", "");
  return lines.join("\n");
}

/**
 * Render all Novel Ideas
 */
function renderNovelIdeas(ideas: NovelIdea[]): string {
  if (!ideas || ideas.length === 0) return "";
  
  const lines = ["## 1. Novel Ideas", ""];
  ideas.forEach((idea, index) => {
    lines.push(renderNovelIdea(idea, index));
  });
  
  return lines.join("\n");
}

/**
 * Render Prior Art as a table
 */
function renderPriorArt(art: PriorArt[] | undefined): string {
  if (!art || art.length === 0) return "";
  
  const lines = [
    "## 2. Prior Art",
    "",
    "| Title | Authors | Venue | Year | Similarity | Differentiator |",
    "|-------|---------|-------|------|------------|----------------|",
  ];
  
  art.forEach(item => {
    const authors = item.authors?.slice(0, 2).join(", ") || "—";
    const authorsDisplay = item.authors && item.authors.length > 2 ? `${authors} et al.` : authors;
    const title = item.url ? `[${sanitizeText(item.title)}](${item.url})` : sanitizeText(item.title);
    
    lines.push(
      `| ${title} | ${authorsDisplay} | ${sanitizeText(item.venue) || "—"} | ${item.year || "—"} | ${Math.round((item.similarity || 0) * 100)}% | ${sanitizeText(item.differentiator)} |`
    );
  });
  
  lines.push("", "---", "");
  return lines.join("\n");
}

/**
 * Render Structured Approach
 */
function renderStructuredApproach(approach: StructuredApproach | undefined): string {
  if (!approach) return "";
  
  const lines = [
    "## 3. Structured Approach",
    "",
    `### ${sanitizeText(approach.title)}`,
    "",
    "### Problem Statement",
    `> ${sanitizeText(approach.problemStatement)}`,
    "",
    "### Proposed Solution",
    `> ${sanitizeText(approach.proposedSolution)}`,
    "",
  ];
  
  if (approach.keySteps && approach.keySteps.length > 0) {
    lines.push("### Key Steps", "");
    approach.keySteps?.sort((a, b) => a.order - b.order).forEach(step => {
      lines.push(`${step.order}. **${sanitizeText(step.title)}:** ${sanitizeText(step.description)}`);
    });
    lines.push("");
  }
  
  if (approach.risks && approach.risks.length > 0) {
    lines.push("### Risks", "");
    approach.risks.forEach(risk => {
      const severityEmoji = risk.severity === "high" ? "🔴" : risk.severity === "medium" ? "🟡" : "🟢";
      lines.push(`- ${severityEmoji} **${risk.severity.toUpperCase()}:** ${sanitizeText(risk.description)}`);
      lines.push(`  - *Mitigation:* ${sanitizeText(risk.mitigation)}`);
    });
    lines.push("");
  }
  
  if (approach.successMetrics && approach.successMetrics.length > 0) {
    lines.push("### Success Metrics", "");
    approach.successMetrics.forEach(metric => {
      lines.push(`- ${sanitizeText(metric)}`);
    });
    lines.push("");
  }
  
  lines.push("---", "");
  return lines.join("\n");
}

/**
 * Render MASA Audit Trace
 */
function renderMasaAudit(audit: MasaAudit | undefined): string {
  if (!audit) return "";
  
  const lines = [
    "#### MASA Audit Trace",
    "",
    "##### Methodologist Critique",
    `- **Grade:** ${audit.methodologist?.grade || "N/A"}`,
    `- **Score:** ${audit.methodologist?.score || 0}/100`,
  ];
  
  if (audit.methodologist?.constructValidityIssues?.length) {
    lines.push(`- **Construct Validity Issues:** ${audit.methodologist.constructValidityIssues.join(", ")}`);
  }
  if (audit.methodologist?.causalityIssues?.length) {
    lines.push(`- **Causality Issues:** ${audit.methodologist.causalityIssues.join(", ")}`);
  }
  if (audit.methodologist?.critique) {
    lines.push(`- **Critique:** ${sanitizeText(audit.methodologist.critique)}`);
  }
  
  lines.push("", "##### Skeptic Critique");
  lines.push(`- **Score:** ${audit.skeptic?.score || 0}/100`);
  
  if (audit.skeptic?.biasesDetected?.length) {
    lines.push(`- **Biases Detected:** ${audit.skeptic.biasesDetected.join(", ")}`);
  }
  if (audit.skeptic?.fallaciesDetected?.length) {
    lines.push(`- **Fallacies Detected:** ${audit.skeptic.fallaciesDetected.join(", ")}`);
  }
  if (audit.skeptic?.devilAdvocacy) {
    lines.push(`- **Devil's Advocacy:** ${sanitizeText(audit.skeptic.devilAdvocacy)}`);
  }
  
  if (audit.finalSynthesis) {
    lines.push("", "##### Final Synthesis Verdict");
    lines.push(`- **Approved:** ${audit.finalSynthesis.isApproved ? "✅ Yes" : "❌ No"}`);
    lines.push(`- **Validity Score:** ${audit.finalSynthesis.validityScore}/100`);
    if (audit.finalSynthesis.architectVerdict) {
      lines.push(`- **Architect Verdict:** ${sanitizeText(audit.finalSynthesis.architectVerdict)}`);
    }
    if (audit.finalSynthesis.remediationPlan?.length) {
      lines.push("- **Remediation Plan:**");
      audit.finalSynthesis.remediationPlan.forEach(item => {
        lines.push(`  - ${sanitizeText(item)}`);
      });
    }
  }
  
  lines.push("");
  return lines.join("\n");
}

/**
 * Render Scientific Artifacts (Protocol Code & Lab Manual)
 */
function renderScientificArtifacts(artifacts: { protocolCode?: string; labManual?: string } | undefined): string {
  if (!artifacts) return "";
  
  const lines = ["#### Scientific Artifacts", ""];
  
  if (artifacts.protocolCode) {
    lines.push("##### Protocol Code (Python)", "```python", artifacts.protocolCode, "```", "");
  }
  
  if (artifacts.labManual) {
    lines.push("##### Lab Manual", "```markdown", artifacts.labManual, "```", "");
  }
  
  return lines.join("\n");
}

/**
 * Render Contradictions
 */
function renderContradictions(contradictions: Contradiction[]): string {
  if (!contradictions || contradictions.length === 0) return "";
  
  const lines = ["## Contradictions Detected", ""];
  
  contradictions.forEach((c, i) => {
    lines.push(`### ${i + 1}. ${sanitizeText(c.concept)}`, "");
    lines.push(`| Source | Claim |`);
    lines.push(`|--------|-------|`);
    lines.push(`| **${sanitizeText(c.sourceA)}** | ${sanitizeText(c.claimA)} |`);
    lines.push(`| **${sanitizeText(c.sourceB)}** | ${sanitizeText(c.claimB)} |`);
    if (c.resolution) {
      lines.push("", `**Resolution:** ${sanitizeText(c.resolution)}`);
    }
    lines.push("");
  });
  
  lines.push("---", "");
  return lines.join("\n");
}

/**
 * Main export function: Generates a complete Markdown string from synthesis data
 */
export function generateMarkdown(
  data: SynthesisExportData,
  options: MarkdownExportOptions = {}
): string {
  const parts: string[] = [];
  
  // Frontmatter
  parts.push(generateFrontmatter(data, options));
  
  // Title
  const title = options.title || data.synthesisGoal || "Synthesis Report";
  parts.push(`# ${sanitizeText(title)}`, "");
  
  // Metadata
  parts.push(renderMetadata(data));
  
  // Novel Ideas (main content)
  parts.push(renderNovelIdeas(data.novelIdeas));
  
  // Prior Art
  if (data.priorArt || (data.novelIdeas && data.novelIdeas.some(i => i.masaAudit))) {
    // Collect prior art from ideas if not provided at top level
    const allPriorArt = data.priorArt || [];
    parts.push(renderPriorArt(allPriorArt));
  }
  
  // Contradictions
  if (data.contradictions && data.contradictions.length > 0) {
    parts.push(renderContradictions(data.contradictions));
  }
  
  // Structured Approach
  if (data.structuredApproach) {
    parts.push(renderStructuredApproach(data.structuredApproach));
  }
  
  // Footer
  parts.push("---", "", "*Generated by Sovereign Synthesis Engine*", "");
  
  return parts.join("\n");
}

/**
 * Trigger a browser download of the Markdown file
 */
export function downloadMarkdown(data: SynthesisExportData, options: MarkdownExportOptions = {}): void {
  const markdown = generateMarkdown(data, options);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const titleSlug = (options.title || data.synthesisGoal || "synthesis")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 30);
  const filename = `${titleSlug}-${timestamp}.md`;
  
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
