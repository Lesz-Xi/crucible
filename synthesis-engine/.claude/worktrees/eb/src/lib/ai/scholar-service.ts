import { ScholarPriorArt } from "../../types";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { getClaudeModel } from './anthropic';
import { safeParseJson } from './ai-utils';

export class ScholarService {
  private apiKey: string;
  private baseUrl = "https://api.semanticscholar.org/graph/v1";
  private static lastRequestTime = 0;
  private static minRequestGap = 1100; // 1.1s to be safe

  constructor() {
    this.apiKey = this.getApiKey();
  }

  private getApiKey(): string {
    // Attempt multiple path resolutions to handle monorepo/workspace root ambiguity
    const possiblePaths = [
      path.resolve(process.cwd(), '.env.local'),
      path.resolve(process.cwd(), 'synthesis-engine', '.env.local'),
      '/Users/lesz/Documents/Synthetic Mind/synthesis-engine/.env.local' // Absolute fallback
    ];
    
    for (const envPath of possiblePaths) {
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: true });
        console.log(`[Scholar Init] Successfully loaded .env.local from: ${envPath}`);
        break;
      }
    }

    const key = process.env.SEMANTIC_SCHOLAR_API_KEY || "";
    if (key) {
      const masked = key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : "***";
      console.log(`[Scholar Init] API Key detected (len: ${key.length}): ${masked}`);
    } else {
      console.error("[Scholar Init] ERROR: SEMANTIC_SCHOLAR_API_KEY NOT FOUND in process.env");
    }
    
    return key.trim();
  }

  /**
   * Search for prior art using Semantic Scholar
   */
  async searchScholar(query: string, limit: number = 5): Promise<ScholarPriorArt[]> {
    if (!this.apiKey) {
      console.warn("SEMANTIC_SCHOLAR_API_KEY not found. Returning empty results.");
      return [];
    }

    try {
      let attempts = 0;
      const maxAttempts = 3;
      let delay = 2000; // Start with 2s delay

      while (attempts < maxAttempts) {
        try {
          // Basic rate limiting: Wait if we're too fast
          const now = Date.now();
          const timeSinceLast = now - ScholarService.lastRequestTime;
          if (timeSinceLast < ScholarService.minRequestGap) {
            const waitTime = ScholarService.minRequestGap - timeSinceLast;
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
          ScholarService.lastRequestTime = Date.now();

          console.log(`[Scholar API] Searching: "${query.slice(0, 50)}..." (limit: ${limit})`);
          
          const response = await fetch(
            `${this.baseUrl}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=title,abstract,url,citationCount,influentialCitationCount,year,authors,venue,openAccessPdf`,
            {
              headers: {
                "x-api-key": this.apiKey,
              },
            }
          );

          if (response.status === 429) {
            console.warn(`[Scholar API] Rate limit hit (429). Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            attempts++;
            continue;
          }

      if (!response.ok) {
            console.error(`[Scholar API] Error: ${response.status} ${response.statusText}`);
            return [];
          }

          const data = await response.json();
          if (!data.data) {
            console.log(`[Scholar API] No results found for query`);
            return [];
          }
          
          console.log(`[Scholar API] Found ${data.data.length} results`);

          return data.data.map((paper: any) => ({
            title: paper.title,
            abstract: paper.abstract,
            url: paper.url,
            year: paper.year,
            citationCount: paper.citationCount,
            influentialCitationCount: paper.influentialCitationCount,
            similarity: 0.8, // Default high as it matched the search query
            authors: paper.authors ? paper.authors.map((a: any) => a.name) : [],
            venue: paper.venue || "Unknown Venue",
            openAccessPdf: paper.openAccessPdf?.url || null
          }));
        } catch (innerError) {
          console.warn(`Attempt ${attempts + 1} failed:`, innerError);
          // If it's a network error, we retry. 
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; 
          attempts++;
        }
      } // End while

      console.error("Max retries exceeded for Scholar API");
      return [];
    } catch (error) {
      console.error("Scholar Search Failed:", error);
      return [];
    }
  }

  /**
   * Fallback: Search OpenAlex for prior art (free, no API key needed)
   * Based on OpenAlex API guide from skills library
   */
  async searchOpenAlex(query: string, limit: number = 5): Promise<ScholarPriorArt[]> {
    try {
      const baseUrl = "https://api.openalex.org/works";
      const params = new URLSearchParams({
        search: query,
        "per-page": limit.toString(),
        select: "display_name,abstract_inverted_index,publication_year,cited_by_count,authorships,primary_location,doi",
        mailto: "synthesis-engine@academic.edu" // Polite pool for higher rate limits
      });
      
      console.log(`[OpenAlex Fallback] Searching: "${query.slice(0, 50)}..." (limit: ${limit})`);
      
      const response = await fetch(`${baseUrl}?${params}`);
      
      if (!response.ok) {
        console.error(`[OpenAlex] Error: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        console.log(`[OpenAlex] No results found`);
        return [];
      }
      
      console.log(`[OpenAlex] Found ${data.results.length} results`);
      
      // Map OpenAlex format to ScholarPriorArt
      return data.results.map((work: any) => {
        // Reconstruct abstract from inverted index if available
        let abstract = "";
        if (work.abstract_inverted_index) {
          const entries: [string, number[]][] = Object.entries(work.abstract_inverted_index);
          const words: { word: string; pos: number }[] = [];
          for (const [word, positions] of entries) {
            for (const pos of positions as number[]) {
              words.push({ word, pos });
            }
          }
          words.sort((a, b) => a.pos - b.pos);
          abstract = words.map(w => w.word).join(" ").slice(0, 500);
        }
        
        return {
          title: work.display_name || "Untitled",
          abstract: abstract || "Abstract not available from OpenAlex",
          url: work.doi ? `https://doi.org/${work.doi}` : work.primary_location?.landing_page_url || "",
          year: work.publication_year,
          citationCount: work.cited_by_count || 0,
          influentialCitationCount: 0, // OpenAlex doesn't have this metric
          similarity: 0.75, // Slightly lower than Semantic Scholar as fallback
          authors: work.authorships?.map((a: any) => a.author?.display_name).filter(Boolean) || [],
          venue: work.primary_location?.source?.display_name || "Unknown Venue",
          openAccessPdf: work.primary_location?.pdf_url || null
        };
      });
    } catch (error) {
      console.error("[OpenAlex Fallback] Search failed:", error);
      return [];
    }
  }

  /**
   * Extract searchable academic keywords from thesis/mechanism text.
   * Uses Claude to identify 3-5 short academic terms suitable for paper search.
   */
  async extractSearchableKeywords(thesis: string, mechanism: string): Promise<string[]> {
    try {
      const model = getClaudeModel();
      
      const prompt = `Extract 3-5 SHORT academic search terms from this hypothesis.
Return terms that would appear in related academic paper titles or abstracts.

Hypothesis: "${thesis}"
Mechanism: "${mechanism}"

Return ONLY a JSON array of 3-5 short keyword phrases (2-4 words each).
Example: ["social scaffolding", "multiagent systems", "emergent behavior"]

JSON array:`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Extract JSON array from response
      const keywords = safeParseJson<string[]>(responseText, []);
      
      if (keywords.length === 0) {
        // Fallback: extract simple terms from thesis
        const fallbackTerms = thesis
          .replace(/[^a-zA-Z\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 5)
          .slice(0, 3);
        console.log(`[Scholar] Fallback keywords: ${fallbackTerms.join(', ')}`);
        return fallbackTerms;
      }
      
      console.log(`[Scholar] Extracted keywords: ${keywords.join(', ')}`);
      return keywords.slice(0, 5); // Limit to 5 max
    } catch (error) {
      console.error('[Scholar] Keyword extraction failed:', error);
      // Emergency fallback: split thesis into meaningful words
      return thesis.split(/\s+/).filter(w => w.length > 5).slice(0, 3);
    }
  }

  /**
   * Cross-reference a novel idea against academic literature using keyword extraction.
   * Uses multi-query strategy for better coverage.
   */
  async verifyMechanism(thesis: string, mechanism: string): Promise<ScholarPriorArt[]> {
    // Step 1: Extract searchable keywords instead of using raw thesis
    const keywords = await this.extractSearchableKeywords(thesis, mechanism);
    
    if (keywords.length === 0) {
      console.log('[Scholar] No keywords extracted, skipping search');
      return [];
    }
    
    // Step 2: Search each keyword and collect results (with OpenAlex fallback)
    const allResults: ScholarPriorArt[] = [];
    const seenTitles = new Set<string>();
    
    for (const keyword of keywords) {
      console.log(`[Prior Art] Searching keyword: "${keyword}"`);
      
      // Try Semantic Scholar first
      let results = await this.searchScholar(keyword, 2);
      
      // Fallback to OpenAlex if Semantic Scholar returns empty
      if (results.length === 0) {
        console.log(`[Prior Art] Semantic Scholar empty, trying OpenAlex fallback...`);
        results = await this.searchOpenAlex(keyword, 2);
      }
      
      // Deduplicate by title
      for (const paper of results) {
        const normalizedTitle = paper.title.toLowerCase().trim();
        if (!seenTitles.has(normalizedTitle)) {
          seenTitles.add(normalizedTitle);
          allResults.push(paper);
        }
      }
      
      // Stop if we have enough results
      if (allResults.length >= 5) break;
    }
    
    console.log(`[Prior Art] Found ${allResults.length} unique papers across ${keywords.length} keyword searches`);
    return allResults;
  }
}
