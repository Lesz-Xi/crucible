/**
 * SCM Report Markdown Export Service
 * Converts SCMGroundedReport into a well-structured, portable Markdown file.
 * Handles report metadata, sources, claims, hypotheses, and SCM notes.
 *
 * @version 1.0.0
 * @methodVersion scm-report-export-v1
 */

import {
  SCMGroundedReport,
  SourceRecord,
  ClaimRecord,
  HypothesisEntry,
  CounterHypothesisEntry,
  SCMNotes,
  FalsifierChecklistItem,
  HonestFramingState,
  ClaimClass,
  EvidenceTier,
  WARNING_CODE_LABELS,
  WarningCode,
} from "@/types/report-analysis";

export interface SCMReportExportOptions {
  includeRawJSON?: boolean;
  includeProvenance?: boolean;
  title?: string;
}

/**
 * Sanitize text for Markdown output
 */
function sanitizeText(text: string | undefined | null): string {
  if (!text) return "";
  return text.replace(/\|/g, "\\|");
}

/**
 * Generate YAML frontmatter for the Markdown file
 */
function generateFrontmatter(report: SCMGroundedReport, options: SCMReportExportOptions): string {
  const { meta } = report;
  const title = options.title || meta.query || "SCM-Grounded Report";

  return `---
title: "${sanitizeText(title)}"
reportId: "${meta.reportId}"
reportVersion: ${meta.reportVersion}
computeRunId: "${meta.computeRunId}"
methodVersion: "${meta.methodVersion}"
generatedAt: "${meta.generatedAt}"
causalDepth: "${meta.causalDepth}"
allowVerified: ${meta.allowVerified}
---

`;
}

/**
 * Render report metadata section
 */
function renderMetadata(report: SCMGroundedReport): string {
  const { meta } = report;
  const lines = [
    "## Report Metadata",
    "",
    `- **Report ID:** \`${meta.reportId}\``,
    `- **Version:** ${meta.reportVersion}`,
    `- **Generated:** ${new Date(meta.generatedAt).toLocaleString()}`,
    `- **Method Version:** ${meta.methodVersion}`,
    `- **Query:** ${sanitizeText(meta.query)}`,
    "",
  ];

  // Honest Framing Status
  const statusEmoji = meta.causalDepth === "verified" ? "✅"
    : meta.causalDepth === "heuristic" ? "⚠️"
    : meta.causalDepth === "warning" ? "🚨"
    : "❓";

  lines.push(`### Honest Framing Status: ${statusEmoji} ${meta.causalDepth.toUpperCase()}`);
  lines.push("");

  if (meta.allowVerified) {
    lines.push("✅ **All framing gates passed** — This report meets verification standards.");
  } else {
    lines.push("⚠️ **Verification gates failed** — Conclusions are preliminary:");
    lines.push("");
    meta.verificationFailures.forEach(failure => {
      lines.push(`- ${sanitizeText(failure)}`);
    });
  }

  lines.push("");

  // Pipeline Configuration
  lines.push("### Pipeline Configuration");
  lines.push("");
  lines.push(`- **Query Families:** ${meta.pipelineConfig.queryFamilyCount}`);
  lines.push(`- **Results per Query:** ${meta.pipelineConfig.kResultsPerQuery}`);
  lines.push(`- **Max Excerpt Length:** ${meta.pipelineConfig.maxExcerptChars} chars`);
  lines.push(`- **Search Domain:** ${meta.pipelineConfig.braveDomain}`);
  lines.push("");

  lines.push("---", "");
  return lines.join("\n");
}

/**
 * Render executive summary
 */
function renderExecutiveSummary(report: SCMGroundedReport): string {
  const { executiveSummary } = report;
  if (!executiveSummary || executiveSummary.length === 0) return "";

  const lines = [
    "## Executive Summary",
    "",
  ];

  executiveSummary.forEach(bullet => {
    lines.push(`- ${sanitizeText(bullet)}`);
  });

  lines.push("", "---", "");
  return lines.join("\n");
}

/**
 * Get emoji for claim class
 */
