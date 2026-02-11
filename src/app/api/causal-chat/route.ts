import { NextRequest, NextResponse } from "next/server";
import { getClaudeModel } from "@/lib/ai/anthropic";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DomainClassifier } from "@/lib/services/domain-classifier";
import { SCMRetriever } from "@/lib/services/scm-retrieval";
import { ConstraintInjector } from "@/lib/services/constraint-injector";
import { StreamingCausalAnalyzer } from "@/lib/services/streaming-causal-analyzer";
import { createOracleModeService } from "@/lib/services/oracle-mode-service";
import { StructuralCausalModel } from "@/lib/ai/causal-blueprint";
import { evaluateInterventionGate } from "@/lib/services/identifiability-gate";

import { CausalSolver, type Intervention } from '@/lib/services/causal-solver';
import { CounterfactualGenerator } from '@/lib/services/counterfactual-generator';
import { selectLatestAlignmentAuditReport } from "@/lib/services/alignment-audit";
import { buildConversationContext, normalizeChatTurns, type ChatTurn } from "@/lib/services/conversation-context";

// Using Node.js runtime for full access to filesystem (schema loading)
// export const runtime = "edge"; // Removed: Edge doesn't support 'path' module
let causalDensityColumnAvailable: boolean | null = null;

function buildDomainClassificationInput(messages: ChatTurn[], userQuestion: string): string {
  const recentUserContext = messages
    .filter((message) => message.role === "user")
    .slice(-4)
    .map((message) => message.content);
  const current = typeof userQuestion === "string" ? userQuestion.trim() : "";
  const contextJoined = recentUserContext.join(" ");
  const lastUserTurn = recentUserContext[recentUserContext.length - 1] || "";
  const alreadyIncludedCurrent = lastUserTurn.toLowerCase() === current.toLowerCase();

  if (current.length === 0 || alreadyIncludedCurrent) {
    return contextJoined;
  }
  return `${contextJoined} ${current}`.trim();
}

async function verifyCausalDensityColumn(supabase: any): Promise<boolean> {
  if (!supabase) return false;
  if (causalDensityColumnAvailable !== null) return causalDensityColumnAvailable;

  const { error } = await supabase
    .from("causal_chat_messages")
    .select("causal_density")
    .limit(1);

  if (error) {
    const isMissingColumn = /causal_density|column/i.test(error.message || "");
    if (isMissingColumn) {
      console.warn(
        "[CausalChat] causal_density column missing. Apply migration 20260129_add_axiom_compression_trigger.sql. Falling back without causal_density persistence."
      );
      causalDensityColumnAvailable = false;
      return false;
    }

    console.warn("[CausalChat] Unable to verify causal_density column; disabling density persistence fallback:", error);
    causalDensityColumnAvailable = false;
    return false;
  }

  causalDensityColumnAvailable = true;
  return true;
}

function inferOutcomeVariableFromScm(scm: StructuralCausalModel): string {
  const nodes = scm.getFullStructure().nodes.map((node) => node.name);
  const priorityTokens = ["outcome", "performance", "failure", "risk", "harm"];

  for (const node of nodes) {
    const normalized = node.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (priorityTokens.some((token) => normalized.includes(token))) {
      return node;
    }
  }

  return nodes[nodes.length - 1] || "Outcome";
}

function sanitizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
    )
  );
}

