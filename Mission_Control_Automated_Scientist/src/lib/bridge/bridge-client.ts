/**
 * Bridge Client for Mission Control -> Synthesis Engine communication
 * Defined in implementation-blueprint-v1.1.md Phase 0
 */

// We duplicate the exact types from bridge-types to avoid cross-repo symlink issues for now
// In a true monorepo, we'd import from '@synthetic-mind/bridge-types'
export interface HealthResponse {
    status: "ok" | "degraded" | "down";
    version: string;
    timestamp: string;
}

export interface BridgeErrorResponse {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}

export class BridgeError extends Error {
    constructor(public code: string, message: string, public details?: Record<string, unknown>) {
        super(message);
        this.name = 'BridgeError';
    }
}

export class BridgeClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_SYNTHESIS_ENGINE_URL || 'http://localhost:3000/api/bridge';
    }

    async getHealth(): Promise<HealthResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                // Short timeout for health checks
                signal: AbortSignal.timeout(3000)
            });

            if (!response.ok) {
                throw new BridgeError('BRIDGE_UPSTREAM_UNAVAILABLE', `SE returned ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (error instanceof BridgeError) throw error;
            throw new BridgeError('BRIDGE_UPSTREAM_UNAVAILABLE', 'Failed to connect to Synthesis Engine', { cause: error });
        }
    }

    // Placeholder for P0-04 (chat-verified)
    async postChatVerified(payload: any): Promise<any> {
        throw new Error('Not implemented yet - P0-04');
    }
}

export const bridgeClient = new BridgeClient();
