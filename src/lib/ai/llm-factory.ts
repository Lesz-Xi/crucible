import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { AI_CONFIG, AIProviderId } from '../../config/ai-models';
import { getClaudeModel, ClaudeModel } from './anthropic';
import { OpenAIAdapter } from './openai';
import { GeminiAdapter } from './gemini';

// ── LLM Factory ───────────────────────────────────────────────
// Abstraction layer to instantiate the correct model provider
// Supports both Environment Variables (System Keys) and
// Runtime Overrides (User Keys / BYOK)
// ─────────────────────────────────────────────────────────────

export interface LLMOptions {
    providerId?: AIProviderId;
    modelType?: 'fast' | 'advanced' | 'reasoning';
    modelId?: string; // Explicit model override (validated by caller)
    apiKey?: string; // BYOK: User-provided API Key
}

export class LLMFactory {

    /**
     * Map fictional MASA model IDs to their actual real-world API equivalent
     */
    private static resolveApiMapping(modelId: string): string {
        const mapping: Record<string, string> = {
            // Anthropic — mapped to Claude 4.5 tier (confirmed available on API key)
            'claude-4-5-haiku': 'claude-haiku-4-5-20251001',
            'claude-4-5-sonnet': 'claude-sonnet-4-5-20250929',
            'claude-4-6-opus': 'claude-opus-4-5-20251101',
            // OpenAI
            'gpt-5-3-codex-spark': 'gpt-4o-mini',
            'gpt-5-3-codex': 'gpt-4o',
            'gpt-5-2': 'o1-preview',
            // Gemini
            'gemini-3-flash': 'gemini-1.5-flash',
            'gemini-3-deep-think': 'gemini-1.5-pro',
            'gemini-3-pro': 'gemini-1.5-pro'
        };
        return mapping[modelId] || modelId;
    }

    /**
     * Get a Vercel AI SDK compatible model instance
     * @param options - Configuration options with optional API key override
     */
    static getModel(options: LLMOptions = {}) {
        const {
            providerId = AI_CONFIG.defaultProvider,
            modelType = 'advanced',
            modelId: explicitModelId,
            apiKey
        } = options;

        // 1. Resolve Provider & Model ID
        const providerConfig = AI_CONFIG.providers[providerId];

        // @ts-ignore - dynamic access to model types
        const rawModelId = explicitModelId || providerConfig.models[modelType] || providerConfig.models.advanced;
        const modelId = LLMFactory.resolveApiMapping(rawModelId);

        // 2. Validate Key Availability (Env or Runtime)
        if (!apiKey && !LLMFactory.validateEnvironment(providerId)) {
            throw new Error(`Missing API Key for ${providerConfig.name}. Please configure environment variables or provide a User Key.`);
        }

        // 3. Instantiate Provider
        switch (providerId) {
            case 'anthropic':
                const anthropic = createAnthropic({
                    apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
                });
                return anthropic(modelId);

            case 'openai':
                const openai = createOpenAI({
                    apiKey: apiKey || process.env.OPENAI_API_KEY,
                });
                return openai(modelId);

            case 'gemini':
                const google = createGoogleGenerativeAI({
                    apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
                });
                return google(modelId);

            default:
                throw new Error(`Unknown AI Provider: ${providerId}`);
        }
    }

    /**
     * Get a legacy ClaudeModel compatible adapter (supports generateContent interface)
     */
    static getAdapter(options: LLMOptions = {}): ClaudeModel {
        const {
            providerId = AI_CONFIG.defaultProvider,
            modelType = 'advanced',
            modelId: explicitModelId,
            apiKey
        } = options;

        // 1. Resolve Provider & Model ID
        const providerConfig = AI_CONFIG.providers[providerId];

        // @ts-ignore - dynamic access to model types
        const rawModelId = explicitModelId || providerConfig.models[modelType] || providerConfig.models.advanced;
        const modelId = LLMFactory.resolveApiMapping(rawModelId);

        // 2. Validate Key Availability (Env or Runtime)
        if (!apiKey && !LLMFactory.validateEnvironment(providerId)) {
            // Check specifically for user-provided key requirement if system key is missing
            throw new Error(`Missing API Key for ${providerConfig.name}. Please configure environment variables or provide a User Key.`);
        }

        // 3. Instantiate Adapter
        switch (providerId) {
            case 'anthropic':
                // Use the factory from anthropic.ts which uses the official SDK
                // We pass modelId here leveraging the update we just made
                return getClaudeModel({ apiKey, model: modelId });

            case 'openai':
                return new OpenAIAdapter(modelId, apiKey);

            case 'gemini':
                return new GeminiAdapter(modelId, apiKey);

            default:
                throw new Error(`Unknown AI Provider: ${providerId}`);
        }
    }

    /**
     * Helper to check if system-level keys exist
     */
    static validateEnvironment(providerId: AIProviderId): boolean {
        switch (providerId) {
            case 'anthropic': return !!process.env.ANTHROPIC_API_KEY;
            case 'openai': return !!process.env.OPENAI_API_KEY;
            case 'gemini': return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
            default: return false;
        }
    }
}
