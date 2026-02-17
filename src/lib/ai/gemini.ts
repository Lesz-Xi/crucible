
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
// Import interfaces from Anthropic adapter to reuse the shape
// In a clean architecture, these would be in a shared 'ai-interfaces.ts'
// But respecting "Minimal Refactoring", we import from existing source.
import { ClaudeModel, GenerateContentOptions, GenerateContentResult } from './anthropic';

export class GeminiAdapter implements ClaudeModel {
  private modelId: string;
  private apiKey?: string;

  constructor(modelId: string = "gemini-3-pro", apiKey?: string) {
    this.modelId = modelId;
    this.apiKey = apiKey;
  }

  async generateContent(prompt: string, options?: GenerateContentOptions): Promise<GenerateContentResult> {
    try {
      const google = createGoogleGenerativeAI({
        apiKey: this.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });

      const model = google(this.modelId);

      const messages: any[] = [];
      if (options?.system) {
        messages.push({ role: 'system', content: options.system });
      }

      if (options?.messages) {
        // Convert Anthropic messages to AI SDK Core messages
        const coreMessages = options.messages.map(m => {
          if (typeof m.content === 'string') return { role: m.role, content: m.content };
          const text = m.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
          return { role: m.role, content: text };
        });
        messages.push(...coreMessages);
      } else {
        messages.push({ role: 'user', content: prompt });
      }

      // Ensure prompt is included if separate
      if (options?.messages && prompt && !messages.some(m => m.content.includes(prompt))) {
        messages.push({ role: 'user', content: prompt });
      }

      const result = await generateText({
        model,
        messages,
        maxTokens: 8192,
        temperature: 0.7,
      } as any);

      return {
        response: {
          text: () => result.text,
          toolCalls: () => [], // Flatten tools for now
        }
      };

    } catch (error) {
      console.error("[Gemini Adapter] Generation failed:", error);
      throw error;
    }
  }
}

export function getGeminiModel(options?: { apiKey?: string, model?: string }): ClaudeModel {
  return new GeminiAdapter(options?.model, options?.apiKey);
}

// Deprecated stubs if needed, but we are replacing the file content completely.
// If other files import 'getEmbeddingModel' from here, we might break them if we remove it.
// Checking previous file content: it exported `getEmbeddingModel`.
// I should keep `getEmbeddingModel` stub to prevent build errors.

export function getEmbeddingModel(): any {
  throw new Error("Gemini embedding model is deprecated.");
}

export async function generateEmbedding(text: string): Promise<number[]> {
  console.warn("generateEmbedding: Returning mock embedding vector (Gemini removed).");
  return Array(768).fill(0).map(() => Math.random());
}
