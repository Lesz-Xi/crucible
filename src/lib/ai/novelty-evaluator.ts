// Novelty Evaluator - Prior Art Detection
// Searches for existing work to ensure honest novelty claims

import { PriorArt, CriticalAnalysis, NovelIdea } from "@/types";
import { ScholarService } from "./scholar-service";

const scholarService = new ScholarService();
const SERPER_API_URL = "https://google.serper.dev/search";

interface SerperResult {
  organic: Array<{
    title: string;
    link: string;
    snippet: string;
  }>;
}

/**
 * Search the web for prior art related to an idea
 */
export async function searchPriorArt(
  ideaThesis: string,
  ideaDescription: string
): Promise<PriorArt[]> {
  const serperKey = process.env.SERPER_API_KEY;
  const searchQuery = extractSearchTerms(ideaThesis, ideaDescription);
  
  let webPriorArt: PriorArt[] = [];
  
  // 1. Serper Web Search (if key exists)
  if (serperKey) {
    try {
      const response = await fetch(SERPER_API_URL, {
        method: "POST",
        headers: {
          "X-API-KEY": serperKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: searchQuery,
          num: 10,
        }),
      });

      if (response.ok) {
        const data: SerperResult = await response.json();
        webPriorArt = await assessSimilarity(
          ideaThesis,
          data.organic.map((r) => ({
            title: r.title,
            url: r.link,
            snippet: r.snippet,
            source: "web" as const
          }))
        );
      } else {
        console.warn(`Serper API error: ${response.status}`);
      }
    } catch (error) {
      console.error("Serper search failed:", error);
    }
  } else {
    console.warn("SERPER_API_KEY not set, skipping web prior art search");
  }

  // 2. DEEP SCIENCE: Semantic Scholar Search (Always attempt)
  let scholarPriorArt: PriorArt[] = [];
  try {
    console.log(`[Prior Art] Searching Scholar for: "${searchQuery.slice(0, 60)}..."`);
    const scholarResults = await scholarService.searchScholar(searchQuery, 3);
    console.log(`[Prior Art] Scholar returned ${scholarResults.length} results`);
    scholarPriorArt = scholarResults.map(p => ({
      title: p.title,
      description: p.abstract,
      similarity: p.similarity,
      differentiator: `Academic Source | Influential Citations: ${p.influenceScore}`,
      url: p.url,
      source: "scholar" as const,
      authors: p.authors,
      venue: p.venue,
      year: p.year,
      openAccessPdf: p.openAccessPdf
    }));
  } catch (error) {
    console.error("[Prior Art] Scholar search failed:", error);
  }

  return [...webPriorArt, ...scholarPriorArt];
}

/**
 * Extract key search terms from idea
 */
function extractSearchTerms(thesis: string, description: string): string {
  // Extract key phrases (simplified - could use NLP)
  const combined = `${thesis} ${description}`;
  
  // Remove common words and keep meaningful terms
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "must", "shall",
    "can", "need", "dare", "ought", "used", "to", "of", "in",
    "for", "on", "with", "at", "by", "from", "as", "into",
    "through", "during", "before", "after", "above", "below",
    "between", "under", "again", "further", "then", "once",
    "that", "this", "these", "those", "it", "its",
  ]);
  
  const words = combined
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));
  
  // Get unique words and take top 10
  const uniqueWords = [...new Set(words)].slice(0, 10);
  
  return uniqueWords.join(" ");
}

/**
 * Assess similarity between idea and found prior art
 */
async function assessSimilarity(
  ideaThesis: string,
  results: Array<{ title: string; url: string; snippet: string }>
): Promise<PriorArt[]> {
  // Simple similarity based on keyword overlap
  // In production, would use embeddings for semantic similarity
  
  const ideaWords = new Set(
    ideaThesis
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );

  return results.map((result) => {
    const resultWords = new Set(
      `${result.title} ${result.snippet}`
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

    // Calculate Jaccard similarity
    const intersection = [...ideaWords].filter((w) => resultWords.has(w));
    const union = new Set([...ideaWords, ...resultWords]);
    const similarity = (intersection.length / union.size) * 100;

    // Determine what makes this idea different
    const differentWords = [...ideaWords].filter((w) => !resultWords.has(w));
    const differentiator =
      differentWords.length > 0
        ? `This idea uniquely emphasizes: ${differentWords.slice(0, 3).join(", ")}`
        : "High overlap with existing work";

    return {
      source: "web_search",
      title: result.title,
      url: result.url,
      similarity: Math.round(similarity),
      differentiator,
    };
  });
}

/**
 * Calculate overall novelty score based on prior art
 */
export function calculateNoveltyScore(priorArt: PriorArt[]): number {
  if (priorArt.length === 0) {
    return 100; // No prior art found = potentially novel
  }

  // Find the highest similarity score
  const maxSimilarity = Math.max(...priorArt.map((p) => p.similarity));
  
  // Novelty is inverse of similarity
  // Score 0-100 where 100 is completely novel
  return Math.max(0, 100 - maxSimilarity);
}

/**
 * Generate honest novelty assessment
 */
export function generateNoveltyAssessment(
  priorArt: PriorArt[],
  noveltyScore: number
): string {
  if (noveltyScore >= 80) {
    return "High novelty: This idea appears to be genuinely novel with minimal prior art detected.";
  } else if (noveltyScore >= 50) {
    return `Moderate novelty (${noveltyScore}%): Similar concepts exist but this synthesis offers a unique perspective. Prior art includes: ${priorArt
      .slice(0, 2)
      .map((p) => p.title)
      .join("; ")}`;
  } else if (noveltyScore >= 20) {
    return `Limited novelty (${noveltyScore}%): Significant prior art exists. Consider how this differs from: ${priorArt[0]?.title}`;
  } else {
    return `Low novelty (${noveltyScore}%): This idea closely matches existing work. ${priorArt[0]?.differentiator || "Consider a different approach."}`;
  }
}

// ===== CRITICAL THINKING & VALIDATION (MASA INTEGRATION) =====


import { MasaAuditor } from "./masa-auditor";

const masaAuditor = new MasaAuditor();

/**
 * Enhanced Critical Thinking via MASA (Multi-Agent Scientific Audit)
 * Wraps the complex MASA output into the simplified CriticalAnalysis type
 * for backwards compatibility where needed.
 */
export async function evaluateCriticalThinking(
  idea: NovelIdea,
  priorArt: PriorArt[] = [] // Now accepts priorArt for context
): Promise<CriticalAnalysis> {
  
  try {
    const audit = await masaAuditor.audit(idea, priorArt);
    
    // Inject the full audit back into the idea object if possible, 
    // but here we return the CriticalAnalysis interface.
    
    return {
      biasDetected: audit.skeptic.biasesDetected,
      logicalFallacies: audit.skeptic.fallaciesDetected,
      validityScore: audit.finalSynthesis.validityScore,
      critique: `[MASA Grade: ${audit.methodologist.grade}] ${audit.methodologist.critique}\n\n[Skeptic]: ${audit.skeptic.devilAdvocacy}`
    };
  } catch (error) {
    console.error("MASA Audit Failed:", error);
    return {
      biasDetected: ["Audit Failure"],
      logicalFallacies: [],
      validityScore: 0,
      critique: "Automated MASA audit failed. Manual review recommended."
    };
  }
}
