/**
 * TokenBucketRateLimiter
 * 
 * Implements token bucket algorithm for API rate limiting.
 * Brave Search free tier: 1 request/second
 * 
 * Usage:
 * ```typescript
 * const limiter = new TokenBucketRateLimiter({ tokensPerSecond: 1, maxTokens: 3 });
 * await limiter.waitForToken(); // Blocks until token available
 * // Make API call
 * ```
 */

export interface TokenBucketConfig {
    /**
     * Rate of token refill (tokens per second)
     * Brave free tier: 1
     */
    tokensPerSecond: number;

    /**
     * Maximum tokens that can accumulate (burst capacity)
     * Recommended: 2-3x tokensPerSecond for burst handling
     */
    maxTokens: number;
}

export class TokenBucketRateLimiter {
    private tokens: number;
    private lastRefill: number;
    private readonly tokensPerSecond: number;
    private readonly maxTokens: number;
    private waitQueue: Array<() => void> = [];

    constructor(config: TokenBucketConfig) {
        this.tokensPerSecond = config.tokensPerSecond;
        this.maxTokens = config.maxTokens;
        this.tokens = config.maxTokens;
        this.lastRefill = Date.now();
    }

    /**
     * Refills tokens based on elapsed time since last refill
     */
    private refill(): void {
        const now = Date.now();
        const elapsedSeconds = (now - this.lastRefill) / 1000;
        const tokensToAdd = elapsedSeconds * this.tokensPerSecond;

        if (tokensToAdd > 0) {
            this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
            this.lastRefill = now;
        }
    }

    /**
     * Waits until a token is available, then consumes it
     * @param timeout Maximum wait time in ms (default: 30000)
     * @returns Promise that resolves when token acquired
     * @throws Error if timeout exceeded
     */
    async waitForToken(timeout: number = 30000): Promise<void> {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const attemptAcquire = () => {
                this.refill();

                if (this.tokens >= 1) {
                    this.tokens -= 1;
                    resolve();
                    return;
                }

                // Check timeout
                if (Date.now() - startTime >= timeout) {
                    reject(new Error(`Rate limiter timeout after ${timeout}ms`));
                    return;
                }

                // Calculate wait time until next token
                const tokensNeeded = 1 - this.tokens;
                const waitMs = Math.max(100, (tokensNeeded / this.tokensPerSecond) * 1000);

                setTimeout(attemptAcquire, waitMs);
            };

            attemptAcquire();
        });
    }

    /**
     * Try to acquire a token without waiting
     * @returns true if token acquired, false if no tokens available
     */
    tryAcquire(): boolean {
        this.refill();

        if (this.tokens >= 1) {
            this.tokens -= 1;
            return true;
        }

        return false;
    }

    /**
     * Get current number of available tokens
     */
    getAvailableTokens(): number {
        this.refill();
        return this.tokens;
    }

    /**
     * Reset the rate limiter to initial state
     */
    reset(): void {
        this.tokens = this.maxTokens;
        this.lastRefill = Date.now();
        this.waitQueue = [];
    }
}

/**
 * Singleton rate limiter for Brave Search API
 * Free tier: 1 request/second
 * Burst capacity: 3 tokens (allows 3 concurrent requests before throttling)
 */
export const braveSearchRateLimiter = new TokenBucketRateLimiter({
    tokensPerSecond: 1,
    maxTokens: 3,
});