function getClaimClassEmoji(claimClass: ClaimClass): string {
  switch (claimClass) {
    case "IDENTIFIED_CAUSAL": return "🎯";
    case "INFERRED_CAUSAL": return "🔍";
    case "ASSOCIATIONAL_ONLY": return "📊";
    case "INSUFFICIENT_EVIDENCE": return "❓";
    default: return "•";
  }
}

/**
 * Get emoji for evidence tier
 */
function getEvidenceTierEmoji(tier: EvidenceTier): string {
  switch (tier) {
    case "A": return "🥇";
    case "B": return "🥈";
    case "C": return "🥉";
    case "UNKNOWN": return "❓";
    default: return "•";
  }
}

/**
 * Render primary hypotheses
 */
function renderPrimaryHypotheses(report: SCMGroundedReport): string {
  const { primaryHypotheses } = report;
  if (!primaryHypotheses || primaryHypotheses.length === 0) return "";

  const lines = [
    "## Primary Hypotheses",
    "",
    "Ranked by confidence (descending):",
    "",
  ];

  primaryHypotheses.forEach((hyp, idx) => {
    const emoji = getClaimClassEmoji(hyp.claimClass);
    const confidence = Math.round(hyp.confidence * 100);

    lines.push(`### ${idx + 1}. ${emoji} ${sanitizeText(hyp.text)}`);
    lines.push("");
    lines.push(`- **Confidence:** ${confidence}%`);
    lines.push(`- **Classification:** ${hyp.claimClass}`);
    lines.push(`- **Supporting Claims:** ${hyp.supportingClaimIds.length}`);
    lines.push("");
  });

  lines.push("---", "");
  return lines.join("\n");
}

/**
 * Render counter hypotheses
 */
function renderCounterHypotheses(report: SCMGroundedReport): string {
  const { counterHypotheses } = report;
  if (!counterHypotheses || counterHypotheses.length === 0) return "";

  const lines = [
    "## Counter-Hypotheses",
    "",
    "Alternative explanations and opposing views:",
    "",
  ];

  counterHypotheses.forEach((counter, idx) => {
    lines.push(`### ${idx + 1}. ${sanitizeText(counter.text)}`);
    lines.push("");
    lines.push(`**Rationale:** ${sanitizeText(counter.rationale)}`);
    lines.push("");
    lines.push(`- **Supporting Claims:** ${counter.supportingClaimIds.length}`);
    lines.push("");
  });

  lines.push("---", "");
  return lines.join("\n");
}

/**
 * Render SCM notes
 */
function renderSCMNotes(report: SCMGroundedReport): string {
  const { scmNotes } = report;
  if (!scmNotes) return "";

  const lines = [
    "## SCM Analysis Notes",
    "",
  ];

  if (scmNotes.identifiableLinks && scmNotes.identifiableLinks.length > 0) {
    lines.push("### ✅ Identifiable Causal Links");
    lines.push("");
    lines.push("Links that pass identifiability criterion (backdoor/front-door):");
    lines.push("");
    scmNotes.identifiableLinks.forEach(link => {
      lines.push(`- ${sanitizeText(link)}`);
    });
    lines.push("");
  }

  if (scmNotes.inferredLinks && scmNotes.inferredLinks.length > 0) {
    lines.push("### 🔍 Inferred Causal Links");
    lines.push("");
    lines.push("Links supported by mechanism but not fully identifiable:");
    lines.push("");
    scmNotes.inferredLinks.forEach(link => {
      lines.push(`- ${sanitizeText(link)}`);
    });
    lines.push("");
  }

  if (scmNotes.latentConfounders && scmNotes.latentConfounders.length > 0) {
    lines.push("### ⚠️ Latent Confounders");
    lines.push("");
    lines.push("Known or suspected confounders that cannot be controlled:");
    lines.push("");
    scmNotes.latentConfounders.forEach(confounder => {
      lines.push(`- ${sanitizeText(confounder)}`);
    });
    lines.push("");
  }

  lines.push("---", "");
  return lines.join("\n");
}

/**
 * Render falsifier checklist
 */
