import type { ScientificAnalysisResponse } from "./scientific-analysis-service";

export type NumericEvidenceCategory =
  | "potential_metric"
  | "bibliographic"
  | "structural"
  | "citation_year"
  | "reference_index";

export interface SequentialNumericEvidence {
  value: number;
  category: NumericEvidenceCategory;
  confidence: "high" | "medium" | "low";
  snippet: string;
  fileName?: string;
}

interface AggregatedNumericEvidence {
  value: number;
  category: NumericEvidenceCategory;
  confidence: "high" | "medium" | "low";
  snippets: string[];
  occurrences: number;
  fileNames: string[];
}

const WORD_NUMBER =
  "(?:\\d+(?:\\.\\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)";
const TEMPORAL_DELTA_REGEX = new RegExp(
  `\\b(${WORD_NUMBER})\\s+(seconds?|minutes?|hours?|days?)\\s+(?:to|->|→)\\s+(${WORD_NUMBER})\\s+(seconds?|minutes?|hours?|days?)\\b`,
  "i",
);
const SCALE_QUANTIFIER_REGEX = new RegExp(
  `\\b(${WORD_NUMBER})?\\s*(thousand|thousands|million|millions|billion|billions|trillion|trillions|petabyte|petabytes)\\b(?:\\s+of\\s+(?:events?|records?|requests?|transactions?|data))?`,
  "i",
);

const WORD_TO_NUMBER: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

function parseNumberishToken(token: string | undefined): number | null {
  if (!token) return null;
  const normalized = token.toLowerCase().trim();
  if (/^\d+(?:\.\d+)?$/.test(normalized)) {
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }
  if (Object.prototype.hasOwnProperty.call(WORD_TO_NUMBER, normalized)) {
    return WORD_TO_NUMBER[normalized];
  }
  return null;
}

function extractReferenceIndexValues(text: string): number[] {
  const matches = text.match(/\[(\d{1,3})\]/g) || [];
  const values = new Set<number>();
  for (const token of matches) {
    const n = Number(token.replace(/[^0-9]/g, ""));
    if (Number.isFinite(n)) values.add(n);
  }
  return [...values];
}

function extractTemporalValues(text: string): number[] {
  const m = text.match(TEMPORAL_DELTA_REGEX);
  if (!m) return [];
  const a = parseNumberishToken(m[1]);
  const b = parseNumberishToken(m[3]);
  return [a, b].filter((v): v is number => typeof v === "number" && Number.isFinite(v));
}

function extractScaleValues(text: string): number[] {
  const m = text.match(SCALE_QUANTIFIER_REGEX);
  if (!m) return [];
  const base = parseNumberishToken(m[1]) ?? 1;
  const scale = (m[2] || "").toLowerCase();
  const multiplier: Record<string, number> = {
    thousand: 1_000,
    thousands: 1_000,
    million: 1_000_000,
    millions: 1_000_000,
    billion: 1_000_000_000,
    billions: 1_000_000_000,
    trillion: 1_000_000_000_000,
    trillions: 1_000_000_000_000,
    petabyte: 1_000_000_000_000_000,
    petabytes: 1_000_000_000_000_000,
  };
  const mul = multiplier[scale];
  if (!mul) return [];
  return [base * mul];
}

