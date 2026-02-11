// Company Extractor - Web Search and Data Extraction
// Fetches company information and extracts structured concepts

import { getClaudeModel } from "@/lib/ai/anthropic";
import { ExtractedConcepts, Entity } from "@/types";

const SERPER_API_URL = "https://google.serper.dev/search";

export interface CompanyData {
  name: string;
  description: string;
  products: string[];
  fundingStage?: string;
  industry: string;
  keyPeople?: string[];
  competitors?: string[];
  recentNews?: string[];
  marketAnalysis?: {
    portersFiveForces: {
      threatOfEntrants: string;
      supplierPower: string;
      buyerPower: string;
      threatOfSubstitutes: string;
      competitiveRivalry: string;
    };
    swot: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
  };
  rawContent: string;
}

export interface CompanyExtractionResult {
  companyName: string;
  data: CompanyData;
  extractedConcepts?: ExtractedConcepts;
}

/**
 * Search for company information using Serper API
 */
export async function searchCompany(companyName: string): Promise<string> {
  const apiKey = process.env.SERPER_API_KEY;
  
  if (!apiKey) {
    throw new Error("SERPER_API_KEY is required for company search");
  }

  const response = await fetch(SERPER_API_URL, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: `${companyName} company overview products funding mission competition market analysis strategy`,
      num: 15, // Increased for deeper analysis
    }),
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Combine search results into a single text
  const results = data.organic || [];
  const combinedText = results
    .map((r: { title: string; snippet: string }) => `${r.title}: ${r.snippet}`)
    .join("\n\n");

  // Add knowledge graph if available
  const knowledgeGraph = data.knowledgeGraph;
  if (knowledgeGraph) {
    return `Company: ${knowledgeGraph.title}\nDescription: ${knowledgeGraph.description || ""}\n\n${combinedText}`;
  }

  return combinedText;
}

/**
 * Extract structured company data using Gemini
 */
const COMPANY_EXTRACTION_PROMPT = `Analyze the following search results about a company and extract structured information, including a strategic market analysis (Porter's 5 Forces & SWOT).

Search Results:
---
{SEARCH_RESULTS}
---

Extract the following information about {COMPANY_NAME}:

1. Basic Info: Description, Products, Industry, Funding, People, Competitors, News
2. **Porter's Five Forces Analysis**:
    - Threat of New Entrants (Barriers to entry?)
    - Bargaining Power of Suppliers
    - Bargaining Power of Buyers
    - Threat of Substitutes
    - Competitive Rivalry
3. **SWOT Analysis**:
    - Strengths (Internal)
    - Weaknesses (Internal)
    - Opportunities (External)
    - Threats (External)

Format as JSON:
{
  "name": "string",
  "description": "string",
  "products": ["string", ...],
  "industry": "string",
  "fundingStage": "string or null",
  "keyPeople": ["string", ...],
  "competitors": ["string", ...],
  "recentNews": ["string", ...],
  "marketAnalysis": {
    "portersFiveForces": {
      "threatOfEntrants": "string",
      "supplierPower": "string",
      "buyerPower": "string",
      "threatOfSubstitutes": "string",
      "competitiveRivalry": "string"
    },
    "swot": {
      "strengths": ["string", ...],
      "weaknesses": ["string", ...],
      "opportunities": ["string", ...],
      "threats": ["string", ...]
    }
  }
}`;

export async function extractCompanyData(
  companyName: string,
  searchResults: string
): Promise<CompanyData> {
  const model = getClaudeModel();
  
  const prompt = COMPANY_EXTRACTION_PROMPT
    .replace("{SEARCH_RESULTS}", searchResults)
    .replace("{COMPANY_NAME}", companyName);

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Return basic data if parsing fails
    return {
      name: companyName,
      description: searchResults.slice(0, 500),
      products: [],
      industry: "Unknown",
      rawContent: searchResults,
    };
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    ...parsed,
    rawContent: searchResults,
  };
}

/**
 * Extract concepts from company data (same format as PDF concepts)
 */
const COMPANY_CONCEPT_PROMPT = `Analyze the following company information and extract key concepts for synthesis:

Company: {COMPANY_NAME}
Description: {DESCRIPTION}
Products: {PRODUCTS}
Industry: {INDUSTRY}

**Market Analysis Context:**
- **Strategic Strengths:** {STRENGTHS}
- **Critical Weaknesses:** {WEAKNESSES}
- **Major Threats/Rivalry:** {THREATS}

Extract:
1. Main Thesis: What is this company's core value proposition?
2. Key Arguments: 3-5 strategic approaches or differentiators
3. Entities: Important concepts, technologies, methods they use

Format as JSON:
{
  "mainThesis": "string",
  "keyArguments": ["string", ...],
  "entities": [
    {"name": "string", "type": "person|concept|organization|technology|method", "description": "string"}
  ]
}`;

export async function extractCompanyConcepts(
  companyData: CompanyData,
  sourceId: string
): Promise<ExtractedConcepts> {
  const model = getClaudeModel();
  
  const strengths = companyData.marketAnalysis?.swot?.strengths?.join(", ") || "";
  const weaknesses = companyData.marketAnalysis?.swot?.weaknesses?.join(", ") || "";
  const threats = companyData.marketAnalysis?.swot?.threats?.join(", ") || "";

  const prompt = COMPANY_CONCEPT_PROMPT
    .replace("{COMPANY_NAME}", companyData.name)
    .replace("{DESCRIPTION}", companyData.description)
    .replace("{PRODUCTS}", companyData.products.join(", "))
    .replace("{INDUSTRY}", companyData.industry)
    .replace("{STRENGTHS}", strengths)
    .replace("{WEAKNESSES}", weaknesses)
    .replace("{THREATS}", threats);

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to extract concepts for ${companyData.name}`);
  }

  const parsed = JSON.parse(jsonMatch[0]);
  
  const entities: Entity[] = parsed.entities.map((e: Omit<Entity, 'sourceId'>) => ({
    ...e,
    sourceId,
  }));

  return {
    mainThesis: parsed.mainThesis,
    keyArguments: parsed.keyArguments,
    entities,
  };
}

/**
 * Full company processing pipeline
 */
export async function processCompany(
  companyName: string
): Promise<CompanyExtractionResult> {
  // Step 1: Search for company information
  const searchResults = await searchCompany(companyName);
  
  // Step 2: Extract structured company data
  const companyData = await extractCompanyData(companyName, searchResults);
  
  // Step 3: Extract concepts for synthesis
  const extractedConcepts = await extractCompanyConcepts(
    companyData,
    `company-${companyName.toLowerCase().replace(/\s+/g, "-")}`
  );

  return {
    companyName,
    data: companyData,
    extractedConcepts,
  };
}

/**
 * Process multiple companies in parallel
 */
export async function processMultipleCompanies(
  companyNames: string[]
): Promise<{ successful: CompanyExtractionResult[]; failed: { name: string; error: string }[] }> {
  const results = await Promise.allSettled(
    companyNames.map((name) => processCompany(name))
  );
  
  const successful: CompanyExtractionResult[] = [];
  const failed: { name: string; error: string }[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successful.push(result.value);
    } else {
      const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.error(`Failed to process company ${companyNames[index]}:`, errorMsg);
      failed.push({
        name: companyNames[index],
        error: errorMsg,
      });
    }
  });

  return { successful, failed };
}

