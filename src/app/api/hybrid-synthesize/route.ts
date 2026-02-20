
import { NextRequest, NextResponse } from "next/server";
import { processMultiplePDFs } from "@/lib/extractors/pdf-extractor";
import { processMultipleCompanies } from "@/lib/extractors/company-extractor";
import {
  runEnhancedSynthesisPipeline,
  SynthesisResult,
  type EnhancedSynthesisConfig,
} from "@/lib/ai/synthesis-engine";
import { searchPriorArt } from "@/lib/ai/novelty-evaluator";
import { PersistenceService } from "@/lib/db/persistence-service";
import { PDFExtractionResult } from "@/lib/extractors/pdf-extractor";
import { StreamingEventEmitter } from "@/lib/streaming-event-emitter";
import { validateProtocol } from "@/lib/services/protocol-validator";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createInitialTimelineReceipt, updateTimelineStage } from "@/lib/hybrid/timeline";
import type { HybridTimelineReceipt, HybridTimelineStageKey, HybridTimelineStageState, HybridTimelineStageTelemetry } from "@/types/hybrid-timeline";
import { ClaimLedgerService } from "@/lib/services/claim-ledger-service";
import {
  DefaultScientificAnalysisService,
  type ScientificAnalysisEnvelope,
  type ScientificAnalysisRequest,
} from "@/lib/science/scientific-analysis-service";

// Synthesis limits configuration
const MAX_PDF_FILES = 6;
const MAX_COMPANIES = 5;
const MAX_IDEAS_FOR_COMPANY_ANALYSIS = 2;

