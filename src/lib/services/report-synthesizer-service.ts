/**
 * ReportSynthesizerService — SCM-Grounded Report Analysis
 *
 * Synthesizes a full SCMGroundedReport from scored sources and extracted claims.
 * Single LLM call for narrative generation; all provenance flows through unchanged.
 *
 * @version 1.0.0
 * @methodVersion scm-grounded-report-v1
 */

import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { LLMFactory } from "@/lib/ai/llm-factory";
import { generateText } from "ai";
import {
    ClaimRecord,
    ComputeProvenance,
    DecisionGuidance,
    HypothesisEntry,
    CounterHypothesisEntry,
    FalsifierChecklistItem,
    PipelineConfig,
    ReportMeta,
    SCMGroundedReport,
    SCMNotes,
    SourceRecord,
    HonestFramingState,
    WarningCode,
} from "@/types/report-analysis";
import { HonestFramingService } from "./honest-framing-service";

export const REPORT_SYNTHESIZER_METHOD_VERSION =
    "scm-grounded-report-v1" as const;

function buildSynthesisPrompt(
    query: string,
    claims: ClaimRecord[],
    sources: SourceRecord[]
): string {
    const claimsSummary = claims
        .slice(0, 20)
        .map(
            (c, i) =>
                `[${i + 1}] ${c.text} (class=${c.claimClass}, confidence=${c.confidence.toFixed(2)}, tier=${c.evidenceTier})`
        )
        .join("\n");

    const sourceSummary = sources
        .slice(0, 10)
        .map((s) => `- ${s.domain}: credibility=${s.credibilityScore.toFixed(2)}`)
        .join("\n");

    return `You are an expert SCM-Grounded Research Analyst. Based on the following claims and sources about: "${query}"

CLAIMS:
${claimsSummary}

TOP SOURCES (by credibility):
${sourceSummary}

Generate a structured analysis in valid JSON with these fields:
{
  "executiveSummary": ["5 to 7 concise bullet strings"],
  "primaryHypotheses": [
    {"text": "...", "confidence": 0.0, "claimClass": "...", "supportingClaimIds": []}
  ],
  "counterHypotheses": [
    {"text": "...", "rationale": "...", "supportingClaimIds": []}
  ],
  "scmNotes": {
    "identifiableLinks": ["..."],
    "inferredLinks": ["..."],
    "latentConfounders": ["..."]
  },
  "unknownsAndGaps": ["..."],
  "decisionGuidance": {
    "safeConclude": ["..."],
    "notSafeConclude": ["..."]
  }
}

RULES:
- Never claim certainty beyond IDENTIFIED_CAUSAL evidence.
- "safeConclude" must only include things supported by IDENTIFIED_CAUSAL or INFERRED_CAUSAL claims.
- "notSafeConclude" must list anything that current evidence cannot support.
- Return ONLY the JSON object, no markdown, no explanation.`;
}

function computeInputHash(query: string, sourceIds: string[]): string {
    const sorted = [...sourceIds].sort().join(",");
    return createHash("sha256").update(`${query}|${sourceIds.length}|${sorted}`).digest("hex");
}

function buildFalsifierChecklist(claims: ClaimRecord[]): FalsifierChecklistItem[] {
    return claims
        .filter((c) => c.falsifierTests.length > 0)
        .flatMap((c) =>
            c.falsifierTests.map((test, i) => ({
                claimId: c.claimId,
                test,
                window: (c.confidence > 0.8 ? "7d" : "30d") as "7d" | "30d",
            }))
        );
}

// Persist using Admin Client because Synthesis Engine uses passcode auth and userId="system"
async function persistReport(
    report: SCMGroundedReport,
    userId: string = "system"
): Promise<void> {
    const supabase = createServerSupabaseAdminClient();
    const { error } = await supabase.from("scm_reports").insert({
        report_id: report.meta.reportId,
        report_version: report.meta.reportVersion,
        compute_run_id: report.meta.computeRunId,
        input_hash: report.meta.inputHash,
        query: report.meta.query,
        causal_depth: report.meta.causalDepth,
        allow_verified: report.meta.allowVerified,
        verification_failures: report.meta.verificationFailures,
        unknowns: report.meta.unknowns,
        method_version: report.meta.methodVersion,
        pipeline_config: report.meta.pipelineConfig,
        report_json: report,
        user_id: userId,
        generated_at: report.meta.generatedAt,
    });

    if (error) {
        console.error("[ReportSynthesizerService] Persistence failed:", error.message);
    }
}

