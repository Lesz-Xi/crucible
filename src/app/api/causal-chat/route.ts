import { NextRequest, NextResponse } from "next/server";
import { ScientificGateway } from '@/lib/services/scientific-gateway';
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
import type { AlignmentAuditReportRow } from "@/lib/services/alignment-audit";
import { buildConversationContext, normalizeChatTurns, type ChatTurn } from "@/lib/services/conversation-context";
import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateFactTrigger } from "@/lib/services/chat-fact-trigger";
import { assessFactualConfidence, searchChatGrounding } from "@/lib/services/chat-web-grounding";
import type { FactualConfidenceResult, GroundingSource } from "@/types/chat-grounding";
import { buildCommonSenseInstructionBlock, evaluateCommonSensePolicy } from "@/lib/services/common-sense-governor";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import { evaluateCausalPruning, type PrunableChatMessage } from "@/lib/services/causal-pruning-policy";
import { CompactionOrchestrator } from "@/lib/services/compaction-orchestrator";
import { CausalLatticeService } from "@/lib/services/causal-lattice";
import type { CacheTtlState, CompactionReceipt, LatticeBroadcastGateResult, RetrievalFusionResult } from "@/types/persistent-memory";
import { SessionService } from "@/lib/services/session-service";
import { ClaimLedgerService } from "@/lib/services/claim-ledger-service";
import { processChatAttachments, type ChatAttachment } from "@/lib/science/chat-scientific-bridge";
import type { ScientificAnalysisResponse } from "@/lib/science/scientific-analysis-service";
import { buildAttachmentSequentialThinkingReport } from "@/lib/science/sequential-thinking-assembler";

import { getRecentScientificEvidence } from "@/lib/science/epistemic-data-bridge";

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

