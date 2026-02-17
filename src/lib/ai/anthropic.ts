
import Anthropic from "@anthropic-ai/sdk";

// Lazy-init Anthropic client
let anthropicClient: Anthropic | null = null;


function getAnthropicClient(apiKeyOverride?: string): Anthropic {
  // If an override is provided, we ALWAYS create a new client (or cache it by key if needed, but simplest is new instance for BYOK)
  if (apiKeyOverride) {
    return new Anthropic({
      apiKey: apiKeyOverride.trim(),
    });
  }

  // Fallback to singleton env-based client
  if (anthropicClient) return anthropicClient;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is missing in environment variables!");
  }

  // Validate API Key format
  if (apiKey.length < 40) {
    throw new Error(`Invalid ANTHROPIC_API_KEY: Key is too short (${apiKey.length} chars). Expected > 40 chars.`);
  }

  if (apiKey.includes("api-key-here") || apiKey.includes("your-api-key")) {
    throw new Error(`Invalid ANTHROPIC_API_KEY: Detected placeholder value ('${apiKey}'). Please check your .env.local file or SHELL variables.`);
  }

  console.log(`[Anthropic Init] API Key loaded successfully. Length: ${apiKey.length}`);

  anthropicClient = new Anthropic({
    apiKey: apiKey.trim(),
  });

  return anthropicClient;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface GenerateContentOptions {
  system?: string;
  tools?: ToolDefinition[];
  toolChoice?: { type: "auto" | "any" | "tool"; name?: string };
  messages?: Array<Anthropic.MessageParam>; // Allow passing existing conversation history
}

export interface GenerateContentResult {
  response: {
    text: () => string;
    toolCalls: () => ToolCall[];
  };
}

// Adapter Interface to mimic Gemini's GenerativeModel, extended for Tools
export interface ClaudeModel {
  generateContent(prompt: string, options?: GenerateContentOptions): Promise<GenerateContentResult>;
}

function extractTextFromMessageContent(content: Array<Anthropic.ContentBlock>): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function extractToolCallsFromMessageContent(content: Array<Anthropic.ContentBlock>): ToolCall[] {
  return content
    .filter((block): block is Anthropic.ToolUseBlock => block.type === "tool_use")
    .map((block) => ({
      id: block.id,
      name: block.name,
      input: block.input as Record<string, unknown>,
    }));
}


// Concrete Adapter
class ClaudeAdapter implements ClaudeModel {
  private model: string;
  private apiKey?: string;

  constructor(model: string = "claude-4-5-sonnet", apiKey?: string) { // Harmonized with AI_CONFIG (Feb 2026)
    this.model = model;
    this.apiKey = apiKey;
  }

  async generateContent(prompt: string, options?: GenerateContentOptions): Promise<GenerateContentResult> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const client = getAnthropicClient(this.apiKey);

        // Use provided messages or start fresh with prompt
        const messages: Array<Anthropic.MessageParam> = options?.messages
          ? [...options.messages]
          : [{ role: "user", content: prompt }];

        // If we didn't use options.messages but have a prompt, ensure it's in there (handled above).
        // If we DO use options.messages, 'prompt' arg might be ignored or expected to be the last user message?
        // Standard convention: if options.messages is passed, it takes precedence. 
        // If 'prompt' is also passed and not empty, and not already in messages, we could append it?
        // For safety/clarity: Let's assume if options.messages is passed, the caller handles the full context.
        // But the signature requires 'prompt'. 
        // Let's modify logic: if options.messages has content, use it. If prompt is not empty and not last message, append it?
        // Actually, simplest is: if options.messages, verify prompt is needed.
        // Let's stick to: if options.messages is present, use it. If prompt is provided and not in messages, append it.
        // But for this specific use case (tool loop), we will likely pass the FULL history including the latest user prompt in 'options.messages'.

        // Edge case: Initial call might just use 'prompt'. Subsequent calls use 'options.messages'.

        if (options?.messages && prompt && !options.messages.some(m => m.content === prompt)) {
          // prompt is just a string, m.content can be string or array.
          // simpler: if options.messages is provided, we assume it's the source of truth.
        }

        let assembledText = "";
        let collectedToolCalls: ToolCall[] = [];
        let continuationHops = 0;
        const maxContinuationHops = 1;

        // Note: With tools, we generally want to stop on tool_use. 
        // If tools are provided, we don't do the simple "max_tokens" continuation loop 
        // because the state management gets complex. 
        // For now, we disable the manual continuation loop if tools are present.
        const toolsEnabled = options?.tools && options.tools.length > 0;

        while (true) {
          const msg = await client.messages.create({
            model: this.model,
            max_tokens: 8192,
            messages,
            system: options?.system,
            tools: options?.tools as Anthropic.Tool[] | undefined,
            tool_choice: options?.toolChoice as any,
          });

          const textChunk = extractTextFromMessageContent(msg.content);
          const toolCalls = extractToolCallsFromMessageContent(msg.content);

          if (textChunk) {
            assembledText = assembledText ? `${assembledText}\n${textChunk}` : textChunk;
          }
          if (toolCalls.length > 0) {
            collectedToolCalls = collectedToolCalls.concat(toolCalls);
          }

          // Stop conditions
          if (msg.stop_reason === "tool_use") {
            break;
          }

          if (msg.stop_reason !== "max_tokens" || continuationHops >= maxContinuationHops || toolsEnabled) {
            if (msg.stop_reason === "max_tokens" && !toolsEnabled) {
              console.warn("[Anthropic] Response hit max_tokens; returning truncated-safe output after continuation cap.");
            }
            break;
          }

          // Continuation logic (only for text-only mode)
          continuationHops += 1;
          console.warn(`[Anthropic] stop_reason=max_tokens, requesting continuation hop ${continuationHops}/${maxContinuationHops}`);

          messages.push({ role: "assistant", content: textChunk || assembledText || "" });
          messages.push({
            role: "user",
            content: "Continue exactly where you left off. Do not repeat prior text. Complete the response succinctly.",
          });
        }

        return {
          response: {
            text: () => assembledText,
            toolCalls: () => collectedToolCalls,
          },
        };
      } catch (error) {
        attempts++;
        console.warn(`Claude API attempt ${attempts} failed:`, error);

        if (attempts >= maxAttempts) throw error;

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
      }
    }

    throw new Error("Unreachable");
  }
}

// Factory function
export function getClaudeModel(options?: { apiKey?: string; model?: string }): ClaudeModel {
  return new ClaudeAdapter(options?.model, options?.apiKey);
}
