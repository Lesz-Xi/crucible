export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface RawChatTurn {
  role?: unknown;
  content?: unknown;
  isStreaming?: unknown;
}

export interface BuildConversationContextOptions {
  maxContextChars?: number;
  referentialPattern?: RegExp;
}

export interface ContextBuildResult {
  promptContext: string;
  includedTurns: number;
  truncatedTurns: number;
  hasPriorContext: boolean;
  ambiguousReference: boolean;
}

export const MAX_CONTEXT_CHARS = 60000;
export const DEFAULT_REFERENTIAL_PATTERN = /\b(this|that|it|they|these|those|same|again)\b/i;

function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function normalizeRole(value: unknown): ChatTurn["role"] | null {
  if (value === "user" || value === "assistant") {
    return value;
  }
  return null;
}

function sameText(left: string, right: string): boolean {
  return sanitizeText(left).toLowerCase() === sanitizeText(right).toLowerCase();
}

function formatConversation(turns: ChatTurn[]): string {
  let threadIndex = 0;
  let activeThread = 0;

  return turns
    .map((turn) => {
      if (turn.role === "user") {
        threadIndex += 1;
        activeThread = threadIndex;
      } else if (activeThread === 0) {
        threadIndex += 1;
        activeThread = threadIndex;
      }

      const speaker = turn.role === "user" ? "User" : "Assistant";
      return `${speaker} (T${activeThread}): ${turn.content}`;
    })
    .join("\n");
}

export function normalizeChatTurns(messages: unknown): ChatTurn[] {
  if (!Array.isArray(messages)) return [];

  const normalized: ChatTurn[] = [];
  for (const message of messages) {
    const row = (message ?? {}) as RawChatTurn;
    if (row.isStreaming === true) continue;

    const role = normalizeRole(row.role);
    const content = sanitizeText(row.content);
    if (!role || !content) continue;

    normalized.push({ role, content });
  }

  return normalized;
}

export function buildConversationContext(
  messages: unknown,
  currentQuestion: string,
  options: BuildConversationContextOptions = {}
): ContextBuildResult {
  const referentialPattern = options.referentialPattern ?? DEFAULT_REFERENTIAL_PATTERN;
  const maxContextChars = options.maxContextChars ?? MAX_CONTEXT_CHARS;
  const normalizedQuestion = sanitizeText(currentQuestion);

  const turns = normalizeChatTurns(messages);
  if (normalizedQuestion.length > 0) {
    const lastUserTurn = [...turns].reverse().find((turn) => turn.role === "user");
    if (!lastUserTurn || !sameText(lastUserTurn.content, normalizedQuestion)) {
      turns.push({ role: "user", content: normalizedQuestion });
    }
  }

  let truncatedTurns = 0;
  let includedTurns = [...turns];
  let promptContext = formatConversation(includedTurns);

  while (promptContext.length > maxContextChars && includedTurns.length > 1) {
    includedTurns.shift();
    truncatedTurns += 1;
    promptContext = formatConversation(includedTurns);
  }

  if (promptContext.length > maxContextChars) {
    promptContext = promptContext.slice(-maxContextChars);
  }

  const hasPriorContext = includedTurns.length > 1;
  const lastIsCurrentQuestion =
    normalizedQuestion.length > 0 &&
    includedTurns.length > 0 &&
    includedTurns[includedTurns.length - 1].role === "user" &&
    sameText(includedTurns[includedTurns.length - 1].content, normalizedQuestion);
  const priorTurns = lastIsCurrentQuestion ? includedTurns.slice(0, -1) : includedTurns;
  const priorChars = priorTurns.reduce((sum, turn) => sum + turn.content.length, 0);
  const weakPriorContext = priorTurns.length === 0 || priorChars < 80;
  const ambiguousReference =
    normalizedQuestion.length > 0 && referentialPattern.test(normalizedQuestion) && weakPriorContext;

  return {
    promptContext,
    includedTurns: includedTurns.length,
    truncatedTurns,
    hasPriorContext,
    ambiguousReference,
  };
}
