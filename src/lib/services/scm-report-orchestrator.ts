import { v7 as uuidv7 } from "uuid";
import { RetrievalOrchestratorService } from "./retrieval-orchestrator-service";
import { SourceScoringService } from "./source-scoring-service";
import { EvidenceExtractionService } from "./evidence-extraction-service";
import { ReportSynthesizerService } from "./report-synthesizer-service";
import { StreamingEventEmitter } from "@/lib/streaming-event-emitter";
import { SCMGroundedReport, PipelineConfig, ComputeProvenance } from "@/types/report-analysis";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server-admin";

type MinimalSupabase = {
  from: (table: string) => {
    insert: (rows: unknown[]) => Promise<{ error?: unknown }>;
  };
};

export class SCMReportOrchestrator {
  private retrievalService: RetrievalOrchestratorService;
  private scoringService: SourceScoringService;
  private extractionService: EvidenceExtractionService;
  private synthesizerService: ReportSynthesizerService;
  private supabase: MinimalSupabase;

  constructor(deps?: {
    retrievalService?: RetrievalOrchestratorService;
    scoringService?: SourceScoringService;
    extractionService?: EvidenceExtractionService;
    synthesizerService?: ReportSynthesizerService;
    supabase?: MinimalSupabase;
  }) {
    this.retrievalService = deps?.retrievalService ?? RetrievalOrchestratorService.getInstance();
    this.scoringService = deps?.scoringService ?? SourceScoringService.getInstance();
    this.extractionService = deps?.extractionService ?? EvidenceExtractionService.getInstance();
    this.synthesizerService = deps?.synthesizerService ?? ReportSynthesizerService.getInstance();
    this.supabase = deps?.supabase ?? (createServerSupabaseAdminClient() as unknown as MinimalSupabase);
  }

