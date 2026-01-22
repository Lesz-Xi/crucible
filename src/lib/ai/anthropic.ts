
import Anthropic from "@anthropic-ai/sdk";

let isInitialized = false;

// Initialize Anthropic client
// Lazy-init Anthropic client
function getAnthropicClient(): Anthropic {
  // Only initialize and log once to prevent log flooding
  if (!isInitialized) {
    try {
      const path = require('path');
      const fs = require('fs');
      
      const possiblePaths = [
        path.resolve(process.cwd(), '.env.local'),
        path.resolve(process.cwd(), 'synthesis-engine', '.env.local'),
      ];
      
      let loaded = false;
      for (const envPath of possiblePaths) {
        if (fs.existsSync(envPath)) {
            const dotenv = require('dotenv');
            dotenv.config({ path: envPath, override: true });
            console.log(`[Anthropic] Environment loaded from: ${envPath}`);
            loaded = true;
            break;
        }
      }
      
      if (!loaded) {
          console.warn(`[Anthropic] WARNING: .env.local not found`);
      }
    } catch (e) {
      // ignore
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      const keyPreview = `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}`;
      console.log(`[Anthropic] Client initialized using key: ${keyPreview}`);
    }
    
    isInitialized = true;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is missing in environment variables!");
  }

  return new Anthropic({
    apiKey: apiKey.trim(),
  });
}

// Adapter Interface to mimic Gemini's GenerativeModel
export interface ClaudeModel {
  generateContent(prompt: string): Promise<{ response: { text: () => string } }>;
}

// Concrete Adapter
class ClaudeAdapter implements ClaudeModel {
  private model: string;

  constructor(model: string = "claude-sonnet-4-5-20250929") { // Upgraded to Sonnet 4.5 for best synthesis quality
    this.model = model;
  }

  async generateContent(prompt: string) {
    let attempts = 0;
    const maxAttempts = 5; // Increased resilience

    while (attempts < maxAttempts) {
      try {
        const client = getAnthropicClient();
        const maxTokens = 64000;
        console.log(`[Claude] Requesting ${this.model} (${maxTokens} max_tokens, streaming)...`);
        
        const startTime = Date.now();
        const stream = client.messages.stream({
          model: this.model,
          max_tokens: maxTokens,
          messages: [{ role: "user", content: prompt }],
        });

        // Track progress
        stream.on('streamEvent', (event) => {
          if (event.type === 'message_start') {
            console.log(`[Claude] Stream started for ${this.model}`);
          }
        });

        const finalMsg = await stream.finalMessage();
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const textContent = finalMsg.content[0].type === 'text' ? finalMsg.content[0].text : "";

        console.log(`[Claude] Summary: Stop Reason: ${finalMsg.stop_reason}, Tokens: In=${finalMsg.usage.input_tokens}, Out=${finalMsg.usage.output_tokens}`);
        console.log(`[Claude] Success: Received ${textContent.length} chars in ${duration}s`);

        return {
          response: {
            text: () => textContent,
          },
        };
      } catch (error: any) {
        attempts++;
        const status = error.status || "Unknown Status";
        const message = error.message || "No error message provided";
        
        // Detailed error logging
        console.error(`[Claude] Attempt ${attempts}/${maxAttempts} FAILED (${status})`);
        console.error(`[Claude] Error Details: ${message}`);
        
        if (error.type === 'invalid_request_error') {
           console.error(`[Claude] Critical: Invalid request (often token/model related). Check limit alignment.`);
        }

        if (attempts >= maxAttempts) throw error;
        
        const backoff = 1000 * Math.pow(2, attempts - 1);
        console.log(`[Claude] Retrying in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
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