export const maxDuration = 300; // Extended time to 5 minutes

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Get PDFs
    const files = formData.getAll("files") as File[];

    // Get company names (JSON array)
    const companiesJson = formData.get("companies") as string | null;
    const companies: string[] = companiesJson ? JSON.parse(companiesJson) : [];
    const researchFocus = formData.get("researchFocus") as string || "";
    // Default to Parallel Enabled (3 concurrent) for speed unless explicitly disabled
    const enableParallel = formData.get("enableParallelRefinement") !== "false";
    const concurrency = parseInt(formData.get("parallelConcurrency") as string) || 3;

    const totalSources = files.length + companies.length;

    if (totalSources < 2) {
      return NextResponse.json(
        { error: "Please provide at least 2 sources (PDFs and/or companies)" },
        { status: 400 }
      );
    }

    let userId = request.headers.get("x-user-id") || undefined;
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        userId = user.id;
      }
    } catch {
      // Keep header fallback for environments where auth is unavailable.
    }

    let clientAborted = false;
    request.signal.addEventListener("abort", () => {
      clientAborted = true;
    });

    const throwIfAborted = () => {
      if (clientAborted || request.signal.aborted) {
        throw new Error("Client disconnected. Synthesis aborted.");
      }
    };

    const stream = new ReadableStream({
      async start(controller) {
        const coreEmitter = new StreamingEventEmitter(controller);
        let timelineReceipt: HybridTimelineReceipt = createInitialTimelineReceipt();
        let latestSignal = "Synthesis run initialized.";

        const recordTimeline = (
          stage: HybridTimelineStageKey,
          state: HybridTimelineStageState,
          telemetry?: HybridTimelineStageTelemetry,
          timestamp?: string,
        ) => {
          timelineReceipt = updateTimelineStage(timelineReceipt, {
            stage,
            state,
            telemetry,
            timestamp,
          });
        };

        const emitter = {
          emit: (data: Record<string, unknown>) => {
            const event = typeof data.event === "string" ? data.event : "";
            const timestamp = typeof data.timestamp === "string" ? data.timestamp : new Date().toISOString();
            if (typeof data.message === "string") {
              latestSignal = data.message;
            } else if (event) {
              latestSignal = event.replaceAll("_", " ");
            }

            if (event === "tbe_telemetry" && data.isTriggered) {
              latestSignal = `Thermodynamic Expansion Triggered! (Temp: ${data.temperature})`;
            }

            if (
              event === "timeline_stage_started" ||
              event === "timeline_stage_progress" ||
              event === "timeline_stage_completed" ||
              event === "timeline_stage_skipped"
            ) {
              const stage = data.stage as HybridTimelineStageKey;
              const state = data.state as HybridTimelineStageState;
              const meta = (data.meta || {}) as HybridTimelineStageTelemetry;
              recordTimeline(stage, state, meta, timestamp);
            }

            coreEmitter.emit(data as never);
          },
          close: () => coreEmitter.close(),
        };

        try {
          throwIfAborted();
          emitter.emit({
            event: "timeline_stage_started",
            stage: "ingestion",
            state: "active",
            timestamp: new Date().toISOString(),
            meta: { totalFiles: files.length, companyCount: companies.length },
          });
          emitter.emit({ event: 'ingestion_start', files: files.length });
          emitter.emit({
            event: "timeline_stage_completed",
            stage: "ingestion",
            state: "done",
            timestamp: new Date().toISOString(),
            meta: { totalFiles: files.length, companyCount: companies.length },
          });

          // Step 1: Process PDFs to text
          const pdfResults: PDFExtractionResult[] = [];
          emitter.emit({
            event: "timeline_stage_started",
            stage: "pdf_parsing",
            state: "active",
            timestamp: new Date().toISOString(),
            meta: { processedFiles: 0, totalFiles: files.length },
          });

          // Phase E: Prepare buffers for parallel scientific analysis
          const fileBuffers: { buffer: ArrayBuffer; name: string }[] = [];

          for (const file of files) {
            throwIfAborted();
            const buffer = await file.arrayBuffer();
            fileBuffers.push({ buffer, name: file.name });
            const { successful } = await processMultiplePDFs([{ buffer, name: file.name }]);
            if (successful.length > 0) {
              pdfResults.push(successful[0]);
              emitter.emit({ event: 'pdf_processed', filename: file.name });
              emitter.emit({
                event: "timeline_stage_progress",
                stage: "pdf_parsing",
                state: "active",
                timestamp: new Date().toISOString(),
                meta: { processedFiles: pdfResults.length, totalFiles: files.length, signal: file.name },
              });
            } else {
              emitter.emit({ event: 'pdf_error', filename: file.name, error: "Extraction failed" });
            }
          }
          emitter.emit({
            event: "timeline_stage_completed",
            stage: "pdf_parsing",
            state: "done",
            timestamp: new Date().toISOString(),
            meta: { processedFiles: pdfResults.length, totalFiles: files.length },
          });

          // Phase E (Contract §C): Run scientific analysis IN PARALLEL
          // Graceful degradation — failure does NOT block hybrid synthesis (§B)
          let scientificEnvelope: ScientificAnalysisEnvelope | null = null;
          try {
            if (fileBuffers.length > 0 && userId) {
              const analysisService = new DefaultScientificAnalysisService();
              const analysisRequests: ScientificAnalysisRequest[] = fileBuffers.map((fb) => ({
                userId: userId!,
                pdfBuffer: fb.buffer,
                fileName: fb.name,
                context: { feature: "hybrid" as const },
              }));

              // Contract §C: concurrency cap of 2
              scientificEnvelope = await analysisService.runBatch(analysisRequests, 2);

              emitter.emit({
                event: "scientific_analysis_complete",
                pdfCount: scientificEnvelope.requestSummary.pdfCount,
                completed: scientificEnvelope.requestSummary.completedCount,
                failed: scientificEnvelope.requestSummary.failedCount,
              });
            }
          } catch (sciErr) {
            // Contract §B: Never fail the overall request
            console.warn('[Hybrid] Scientific analysis batch failed (non-fatal):', sciErr);
            emitter.emit({
              event: "scientific_analysis_failed",
              reason: sciErr instanceof Error ? sciErr.message : "unknown_error",
            });
          }

          // Step 2: Process Companies
          const companyResults: PDFExtractionResult[] = [];
          if (companies.length > 0) {
            emitter.emit({
              event: "timeline_stage_started",
              stage: "entity_harvest",
              state: "active",
              timestamp: new Date().toISOString(),
              meta: { companyCount: companies.length, resolvedEntities: 0 },
            });
            throwIfAborted();
            const { successful } = await processMultipleCompanies(companies);
            let resolvedEntities = 0;
            for (const company of successful) {
              throwIfAborted();
              resolvedEntities += company.extractedConcepts?.entities?.length ?? 0;
              companyResults.push({
                fileName: company.companyName,
                fullText: JSON.stringify(company.extractedConcepts),
                totalPages: 0,
                chunks: [],
                sourceType: 'company'
              } as PDFExtractionResult);
              emitter.emit({ event: 'pdf_processed', filename: `Company: ${company.companyName}` });
              emitter.emit({
                event: "timeline_stage_progress",
                stage: "entity_harvest",
                state: "active",
                timestamp: new Date().toISOString(),
                meta: { companyCount: companies.length, resolvedEntities, signal: company.companyName },
              });
            }
            emitter.emit({
              event: "timeline_stage_completed",
              stage: "entity_harvest",
              state: "done",
              timestamp: new Date().toISOString(),
              meta: { companyCount: companies.length, resolvedEntities },
            });
          } else {
            emitter.emit({
              event: "timeline_stage_skipped",
              stage: "entity_harvest",
              state: "skipped",
              timestamp: new Date().toISOString(),
              meta: { reason: "no_companies" },
            });
          }

          // Step 3: Run Pipeline with Emitter
          const combinedSources = [...pdfResults, ...companyResults];
          const persistence = new PersistenceService();

          const config = {
            maxRefinementIterations: 2,
            priorArtSearchFn: searchPriorArt,
            priorRejectionCheckFn: (t: string, m: string, d?: string) => persistence.checkRejection(t, m, d),
            validateProtocolFn: validateProtocol,
            eventEmitter: emitter,
            researchFocus: researchFocus || undefined,
            enableParallelRefinement: enableParallel,
            parallelConcurrency: concurrency,
            userId: userId, // Add explicitly to config
            noveltyProofEnabled: process.env.HYBRID_NOVELTY_PROOF_V1 !== "false",
            abortSignal: request.signal,
          } as unknown as EnhancedSynthesisConfig;

          throwIfAborted();
          const result: SynthesisResult = await runEnhancedSynthesisPipeline(combinedSources, config);
          throwIfAborted();
          emitter.emit({
            event: "timeline_stage_started",
            stage: "completed",
            state: "active",
            timestamp: new Date().toISOString(),
            meta: { signal: "persisting_run" },
          });

          // Make sure optional recovery stage is explicit even when not emitted upstream.
          if (result.noveltyGate?.decision === "pass") {
            emitter.emit({
              event: "timeline_stage_skipped",
              stage: "recovery_plan",
              state: "skipped",
              timestamp: new Date().toISOString(),
              meta: { reason: "gate_passed" },
            });
          }

          if (!result.noveltyGate) {
            emitter.emit({
              event: "timeline_stage_skipped",
              stage: "novelty_gate",
              state: "skipped",
              timestamp: new Date().toISOString(),
              meta: { reason: "novelty_gate_unavailable" },
            });
          }

          // Step 4: Persist
          const resultWithTimeline: SynthesisResult = {
            ...result,
            timelineReceipt: {
              ...timelineReceipt,
              latestSignal,
            },
          };
          const saveStatus = await persistence.saveSynthesis(resultWithTimeline, userId);
          emitter.emit({
            event: "timeline_stage_completed",
            stage: "completed",
            state: "done",
            timestamp: new Date().toISOString(),
            meta: { signal: "persisted_and_streaming_complete" },
          });

          const finalResult = {
            ...resultWithTimeline,
            timelineReceipt: {
              ...timelineReceipt,
              latestSignal: "Synthesis completed.",
            },
            runId: saveStatus?.runId
          };

          if (userId) {
            try {
              const supabase = await createServerSupabaseClient();
              const claimLedger = new ClaimLedgerService(supabase);
              const topClaimText =
                result.selectedIdea?.thesis ||
                result.selectedIdea?.description ||
                result.novelIdeas?.[0]?.thesis ||
                result.structuredApproach?.proposedSolution ||
                `Hybrid synthesis run ${saveStatus?.runId || 'unknown'} completed.`;

              const claimId = await claimLedger.recordClaim({
                userId,
                traceId: saveStatus?.runId,
                sourceFeature: 'hybrid',
                claimText: topClaimText,
                claimKind: 'hypothesis',
                confidenceScore: typeof result.selectedIdea?.confidence === 'number' ? result.selectedIdea.confidence : undefined,
                uncertaintyLabel: result.noveltyGate?.decision === 'pass' ? 'low' : 'medium',
                modelKey: 'hybrid_synthesis_pipeline',
                modelVersion: 'v2',
                evidenceLinks: [
                  ...combinedSources.slice(0, 12).map((source) => ({
                    evidenceType: 'source' as const,
                    evidenceRef: source.fileName,
                    snippet: source.fullText?.slice(0, 240),
                    metadata: { sourceType: source.sourceType || 'pdf' },
                  })),
                  // Contract §D: Link scientific provenance to claim ledger
                  ...(scientificEnvelope?.scientificAnalysis ?? []).filter(a => a.provenance).map(a => ({
                    evidenceType: 'scientific_provenance' as const,
                    evidenceRef: a.provenance!.ingestionId,
                    snippet: `tables=${a.summary.tableCount} points=${a.summary.dataPointCount} compute=${a.provenance!.computeRunId ?? 'none'}`,
                    metadata: {
                      sourceType: 'automated_scientist',
                      methodVersion: a.provenance!.methodVersion,
                      sourceTableIds: a.provenance!.sourceTableIds,
                      dataPointIds: a.provenance!.dataPointIds,
                    },
                  })),
                ],
                gateDecisions: result.noveltyGate
                  ? [
                    {
                      gateName: 'novelty_gate',
                      decision:
                        result.noveltyGate.decision === 'pass'
                          ? 'pass'
                          : result.noveltyGate.decision === 'recover'
                            ? 'warn'
                            : 'fail',
                      rationale: result.noveltyGate.reasons.join(' | ') || `Novelty gate: ${result.noveltyGate.decision}`,
                      score: result.noveltyGate.threshold,
                      metadata: {
                        proofCount: result.noveltyProof?.length || 0,
                      },
                    },
                  ]
                  : [],
                receipts: [
                  {
                    receiptType: 'emission',
                    actor: 'hybrid-synthesize-api',
                    receiptJson: {
                      runId: saveStatus?.runId || null,
                      sourceCount: combinedSources.length,
                    },
                  },
                ],
              });

              emitter.emit({ event: 'claim_recorded', claimId });
            } catch (claimError) {
              console.warn('[Hybrid] Failed to record claim ledger entry:', claimError);
              emitter.emit({
                event: 'claim_record_failed',
                reason: claimError instanceof Error ? claimError.message : 'unknown_error',
              });
            }
          }

          // Contract §A: SSE complete payload includes scientificAnalysis + featureContext
          emitter.emit({
            event: 'complete',
            synthesis: finalResult,
            ...(scientificEnvelope ? {
              scientificAnalysis: scientificEnvelope.scientificAnalysis,
              featureContext: scientificEnvelope.featureContext,
            } : {}),
          });

        } catch (error) {
          console.error("Streaming synthesis error:", error);
          if (!clientAborted && !request.signal.aborted) {
            emitter.emit({
              event: "timeline_stage_completed",
              stage: "completed",
              state: "blocked",
              timestamp: new Date().toISOString(),
              meta: { signal: error instanceof Error ? error.message : "runtime_error" },
            });
          }
          if (!clientAborted && !request.signal.aborted) {
            emitter.emit({ event: 'error', message: error instanceof Error ? error.message : "Synthesis failed" });
          }
        } finally {
          emitter.close();
        }
      },
      cancel() {
        clientAborted = true;
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("Route handler error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
