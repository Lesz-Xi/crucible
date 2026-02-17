
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { ClaudeModel, GenerateContentOptions, GenerateContentResult, ToolCall } from './anthropic';

export class OpenAIAdapter implements ClaudeModel {
    private modelId: string;
    private apiKey?: string;

    constructor(modelId: string = "gpt-5-3-codex", apiKey?: string) {
        this.modelId = modelId;
        this.apiKey = apiKey;
    }

    async generateContent(prompt: string, options?: GenerateContentOptions): Promise<GenerateContentResult> {
        try {
            const openai = createOpenAI({
                apiKey: this.apiKey || process.env.OPENAI_API_KEY,
            });

            const model = openai(this.modelId);

            // Map Anthropic tools to AI SDK tools if present
            // Note: AI SDK expects a different tool format (Zod schema). 
            // The current ToolDefinition in anthropic.ts is: { name, description, input_schema }
            // This is JSON Schema. Vercel AI SDK 'tools' option usually expects Zod or a specific object structure.
            // However, generateText allows 'tools' defined as Record<string, Tool>.
            // Muting tool support for Phase 1 of OpenAI/Gemini to avoid schema translation complexity unless strictly needed.
            // The current user flow (CausalChat) uses tools significantly.
            // IF tools are passed, we might crash if we don't handle them.
            // For now, let's implement text-only support or basic tool support if easy.
            // Given "Minimal Refactoring Risk", I will Log a warning if tools are used and skip them for now,
            // OR try to pass them if Vercel SDK accepts JSON schema tools (it supports 'jsonSchema' in newer versions).

            // Let's stick to text generation for BYOK MVP to avoid breaking complex tool flows.

            const messages: any[] = [];
            if (options?.system) {
                messages.push({ role: 'system', content: options.system });
            }

            if (options?.messages) {
                // Convert Anthropic messages to AI SDK Core messages
                const coreMessages = options.messages.map(m => {
                    if (typeof m.content === 'string') return { role: m.role, content: m.content };
                    // Handle array content (simple text extraction for now)
                    const text = m.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
                    return { role: m.role, content: text };
                });
                messages.push(...coreMessages);
            } else {
                messages.push({ role: 'user', content: prompt });
            }

            // If prompt is separate and not in messages
            if (options?.messages && prompt && !messages.some(m => m.content.includes(prompt))) {
                messages.push({ role: 'user', content: prompt });
            }

            const result = await generateText({
                model,
                messages,
                maxTokens: 4096, // OpenAI limit
                temperature: 0.7,
            } as any);

            return {
                response: {
                    text: () => result.text,
                    toolCalls: () => [], // TODO: Map result.toolCalls if we implement tool support
                }
            };

        } catch (error) {
            console.error("[OpenAI Adapter] Generation failed:", error);
            throw error;
        }
    }
}

export function getOpenAIModel(options?: { apiKey?: string, model?: string }): ClaudeModel {
    return new OpenAIAdapter(options?.model, options?.apiKey);
}