interface NarrativeOutput {
    executiveSummary: string[];
    primaryHypotheses: HypothesisEntry[];
    counterHypotheses: CounterHypothesisEntry[];
    scmNotes: SCMNotes;
    unknownsAndGaps: string[];
    decisionGuidance: DecisionGuidance;
}

const NARRATIVE_FALLBACK: NarrativeOutput = {
    executiveSummary: ["Analysis was partially incomplete due to a synthesis error. Review individual claims below."],
    primaryHypotheses: [],
    counterHypotheses: [],
    scmNotes: { identifiableLinks: [], inferredLinks: [], latentConfounders: [] },
    unknownsAndGaps: ["Narrative synthesis failed — manual review required."],
    decisionGuidance: {
        safeConclude: [],
        notSafeConclude: ["All conclusions require manual verification; automated synthesis did not complete."],
    },
};

// Adapted to use LLMFactory properly via Vercel AI SDK
async function generateNarrative(
    query: string,
    claims: ClaimRecord[],
    sources: SourceRecord[]
): Promise<NarrativeOutput> {
    const prompt = buildSynthesisPrompt(query, claims, sources);

    try {
        const model = LLMFactory.getModel({ providerId: 'gemini', modelType: 'advanced' });

        const { text } = await generateText({
            model,
            prompt,
            temperature: 0.2,
        });

        // Strip markdown blocks if the LLM outputted them despite prompt instruction
        const cleanText = text.replace(/^```json/m, "").replace(/^```/m, "").trim();
        const parsed = JSON.parse(cleanText) as NarrativeOutput;
        return parsed;
    } catch (err) {
        console.error("[ReportSynthesizerService] Narrative generation failed:", err);
        return NARRATIVE_FALLBACK;
    }
}

export interface SynthesizeReportParams {
    query: string;
    sources: SourceRecord[];
    claims: ClaimRecord[];
    computeRunId: string;
    provenance: ComputeProvenance;
    pipelineConfig: PipelineConfig;
    noRuntimeGap: boolean;
    userId?: string;
}

export class ReportSynthesizerService {
    private static instance: ReportSynthesizerService;
    private readonly framingService: HonestFramingService;

    // Adapted for singleton & proper DI
    private constructor() {
        this.framingService = HonestFramingService.getInstance();
    }

    public static getInstance() {
        if (!ReportSynthesizerService.instance) {
            ReportSynthesizerService.instance = new ReportSynthesizerService();
        }
        return ReportSynthesizerService.instance;
    }

    async synthesizeReport(params: SynthesizeReportParams): Promise<SCMGroundedReport> {
        const {
            query,
            sources,
            claims,
            computeRunId,
            pipelineConfig,
            noRuntimeGap,
            userId,
        } = params;

        const framingResults = claims.map((claim) =>
            this.framingService.evaluateClaim({
                claim,
                allSources: sources,
                noRuntimeGap,
            })
        );

        const causalDepth: HonestFramingState = this.framingService.deriveReportState(framingResults);
        const allWarnings = framingResults.flatMap((r) => r.warningCodes);
        const verificationFailures = framingResults
            .flatMap((r) => r.downgradeReasons)
            .filter(Boolean);

        const inputHash = computeInputHash(
            query,
            sources.map((s) => s.sourceId)
        );

        const meta: ReportMeta = {
            reportId: uuidv4(),
            reportVersion: 1,
            computeRunId,
            inputHash,
            query,
            causalDepth,
            allowVerified: causalDepth === "verified",
            verificationFailures: [...new Set(verificationFailures)],
            unknowns: [],
            generatedAt: new Date().toISOString(),
            methodVersion: REPORT_SYNTHESIZER_METHOD_VERSION,
            pipelineConfig,
        };

        const narrative = await generateNarrative(query, claims, sources);
        meta.unknowns = narrative.unknownsAndGaps;

        const falsifierChecklist = buildFalsifierChecklist(claims);

        const report: SCMGroundedReport = {
            meta,
            sources,
            claims,
            executiveSummary: narrative.executiveSummary,
            primaryHypotheses: narrative.primaryHypotheses,
            counterHypotheses: narrative.counterHypotheses,
            scmNotes: narrative.scmNotes,
            falsifierChecklist,
            unknownsAndGaps: narrative.unknownsAndGaps,
            decisionGuidance: narrative.decisionGuidance,
        };

        persistReport(report, userId ?? "system").catch((err) =>
            console.error("[ReportSynthesizerService] Background persist error:", err)
        );

        return report;
    }
}
