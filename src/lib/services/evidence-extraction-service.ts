import { v4 as uuidv4 } from "uuid";
import { LLMFactory } from "@/lib/ai/llm-factory";
import { generateText } from "ai";
import { ClaimRecord, SourceRecord, EvidenceTier } from "@/types/report-analysis";

export const EVIDENCE_EXTRACTION_METHOD_VERSION = "evidence-extractor-v1.0" as const;

export class EvidenceExtractionService {
    private static instance: EvidenceExtractionService;

    private constructor() { }

    public static getInstance(): EvidenceExtractionService {
        if (!EvidenceExtractionService.instance) {
            EvidenceExtractionService.instance = new EvidenceExtractionService();
        }
        return EvidenceExtractionService.instance;
    }

    private buildPrompt(query: string, source: SourceRecord): string {
        return `You are an expert intelligence analyst. Extract the core causal and factual claims from the following source text that are strictly relevant to the query: "${query}".

Source URL: ${source.url}
Source Domain: ${source.domain}
Source Text:
${source.excerpt}

Return a valid JSON array of claim objects. Each object MUST have:
{
  "text": "The core claim statement",
  "entities": ["list", "of", "named", "entities"],
  "evidenceTier": "A" | "B" | "C" | "UNKNOWN", // A=Institutional/Peer-Reviewed, B=Reputable News/Analysis, C=Blog/Opinion, UNKNOWN=Unverifiable
  "claimClass": "IDENTIFIED_CAUSAL" | "INFERRED_CAUSAL" | "ASSOCIATIONAL_ONLY" | "INSUFFICIENT_EVIDENCE",
  "scmEdgeSupport": "observed" | "inferred" | "speculative",
  "confidence": 0.0 to 1.0,
  "falsifierTests": ["What would definitively prove this claim false in the next 30 days?"]
}

Rules:
- If no relevant causal or factual claims exist, return an empty array [].
- Never claim "IDENTIFIED_CAUSAL" unless evidence is direct, structural, and unambiguous. Most reporting is "INFERRED_CAUSAL" or "ASSOCIATIONAL_ONLY".
- Output ONLY valid JSON array. No markdown, no explanations.`;
    }

    async extractClaimsFromSource(
        query: string,
        source: SourceRecord,
        computeRunId: string,
        reportId: string
    ): Promise<ClaimRecord[]> {
        const prompt = this.buildPrompt(query, source);

        try {
            const model = LLMFactory.getModel({ providerId: 'gemini', modelType: 'advanced' });

            const { text } = await generateText({
                model,
                prompt,
                temperature: 0.1,
            });

            const cleanText = text.replace(/^```json/m, "").replace(/^```/m, "").trim();
            const extracted = JSON.parse(cleanText) as any[];

            if (!Array.isArray(extracted)) return [];

            return extracted.map((c) => ({
                claimId: uuidv4(),
                computeRunId,
                reportId,
                claimText: c.text || "Unknown claim",
                entities: c.entities || [],
                sourceIds: [source.sourceId],
                evidenceTier: (c.evidenceTier as EvidenceTier) || "UNKNOWN",
                claimClass: c.claimClass || "INSUFFICIENT_EVIDENCE",
                scmEdgeSupport: c.scmEdgeSupport || "speculative",
                confidence: typeof c.confidence === 'number' ? c.confidence : 0.5,
                warningCodes: [],
                falsifierTests: c.falsifierTests || [],

                // M6.2 compliance provenance defaults (filled fully in DB layer typically)
                provenanceModel: 'gemini-2.5-flash',
                provenancePromptVersion: 'extraction-v1.0',
                provenanceInputHash: 'dynamic', // Or calculated
                provenanceMethodVersion: EVIDENCE_EXTRACTION_METHOD_VERSION
            })) as ClaimRecord[];

        } catch (err) {
            console.error(`[EvidenceExtractionService] Extraction failed for source ${source.url}:`, err);
            return [];
        }
    }

    async extractClaimsBatch(
        query: string,
        sources: SourceRecord[],
        computeRunId: string,
        reportId: string
    ): Promise<ClaimRecord[]> {
        // Run in parallel chunks to avoid blowing up rate limits, but for v1 we'll Promise.all
        // (Brave restricts retrieval rate limits more than LLM limits right now)
        const batchSize = 5;
        const allClaims: ClaimRecord[] = [];

        for (let i = 0; i < sources.length; i += batchSize) {
            const batch = sources.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(source => this.extractClaimsFromSource(query, source, computeRunId, reportId))
            );
            batchResults.forEach(claims => allClaims.push(...claims));
        }

        // Deduplicate claims across sources could happen here, but for v1 we keep them raw
        // The ReportSynthesizer evaluates overlapping claims.
        return allClaims;
    }
}
