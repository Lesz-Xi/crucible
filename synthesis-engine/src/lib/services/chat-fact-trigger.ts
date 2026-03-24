import type { FactTriggerResult } from "@/types/chat-grounding";

const FACT_PATTERNS: RegExp[] = [
  /\bwho\s+(created|founded|owns|built)\b/i,
  /\b(founder|cofounder|ceo|creator|owner)\b/i,
  /\bwhat\s+is\b/i,
  /\bwhen\s+(launched|founded|started|created)\b/i,
  /\bofficial\s+site\b/i,
  /\bcompany\b/i,
  /\b(latest|current|recent|today|this week|breaking)\b/i,
  /\b(news|update|updates|frontier|breakthrough)\b/i,
  /\b(web\s*search|search\s+the\s+web|look\s+up)\b/i,
];

const ENTITY_CANDIDATE = /\b([A-Z][a-zA-Z0-9]+(?:[.-][A-Za-z0-9]+)*)\b/g;
const DOMAIN_CANDIDATE = /\b([a-z0-9-]+\.[a-z]{2,})(?:\/[^\s]*)?\b/gi;

const STOP_ENTITIES = new Set([
  "What",
  "Who",
  "When",
  "Where",
  "Why",
  "How",
  "The",
  "A",
  "An",
  "I",
  "Do",
  "Search",
  "Find",
  "Tell",
  "Give",
  "Show",
  "Explain",
  "Retrieve",
]);

const IMPERATIVE_LEAD_VERBS = new Set([
  "do",
  "search",
  "find",
  "tell",
  "give",
  "show",
  "explain",
  "retrieve",
  "check",
  "look",
]);

const SHORT_ENTITY_ALLOWLIST = new Set([
  "AI",
  "UK",
  "US",
  "EU",
  "UN",
  "UAE",
  "IBM",
  "MIT",
]);

function normalizeEntity(entity: string): string {
  return entity.trim().replace(/[.,!?;:]+$/g, "");
}

function shouldDropImperativeLeadToken(token: string, text: string, matchIndex: number): boolean {
  if (matchIndex > 1) return false;
  if (!IMPERATIVE_LEAD_VERBS.has(token.toLowerCase())) return false;
  return /\b(web\s*search|search\s+the\s+web|look\s+up|find\s+information|check)\b/i.test(text);
}

function isValidEntityLength(token: string): boolean {
  if (token.length >= 3) return true;
  return SHORT_ENTITY_ALLOWLIST.has(token.toUpperCase());
}

export function evaluateFactTrigger(input: string): FactTriggerResult {
  const text = (input || "").trim();
  if (!text) {
    return {
      shouldSearch: false,
      confidence: 0,
      reason: "empty_input",
      normalizedEntities: [],
    };
  }

  const entities = new Set<string>();

  const domainMatches = text.match(DOMAIN_CANDIDATE) || [];
  for (const m of domainMatches) {
    entities.add(normalizeEntity(m.toLowerCase()));
  }

  const entityMatches = Array.from(text.matchAll(ENTITY_CANDIDATE));
  for (const match of entityMatches) {
    const raw = match[1] || "";
    const normalized = normalizeEntity(raw);
    const index = typeof match.index === "number" ? match.index : -1;

    if (!normalized || STOP_ENTITIES.has(normalized)) continue;
    if (!isValidEntityLength(normalized)) continue;
    if (shouldDropImperativeLeadToken(normalized, text, index)) continue;

    entities.add(normalized);
  }

  const normalizedEntities = Array.from(entities).slice(0, 6);
  const hasFactPattern = FACT_PATTERNS.some((pattern) => pattern.test(text));
  const hasEntitySignal = normalizedEntities.length > 0;

  const hasRealtimeIntent = /\b(latest|current|recent|today|breaking|web\s*search|search\s+the\s+web|look\s+up)\b/i.test(text);

  let confidence = 0;
  if (hasFactPattern) confidence += 0.55;
  if (hasEntitySignal) confidence += 0.25;
  if (domainMatches.length > 0) confidence += 0.1;
  if (hasRealtimeIntent) confidence += 0.25;

  const boundedConfidence = Math.max(0, Math.min(1, confidence));
  const shouldSearch = boundedConfidence >= 0.55;
  const reason = shouldSearch
    ? "entity_fact_query_detected"
    : hasFactPattern
      ? "fact_pattern_low_entity_confidence"
      : "non_fact_or_conversational_query";

  return {
    shouldSearch,
    confidence: boundedConfidence,
    reason,
    normalizedEntities,
  };
}