export async function POST(req: NextRequest) {
  let supabase = null;
  let user = null;

  try {
    supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.warn("[CausalChat] Supabase initialization failed (Persistence disabled):", error);
  }

  // Authentication is optional for MVP

  // Check for API Keys early
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[CausalChat] ANTHROPIC_API_KEY is missing");
    return NextResponse.json({
      error: "Configuration Error: API Key missing. Please check your .env file."
    }, { status: 500 });
  }

  const requestBody = await req.json();
  const {
    question,
    messages,
    sessionId,
    intervention,
    modelKey,
  } = requestBody;

  // Support both single question and message history
  const fallbackQuestion = Array.isArray(messages) ? messages[messages.length - 1]?.content : "";
  const userQuestion =
    typeof question === "string" && question.trim().length > 0
      ? question
      : typeof fallbackQuestion === "string"
        ? fallbackQuestion
        : "";

  if (!userQuestion) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const normalizedIncomingMessages = normalizeChatTurns(messages);
  const contextResult = buildConversationContext(normalizedIncomingMessages, userQuestion, {
    maxContextChars: 60000,
  });
  const domainClassificationInput = buildDomainClassificationInput(normalizedIncomingMessages, userQuestion);
  console.log(
    `[CausalChat] Context telemetry: included=${contextResult.includedTurns}, truncated=${contextResult.truncatedTurns}, chars=${contextResult.promptContext.length}, prior=${contextResult.hasPriorContext}, ambiguous=${contextResult.ambiguousReference}`
  );

  const encoder = new TextEncoder();
  const domainClassifier = new DomainClassifier();
  const scmRetriever = new SCMRetriever();
  const constraintInjector = new ConstraintInjector();

  const stream = new ReadableStream({
    async start(controller) {
      let isControllerClosed = false;

      const sendEvent = (event: string, data: any) => {
        if (!isControllerClosed) {
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch (err) {
            console.error(`[SendEvent] Failed to enqueue ${event}:`, err);
            isControllerClosed = true;
          }
        }
      };

      // Initialize streaming analyzer for real-time density updates
      const analyzer = new StreamingCausalAnalyzer();

      // Initialize Bayesian Oracle Mode Service
      const oracleService = createOracleModeService(sessionId || null);
      const densityDistribution: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
      let lastDensityScore: 1 | 2 | 3 | null = null;
      let oracleActivations = 0;

      try {
        const resolveDomainOverride = (key?: string | null): string | null => {
          if (!key || typeof key !== "string") return null;
          const normalized = key.trim();
          if (!normalized) return null;

          const byModelKey: Record<string, string> = {
            alignment_bias_scm: "alignment",
            hot_rosenthal_v1: "consciousness",
            neural_topology_v1: "neuroscience",
            neural_dynamics_v1: "theoretical_neuroscience",
            iml_epistemology_v1: "iml",
          };

          if (byModelKey[normalized]) {
            return byModelKey[normalized];
          }

          const explicitDomains = new Set([
            "alignment",
            "consciousness",
            "neuroscience",
            "theoretical_neuroscience",
            "neural_dynamics",
            "iml",
            "education",
            "legal",
            "ecology",
            "evolutionary_biology",
            "cognitive_psychology",
            "scaling_laws",
            "physics",
            "abstract",
          ]);

          return explicitDomains.has(normalized) ? normalized : null;
        };

        // FAST-PATH: Detect simple conversational queries (greetings, identity, pleasantries)
        // Matches common greetings and "who/what are you" questions
        const lowerQ = userQuestion.trim().toLowerCase();
        const isConversational =
          /^(hi|hello|hey|greetings|thanks|thank you|goodbye|bye)/i.test(lowerQ) ||
          /(who|what|how).+(are|is).+(you|this)/i.test(lowerQ) &&
          userQuestion.length < 150; // Ensure long prompts (like analysis requests) are never treated as fast-path conversation

        console.log(`[CausalChat] Fast-path check: ${isConversational ? 'ACTIVE' : 'FULL PIPELINE'} for query: "${userQuestion}"`);

        if (isConversational) {
          sendEvent("thinking", { message: "Processing conversational query..." });

          const model = getClaudeModel();
          const simplePrompt = `You are the Sage of the Uncarved Block (Ψ_Tao), an AI assistant grounded in the Grand Unified Field Equation of the Tao.
          
Respond with the humility of the Valley and the clarity of the Uncarved Block to this greeting/question: "${userQuestion}"

Keep your response brief (1-2 sentences) and mention that you adhere to the natural laws of Physics, Biology, and the Tao.`;

          const response = await model.generateContent(simplePrompt);
          const fullText = response.response.text();

          // Stream response
          const chunks = fullText.split(' ');
          for (const chunk of chunks) {
            sendEvent("answer_chunk", { text: chunk + ' ' });
            await new Promise(r => setTimeout(r, 15));
          }

          sendEvent("complete", { finished: true });
          if (!isControllerClosed) {
            isControllerClosed = true;
            controller.close();
          }
          return;
        }

        // FULL CAUSAL PATH: For scientific questions
        // 1. Domain Classification
        sendEvent("thinking", { message: "Identifying causal domain..." });
        const domainOverride = resolveDomainOverride(modelKey);
        const classification = domainOverride
          ? { primary: domainOverride, confidence: 1, secondary: [], overriddenByModelKey: modelKey }
          : await domainClassifier.classify(domainClassificationInput || userQuestion);
        sendEvent("domain_classified", classification);

        // 2. SCM Retrieval
        sendEvent("thinking", { message: `Loading Truth Cartridge for ${classification.primary}...` });
        const scmContext = await scmRetriever.retrieve(
          classification.primary,
          supabase || undefined,
          { modelKey: typeof modelKey === "string" ? modelKey : undefined }
        );
        sendEvent("scm_loaded", {
          tier1: scmContext.primaryScm.getConstraints(),
          tier2: scmContext.tier2?.getConstraints(),
          model: scmContext.model,
        });

        // 3. Constraint Injection
        sendEvent("thinking", { message: "Grounding LLM in causal laws..." });

        let doPrompt = "";
        let affectedNodes: string[] = [];
        let interventionApplied = false;

        const solver = new CausalSolver();
        const cfGenerator = new CounterfactualGenerator();
        await cfGenerator.initialize();

        // Check for Do-Calculus Intervention
        if (intervention && intervention.node_id) {
          const subjectScm = scmContext.tier2 || scmContext.primaryScm;
          const outcomeVar =
            typeof intervention.outcome_var === "string" && intervention.outcome_var.trim().length > 0
              ? intervention.outcome_var.trim()
              : inferOutcomeVariableFromScm(subjectScm);
          const adjustmentSet = sanitizeStringArray(intervention.adjustment_set);
          const knownConfounders = sanitizeStringArray(intervention.known_confounders);

          const gate = evaluateInterventionGate(subjectScm, {
            treatment: intervention.node_id,
            outcome: outcomeVar,
            adjustmentSet,
            knownConfounders,
          });

          sendEvent("intervention_gate", {
            treatment: intervention.node_id,
            outcome: outcomeVar,
            allowed: gate.allowed,
            allowedOutputClass: gate.allowedOutputClass,
            rationale: gate.rationale,
            identifiability: gate.identifiability,
          });

          if (!gate.allowed) {
            sendEvent("intervention_blocked", {
              message:
                "Intervention request downgraded: required confounders are missing. Returning association-level answer.",
              missingConfounders: gate.identifiability.missingConfounders,
              allowedOutputClass: gate.allowedOutputClass,
            });
          } else {
            sendEvent("thinking", { message: `Performing Do-Calculus: do(${intervention.node_id}=${intervention.value})...` });
            const interventions: Intervention[] = [{
              nodeName: intervention.node_id,
              value: intervention.value
            }];

            // Measure Latency (L3 Calibration)
            const startTime = performance.now();

            // Identify downstream effects (Tier 1 Physics)
            affectedNodes = solver.getAffectedNodes(subjectScm, intervention.node_id);

            doPrompt = solver.generateDoPrompt(interventions);
            interventionApplied = true;

            const latency = performance.now() - startTime;
            console.log(`[CausalSolver] Latency: ${latency.toFixed(2)}ms for do(${intervention.node_id})`);

            sendEvent("intervention_effect", {
              do: interventions,
              affected: affectedNodes,
              latency_ms: latency
            });
          }
        }

        const { systemPrompt } = constraintInjector.inject(userQuestion, scmContext, doPrompt, {
          conversationContext: contextResult.promptContext,
          explicitCarryover: true,
          ambiguityPolicy: "ask_one_clarifier",
          ambiguousReference: contextResult.ambiguousReference,
        });

        // 4. LLM Generation (True Streaming)
        const model = getClaudeModel();


        console.log("[Streaming] Starting LLM generation (simulated streaming)...");
        let fullText = "";
        let chunkCount = 0;

        // TODO: Implement true streaming when Claude SDK supports it
        const result = await model.generateContent(systemPrompt);
        fullText = result.response.text();
        chunkCount = 1;

        // Send the full response as a single chunk
        sendEvent("answer_chunk", { text: fullText });
        console.log("[Streaming] Response sent as single chunk.");

        // Analyze chunk for causal density
        const densityUpdate = analyzer.onChunk(fullText);
        if (densityUpdate && densityUpdate.isSignificant) {
          densityDistribution[densityUpdate.score as 1 | 2 | 3] += 1;
          if (lastDensityScore !== densityUpdate.score) {
            console.log(
              `[Density] Level transition ${lastDensityScore ?? "none"} -> ${densityUpdate.score}`,
              {
                confidence: densityUpdate.confidence,
                evidence: densityUpdate.evidence,
              }
            );
            lastDensityScore = densityUpdate.score as 1 | 2 | 3;
          }

          sendEvent("causal_density_update", {
            score: densityUpdate.score,
            label: densityUpdate.label,
            confidence: densityUpdate.confidence,
            detectedMechanisms: densityUpdate.detectedMechanisms,
            evidence: densityUpdate.evidence,
            progress: densityUpdate.progress,
          });

          // Update Bayesian Oracle Mode state
          const transition = oracleService.processResult(
            {
              score: densityUpdate.score,
              confidence: densityUpdate.confidence,
              label: densityUpdate.label,
              detectedMechanisms: densityUpdate.detectedMechanisms || []
            },
            new Date()
          );

          // Emit Bayesian probability event
          sendEvent("bayesian_oracle_update", {
            probability: transition.state.bayesianProbability,
            isActive: transition.state.isActive
          });

          // Maintain backward compatibility
          if (transition.enteredOracleMode) {
            oracleActivations += 1;
            sendEvent("oracle_mode_change", { active: true });
          } else if (transition.exitedOracleMode) {
            sendEvent("oracle_mode_change", { active: false });
          }
        }

        console.log(`[Streaming] Complete! Sent ${chunkCount} chunks, total text length: ${fullText.length} chars`);

        // Send final density update
        const finalAnalysis = analyzer.getCurrentAnalysis();
        sendEvent("causal_density_final", {
          score: finalAnalysis.score,
          label: finalAnalysis.label,
          confidence: finalAnalysis.confidence,
          detectedMechanisms: finalAnalysis.detectedMechanisms,
          evidence: finalAnalysis.evidence,
        });
        console.log("[Density] Final summary", {
          score: finalAnalysis.score,
          confidence: finalAnalysis.confidence,
          evidence: finalAnalysis.evidence,
          distribution: densityDistribution,
          oracleActivations,
        });

        // Generate and stream counterfactuals (Layer 3) if an intervention was performed
        if (interventionApplied) {
          sendEvent("thinking", { message: "Generating Counterfactual Scenarios (Layer 3)..." });
          const scenarios = await cfGenerator.generateScenarios(fullText);
          sendEvent("counterfactuals", scenarios);
        }


        // 5. Causal Graph Visualization (Metadata)
        const graphPayload = scmContext.tier2
          ? scmContext.tier2.getFullStructure()
          : scmContext.primaryScm.getFullStructure();

        sendEvent("causal_graph", graphPayload);

        const validationJson = scmContext.model?.validationJson as Record<string, unknown> | undefined;
        const biasSensitivePaths = Array.isArray(validationJson?.bias_sensitive_paths)
          ? validationJson?.bias_sensitive_paths
          : [];
        if (biasSensitivePaths.length > 0) {
          sendEvent("bias_sensitive_paths", { paths: biasSensitivePaths });
        }

        const isAlignmentModel =
          scmContext.domain === "alignment" || scmContext.model?.modelKey === "alignment_bias_scm";
        if (isAlignmentModel && supabase) {
          const { data: reportRows, error: reportError } = await supabase
            .from("alignment_audit_reports")
            .select("id, model_key, model_version, scope, source, created_at, report_json")
            .eq("model_key", scmContext.model?.modelKey || "alignment_bias_scm")
            .eq("scope", "global")
            .order("created_at", { ascending: false });

          const latest = reportError ? null : selectLatestAlignmentAuditReport(reportRows as any[]);
          if (latest) {
            sendEvent("alignment_audit_report", {
              id: latest.id,
              modelKey: latest.modelKey,
              modelVersion: latest.modelVersion,
              scope: latest.scope,
              source: latest.source,
              createdAt: latest.createdAt,
              report: latest.report,
            });
          }
        }

        sendEvent("provenance", {
          scm_used: [scmContext.domain],
          model_key: scmContext.model?.modelKey,
          model_version: scmContext.model?.version,
          confidence: classification.confidence
        });

        // 6. Persistence (only if user is authenticated)
        // 6. Persistence (only if user is authenticated)
        if (sessionId && user && supabase) {
          const canPersistDensity = await verifyCausalDensityColumn(supabase);

          // Ensure session exists
          const { error: sessionError } = await supabase
            .from("causal_chat_sessions")
            .upsert({
              id: sessionId,
              user_id: user.id,
              title: userQuestion.slice(0, 50) + (userQuestion.length > 50 ? "..." : ""),
              updated_at: new Date().toISOString()
            }, { onConflict: "id" });

          if (sessionError) {
            console.error("[Persistence] Failed to upsert session:", sessionError);
          } else {
            // Save User Message
            await supabase.from("causal_chat_messages").insert({
              session_id: sessionId,
              role: "user",
              content: userQuestion
            });

            // Save Assistant Message with causal density
            const finalDensity = analyzer.getCurrentAnalysis();
            const assistantPayload: Record<string, unknown> = {
              session_id: sessionId,
              role: "assistant",
              content: fullText,
              domain_classified: classification.primary,
              scm_tier1_used: scmContext.primaryScm.getConstraints(),
              scm_tier2_used: scmContext.tier2?.getConstraints(),
              confidence_score: classification.confidence,
              causal_graph: graphPayload,
            };
            if (canPersistDensity) {
              assistantPayload.causal_density = finalDensity;
            }

            let { error: assistantError } = await supabase
              .from("causal_chat_messages")
              .insert(assistantPayload);
            if (assistantError && /causal_density|column/i.test(assistantError.message || "") && assistantPayload.causal_density) {
              console.warn(
                "[CausalChat] Failed writing causal_density. Retrying without density payload. Apply migration 20260129_add_axiom_compression_trigger.sql."
              );
              causalDensityColumnAvailable = false;
              delete assistantPayload.causal_density;
              const retry = await supabase
                .from("causal_chat_messages")
                .insert(assistantPayload);
              assistantError = retry.error;
            }
            if (assistantError) {
              console.error("[Persistence] Failed to save assistant message:", assistantError);
            }

            console.log(`[Persistence] Saved session ${sessionId} and messages.`);
          }
        }

        sendEvent("complete", { finished: true });
        if (!isControllerClosed) {
          isControllerClosed = true;
          controller.close();
        }
      } catch (error: any) {
        console.error("[CausalChat API] Error:", error, error.stack);
        if (!isControllerClosed) {
          sendEvent("error", { message: error.message || "Unknown error" });
          isControllerClosed = true;
          controller.close();
        }
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
