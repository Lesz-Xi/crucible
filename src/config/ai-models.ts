import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';

// ── MANUAL CONFIGURATION ──────────────────────────────────────
// Toggle your active provider here or via Environment Variables
// ─────────────────────────────────────────────────────────────

export type AIProviderId = 'anthropic' | 'openai' | 'gemini';

export const AI_CONFIG = {
    // The default provider to use for "Fast" tasks (Chat, simple reasoning)
    defaultProvider: (process.env.AI_PROVIDER_DEFAULT as AIProviderId) || 'anthropic',

    // The provider to use for "Heavy" tasks (Complex reasoning, Coding, Scientific Simulation)
    advancedProvider: (process.env.AI_PROVIDER_ADVANCED as AIProviderId) || 'anthropic',

    // ── Provider Registry ──
    providers: {
        anthropic: {
            id: 'anthropic',
            name: 'Anthropic Claude',
            enabled: true,
            models: {
                fast: 'claude-haiku-4.5',
                advanced: 'claude-sonnet-4.5',
                opus: 'claude-opus-4.6'
            },
            // Requires: process.env.ANTHROPIC_API_KEY
        },
        openai: {
            id: 'openai',
            name: 'OpenAI GPT',
            enabled: true, // Set to true after adding OPENAI_API_KEY
            models: {
                fast: 'gpt-5.1-codex-mini',
                advanced: 'gpt-5.3-codex',
                reasoning: 'gpt-5.2'
            },
            // Requires: process.env.OPENAI_API_KEY
        },
        gemini: {
            id: 'gemini',
            name: 'Google Gemini',
            enabled: true,
            models: {
                fast: 'gemini-3-flash',
                thinking: 'gemini-3-deep-think',
                pro: 'gemini-3-pro'
            },
            // Requires: process.env.GOOGLE_GENERATIVE_AI_API_KEY
        }
    }
} as const;

// export type AIProviderId = keyof typeof AI_CONFIG.providers; // Moved to top to avoid circular dependency

// ── Helper to check if a provider is configured ──
export function isProviderConfigured(providerId: AIProviderId): boolean {
    if (!AI_CONFIG.providers[providerId].enabled) return false;

    switch (providerId) {
        case 'anthropic': return !!process.env.ANTHROPIC_API_KEY;
        case 'openai': return !!process.env.OPENAI_API_KEY;
        case 'gemini': return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        default: return false;
    }
}
