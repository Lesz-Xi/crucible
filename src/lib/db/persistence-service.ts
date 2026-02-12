import { createServerSupabaseClient } from "../supabase/server";
import { NovelIdea, MasaAudit } from "../../types";
import { SynthesisResult } from "../ai/synthesis-engine";
import { generateEmbedding } from "../ai/gemini";
import { DomainProjector } from "../services/embedding-service";
import { SpectralService } from "../services/spectral-service";

interface ScientificArtifacts {
  protocolCode?: string;
  labManual?: string;
  labJob?: string;
}

interface NovelIdeaExtended extends NovelIdea {
  scientificArtifacts?: ScientificArtifacts;
  scientificProse?: string;
  masaAudit?: MasaAudit;
  domain?: string;
}

type JsonRecord = Record<string, unknown>;

function toJsonRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as JsonRecord;
}

export class PersistenceService {
  /**
   * Saves a full synthesis run and its results to Supabase
   */
  async saveSynthesis(result: SynthesisResult, userId?: string): Promise<{ runId: string } | null> {
    try {
      const supabase = await createServerSupabaseClient();

      // 1. Create Synthesis Run
      const structuredApproachPayload = {
        ...(result.structuredApproach || {}),
        __noveltyProof: result.noveltyProof || [],
        __noveltyGate: result.noveltyGate || null,
        __recoveryPlan: result.recoveryPlan || null,
        __contradictionMatrix: result.contradictionMatrix || [],
        __timelineReceipt: result.timelineReceipt || null,
      };

      const { data: run, error: runError } = await supabase
        .from("synthesis_runs")
        .insert({
          user_id: userId ?? null,
          sources: result.sources.map(s => ({ name: s.name, thesis: s.concepts.mainThesis })),
          total_ideas: result.novelIdeas.length,
          status: "completed",
          structured_approach: structuredApproachPayload,
          contradictions: result.contradictionMatrix && result.contradictionMatrix.length > 0
            ? result.contradictionMatrix
            : result.contradictions
        })
        .select()
        .single();

      if (runError || !run) {
        console.error("Failed to create synthesis run:", runError);
        return null;
      }

      // 2. Create Results (Novel Ideas)
      for (const idea of result.novelIdeas) {
        const ideaExtended = idea as NovelIdeaExtended;
        const artifacts = ideaExtended.scientificArtifacts;
        const { data: savedIdea, error: ideaError } = await supabase
          .from("synthesis_results")
          .insert({
            run_id: run.id,
            thesis: idea.thesis,
            description: idea.description,
            mechanism: idea.mechanism,
            confidence: idea.confidence,
            novelty_assessment: idea.noveltyAssessment,
            scientific_prose: ideaExtended.scientificProse,
            structured_hypothesis: idea.structuredHypothesis,
            protocol_code: artifacts?.protocolCode,
            lab_manual: artifacts?.labManual,
            lab_job: artifacts?.labJob
          })
          .select()
          .single();

        if (ideaError || !savedIdea) {
          console.error("Failed to save novel idea:", ideaError);
          continue;
        }

        // 3. Save Audit Trace if available
        // Note: The engine now attaches masaAudit to idea during the loop
        const masaAudit = ideaExtended.masaAudit;
        if (masaAudit) {
          const { error: auditError } = await supabase
            .from("audit_traces")
            .insert({
              result_id: savedIdea.id,
              epistemologist_critique: masaAudit.methodologist.critique,
              epistemologist_score: masaAudit.methodologist.score,
              skeptic_critique: masaAudit.skeptic.critique,
              skeptic_score: masaAudit.skeptic.score,
              skeptic_biases: masaAudit.skeptic.biasesDetected,
              architect_verdict: masaAudit.finalSynthesis.architectVerdict || "N/A",
              architect_score: masaAudit.finalSynthesis.validityScore,
              is_approved: masaAudit.finalSynthesis.isApproved,
              remediation_plan: masaAudit.finalSynthesis.remediationPlan
            });

          if (auditError) {
            console.error("Failed to save audit trace:", auditError);
          }

          // 4. Save Vector Embedding (for Long-Term Memory)
          const embeddingText = `Thesis: ${idea.thesis}\nMechanism: ${idea.mechanism || ""}`;
          const isRejected = !masaAudit.finalSynthesis.isApproved;
          const rejectReason = isRejected ? masaAudit.finalSynthesis.architectVerdict : undefined;

          // Phase 3: Domain-Aware Storage
          const domain = ideaExtended.domain || "General";
          await this.saveIdeaEmbedding(savedIdea.id, embeddingText, isRejected, rejectReason, domain);

          // 5. Cognitive Sovereignty: Spectral Interference Check
          const spectralService = new SpectralService();
          const embedding = await generateEmbedding(embeddingText);
          const interference = await spectralService.calculateInterference(embedding);

          // Convert Map to plain object for JSONB storage
          const interferenceObj = Object.fromEntries(interference);

          // Save spectral metrics to database
          if (Object.keys(interferenceObj).length > 0) {
            await supabase
              .from("synthesis_results")
              .update({ spectral_interference: interferenceObj })
              .eq("id", savedIdea.id);

            console.log(`[Persistence] Spectral Interference for ${idea.thesis.slice(0, 30)}...`);
            for (const [domain, strength] of interference) {
              if (strength > 0.5) {
                console.warn(`⚠️ High Interference with domain [${domain}]: ${strength.toFixed(2)}`);
              }
            }
          }
        }
      }

      return { runId: run.id };
    } catch (error) {
      console.error("Persistence Error:", error);
      return null;
    }
  }

