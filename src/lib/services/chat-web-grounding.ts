import type {
  FactualConfidenceResult,
  GroundingSource,
} from "@/types/chat-grounding";

const SERPER_API_URL = "https://google.serper.dev/search";

interface SerperResponse {
  organic?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
    date?: string;
  }>;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function buildQueries(question: string, entities: string[]): string[] {
  const q = question.trim();
  const candidates = new Set<string>();

  if (q) candidates.add(q);
  for (const entity of entities) {
    candidates.add(`${entity} founder`);
    candidates.add(`${entity} creator`);
    if (entity.includes(".")) {
      candidates.add(`site:${entity} about`);
    }
  }

  return Array.from(candidates).slice(0, 4);
}

export async function searchChatGrounding(
  question: string,
  entities: string[],
  options?: { topK?: number; timeoutMs?: number }
): Promise<GroundingSource[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const topK = options?.topK ?? 5;
  const timeoutMs = options?.timeoutMs ?? 5000;
  const queries = buildQueries(question, entities);
  const dedupe = new Map<string, GroundingSource>();

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

      rows.forEach((row, index) => {
        if (!row.link || !row.title) return;
        const domain = extractDomain(row.link);
        const key = `${domain}|${row.title.toLowerCase().trim()}`;
        if (dedupe.has(key)) return;

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

  return Array.from(dedupe.values()).slice(0, topK).map((source, index) => ({
    ...source,
    rank: index + 1,
  }));
}

export function assessFactualConfidence(
  question: string,
  sources: GroundingSource[]
): FactualConfidenceResult {
  if (sources.length === 0) {
    return {
      level: "insufficient",
      score: 0,
      rationale: "No web sources were retrieved.",
    };
  }

  const uniqueDomains = new Set(sources.map((source) => source.domain)).size;
  const hasDirectEntityMention = sources.some((source) =>
    `${source.title} ${source.snippet}`.toLowerCase().includes(question.toLowerCase().split(" ")[0] || "")
  );

  let score = 0.2;
  if (sources.length >= 2) score += 0.2;
  if (sources.length >= 4) score += 0.2;
  if (uniqueDomains >= 2) score += 0.2;
  if (uniqueDomains >= 4) score += 0.1;
  if (hasDirectEntityMention) score += 0.1;

  const boundedScore = Math.max(0, Math.min(1, score));
  const level =
    boundedScore >= 0.8
      ? "high"
      : boundedScore >= 0.6
        ? "medium"
        : boundedScore >= 0.35
          ? "low"
          : "insufficient";

  const rationale =
    level === "high"
      ? "Multiple sources across domains support the claim."
      : level === "medium"
        ? "Evidence is present but not fully convergent."
        : level === "low"
          ? "Limited evidence; treat as tentative."
          : "Evidence is too weak to verify confidently.";

  return { level, score: boundedScore, rationale };
}
