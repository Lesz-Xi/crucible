import { createServerSupabaseClient } from "../supabase/server";
import { SynthesisResult, NovelIdea, MasaAudit } from "../../types";
import { generateEmbedding } from "../ai/gemini";
import { SpectralService } from "../services/spectral-service";

export class PersistenceService {
  /**
   * Saves a full synthesis run and its results to Supabase
   */
  async saveSynthesis(result: SynthesisResult): Promise<{ runId: string } | null> {
    try {
      const supabase = await createServerSupabaseClient();

      // 1. Create Synthesis Run
      const { data: run, error: runError } = await supabase
        .from("synthesis_runs")
        .insert({
          sources: result.sources.map(s => ({ name: s.name, thesis: s.concepts.mainThesis })),
          total_ideas: result.novelIdeas.length,
          status: "completed",
          structured_approach: result.structuredApproach,
          contradictions: result.contradictions
        })
        .select()
        .single();

      if (runError || !run) {
        console.error("Failed to create synthesis run:", runError);
        return null;
      }

      // 2. Create Results (Novel Ideas)
      for (const idea of result.novelIdeas) {
        const artifacts = (idea as any).scientificArtifacts;
        const { data: savedIdea, error: ideaError } = await supabase
          .from("synthesis_results")
          .insert({
            run_id: run.id,
            thesis: idea.thesis,
            description: idea.description,
            mechanism: idea.mechanism,
            confidence: idea.confidence,
            explanation_depth: idea.explanationDepth,
            novelty_assessment: idea.noveltyAssessment,
            scientific_prose: (idea as any).scientificProse,
            structured_hypothesis: idea.structuredHypothesis,
            evidence_snippets: idea.evidenceSnippets,
            prior_art: idea.priorArt,
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
        const masaAudit = (idea as any).masaAudit as MasaAudit;
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
          
          await this.saveIdeaEmbedding(savedIdea.id, embeddingText, isRejected, rejectReason);

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
  async getHistoricalRuns(limit = 10): Promise<any[]> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("synthesis_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

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
  async getRunDetails(runId: string): Promise<any | null> {
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
      const { data: run, error: runError } = await supabase
        .from("synthesis_runs")
        .select("*")
        .eq("id", runId)
        .single();

      if (runError) throw runError;

      return {
        ...run,
        structuredApproach: run.structured_approach,
        contradictions: run.contradictions || [],
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
   */
  async checkRejection(thesis: string, mechanism: string): Promise<boolean> {
    try {
      const supabase = await createServerSupabaseClient();
      const text = `Thesis: ${thesis}\nMechanism: ${mechanism}`;
      const embedding = await generateEmbedding(text);
      
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
   */
  async saveIdeaEmbedding(ideaId: string, text: string, isRejected: boolean, reason?: string) {
      try {
          const supabase = await createServerSupabaseClient();
          const embedding = await generateEmbedding(text);
          
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
