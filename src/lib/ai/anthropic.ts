
import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client
// Lazy-init Anthropic client
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
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

// Adapter Interface to mimic Gemini's GenerativeModel
export interface ClaudeModel {
  generateContent(prompt: string): Promise<{ response: { text: () => string } }>;
}

// Concrete Adapter
class ClaudeAdapter implements ClaudeModel {
  private model: string;

  constructor(model: string = "claude-sonnet-4-20250514") {
    this.model = model;
  }

  async generateContent(prompt: string) {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const client = getAnthropicClient();
        const msg = await client.messages.create({
          model: this.model,
          max_tokens: 8192,
          messages: [{ role: "user", content: prompt }],
        });

        const textContent = msg.content[0].type === 'text' ? msg.content[0].text : "";

        return {
          response: {
            text: () => textContent,
          },
        };
      } catch (error) {
        attempts++;
        console.warn(`Claude API attempt ${attempts} failed:`, error);
        
        if (attempts >= maxAttempts) throw error;
        
        // Exponential backoff: 1000ms, 2000ms, 4000ms
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
      }
    }
    
    throw new Error("Unreachable");
  }
}

// Factory function
export function getClaudeModel(): ClaudeModel {
  return new ClaudeAdapter();
}

// TODO: Claude does not support embeddings natively.
// If your pipeline relies on generateEmbedding, you must either:
// 1. Keep using Gemini for embeddings
// 2. Use OpenAI or local transformers.js
// 3. Refactor to remove embedding dependency
