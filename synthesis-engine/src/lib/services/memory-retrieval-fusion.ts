import type {
  CausalRung,
  RetrievalFusionResult,
  RetrievalFusionScoredItem,
} from "@/types/persistent-memory";

export interface RetrievalCandidate {
  id: string;
  content: string;
  causalLevel: CausalRung;
  vectorScore?: number;
  lexicalScore?: number;
}

function causalPriority(level: CausalRung): number {
  if (level === "L3") return 1;
  if (level === "L2") return 0.6;
  return 0.3;
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function lexicalScore(query: string, content: string): number {
  const queryTokens = new Set(tokenize(query));
  const contentTokens = new Set(tokenize(content));
  if (queryTokens.size === 0 || contentTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of queryTokens) {
    if (contentTokens.has(token)) overlap += 1;
  }

  return overlap / queryTokens.size;
}

export function fuseMemoryRetrieval(
  query: string,
  candidates: RetrievalCandidate[],
  options?: { topK?: number; useRrf?: boolean },
): RetrievalFusionResult {
  const useRrf = options?.useRrf ?? false;
  const topK = options?.topK ?? 8;

  const scored: RetrievalFusionScoredItem[] = candidates.map((candidate) => {
    const vScore = Math.max(0, Math.min(1, candidate.vectorScore ?? 0));
    const lScore = Math.max(0, Math.min(1, candidate.lexicalScore ?? lexicalScore(query, candidate.content)));
    const cScore = causalPriority(candidate.causalLevel);

    const finalScore = useRrf
      ? 1 / (50 + (1 - vScore) * 100) + 1 / (50 + (1 - lScore) * 100) + 1 / (50 + (1 - cScore) * 100)
      : vScore * 0.45 + lScore * 0.3 + cScore * 0.25;

    return {
      id: candidate.id,
      content: candidate.content,
      causalLevel: candidate.causalLevel,
      vectorScore: Number(vScore.toFixed(4)),
      lexicalScore: Number(lScore.toFixed(4)),
      causalPriority: Number(cScore.toFixed(4)),
      finalScore: Number(finalScore.toFixed(4)),
    };
  });

  scored.sort((a, b) => b.finalScore - a.finalScore);

  return {
    query,
    topK: scored.slice(0, topK),
  };
}