function renderFalsifierChecklist(report: SCMGroundedReport): string {
  const { falsifierChecklist } = report;
  if (!falsifierChecklist || falsifierChecklist.length === 0) return "";

  const lines = [
    "## Falsifier Checklist",
    "",
    "Time-bounded tests that could invalidate the hypotheses:",
    "",
    "| Claim ID | Test | Time Window |",
    "|----------|------|-------------|",
  ];

  falsifierChecklist.forEach(item => {
    lines.push(
      `| \`${item.claimId.slice(0, 8)}...\` | ${sanitizeText(item.test)} | ${item.window} |`
    );
  });

  lines.push("", "---", "");
  return lines.join("\n");
}

/**
 * Render unknowns and gaps
 */
function renderUnknownsAndGaps(report: SCMGroundedReport): string {
  const { unknownsAndGaps, meta } = report;
  if ((!unknownsAndGaps || unknownsAndGaps.length === 0) &&
      (!meta.unknowns || meta.unknowns.length === 0)) {
    return "";
  }

  const lines = [
    "## Unknowns & Knowledge Gaps",
    "",
    "Questions this report cannot answer with current evidence:",
    "",
  ];

  // Combine unknowns from both sources
  const allUnknowns = [
    ...(meta.unknowns || []),
    ...(unknownsAndGaps || []),
  ];

  allUnknowns.forEach(unknown => {
    lines.push(`- ${sanitizeText(unknown)}`);
  });

  lines.push("", "---", "");
  return lines.join("\n");
}

/**
 * Render decision guidance
 */
function renderDecisionGuidance(report: SCMGroundedReport): string {
  const { decisionGuidance } = report;
  if (!decisionGuidance) return "";

  const lines = [
    "## Decision Guidance",
    "",
  ];

  if (decisionGuidance.safeConclude && decisionGuidance.safeConclude.length > 0) {
    lines.push("### ✅ What Can Be Safely Concluded");
    lines.push("");
    decisionGuidance.safeConclude.forEach(item => {
      lines.push(`- ${sanitizeText(item)}`);
    });
    lines.push("");
  }

  if (decisionGuidance.notSafeConclude && decisionGuidance.notSafeConclude.length > 0) {
    lines.push("### ❌ What Cannot Be Concluded");
    lines.push("");
    decisionGuidance.notSafeConclude.forEach(item => {
      lines.push(`- ${sanitizeText(item)}`);
    });
    lines.push("");
  }

  lines.push("---", "");
  return lines.join("\n");
}

/**
 * Render sources table
 */
function renderSources(report: SCMGroundedReport): string {
  const { sources } = report;
  if (!sources || sources.length === 0) return "";

  const lines = [
    "## Sources",
    "",
    `Total sources analyzed: ${sources.length}`,
    "",
    "| Domain | URL | Credibility | Recency | Corroboration |",
    "|--------|-----|-------------|---------|---------------|",
  ];

  sources.forEach(source => {
    const credibility = Math.round(source.credibilityScore * 100);
    const recency = Math.round(source.recencyScore * 100);
    const corroboration = Math.round(source.corroborationScore * 100);
    const url = source.url.length > 50 ? source.url.slice(0, 47) + "..." : source.url;

    lines.push(
      `| ${sanitizeText(source.domain)} | [Link](${source.url}) | ${credibility}% | ${recency}% | ${corroboration}% |`
    );
  });

  lines.push("", "---", "");
  return lines.join("\n");
}

/**
 * Render claims table
 */