  /**
   * Fetches the most recent synthesis runs
   */
  async getHistoricalRuns(limit = 10, userId?: string): Promise<JsonRecord[]> {
    try {
      const supabase = await createServerSupabaseClient();
      let query = supabase
        .from("synthesis_runs")
        .select("*")
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query.limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to fetch historical runs:", error);
      return [];
    }
  }

  /**
   * Fetches full details for a synthesis run including results and audits
   */
  async getRunDetails(runId: string, userId?: string): Promise<JsonRecord | null> {
    try {
      const supabase = await createServerSupabaseClient();

      // Fetch ideas and their audits
      const { data: ideas, error: ideasError } = await supabase
        .from("synthesis_results")
        .select(`
          *,
          audit_traces (*)
        `)
        .eq("run_id", runId);

      if (ideasError) throw ideasError;

      // Fetch run metadata
      let runQuery = supabase
        .from("synthesis_runs")
        .select("*")
        .eq("id", runId);

      if (userId) {
        runQuery = runQuery.eq("user_id", userId);
      }

      const { data: run, error: runError } = await runQuery.maybeSingle();

      if (runError) throw runError;
      if (!run) return null;

      return {
        ...run,
        structuredApproach: toJsonRecord(run.structured_approach),
        contradictions: Array.isArray(run.contradictions) ? run.contradictions : [],
        contradictionMatrix: Array.isArray(toJsonRecord(run.structured_approach).__contradictionMatrix)
          ? toJsonRecord(run.structured_approach).__contradictionMatrix
          : [],
        noveltyProof: Array.isArray(toJsonRecord(run.structured_approach).__noveltyProof)
          ? toJsonRecord(run.structured_approach).__noveltyProof
          : [],
        noveltyGate: toJsonRecord(run.structured_approach).__noveltyGate || null,
        recoveryPlan: toJsonRecord(run.structured_approach).__recoveryPlan || null,
        timelineReceipt: toJsonRecord(run.structured_approach).__timelineReceipt || null,
        novelIdeas: (ideas || []).map(idea => ({
          ...idea,
          priorArt: idea.prior_art,
          scientificArtifacts: {
            protocolCode: idea.protocol_code || '',
            labManual: idea.lab_manual || '',
            labJob: idea.lab_job
          },
          spectralInterference: idea.spectral_interference ?
            new Map(Object.entries(idea.spectral_interference)) : undefined,
          criticalAnalysis: idea.audit_traces?.[0] ? {
            verdict: idea.audit_traces[0].architect_verdict,
            isApproved: idea.audit_traces[0].is_approved,
            remediationPlan: idea.audit_traces[0].remediation_plan
          } : undefined,
          masaAudit: idea.audit_traces?.[0] ? {
            methodologist: {
              critique: idea.audit_traces[0].epistemologist_critique,
              score: idea.audit_traces[0].epistemologist_score
            },
            skeptic: {
              critique: idea.audit_traces[0].skeptic_critique,
              score: idea.audit_traces[0].skeptic_score,
              biasesDetected: idea.audit_traces[0].skeptic_biases
            },
            finalSynthesis: {
              architectVerdict: idea.audit_traces[0].architect_verdict,
              validityScore: idea.audit_traces[0].architect_score,
              isApproved: idea.audit_traces[0].is_approved,
              remediationPlan: idea.audit_traces[0].remediation_plan
            }
          } : undefined
        }))
      };
    } catch (error) {
      console.error(`Failed to fetch run details for ${runId}:`, error);
      return null;
    }
  }

  /**
   * Vector Memory: Check if this idea matches a previously rejected concept
   * Phase 3: Support domain-aware Vector-Space Orthogonality
   */
  async checkRejection(thesis: string, mechanism: string, domain?: string): Promise<boolean> {
    try {
      const supabase = await createServerSupabaseClient();
      const text = `Thesis: ${thesis}\nMechanism: ${mechanism}`;
      let embedding = await generateEmbedding(text);

      // Phase 3: Orthogonal Manifold Projection
      if (domain) {
        embedding = DomainProjector.project(embedding, domain);
      }

      const { data, error } = await supabase.rpc('match_idea_embeddings', {
        query_embedding: embedding,
        match_threshold: 0.90, // Strict similarity
        match_count: 1
      });

      if (error) {
        // If RPC missing, ignore (migration might not run yet)
        console.warn("Vector search failed (RPC likely missing):", error.message);
        return false;
      }

      if (data && data.length > 0 && data[0].is_rejected) {
        console.log(`[Persistence] BLOCKED: Found similar rejected idea. Reason: ${data[0].rejection_reason}`);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Vector Search Exception:", e);
      return false;
    }
  }

  /**
   * Helper: Save embedding to idea_embeddings table
   * Phase 3: Support domain-aware Vector-Space Orthogonality
   */
  async saveIdeaEmbedding(ideaId: string, text: string, isRejected: boolean, reason?: string, domain?: string) {
    try {
      const supabase = await createServerSupabaseClient();
      let embedding = await generateEmbedding(text);

      // Phase 3: Orthogonal Manifold Projection
      if (domain) {
        embedding = DomainProjector.project(embedding, domain);
      }

      await supabase.from("idea_embeddings").insert({
        idea_id: ideaId,
        embedding: embedding,
        is_rejected: isRejected,
        rejection_reason: reason
      });
    } catch (e) {
      console.error("Failed to save idea embedding:", e);
    }
  }
}