  /**
   * Orchestrates the SCM report pipeline and streams progress/heartbeat events.
   */
  async generateReport(
    query: string,
    options: { k?: number; noRuntimeGap?: boolean; heartbeatIntervalMs?: number; timeoutMs?: number } = {},
    streamEmitter: StreamingEventEmitter
  ): Promise<SCMGroundedReport> {
    const computeRunId = uuidv7();
    const reportId = uuidv7();
    const startTime = Date.now();
    const k = options.k || 20;
    const timeoutMs = options.timeoutMs || 55_000; // Default 55s (safe buffer for 60s Vercel limit)

    let currentStage = 1;
    const heartbeatMs = Math.max(500, options.heartbeatIntervalMs ?? 10_000);

    streamEmitter.emit({
      event: "report_pipeline_start",
      computeRunId,
      estimatedSteps: 4,
    });

    const heartbeatTimer = setInterval(() => {
      streamEmitter.emit({
        event: "report_heartbeat",
        elapsedMs: Date.now() - startTime,
        stage: currentStage,
      });
    }, heartbeatMs);

    const pipelineConfig: PipelineConfig = {
      queryFamilyCount: 5,
      kResultsPerQuery: Math.min(15, k),
      maxExcerptChars: 2000,
      braveDomain: "api.search.brave.com",
    };

    const provenance: ComputeProvenance = {
      computeRunId,
      model: "gemini-2.5-flash",
      promptVersion: "scm-orchestrator-v1.0",
      inputHash: "dynamic",
      methodVersion: "scm-orchestrator-v1.0",
    };

    // Helper to check if we're approaching timeout
    const checkTimeout = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > timeoutMs) {
        throw new Error(`Pipeline timeout after ${elapsed}ms (limit: ${timeoutMs}ms)`);
      }
    };

    try {
      currentStage = 1;
      checkTimeout();
      streamEmitter.emit({
        event: "report_stage_progress",
        stage: 1,
        label: "retrieval",
        detail: "Planning queries and retrieving raw sources...",
      });

      let retrievedSources: Awaited<ReturnType<RetrievalOrchestratorService["orchestrateRetrieval"]>> = {
        sources: [],
        failedFamilies: [],
      };

      try {
        retrievedSources = await this.retrievalService.orchestrateRetrieval({
          query,
          k,
          computeRunId,
        });
      } catch (err: any) {
        if (err?.name === "BraveUnavailableError") {
          streamEmitter.emit({
            event: "report_pipeline_error",
            stage: 1,
            error: "Brave Search unavailable. Degrading to heuristic synthesis with empty retrieval.",
            warningCode: "VERIFIED_DOWNGRADED_RUNTIME_GAP",
          });
        } else {
          throw err;
        }
      }

      currentStage = 2;
      checkTimeout();
      streamEmitter.emit({
        event: "report_stage_progress",
        stage: 2,
        label: "scoring",
        detail: "Scoring source credibility, recency, and corroboration...",
      });

      // Retrieval service already returns scored sources; keep this stage explicit for telemetry.
      const scoredSources = retrievedSources.sources;

      if (scoredSources.length > 0) {
        await this.supabase
          .from("scm_report_sources")
          .insert(
            scoredSources.map((s) => ({
              compute_run_id: computeRunId,
              source_id: s.sourceId,
              url: s.url,
              domain: s.domain,
              published_at: s.publishedAt,
              credibility_score: s.credibilityScore,
              recency_score: s.recencyScore,
              corroboration_score: s.corroborationScore,
              excerpt: s.excerpt,
              ingestion_id: s.ingestionId,
            }))
          )
          .catch((e) => console.error("Source persistence failed:", e));
      }

      currentStage = 3;
      streamEmitter.emit({
        event: "report_stage_progress",
        stage: 3,
        label: "extraction",
        detail: "Extracting factual and causal claims from evidence...",
      });

      const claims = await this.extractionService.extractClaimsBatch(
        query,
        scoredSources,
        computeRunId,
        reportId
      );

      if (claims.length > 0) {
        await this.supabase
          .from("scm_report_claims")
          .insert(
            claims.map((c: any) => ({
              claim_id: c.claimId,
              compute_run_id: computeRunId,
              report_id: reportId,
              claim_text: c.text ?? c.claimText,
              entities: c.entities,
              event_time: c.eventTime,
              source_ids: c.sourceIds,
              evidence_tier: c.evidenceTier,
              claim_class: c.claimClass,
              scm_edge_support: c.scmEdgeSupport,
              confidence: c.confidence,
              warning_codes: c.warningCodes,
              falsifier_tests: c.falsifierTests,
              provenance_model: c.provenance?.model ?? c.provenanceModel ?? "unknown",
              provenance_prompt_version: c.provenance?.promptVersion ?? c.provenancePromptVersion ?? "unknown",
              provenance_input_hash: c.provenance?.inputHash ?? c.provenanceInputHash ?? "unknown",
              provenance_method_version: c.provenance?.methodVersion ?? c.provenanceMethodVersion ?? "unknown",
            }))
          )
          .catch((e) => console.error("Claim persistence failed:", e));
      }

      currentStage = 4;
      checkTimeout();
      streamEmitter.emit({
        event: "report_stage_progress",
        stage: 4,
        label: "synthesis",
        detail: "Applying Honest Framing and synthesizing final report...",
      });

      const finalReport = await this.synthesizerService.synthesizeReport({
        query,
        sources: scoredSources,
        claims,
        computeRunId,
        reportId,
        provenance,
        pipelineConfig,
        noRuntimeGap: options.noRuntimeGap ?? retrievedSources.failedFamilies.length === 0,
      });

      streamEmitter.emit({
        event: "report_stage_progress",
        stage: 5,
        label: "complete",
        detail: "Pipeline complete.",
      });

      return finalReport;
    } catch (error) {
      console.error("[SCMReportOrchestrator] Error during pipeline:", error);
      throw error;
    } finally {
      clearInterval(heartbeatTimer);
    }
  }
}
