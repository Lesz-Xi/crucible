import { PriorArt } from "@/types";

const HALF_LIFE_YEARS = 10;
const LN2 = Math.log(2);

export function calculateTemporalWeight(
  publicationYear: number,
  referenceYear: number = new Date().getFullYear()
): number {
  if (!Number.isFinite(publicationYear) || publicationYear <= 0) {
    return 1;
  }

  const age = Math.max(0, referenceYear - publicationYear);
  return Math.exp((-LN2 * age) / HALF_LIFE_YEARS);
}

export function extractPublicationYear(citation: string): number | null {
  if (!citation) return null;
  const yearMatch = citation.match(/\b(19|20)\d{2}\b/);
  if (!yearMatch) return null;
  const year = Number(yearMatch[0]);
  return Number.isFinite(year) ? year : null;
}

export function applyTemporalDecay(priorArt: PriorArt[]): PriorArt[] {
  return priorArt.map((item) => {
    const publicationYear = item.publicationYear ?? extractPublicationYear(`${item.title} ${item.differentiator} ${item.snippet ?? ""}`);
    const temporalWeight = publicationYear ? calculateTemporalWeight(publicationYear) : 1;
    const adjustedSimilarity = Math.max(0, Math.min(100, item.similarity * temporalWeight));
    return {
      ...item,
      publicationYear: publicationYear ?? undefined,
      temporalWeight,
      adjustedSimilarity,
    };
  });
}
