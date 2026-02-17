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
        const modelId = explicitModelId || providerConfig.models[modelType] || providerConfig.models.advanced;

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
        const modelId = explicitModelId || providerConfig.models[modelType] || providerConfig.models.advanced;

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