export function trimContextSnippet(snippet: string, max = 180): string {
  let clean = snippet.replace(/\s+/g, " ").trim();

  clean = clean
    .replace(/^[a-z]{1,4}\.\s+/, "")
    .replace(/^[a-z]{3,}(?=,\s+[A-Z])/, "")
    .replace(/^[-–,:;\s]+/, "")
    .trim();

  if (/^[a-z][a-z'-]*\s/.test(clean)) {
    const firstSpace = clean.indexOf(" ");
    if (firstSpace > 0 && firstSpace < 20) {
      clean = clean.slice(firstSpace + 1).trim();
    }
  }

  if (/[a-zA-Z]$/.test(clean) && !/[.!?]$/.test(clean)) {
    const lastSpace = clean.lastIndexOf(" ");
    if (lastSpace > clean.length - 24) {
      clean = clean.slice(0, lastSpace).trim();
    }
  }

  if (clean.length <= max) return clean;
  const sliced = clean.slice(0, max - 1);
  const boundary = Math.max(
    sliced.lastIndexOf("."),
    sliced.lastIndexOf(";"),
    sliced.lastIndexOf(","),
    sliced.lastIndexOf(" "),
  );
  const stable = boundary > 40 ? sliced.slice(0, boundary).trim() : sliced.trim();
  return `${stable}…`;
}

function hasMetricSignal(text: string): boolean {
  return /%|\bms\b|\bseconds?\b|\bminutes?\b|\bhours?\b|\brate\b|\bcount\b|\bn=\s*\d+|\baccuracy\b|\bprecision\b|\brecall\b|\bf1\b|\bauc\b|\blatency\b|\bimprov(e|ed|ement)\b|\breduc(e|ed|tion)\b|\bincreas(e|ed)\b|\bdecreas(e|ed)\b|\bbaseline\b|\bversus\b/i.test(
    text,
  );
}

function hasStructuralEnumeration(text: string): boolean {
  return /\b(main side effects?|critical areas?|separate teams?|references?|sections?|chapters?|categories?|components?)\b/i.test(
    text,
  );
}

function hasSectionReference(text: string): boolean {
  return /\b(section|chapter|page|figure|table|appendix|introduction|challenges?|solutions?|ethical|conclusion)\b|§\s*\d+(?:\.\d+)?/i.test(
    text,
  );
}

function hasBibliographicCue(text: string): boolean {
  return /(doi|ssrn|arxiv|world journal|volume|issue|pages?|copyright|received|accepted|revised|creative commons|license)/i.test(
    text,
  );
}

function hasCitationCue(text: string): boolean {
  return /(et al\.|\(|\)|references?|journal|copyright|received|accepted|revised)/i.test(text);
}

function confidenceForCategory(category: NumericEvidenceCategory, snippet: string): "high" | "medium" | "low" {
  if (category !== "potential_metric") return "low";
  if (TEMPORAL_DELTA_REGEX.test(snippet) || /\b\d+(?:\.\d+)?\s*%/.test(snippet)) return "high";
  return "medium";
}

export function classifyNumericEvidence(value: number, snippet: string): NumericEvidenceCategory {
  const text = (snippet || "").toLowerCase();

  const referenceValues = extractReferenceIndexValues(text);
  if (referenceValues.includes(value)) return "reference_index";

  if (Number.isInteger(value) && /\b(19|20)\d{2}\b/.test(String(value)) && hasCitationCue(text)) {
    return "citation_year";
  }

  const temporalValues = extractTemporalValues(text);
  if (temporalValues.includes(value)) return "potential_metric";

  const scaleValues = extractScaleValues(text);
  if (scaleValues.includes(value)) return "potential_metric";

  // Precedence lock (critical): section/structure references stay structural.
  if (hasSectionReference(text)) return "structural";

  // Bibliographic cues dominate unless this exact value is part of a metric pattern.
  if (hasBibliographicCue(text)) return "bibliographic";

  // Structural enumerations override weak metric hints.
  if (hasStructuralEnumeration(text) && !hasMetricSignal(text)) return "structural";

  return hasMetricSignal(text) ? "potential_metric" : "structural";
}

function normalizeEvidenceRows(analyses: ScientificAnalysisResponse[]): SequentialNumericEvidence[] {
  const rows: SequentialNumericEvidence[] = [];

  for (const analysis of analyses) {
    const fileName = analysis.observability?.fileName;
    for (const numeric of analysis.numericEvidence || []) {
      if (typeof numeric.value !== "number" || !Number.isFinite(numeric.value)) continue;
      const snippet = trimContextSnippet(numeric.contextSnippet || "(no snippet available)");
      const category = classifyNumericEvidence(numeric.value, snippet);
      rows.push({
        value: numeric.value,
        snippet,
        category,
        confidence: confidenceForCategory(category, snippet),
        fileName,
      });
    }
  }

  return rows;
}

function aggregateRows(rows: SequentialNumericEvidence[]): AggregatedNumericEvidence[] {
  const map = new Map<string, AggregatedNumericEvidence>();

  for (const row of rows) {
    const key = `${row.category}|${row.value}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        value: row.value,
        category: row.category,
        confidence: row.confidence,
        snippets: [row.snippet],
        occurrences: 1,
        fileNames: row.fileName ? [row.fileName] : [],
      });
      continue;
    }

    existing.occurrences += 1;
    if (row.confidence === "high") existing.confidence = "high";
    if (row.confidence === "medium" && existing.confidence === "low") existing.confidence = "medium";
    if (!existing.snippets.includes(row.snippet) && existing.snippets.length < 3) {
      existing.snippets.push(row.snippet);
    }
    if (row.fileName && !existing.fileNames.includes(row.fileName)) {
      existing.fileNames.push(row.fileName);
    }
  }

  return Array.from(map.values());
}

function formatValue(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString("en-US");
  return Number(value.toFixed(6)).toString();
}

function formatEvidenceLine(row: AggregatedNumericEvidence): string {
  const snippetText = row.snippets.join(" | ");
  return `- ${formatValue(row.value)} — ${snippetText} (${row.confidence} confidence)`;
}

function buildClaimLines(
  claimEligible: AggregatedNumericEvidence[],
  evidenceClass: "bibliographic/structural only" | "mixed" | "metric-bearing",
): string[] {
  if (claimEligible.length === 0) {
    return [
      "1. Claim 1 (Low Confidence): Unable to construct a performance metric claim because Section 2 has no claim-eligible numerics.",
      "2. Claim 2 (Low Confidence): Unable to construct a comparative effectiveness claim; extracted numbers are bibliographic/structural only.",
      "3. Claim 3 (Low Confidence): Unable to construct a causal intervention claim without metric-bearing magnitudes tied to outcomes.",
    ];
  }

  const sorted = [...claimEligible].sort((a, b) => b.occurrences - a.occurrences);
  const first = sorted[0];
  const second = sorted[1] || first;
  const third = sorted[2] || second;

  const confidenceLabel = (row: AggregatedNumericEvidence): string =>
    row.confidence === "high" ? "High" : row.confidence === "medium" ? "Medium" : "Low";

  return [
    `1. Claim 1 (${confidenceLabel(first)} Confidence): Metric-bearing signal ${formatValue(first.value)} appears in extracted context "${first.snippets[0]}". This supports a testable quantitative observation.`,
    `2. Claim 2 (${confidenceLabel(second)} Confidence): Numeric evidence ${formatValue(second.value)} is available for claim construction, but interpretation remains limited to extracted text context.`,
    `3. Claim 3 (${confidenceLabel(third)} Confidence): Evidence class is ${evidenceClass}; any intervention claim should remain conditional on validating these numerics against source tables/prose.`,
  ];
}

export function buildAttachmentSequentialThinkingReport(
  analyses: ScientificAnalysisResponse[],
  warnings: string[] = [],
): string {
  const rows = aggregateRows(normalizeEvidenceRows(analyses));
  const categoryOrder: NumericEvidenceCategory[] = [
    "potential_metric",
    "structural",
    "bibliographic",
    "citation_year",
    "reference_index",
  ];
  const labelMap: Record<NumericEvidenceCategory, string> = {
    potential_metric: "Potential metrics",
    structural: "Structural",
    bibliographic: "Bibliographic",
    citation_year: "Citation years",
    reference_index: "Reference indices",
  };

  const fileNames = Array.from(
    new Set(
      analyses
        .map((analysis) => analysis.observability?.fileName)
        .filter((name): name is string => typeof name === "string" && name.trim().length > 0),
    ),
  );

  const section1Lines: string[] = ["Section 1: All Explicit Numbers with Context"];

  if (fileNames.length > 0) {
    section1Lines.push("Source files:");
    fileNames.forEach((name) => section1Lines.push(`- ${name}`));
  }

  const hasAnyRows = rows.length > 0;
  if (!hasAnyRows) {
    section1Lines.push("Potential metrics");
    section1Lines.push("- NONE — insufficient extractable numeric evidence");
  } else {
    for (const category of categoryOrder) {
      const bucket = rows.filter((row) => row.category === category).slice(0, 8);
      if (bucket.length === 0) continue;
      section1Lines.push(labelMap[category]);
      bucket.forEach((row) => section1Lines.push(formatEvidenceLine(row)));
    }
  }

  if (warnings.length > 0) {
    section1Lines.push("Extraction warnings:");
    warnings.slice(0, 3).forEach((warning) => section1Lines.push(`- ${warning}`));
  }

  const claimEligible = rows.filter((row) => row.category === "potential_metric");
  const section2Lines = ["Section 2: Claim-Eligible Numerics"];
  if (claimEligible.length === 0) {
    section2Lines.push("NONE");
  } else {
    claimEligible.slice(0, 6).forEach((row) => section2Lines.push(formatEvidenceLine(row)));
  }

  const nonMetricCount = rows.filter((row) => row.category !== "potential_metric").length;
  const evidenceClass: "bibliographic/structural only" | "mixed" | "metric-bearing" =
    claimEligible.length === 0 ? "bibliographic/structural only" : nonMetricCount > 0 ? "mixed" : "metric-bearing";

  const section3Lines = [
    "Section 3: Three Claims with Uncertainty Labels",
    `Evidence class: ${evidenceClass}`,
    ...buildClaimLines(claimEligible, evidenceClass),
  ];

  return [section1Lines.join("\n"), section2Lines.join("\n"), section3Lines.join("\n")].join("\n\n").trim();
}
