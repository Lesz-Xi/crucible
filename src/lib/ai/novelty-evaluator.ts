// Novelty Evaluator - Prior Art Detection
// Searches for existing work to ensure honest novelty claims

import { PriorArt } from "@/types";

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
  const apiKey = process.env.SERPER_API_KEY;
  
  if (!apiKey) {
    console.warn("SERPER_API_KEY not set, skipping prior art search");
    return [];
  }

  // Create search query from the idea
  const searchQuery = extractSearchTerms(ideaThesis, ideaDescription);
  
  try {
    const response = await fetch(SERPER_API_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: searchQuery,
        num: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status}`);
    }

    const data: SerperResult = await response.json();
    
    // Convert to PriorArt format with similarity assessment
    const priorArt = await assessSimilarity(
      ideaThesis,
      data.organic.map((r) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
      }))
    );

    return priorArt;
  } catch (error) {
    console.error("Prior art search failed:", error);
    return [];
  }
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

// ===== CRITICAL THINKING & VALIDATION =====

import { getClaudeModel } from "@/lib/ai/anthropic";
import { CriticalAnalysis, NovelIdea } from "@/types";

const CRITICAL_THINKING_PROMPT = `You are a Tier 1 Scientific Reviewer. rigorous critique the following hypothesis for logical flaws and biases.

**Hypothesis:**
Thesis: {THESIS}
Description: {DESCRIPTION}
Mechanism: {MECHANISM}

**Your Task:**
1. Identify potential **Biases** (e.g., Confirmation Bias, Selection Bias, Overgeneralization).
2. Identify **Logical Fallacies** (e.g., Post hoc ergo propter hoc, Strawman, False Dichotomy).
3. Evaluate the **Scientific Validity** (Is the mechanism plausible? Is the prediction falsifiable?).

Format as JSON:
{
  "biasDetected": ["Bias 1", "Bias 2", ...],
  "logicalFallacies": ["Fallacy 1", "Fallacy 2", ...],
  "validityScore": number, // 0-100 (100 = Solid, 0 = Pseudoscientific)
  "critique": "A concise paragraph summarizing the critical review."
}`;

export async function evaluateCriticalThinking(
  idea: NovelIdea
): Promise<CriticalAnalysis> {
  const model = getClaudeModel();
  
  const prompt = CRITICAL_THINKING_PROMPT
    .replace("{THESIS}", idea.thesis)
    .replace("{DESCRIPTION}", idea.description)
    .replace("{MECHANISM}", idea.mechanism || "N/A");

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Default fallback if parsing fails
    return {
      biasDetected: [],
      logicalFallacies: [],
      validityScore: 50,
      critique: "Automated critique failed to parse. Proceed with caution."
    };
  }

  return JSON.parse(jsonMatch[0]);
}
