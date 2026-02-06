import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { executeWithRetry } from "./resilient-ai-orchestrator";

let isInitialized = false;
let anthropicClientInstance: Anthropic | null = null;

// Debug logging - only log if AI_DEBUG env var is set
const isDebug = process.env.AI_DEBUG === 'true' || process.env.NODE_ENV === 'development';

function debugLog(...args: any[]) {
  if (isDebug) {
    console.log(...args);
  }
}

// --- Anthropic Implementation ---
function getAnthropicClient(): Anthropic {
  // Reuse existing client instance to avoid repeated initialization
  if (anthropicClientInstance) {
    return anthropicClientInstance;
  }
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!isInitialized) {
    if (apiKey) {
      const keyPreview = `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}`;
      debugLog(`[Anthropic] Client initialized using key: ${keyPreview}`);
    } else {
      console.warn(`[Anthropic] WARNING: ANTHROPIC_API_KEY not found in environment`);
    }
    isInitialized = true;
  }
  
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is missing!");
  
  anthropicClientInstance = new Anthropic({ apiKey: apiKey.trim() });
  return anthropicClientInstance;
}

// --- Gemini Implementation ---
function getGeminiClient(): GoogleGenerativeAI {
  const apiKey =
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY is missing!");
  return new GoogleGenerativeAI(apiKey);
}

// --- Shared Interface ---
export interface ClaudeModel {
  generateContent(prompt: string): Promise<{ response: { text: () => string } }>;
  generateContentStream(prompt: string): AsyncIterable<{ text: () => string }>;
}

// --- Adapters ---

class ClaudeAdapter implements ClaudeModel {
  constructor(private model: string = "claude-sonnet-4-5-20250929") {}

  async generateContent(prompt: string) {
    return await executeWithRetry(
      async () => {
        const client = getAnthropicClient();
        const stream = client.messages.stream({
          model: this.model,
          max_tokens: 8192,
          messages: [{ role: "user", content: prompt }],
        });
        const finalMsg = await stream.finalMessage();
        const textContent = finalMsg.content[0].type === 'text' ? finalMsg.content[0].text : "";
        return { response: { text: () => textContent } };
      },
      {
        provider: 'anthropic',
        operationName: 'claude-generate-content',
        maxAttempts: 3,
      }
    );
  }

  async *generateContentStream(prompt: string) {
    // Note: Streaming has inherent retry complexity (partial consumption)
    // For now, wrap the stream creation with retry, but not individual chunks
    const stream = await executeWithRetry(
      async () => {
        const client = getAnthropicClient();
        return client.messages.stream({
          model: this.model,
          max_tokens: 8192,
          messages: [{ role: "user", content: prompt }],
        });
      },
      {
        provider: 'anthropic',
        operationName: 'claude-generate-content-stream',
        maxAttempts: 2, // Fewer retries for streaming (avoid long delays)
      }
    );

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const delta = chunk.delta as { type: 'text_delta'; text: string };
        yield { text: () => delta.text };
      }
    }
  }
}

class GeminiAdapter implements ClaudeModel {
  constructor(private model?: string) {}

  private getModelCandidates(): string[] {
    return Array.from(
      new Set(
        [
          this.model,
          process.env.GEMINI_TEXT_MODEL,
          "gemini-2.5-flash",
          "gemini-2.0-flash",
          "gemini-2.0-flash-001",
          "gemini-flash-latest",
        ].filter((value): value is string => Boolean(value && value.trim().length > 0))
      )
    );
  }

  async generateContent(prompt: string) {
    const client = getGeminiClient();
    let lastError: unknown = null;

    for (const modelName of this.getModelCandidates()) {
      try {
        const model = client.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return { response: { text: () => text } };
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError ?? new Error("No Gemini text models available");
  }

  async *generateContentStream(prompt: string) {
    const client = getGeminiClient();
    let lastError: unknown = null;

    for (const modelName of this.getModelCandidates()) {
      try {
        const model = client.getGenerativeModel({ model: modelName });
        const result = await model.generateContentStream(prompt);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            yield { text: () => text };
          }
        }
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError ?? new Error("No Gemini text models available for streaming");
  }
}

// --- Factory ---

// Singleton instances for reuse
let claudeAdapterInstance: ClaudeAdapter | null = null;
let geminiAdapterInstance: GeminiAdapter | null = null;
let factoryInitialized = false;

/**
 * Global factory for the Causal Explorer's reasoning engine.
 * Defaults to Anthropic, but supports Gemini fallback via CAUSAL_AI_PROVIDER environment variable.
 * 
 * OPTIMIZED: Returns singleton instances to avoid repeated initialization logs.
 */
export function getClaudeModel(): ClaudeModel {
  const provider = process.env.CAUSAL_AI_PROVIDER?.toLowerCase() || "anthropic";
  
  if (provider === "gemini") {
    if (!geminiAdapterInstance) {
      if (!factoryInitialized) {
        debugLog("[AI Factory] Initializing Gemini Provider...");
        factoryInitialized = true;
      }
      geminiAdapterInstance = new GeminiAdapter();
    }
    return geminiAdapterInstance;
  }
  
  if (!claudeAdapterInstance) {
    if (!factoryInitialized) {
      debugLog("[AI Factory] Initializing Anthropic Provider...");
      factoryInitialized = true;
    }
    claudeAdapterInstance = new ClaudeAdapter();
  }
  return claudeAdapterInstance;
}