function renderClaims(report: SCMGroundedReport): string {
  const { claims } = report;
  if (!claims || claims.length === 0) return "";

  const lines = [
    "## Claims",
    "",
    `Total claims extracted: ${claims.length}`,
    "",
  ];

  claims.forEach((claim, idx) => {
    const emoji = getClaimClassEmoji(claim.claimClass);
    const tierEmoji = getEvidenceTierEmoji(claim.evidenceTier);
    const confidence = Math.round(claim.confidence * 100);

    lines.push(`### ${idx + 1}. ${emoji} ${sanitizeText(claim.text)}`);
    lines.push("");
    lines.push(`- **Claim ID:** \`${claim.claimId}\``);
    lines.push(`- **Classification:** ${claim.claimClass}`);
    lines.push(`- **Evidence Tier:** ${tierEmoji} ${claim.evidenceTier}`);
    lines.push(`- **Confidence:** ${confidence}%`);
    lines.push(`- **SCM Edge Support:** ${claim.scmEdgeSupport}`);
    lines.push(`- **Source Count:** ${claim.sourceIds.length}`);

    if (claim.entities && claim.entities.length > 0) {
      lines.push(`- **Entities:** ${claim.entities.join(", ")}`);
    }

    if (claim.eventTime) {
      lines.push(`- **Event Time:** ${claim.eventTime}`);
    }

    if (claim.warningCodes && claim.warningCodes.length > 0) {
      lines.push("");
      lines.push("**Warnings:**");
      claim.warningCodes.forEach(code => {
        lines.push(`- ⚠️ ${WARNING_CODE_LABELS[code]}`);
      });
    }

    if (claim.falsifierTests && claim.falsifierTests.length > 0) {
      lines.push("");
      lines.push("**Falsifier Tests:**");
      claim.falsifierTests.forEach(test => {
        lines.push(`- ${sanitizeText(test)}`);
      });
    }

    lines.push("");
  });

  lines.push("---", "");
  return lines.join("\n");
}

/**
 * Render provenance information
 */
function renderProvenance(report: SCMGroundedReport): string {
  const { meta } = report;

  const lines = [
    "## Provenance & Reproducibility",
    "",
    "### Compute Trace",
    "",
    `- **Compute Run ID:** \`${meta.computeRunId}\``,
    `- **Input Hash:** \`${meta.inputHash}\``,
    `- **Method Version:** ${meta.methodVersion}`,
    "",
    "This report's claims carry M6.2 ComputeProvenance for deterministic trace integrity.",
    "All LLM-generated artifacts include: `computeRunId`, `model`, `promptVersion`, `inputHash`.",
    "",
    "---",
    "",
  ];

  return lines.join("\n");
}

/**
 * Main export function: Generates a complete Markdown string from SCM report
 */
export function generateSCMReportMarkdown(
  report: SCMGroundedReport,
  options: SCMReportExportOptions = {}
): string {
  const parts: string[] = [];

  // Frontmatter
  parts.push(generateFrontmatter(report, options));

  // Title
  const title = options.title || report.meta.query || "SCM-Grounded Report";
  parts.push(`# ${sanitizeText(title)}`, "");

  // Metadata
  parts.push(renderMetadata(report));

  // Executive Summary
  parts.push(renderExecutiveSummary(report));

  // Primary Hypotheses
  parts.push(renderPrimaryHypotheses(report));

  // Counter-Hypotheses
  parts.push(renderCounterHypotheses(report));

  // SCM Analysis Notes
  parts.push(renderSCMNotes(report));

  // Decision Guidance
  parts.push(renderDecisionGuidance(report));

  // Falsifier Checklist
  parts.push(renderFalsifierChecklist(report));

  // Unknowns & Gaps
  parts.push(renderUnknownsAndGaps(report));

  // Sources
  parts.push(renderSources(report));

  // Claims (detailed)
  parts.push(renderClaims(report));

  // Provenance
  if (options.includeProvenance !== false) {
    parts.push(renderProvenance(report));
  }

  // Raw JSON (optional)
  if (options.includeRawJSON) {
    parts.push(
      "## Raw JSON Export",
      "",
      "```json",
      JSON.stringify(report, null, 2),
      "```",
      ""
    );
  }

  // Footer
  parts.push(
    "---",
    "",
    `*Generated by Synthesis Engine | Method: ${report.meta.methodVersion}*`,
    ""
  );

  return parts.join("\n");
}

/**
 * Trigger a browser download of the SCM report Markdown file
 */
export function downloadSCMReportMarkdown(
  report: SCMGroundedReport,
  options: SCMReportExportOptions = {}
): void {
  const markdown = generateSCMReportMarkdown(report, options);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const querySlug = (options.title || report.meta.query)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 50);
  const filename = `scm-report-${querySlug}-${timestamp}.md`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
