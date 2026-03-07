import type {
  FactualConfidenceResult,
  GroundingSource,
} from "@/types/chat-grounding";

const SERPER_API_URL = "https://google.serper.dev/search";
const MIN_TOPICALITY_SCORE = 0.2;

interface SerperResponse {
  organic?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
    date?: string;
  }>;
}

export interface GroundingDiagnostics {
  generatedQueries: string[];
  rawCandidateCount: number;
  acceptedCount: number;
  filteredOutCount: number;
  filteredOutReasons: {
    lowTopicality: number;
    duplicate: number;
    missingFields: number;
  };
  topicalityThreshold: number;
}

export interface GroundingSearchResult {
  sources: GroundingSource[];
  diagnostics: GroundingDiagnostics;
}

const QUERY_STOPWORDS = new Set([
  "do",
  "a",
  "an",
  "the",
  "about",
  "this",
  "that",
  "for",
  "with",
  "from",
  "into",
  "what",
  "who",
  "when",
  "where",
  "why",
  "how",
  "search",
  "web",
  "look",
  "find",
  "check",
  "information",
  "statement",
  "claim",
]);

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9.-]*/g) || []).filter((token) => token.length >= 3);
}

function inferEntityType(entity: string): "person_or_org" | "domain" | "unknown" {
  if (entity.includes(".")) return "domain";
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(entity)) return "person_or_org";
  if (/^[A-Za-z][A-Za-z0-9-]{2,}$/.test(entity)) return "person_or_org";
  return "unknown";
}

function extractSubjectTerms(question: string, entities: string[]): Set<string> {
  const terms = new Set<string>();

  for (const entity of entities) {
    for (const token of tokenize(entity)) {
      if (!QUERY_STOPWORDS.has(token)) terms.add(token);
    }
  }

  for (const token of tokenize(question)) {
    if (QUERY_STOPWORDS.has(token)) continue;
    terms.add(token);
  }

  return terms;
}

export function buildQueries(question: string, entities: string[]): string[] {
  const q = question.trim();
  const candidates = new Set<string>();

  if (q) candidates.add(q);

  for (const entity of entities) {
    const type = inferEntityType(entity);

    if (type === "domain") {
      candidates.add(`site:${entity} about`);
      continue;
    }

    if (type === "person_or_org") {
      candidates.add(`${entity} biography`);
      candidates.add(`${entity} history`);
    }
  }

  return Array.from(candidates).slice(0, 4);
}

function computeTopicalityScore(
  source: { title: string; snippet?: string; domain: string },
  subjectTerms: Set<string>
): number {
  if (subjectTerms.size === 0) return 0;

  const corpus = `${source.title} ${source.snippet || ""} ${source.domain}`.toLowerCase();
  let matches = 0;

  for (const term of subjectTerms) {
    if (corpus.includes(term)) matches += 1;
  }

  const coverage = matches / subjectTerms.size;

  // Mild precision bonus when title has at least one key subject term
  const titleLower = source.title.toLowerCase();
  const titleMatch = Array.from(subjectTerms).some((term) => titleLower.includes(term));

  return Math.min(1, coverage + (titleMatch ? 0.1 : 0));
}