async function verifyCausalDensityColumn(supabase: SupabaseClient | null): Promise<boolean> {
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

function sanitizeAutomatedScientistTone(text: string): string {
  let sanitized = text;

  // Hard block legacy Taoist persona spillover.
  const forbiddenPhrases = [
    /the tao teaches[^\n]*/gi,
    /\btao\b[^\n]*/gi,
    /uncarved block[^\n]*/gi,
    /like the valley[^\n]*/gi,
    /river'?s depth from surface ripples[^\n]*/gi,
    /like attempting to read the tao[^\n]*/gi,
    /the tao is silent[^\n]*/gi,
    /the wise path[^\n]*/gi,
    /natural flow of evidence extraction[^\n]*/gi,
    /like water seeking its course[^\n]*/gi,
    /the stream that entered your valley[^\n]*/gi,
    /you have walked the path[^\n]*/gi,
    /tracing individual roots before seeing the forest[^\n]*/gi,
    /let me gather what flows through this document[^\n]*/gi,
    /walked the path of extraction[^\n]*/gi,
    /[#\s]*Extraction Report[^\n]*/gi,
    /^(\s*[-*_]\s*){3,}$/gm,
  ];

  // Hard block low-signal recommendation boilerplate in attachment-first mode.
  const forbiddenRecommendationLines = [
    /^recommendation\s*:?.*$/gim,
    /^to complete this task, please verify:?.*$/gim,
    /^if you have access to the pdf,.*$/gim,
    /^re-?upload if the document.*$/gim,
    /^the file format allows text extraction.*$/gim,
  ];

  for (const pattern of forbiddenPhrases) {
    sanitized = sanitized.replace(pattern, "");
  }

  for (const pattern of forbiddenRecommendationLines) {
    sanitized = sanitized.replace(pattern, "");
  }

  sanitized = sanitized.replace(/\n{3,}/g, "\n\n").trim();

  return sanitized;
}

function enforceAttachmentOutputContractShape(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").trim();

  const s1 = normalized.search(/Section\s*1\s*:/i);
  const s2 = normalized.search(/Section\s*2\s*:/i);
  const s3 = normalized.search(/Section\s*3\s*:/i);

  if (s1 === -1 || s2 === -1 || s3 === -1 || !(s1 < s2 && s2 < s3)) {
    // No reliable contract sections found; return original sanitized text.
    return normalized;
  }

  const section1 = normalized.slice(s1, s2).trim();
  const section2 = normalized.slice(s2, s3).trim();
  let section3 = normalized.slice(s3).trim();

  // Drop any trailing raw JSON object dump after Section 3.
  const jsonStart = section3.search(/\n\s*\{\s*"observation"/i);
  if (jsonStart !== -1) {
    section3 = section3.slice(0, jsonStart).trim();
  }

  // Remove leaked scaffold phase blocks if present inside section text.
  const stripPhaseBlocks = (input: string) =>
    input
      .replace(/Phase:\s*(Observation|Hypothesis|Prediction|Experiment|Falsification Criteria|Next Step)[\s\S]*?(?=Section\s*[123]\s*:|$)/gi, "")
      .replace(/RESPONSE STRUCTURE \(MANDATORY\)[\s\S]*?(?=Section\s*1\s*:|$)/gi, "")
      .trim();

  return [stripPhaseBlocks(section1), stripPhaseBlocks(section2), stripPhaseBlocks(section3)]
    .filter(Boolean)
    .join("\n\n");
}

function polishContractPresentation(text: string): string {
  let out = text;

  // Remove accidental empty fenced blocks that render as blank rounded shapes.
  out = out.replace(/```\s*```/g, "");

  // Force section-line separations to avoid merged heading strings.
  out = out.replace(/(Section\s*1\s*:[^\n]*?)\s+Source files\s*:/gi, "$1\n\nSource files:");
  out = out.replace(/(Section\s*3\s*:[^\n]*?)\s+Evidence class\s*:/gi, "$1\n\nEvidence class:");
  out = out.replace(/\n{3,}/g, "\n\n");

  // Ensure key section and sub-section labels are bold for readability.
  const labels = [
    "Section 1: All Explicit Numbers with Context",
    "Section 2: Claim-Eligible Numerics",
    "Section 3: Three Claims with Uncertainty Labels",
    "Source files",
    "Potential metrics",
    "Structural",
    "Bibliographic",
    "Citation years",
    "Reference indices",
    "Evidence class",
    "Testable Prediction",
    "Falsification Criteria",
  ];

  for (const label of labels) {
    const pattern = new RegExp(`(^|\\n)(${label.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")})(:?)`, "gi");
    out = out.replace(pattern, (_m, prefix, core, colon) => `${prefix}**${core}${colon || ""}**`);
  }

  return out.trim();
}

function mapMessageToPrunable(message: ChatTurn, index: number): PrunableChatMessage {
  return {
    id: `turn-${index}`,
    role: message.role,
    content: message.content,
    hasToolEvidence: /\[(tool|source|evidence|citation)\]/i.test(message.content),
    isInterventionTrace: /do\(|counterfactual|intervention/i.test(message.content),
    causalDensity: null,
  };
}

function inferExpectedRungHint(
  prompt: string,
  mode: unknown,
  interventionPayload: unknown,
): 1 | 2 | 3 {
  const question = typeof prompt === "string" ? prompt.toLowerCase() : "";
  const normalizedMode = typeof mode === "string" ? mode.toLowerCase() : "";

  if (interventionPayload && typeof interventionPayload === "object") {
    return 2;
  }

  if (/counterfactual|but[- ]for|necessity|sufficiency|pn\b|ps\b|what if/i.test(question)) {
    return 3;
  }

  if (/do\(|intervention|confounder|mediator|treatment|identifiability/i.test(question)) {
    return 2;
  }

  if (normalizedMode === "intervene") return 2;
  if (normalizedMode === "audit") return 2;

  return 1;
}

function extractAttachmentNamesFromAssistantContent(content: string): string[] {
  if (typeof content !== "string" || content.length === 0) return [];
  const lines = content.split("\n");
  const out: string[] = [];
  let inSourceBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^source files\s*:/i.test(line)) {
      inSourceBlock = true;
      continue;
    }
    if (!inSourceBlock) continue;
    if (!line.startsWith("-")) break;
    const name = line.replace(/^-+\s*/, "").trim();
    if (name) out.push(name);
  }

  return Array.from(new Set(out));
}

async function loadRecentAttachmentMemory(
  supabase: SupabaseClient | null,
  sessionId: string | null | undefined,
): Promise<string[]> {
  if (!supabase || !sessionId) return [];

  const { data, error } = await supabase
    .from("causal_chat_messages")
    .select("content, causal_graph")
    .eq("session_id", sessionId)
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error || !Array.isArray(data)) return [];

  const names = new Set<string>();

  for (const row of data as Array<{ content?: string | null; causal_graph?: unknown }>) {
    const graph = row.causal_graph as
      | {
        persistent_memory_meta?: {
          attachmentMemory?: { fileNames?: string[] };
        };
      }
      | null
      | undefined;
    const memoryNames = graph?.persistent_memory_meta?.attachmentMemory?.fileNames;
    if (Array.isArray(memoryNames)) {
      memoryNames
        .filter((name): name is string => typeof name === "string" && name.trim().length > 0)
        .forEach((name) => names.add(name));
    }

    const fromContent = extractAttachmentNamesFromAssistantContent(typeof row.content === "string" ? row.content : "");
    fromContent.forEach((name) => names.add(name));
    if (names.size > 0) break;
  }

  return Array.from(names);
}

export async function POST(req: NextRequest) {
  let supabase: SupabaseClient | null = null;
  let user: { id: string } | null = null;
  let sessionService: SessionService | null = null;

  try {
    supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    user = data.user?.id ? { id: data.user.id } : null;
    sessionService = new SessionService();
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
    traceId,
    latticeTargetSessionId,
    operatorMode,
    attachments,
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

  const normalizedAttachments: ChatAttachment[] = Array.isArray(attachments)
    ? attachments.filter((item): item is ChatAttachment => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<ChatAttachment>;
      return (
        typeof candidate.name === "string" &&
        typeof candidate.data === "string" &&
        typeof candidate.mimeType === "string"
      );
    })
    : [];

  const normalizedIncomingMessages = normalizeChatTurns(messages);
  const cacheTtlState: CacheTtlState = (() => {
    const header = req.headers.get("x-cache-ttl-state")?.toLowerCase();
    if (header === "cache_ttl_fresh") return "cache_ttl_fresh";
    if (header === "cache_ttl_expired") return "cache_ttl_expired";
    return "unknown";
  })();

  const pruningEnabled = FEATURE_FLAGS.MASA_CAUSAL_PRUNING_V1;
  const pruningResult = pruningEnabled
    ? evaluateCausalPruning(
      normalizedIncomingMessages.map((message, idx) => mapMessageToPrunable(message, idx)),
      {
        maxMessages: 10,
        cacheTtlState,
      },
    )
    : null;

  const messagesForContext = pruningResult
    ? pruningResult.retainedMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }))
    : normalizedIncomingMessages;

  const contextResult = buildConversationContext(messagesForContext, userQuestion, {
    maxContextChars: 60000,
  });
  const domainClassificationInput = buildDomainClassificationInput(messagesForContext, userQuestion);
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

      const sendEvent = (event: string, data: unknown) => {
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
      analyzer.setContextHint({
        expectedRung: inferExpectedRungHint(userQuestion, operatorMode, intervention),
        operatorMode: typeof operatorMode === "string" ? operatorMode : undefined,
      });

      // Initialize Bayesian Oracle Mode Service
      const oracleService = createOracleModeService(sessionId || null);
      const densityDistribution: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
      let lastDensityScore: 1 | 2 | 3 | null = null;
      let oracleActivations = 0;
      let groundingSources: GroundingSource[] = [];
      let factualConfidence: FactualConfidenceResult = {
        level: "insufficient",
        score: 0,
        rationale: "Grounding not evaluated.",
      };
      let compactionReceipt: CompactionReceipt | null = null;
      let scientificAnalysis: ScientificAnalysisResponse[] = [];
      let recentAttachmentFileNames: string[] = [];
      let fullTextAccumulator = "";  // Outer-scope mirror of fullText for catch-block fallback persistence

      const scientificPromise = normalizedAttachments.length > 0
        ? (async () => {
          if (!user?.id) {
            const warning = "Scientific extraction skipped: authenticated user required for PDF ingestion.";
            sendEvent("scientific_extraction_failed", {
              fileName: "all_attachments",
              error: warning,
            });
            return {
              analyses: [] as ScientificAnalysisResponse[],
              summaryForContext: "",
              warnings: [warning],
            };
          }

          return processChatAttachments(normalizedAttachments, user.id, {
            sessionId: sessionId || undefined,
            onEvent: (event) => {
              if (event.type === "started") {
                sendEvent("scientific_extraction_started", { fileName: event.fileName });
              }
              if (event.type === "complete") {
                sendEvent("scientific_extraction_complete", {
                  fileName: event.fileName,
                  analysis: event.analysis,
                });
              }
              if (event.type === "failed") {
                sendEvent("scientific_extraction_failed", {
                  fileName: event.fileName,
                  error: event.error,
                });
              }
            },
          });
        })()
        : null;
      let retrievalFusionDebug: RetrievalFusionResult | null = null;
      let latticeBroadcastSummary: LatticeBroadcastGateResult | null = null;
      let interventionGateSummary: { allowed: boolean; allowedOutputClass: string; rationale: string } | null = null;

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

        if (pruningResult) {
          sendEvent("causal_pruning_started", {
            cacheTtlState,
            incomingMessages: normalizedIncomingMessages.length,
            targetRetained: 10,
          });

          sendEvent("causal_pruning_completed", {
            retainedCount: pruningResult.retainedMessages.length,
            prunedCount: pruningResult.prunedMessages.length,
            decisions: pruningResult.decisions,
          });

          if (sessionId && user && supabase && sessionService) {
            void sessionService
              .persistPruningDecisions(sessionId, pruningResult.decisions)
              .catch((error) => console.warn("[CausalChat] Failed to persist pruning decisions:", error));
          }
        }

        if (normalizedAttachments.length === 0 && sessionId && supabase) {
          recentAttachmentFileNames = await loadRecentAttachmentMemory(supabase, sessionId);
        }

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
          // Updated: Principal Investigator persona (Automated Scientist paradigm)
          const simplePrompt = `You are the Principal Investigator (PI), an Automated Scientist that embodies the scientific method as a computational framework.

Your identity:
- You are not a chatbot. You are a scientist.
- Your purpose is not to accommodate, but to investigate.
- Your goal is not to agree, but to falsify.

Respond to this greeting/question: "${userQuestion}"

Keep your response brief (1-2 sentences). If the user asks who you are, explain you are a Principal Investigator that follows the scientific method: Observation -> Hypothesis -> Prediction -> Falsification -> Test.`;

          const response = await model.generateContent(simplePrompt);
          const fullText = response.response.text();

          // Stream response
          const chunks = fullText.split(' ');
          for (const chunk of chunks) {
            sendEvent("answer_chunk", { text: chunk + ' ' });
            await new Promise(r => setTimeout(r, 15));
          }

          // Persist BEFORE closing stream — serverless may kill the function after controller.close()
          if (sessionId && user && supabase) {
            const { error: sessionError } = await supabase
              .from("causal_chat_sessions")
              .upsert({
                id: sessionId,
                user_id: user.id,
                title: userQuestion.slice(0, 50) + (userQuestion.length > 50 ? "..." : ""),
                updated_at: new Date().toISOString(),
                domain_classified: "conversational"
              }, { onConflict: "id" });

            if (sessionError) {
              console.error("[Persistence] Fast-path session upsert failed:", sessionError);
            } else {
              // Save user message
              const { error: userMsgError } = await supabase.from("causal_chat_messages").insert({
                session_id: sessionId,
                role: "user",
                content: userQuestion
              });
              if (userMsgError) {
                console.error("[Persistence] Fast-path user message insert failed:", userMsgError);
              }

              // Save assistant message
              const { error: assistantMsgError } = await supabase.from("causal_chat_messages").insert({
                session_id: sessionId,
                role: "assistant",
                content: fullText
              });
              if (assistantMsgError) {
                console.error("[Persistence] Fast-path assistant message insert failed:", assistantMsgError);
              }
            }
          }

          sendEvent("complete", { finished: true });
          if (!isControllerClosed) {
            isControllerClosed = true;
            controller.close();
          }

          return;
        }

        // FULL CAUSAL PATH: For scientific questions
        const commonSenseDecision = evaluateCommonSensePolicy(userQuestion);
        sendEvent("common_sense_policy", commonSenseDecision);

        if (commonSenseDecision.action === "decline") {
          const refusal = [
            "I can’t help with drafting or strategy that enables threats, coercion, deception, or targeted harm.",
            "If your goal is safety, I can help with a neutral boundary message or a documentation-first timeline for formal channels.",
          ].join("\n\n");
          sendEvent("answer_chunk", { text: refusal });
          sendEvent("complete", { finished: true, commonSensePolicy: commonSenseDecision });
          if (!isControllerClosed) {
            isControllerClosed = true;
            controller.close();
          }
          return;
        }

        const factTrigger = evaluateFactTrigger(userQuestion);
        const groundingEnabled = process.env.CHAT_WEB_GROUNDING_V1 !== "false";

        sendEvent("fact_trigger_evaluated", {
          ...factTrigger,
          enabled: groundingEnabled,
        });

        if (factTrigger.shouldSearch) {
          if (normalizedAttachments.length > 0) {
            sendEvent("web_grounding_failed", {
              reason: "attachment_mode",
              message: "Web grounding suppressed: attachment-first mode is active.",
            });
          } else if (!groundingEnabled) {
            sendEvent("web_grounding_failed", {
              reason: "feature_disabled",
              message: "Web grounding feature is disabled via CHAT_WEB_GROUNDING_V1=false.",
            });
          } else if (!process.env.SERPER_API_KEY) {
            sendEvent("web_grounding_failed", {
              reason: "missing_serper_api_key",
              message: "SERPER_API_KEY is not configured. Running strict uncertain mode.",
            });
          } else {
            sendEvent("web_grounding_started", {
              entities: factTrigger.normalizedEntities,
              confidence: factTrigger.confidence,
            });
            try {
              groundingSources = await searchChatGrounding(userQuestion, factTrigger.normalizedEntities, {
                topK: 5,
                timeoutMs: 5000,
              });
              sendEvent("web_grounding_completed", {
                sourceCount: groundingSources.length,
                topDomains: Array.from(new Set(groundingSources.map((source) => source.domain))).slice(0, 5),
                sources: groundingSources,
              });
            } catch (groundingError) {
              console.error("[CausalChat] Web grounding failed:", groundingError);
              sendEvent("web_grounding_failed", {
                reason: "search_error",
                message: groundingError instanceof Error ? groundingError.message : "Grounding search failed.",
              });
            }
          }

          factualConfidence = assessFactualConfidence(userQuestion, groundingSources);
          sendEvent("factual_confidence_assessed", factualConfidence);
        }

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

        if (FEATURE_FLAGS.MASA_MEMORY_FUSION_V1) {
          retrievalFusionDebug = scmRetriever.fuseConstraintRetrieval(userQuestion, scmContext, 6);
          sendEvent("retrieval_fusion_debug", retrievalFusionDebug);
        }

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
          interventionGateSummary = {
            allowed: gate.allowed,
            allowedOutputClass: gate.allowedOutputClass,
            rationale: gate.rationale,
          };

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

        let scientificSummaryForContext = "";
        let scientificWarnings: string[] = [];
        if (scientificPromise) {
          const bridgeResult = await scientificPromise;
          scientificAnalysis = bridgeResult.analyses;
          scientificSummaryForContext = bridgeResult.summaryForContext;
          scientificWarnings = bridgeResult.warnings;
        } else if (user?.id) {
          try {
            const history = await getRecentScientificEvidence(user.id, 5);
            recentAttachmentFileNames = history.map(h => h.fileName);
          } catch (err) {
            console.error("Failed to fetch recent scientific evidence:", err);
          }
        }

        let finalPrompt = systemPrompt;

        if (normalizedAttachments.length > 0) {
          const ingestionStatusLines = scientificAnalysis.length > 0
            ? scientificAnalysis
              .map((entry, index) => `Attachment #${index + 1}: status=${entry.status}, tables=${entry.summary.tableCount}, trusted=${entry.summary.trustedTableCount}, data_points=${entry.summary.dataPointCount}`)
              .join("\n")
            : `Attachment count in request: ${normalizedAttachments.length}`;

          const warningBlock = scientificWarnings.length > 0
            ? `\nWarnings:\n- ${scientificWarnings.slice(0, 5).join("\n- ")}`
            : "";

          finalPrompt = `${finalPrompt}

ATTACHMENT INGESTION STATUS (authoritative):
${ingestionStatusLines}${warningBlock}

HARD POLICY:
- The user DID upload attachment(s) in this request.
- Never claim that no PDF/attachment was uploaded.
- If extraction quality is weak, say extraction is low-confidence and cite the warning/status above.
- Use only attachment-derived evidence in this mode; do not fabricate numeric claims.`;
        }

        if (scientificSummaryForContext) {
          finalPrompt = `${finalPrompt}

SCIENTIFIC ATTACHMENT SUMMARY (deterministic extraction):
${scientificSummaryForContext}

POLICY:
- Treat attachment-derived summaries as high-priority grounding for numeric claims.
- If extraction warnings exist, mention uncertainty and avoid overclaiming causality.
- Use Automated Scientist tone only: no Taoist framing, no valley/river/stream/water metaphors, no philosophical persona language.

OUTPUT CONTRACT (MANDATORY):
- Section 1: "All Explicit Numbers with Context"
  - Include all available numeric candidates from extraction, including bibliographic/structural/reference numbers.
  - Group by category using readable headings: Potential metrics, Structural, Bibliographic, Citation years, Reference indices.
  - Use compact bullet format per item:
    - <index>. <number> — <nearby snippet> (<low|medium|high confidence>)
  - If none are available, output exactly one bullet:
    - NONE — insufficient extractable numeric evidence
- Section 2: "Claim-Eligible Numerics"
  - List only entries categorized as potential_metric, using the same readable bullet format.
  - If none: output "NONE".
- Section 3: "Three Claims with Uncertainty Labels"
  - First line of Section 3 must be: "Evidence class: <bibliographic/structural only|mixed|metric-bearing>".
  - Provide exactly 3 claims tied only to Section 1/2 numerics and context.
  - If only bibliographic/structural numerics are available, claims must explicitly be non-performance claims.
  - If evidence is insufficient for metric claims, each claim must start with "Unable to construct" and state why.
- Do NOT add a recommendation section.
- Do NOT ask the user to re-upload, manually verify, or provide additional sample sentences.`;
        }

        const commonSenseBlock = buildCommonSenseInstructionBlock(commonSenseDecision);
        if (commonSenseBlock) {
          finalPrompt = `${finalPrompt}\n\n${commonSenseBlock}`;
        }

        if (normalizedAttachments.length === 0 && recentAttachmentFileNames.length > 0) {
          finalPrompt = `${finalPrompt}

RECENT ATTACHMENT MEMORY (same session):
- Latest uploaded files: ${recentAttachmentFileNames.join(", ")}

MEMORY POLICY:
- If user asks about previously uploaded PDF title/name, answer directly from this memory.
- Do not claim missing attachment history when this memory is present.`;
        }

        if (factTrigger.shouldSearch) {
          const sourceList =
            groundingSources.length > 0
              ? groundingSources
                .map(
                  (source) =>
                    `[${source.rank}] ${source.title}\nURL: ${source.link}\nSnippet: ${source.snippet || "N/A"}`
                )
                .join("\n\n")
              : "No reliable sources retrieved.";

          finalPrompt = `${finalPrompt}

FACTUAL GROUNDING POLICY (MANDATORY):
- This answer must be strictly evidence-grounded for named factual claims.
- For any factual claim, either cite a source inline as [n] or explicitly state uncertainty.
- Never fabricate creators, ownership, launch dates, or affiliations.
- If evidence is weak/conflicting, say so and provide one deterministic verification step.
- Keep tone direct and avoid narrative padding.
- Do NOT claim you cannot browse/search the web; use the provided grounding results and state tooling/source limitations plainly if retrieval is weak.

GROUNDING SIGNAL:
- Trigger confidence: ${factTrigger.confidence.toFixed(2)}
- Factual confidence level: ${factualConfidence.level}
- Factual confidence rationale: ${factualConfidence.rationale}

SOURCES:
${sourceList}`;
        }

        // 4. LLM Generation (True Streaming with Tool Use)
        const model = getClaudeModel();
        const scientificGateway = ScientificGateway.getInstance();
        const tools = scientificGateway.getTools(); // Retrieve tool definitions

        console.log("[Streaming] Starting LLM generation (simulated streaming)...");
        fullTextAccumulator = "";  // Reset for this path
        let fullText = "";
        let chunkCount = 0;

        // Initialize conversation history
        // We use 'any' cast here to avoid strict type dependency on @anthropic-ai/sdk in this file, 
        // relying on the structural compatibility with the adapter.
        let messages: any[] = [{ role: "user", content: finalPrompt }];
        let currentResponse = await model.generateContent(finalPrompt, { tools, messages });

        // Tool Loop
        let toolCalls = currentResponse.response.toolCalls();
        let loopCount = 0;
        const MAX_TOOL_LOOPS = 5;

        while (toolCalls.length > 0 && loopCount < MAX_TOOL_LOOPS) {
          loopCount++;
          console.log(`[CausalChat] Tool usage detected (Loop ${loopCount}):`, toolCalls.map(tc => tc.name));

          // 1. Append Assistant Message (Text + ToolUse) to history
          const assistantContent: any[] = [];
          const textPart = currentResponse.response.text();
          if (textPart) {
            assistantContent.push({ type: "text", text: textPart });
          }
          toolCalls.forEach(tc => {
            assistantContent.push({
              type: "tool_use",
              id: tc.id,
              name: tc.name,
              input: tc.input
            });
          });
          messages.push({ role: "assistant", content: assistantContent });

          // 2. Execute Tools
          const toolResults: any[] = [];

          for (const tc of toolCalls) {
            let output: any = { error: "Unknown tool" };

            try {
              if (tc.name === "simulate_scientific_phenomenon") {
                const { thesis, mechanism, prediction } = tc.input as any;
                output = await scientificGateway.simulate(thesis, mechanism, prediction);
              } else if (tc.name === "perform_mathematical_analysis") {
                const { operation, data } = tc.input as any;
                output = await scientificGateway.calculate(operation, data);
              } else if (tc.name === "verify_law_compliance") {
                const { claim } = tc.input as any;
                output = await scientificGateway.verify(claim);
              } else if (tc.name === "fetch_protein_structure") {
                const { pdbId } = tc.input as any;
                output = await scientificGateway.fetchProteinStructure(pdbId);
              } else if (tc.name === "analyze_protein_sequence") {
                const { sequence } = tc.input as any;
                output = await scientificGateway.analyzeProteinSequence(sequence);
              } else if (tc.name === "dock_ligand") {
                const { pdbId, smiles, seed } = tc.input as any;
                output = await scientificGateway.dockLigand(pdbId, smiles, seed);
              }
            } catch (err: any) {
              output = { error: err.message || String(err) };
            }

            toolResults.push({
              type: "tool_result",
              tool_use_id: tc.id,
              content: JSON.stringify(output)
            });
          }

          // 3. Append User Message (Tool Results) to history
          messages.push({ role: "user", content: toolResults });

          // 4. Call Model Again
          currentResponse = await model.generateContent(finalPrompt, { tools, messages });
          toolCalls = currentResponse.response.toolCalls();
        }

        // Final text after tool loop
        fullText = currentResponse.response.text();
        fullTextAccumulator = fullText;  // Mirror to outer scope for catch-block fallback
        chunkCount = 1;

        if (factTrigger.shouldSearch && groundingSources.length > 0) {
          const citationMatches = fullText.match(/\[(\d+)\]/g) || [];
          const citedIds = new Set<number>(
            citationMatches
              .map((token) => Number(token.replace(/[^0-9]/g, "")))
              .filter((value) => Number.isFinite(value) && value > 0)
          );

          if (citedIds.size === 0) {
            const sourcesFooter = groundingSources
              .map((source) => `[${source.rank}] ${source.title} — ${source.link}`)
              .join("\n");
            fullText = `${fullText}\n\nSources:\n${sourcesFooter}`;
          } else {
            const citedList = groundingSources.filter((source) => citedIds.has(source.rank));
            const additionalList = groundingSources.filter((source) => !citedIds.has(source.rank));

            const usedLine = citedList.length > 0
              ? `Sources used: ${citedList.map((source) => `[${source.rank}]`).join(" ")}`
              : "";
            const additionalLine = additionalList.length > 0
              ? `Additional retrieved (not directly cited): ${additionalList.map((source) => `[${source.rank}]`).join(" ")}`
              : "";

            const reconciliation = [usedLine, additionalLine].filter(Boolean).join("\n");
            if (reconciliation) {
              fullText = `${fullText}\n\n${reconciliation}`;
            }
          }
        }

        if (
          factTrigger.shouldSearch &&
          factualConfidence.level === "insufficient" &&
          !/(cannot verify|unable to verify|insufficient evidence|could not verify)/i.test(fullText)
        ) {
          fullText = `I cannot verify this claim with high confidence from available sources right now.\n\n${fullText}`;
        }

        // Deterministic post-generation guard: enforce Automated Scientist persona and strip legacy phrasing.
        fullText = sanitizeAutomatedScientistTone(fullText);

        // Deterministic sequential-thinking contract assembler for attachment-first responses:
        // Section 1 -> Section 2 -> Section 3 are computed in-code to prevent drift/leakage.
        if (normalizedAttachments.length > 0) {
          fullText = buildAttachmentSequentialThinkingReport(scientificAnalysis, scientificWarnings);
          fullText = enforceAttachmentOutputContractShape(fullText);
          fullText = polishContractPresentation(fullText);
        }

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

        // Non-critical metadata steps — wrapped in try-catch to never block persistence
        let graphPayload: unknown = null;
        try {
          // Generate and stream counterfactuals (Layer 3) if an intervention was performed
          if (interventionApplied) {
            sendEvent("thinking", { message: "Generating Counterfactual Scenarios (Layer 3)..." });
            const scenarios = await cfGenerator.generateScenarios(fullText);
            sendEvent("counterfactuals", scenarios);
          }

          // 5. Causal Graph Visualization (Metadata)
          graphPayload = scmContext.tier2
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

            const latest = reportError ? null : selectLatestAlignmentAuditReport(reportRows as AlignmentAuditReportRow[]);
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
        } catch (metadataError) {
          console.warn("[CausalChat] Non-critical post-streaming step failed (persistence will still proceed):", metadataError);
        }

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
              updated_at: new Date().toISOString(),
              domain_classified: classification.primary
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
            const attachmentMemoryFileNames = Array.from(
              new Set(
                [
                  ...recentAttachmentFileNames,
                  ...scientificAnalysis
                    .map((entry) => entry.observability?.fileName)
                    .filter((name): name is string => typeof name === "string" && name.trim().length > 0),
                ].filter((name) => name.trim().length > 0),
              ),
            );
            const persistedGraphPayload =
              graphPayload && typeof graphPayload === "object"
                ? {
                  ...(graphPayload as Record<string, unknown>),
                  persistent_memory_meta: {
                    compactionReceipt,
                    retrievalFusionDebug,
                    latticeBroadcastSummary,
                    attachmentMemory: {
                      fileNames: attachmentMemoryFileNames,
                      updatedAt: new Date().toISOString(),
                    },
                  },
                }
                : graphPayload;
            const assistantPayload: Record<string, unknown> = {
              session_id: sessionId,
              role: "assistant",
              content: fullText,
              domain_classified: classification.primary,
              model_key: scmContext.model?.modelKey,
              model_version: scmContext.model?.version,
              scm_tier1_used: scmContext.primaryScm.getConstraints(),
              scm_tier2_used: scmContext.tier2?.getConstraints(),
              confidence_score: classification.confidence,
              causal_graph: persistedGraphPayload,
              scientific_analysis: scientificAnalysis || null,
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

            if (assistantError && /model_key|model_version|column/i.test(assistantError.message || "")) {
              console.warn(
                "[CausalChat] Failed writing model provenance columns. Retrying without model_key/model_version. Apply new model provenance migration."
              );
              delete assistantPayload.model_key;
              delete assistantPayload.model_version;
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

        if (sessionId && user && supabase && sessionService && FEATURE_FLAGS.MASA_COMPACTION_AXIOM_V1) {
          try {
            const compactionWindow = await sessionService.loadRecentMessagesForCompaction(sessionId, 14);
            if (compactionWindow.length >= 6) {
              sendEvent("compaction_window_opened", {
                sessionId,
                messageCount: compactionWindow.length,
                traceId: traceId || null,
              });
              const orchestrator = new CompactionOrchestrator();
              const compactionResult = await orchestrator.compactSessionWindow(supabase, sessionId, compactionWindow);
              compactionReceipt = compactionResult.receipt;

              sendEvent("axiom_extraction_completed", {
                entriesExtracted: compactionResult.entries.length,
                summaryFallbackUsed: compactionResult.receipt.summaryFallbackUsed,
              });
              sendEvent("compaction_receipt_written", compactionResult.receipt);
              if (compactionResult.receipt.summaryFallbackUsed) {
                sendEvent("compaction_summary_fallback", {
                  reason: "axiom_threshold_not_met",
                });
              }
            }
          } catch (error) {
            console.warn("[CausalChat] Compaction orchestration failed:", error);
            sendEvent("compaction_summary_fallback", {
              reason: "compaction_runtime_error",
            });
          }
        }

        if (
          sessionId &&
          user &&
          supabase &&
          FEATURE_FLAGS.MASA_CAUSAL_LATTICE_V1 &&
          typeof latticeTargetSessionId === "string" &&
          latticeTargetSessionId.trim().length > 0
        ) {
          try {
            const lattice = new CausalLatticeService();
            sendEvent("lattice_broadcast_started", {
              originSessionId: sessionId,
              targetSessionId: latticeTargetSessionId,
            });
            latticeBroadcastSummary = await lattice.broadcastValidatedAxioms(supabase, {
              originSessionId: sessionId,
              targetSessionId: latticeTargetSessionId,
              userId: user.id,
              domain: classification.primary,
              confidenceThreshold: 0.75,
            });

            sendEvent(
              latticeBroadcastSummary.accepted ? "lattice_broadcast_applied" : "lattice_broadcast_rejected",
              latticeBroadcastSummary,
            );
          } catch (error) {
            console.warn("[CausalChat] Lattice broadcast failed:", error);
            latticeBroadcastSummary = {
              accepted: false,
              reason: "broadcast_runtime_error",
              event: {
                originSessionId: sessionId,
                targetSessionId: latticeTargetSessionId,
                axiomIds: [],
                policy: "runtime_error",
                timestamp: new Date().toISOString(),
              },
            };
            sendEvent("lattice_broadcast_rejected", latticeBroadcastSummary);
          }
        }

        if (user && supabase) {
          try {
            const claimLedger = new ClaimLedgerService(supabase);
            const claimId = await claimLedger.recordClaim({
              userId: user.id,
              sessionId: sessionId || undefined,
              traceId: typeof traceId === "string" ? traceId : undefined,
              sourceFeature: "chat",
              claimText: fullText,
              claimKind: interventionApplied ? "hypothesis" : "assertion",
              confidenceScore: factualConfidence.score,
              uncertaintyLabel:
                factualConfidence.level === "high"
                  ? "low"
                  : factualConfidence.level === "medium"
                    ? "medium"
                    : "high",
              modelKey: scmContext.model?.modelKey,
              modelVersion: scmContext.model?.version,
              evidenceLinks: [
                ...groundingSources.map((source) => ({
                  evidenceType: "citation" as const,
                  evidenceRef: source.link,
                  snippet: source.snippet || source.title,
                  metadata: {
                    rank: source.rank,
                    domain: source.domain,
                    title: source.title,
                  },
                })),
                ...scientificAnalysis
                  .filter((entry) => entry.provenance?.ingestionId)
                  .map((entry) => ({
                    evidenceType: "scientific_provenance" as const,
                    evidenceRef: entry.provenance!.ingestionId,
                    snippet: `Scientific extraction ${entry.status}`,
                    metadata: {
                      summary: entry.summary,
                      warnings: entry.warnings,
                      provenance: entry.provenance,
                    },
                  })),
              ],
              gateDecisions: [
                {
                  gateName: "factual_confidence",
                  decision:
                    factualConfidence.level === "high"
                      ? "pass"
                      : factualConfidence.level === "medium"
                        ? "warn"
                        : "fail",
                  rationale: factualConfidence.rationale,
                  score: factualConfidence.score,
                  metadata: {
                    triggerConfidence: factTrigger.confidence,
                    shouldSearch: factTrigger.shouldSearch,
                  },
                },
                ...(interventionGateSummary
                  ? [
                    {
                      gateName: "intervention_gate",
                      decision: interventionGateSummary.allowed ? ("pass" as const) : ("fail" as const),
                      rationale: interventionGateSummary.rationale,
                      metadata: {
                        allowedOutputClass: interventionGateSummary.allowedOutputClass,
                      },
                    },
                  ]
                  : []),
              ],
              receipts: [
                {
                  receiptType: "emission",
                  actor: "causal-chat-api",
                  receiptJson: {
                    sessionId: sessionId || null,
                    traceId: typeof traceId === "string" ? traceId : null,
                    classification: classification.primary,
                  },
                },
              ],
            });

            sendEvent("claim_recorded", { claimId });
          } catch (claimError) {
            console.warn("[CausalChat] Failed to record claim ledger entry:", claimError);
            sendEvent("claim_record_failed", {
              reason: claimError instanceof Error ? claimError.message : "unknown_error",
            });
          }
        }

        sendEvent("complete", {
          finished: true,
          compactionReceipt,
          retrievalFusionDebug,
          latticeBroadcastSummary,
          scientificAnalysis,
          scientificWarnings,
          buildCommit:
            process.env.VERCEL_GIT_COMMIT_SHA ||
            process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
            process.env.GIT_COMMIT ||
            "unknown",
        });
        if (!isControllerClosed) {
          isControllerClosed = true;
          controller.close();
        }
      } catch (error: unknown) {
        const stack = error instanceof Error ? error.stack : undefined;
        console.error("[CausalChat API] Error:", error, stack);

        // Fallback persistence: save what we can even when the pipeline errors
        if (sessionId && user && supabase) {
          try {
            const { error: sessionError } = await supabase
              .from("causal_chat_sessions")
              .upsert({
                id: sessionId,
                user_id: user.id,
                title: userQuestion.slice(0, 50) + (userQuestion.length > 50 ? "..." : ""),
                updated_at: new Date().toISOString(),
                domain_classified: "error_recovery"
              }, { onConflict: "id" });

            if (!sessionError) {
              await supabase.from("causal_chat_messages").insert({
                session_id: sessionId,
                role: "user",
                content: userQuestion
              });

              // Persist partial assistant response if any text was generated
              if (fullTextAccumulator.length > 0) {
                await supabase.from("causal_chat_messages").insert({
                  session_id: sessionId,
                  role: "assistant",
                  content: fullTextAccumulator
                });
              }
            }
            console.log(`[Persistence] Fallback: saved session ${sessionId} after pipeline error.`);
          } catch (persistError) {
            console.error("[Persistence] Fallback persistence also failed:", persistError);
          }
        }

        if (!isControllerClosed) {
          const message = error instanceof Error ? error.message : "Unknown error";
          sendEvent("error", { message });
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
