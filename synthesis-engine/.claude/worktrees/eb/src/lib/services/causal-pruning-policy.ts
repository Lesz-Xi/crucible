import type { CacheTtlState, CausalRung, PruningDecision } from "@/types/persistent-memory";

export interface PrunableChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  causalDensity?: {
    score?: number;
    confidence?: number;
  } | null;
  hasToolEvidence?: boolean;
  isInterventionTrace?: boolean;
}

export interface PruningResult {
  retainedMessages: PrunableChatMessage[];
  prunedMessages: PrunableChatMessage[];
  decisions: PruningDecision[];
}

function toCausalRung(score: number | undefined): CausalRung {
  if (score === 3) return "L3";
  if (score === 2) return "L2";
  return "L1";
}

function basePriority(message: PrunableChatMessage): number {
  const rung = toCausalRung(message.causalDensity?.score);
  const rungWeight = rung === "L3" ? 90 : rung === "L2" ? 60 : 30;
  const evidenceBonus = message.hasToolEvidence ? 20 : 0;
  const interventionBonus = message.isInterventionTrace ? 20 : 0;
  return rungWeight + evidenceBonus + interventionBonus;
}

export function evaluateCausalPruning(
  messages: PrunableChatMessage[],
  options: {
    maxMessages: number;
    cacheTtlState: CacheTtlState;
  },
): PruningResult {
  const decisions: PruningDecision[] = [];

  if (messages.length <= options.maxMessages) {
    return {
      retainedMessages: messages,
      prunedMessages: [],
      decisions: messages.map((message) => ({
        messageId: message.id,
        eligible: false,
        reason: "within_limit",
        cacheTtlState: options.cacheTtlState,
        keepPriorityScore: basePriority(message),
        causalLevel: toCausalRung(message.causalDensity?.score),
      })),
    };
  }

  const protectedMessageIds = new Set<string>();
  const newestWindow = messages.slice(-4);
  newestWindow.forEach((message) => protectedMessageIds.add(message.id));

  const ranked = messages
    .map((message, index) => {
      const priority = basePriority(message) + (index / Math.max(messages.length, 1)) * 10;
      return { message, priority };
    })
    .sort((a, b) => b.priority - a.priority);

  const retainedIds = new Set<string>(Array.from(protectedMessageIds));

  for (const item of ranked) {
    if (retainedIds.size >= options.maxMessages) break;
    retainedIds.add(item.message.id);
  }

  const retainedMessages: PrunableChatMessage[] = [];
  const prunedMessages: PrunableChatMessage[] = [];

  for (const message of messages) {
    const rung = toCausalRung(message.causalDensity?.score);
    const keepPriorityScore = basePriority(message);
    if (retainedIds.has(message.id)) {
      retainedMessages.push(message);
      decisions.push({
        messageId: message.id,
        eligible: false,
        reason: protectedMessageIds.has(message.id) ? "recent_message_guard" : "priority_retained",
        cacheTtlState: options.cacheTtlState,
        keepPriorityScore,
        causalLevel: rung,
      });
      continue;
    }

    prunedMessages.push(message);
    decisions.push({
      messageId: message.id,
      eligible: true,
      reason: "token_pressure_pruned",
      cacheTtlState: options.cacheTtlState,
      keepPriorityScore,
      causalLevel: rung,
    });
  }

  return {
    retainedMessages,
    prunedMessages,
    decisions,
  };
}