export async function searchChatGroundingDetailed(
  question: string,
  entities: string[],
  options?: { topK?: number; timeoutMs?: number }
): Promise<GroundingSearchResult> {
  const topK = options?.topK ?? 5;
  const timeoutMs = options?.timeoutMs ?? 5000;
  const queries = buildQueries(question, entities);

  const diagnostics: GroundingDiagnostics = {
    generatedQueries: queries,
    rawCandidateCount: 0,
    acceptedCount: 0,
    filteredOutCount: 0,
    filteredOutReasons: {
      lowTopicality: 0,
      duplicate: 0,
      missingFields: 0,
    },
    topicalityThreshold: MIN_TOPICALITY_SCORE,
  };

  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    return { sources: [], diagnostics };
  }

  const dedupe = new Map<string, GroundingSource>();
  const subjectTerms = extractSubjectTerms(question, entities);

  for (const query of queries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(SERPER_API_URL, {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query, num: 6 }),
        signal: controller.signal,
      });

      if (!response.ok) continue;
      const payload = (await response.json()) as SerperResponse;
      const rows = payload.organic || [];
      diagnostics.rawCandidateCount += rows.length;

      rows.forEach((row, index) => {
        if (!row.link || !row.title) {
          diagnostics.filteredOutCount += 1;
          diagnostics.filteredOutReasons.missingFields += 1;
          return;
        }

        const domain = extractDomain(row.link);
        const topicality = computeTopicalityScore(
          { title: row.title, snippet: row.snippet, domain },
          subjectTerms
        );

        if (topicality < MIN_TOPICALITY_SCORE) {
          diagnostics.filteredOutCount += 1;
          diagnostics.filteredOutReasons.lowTopicality += 1;
          return;
        }

        const key = `${domain}|${row.title.toLowerCase().trim()}`;
        if (dedupe.has(key)) {
          diagnostics.filteredOutCount += 1;
          diagnostics.filteredOutReasons.duplicate += 1;
          return;
        }

        dedupe.set(key, {
          title: row.title,
          link: row.link,
          snippet: row.snippet || "",
          domain,
          rank: dedupe.size + index + 1,
          publishedAt: row.date,
        });
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  const sources = Array.from(dedupe.values()).slice(0, topK).map((source, index) => ({
    ...source,
    rank: index + 1,
  }));

  diagnostics.acceptedCount = sources.length;

  return { sources, diagnostics };
}

export async function searchChatGrounding(
  question: string,
  entities: string[],
  options?: { topK?: number; timeoutMs?: number }
): Promise<GroundingSource[]> {
  const result = await searchChatGroundingDetailed(question, entities, options);
  return result.sources;
}

export function assessFactualConfidence(
  question: string,
  sources: GroundingSource[],
  entities: string[] = []
): FactualConfidenceResult {
  if (sources.length === 0) {
    return {
      level: "insufficient",
      score: 0,
      rationale: "No web sources were retrieved.",
    };
  }

  const subjectTerms = extractSubjectTerms(question, entities);
  const uniqueDomains = new Set(sources.map((source) => source.domain)).size;

  const averageTopicality =
    sources.reduce((sum, source) => {
      return sum + computeTopicalityScore(source, subjectTerms);
    }, 0) / sources.length;

  let score = 0.1;
  if (sources.length >= 2) score += 0.2;
  if (sources.length >= 4) score += 0.15;
  if (uniqueDomains >= 2) score += 0.2;
  if (uniqueDomains >= 4) score += 0.1;
  score += Math.min(0.25, averageTopicality * 0.25);

  // hard cap when topical relevance is weak
  if (averageTopicality < MIN_TOPICALITY_SCORE) {
    score = Math.min(score, 0.34);
  }

  const boundedScore = Math.max(0, Math.min(1, score));
  const level =
    boundedScore >= 0.8
      ? "high"
      : boundedScore >= 0.6
        ? "medium"
        : boundedScore >= 0.35
          ? "low"
          : "insufficient";

  const rationaleBase =
    averageTopicality < MIN_TOPICALITY_SCORE
      ? "Sources were retrieved, but topical overlap is weak; confidence is capped."
      : level === "high"
        ? "Multiple topically aligned sources across domains support the claim."
        : level === "medium"
          ? "Evidence is topically relevant but not fully convergent."
          : level === "low"
            ? "Limited or partially aligned evidence; treat as tentative."
            : "Evidence is too weak to verify confidently.";

  const rationale = `${rationaleBase} (avg_topicality=${averageTopicality.toFixed(2)}, domains=${uniqueDomains}, sources=${sources.length})`;

  return { level, score: boundedScore, rationale };
}
