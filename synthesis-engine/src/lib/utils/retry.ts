/**
 * Retry Utility with Exponential Backoff
 * 
 * Provides deterministic, production-ready retry logic for API calls.
 * Aligned with Demis Workflow: graceful degradation, provenance tracking.
 */

export interface RetryConfig {
    /** Maximum number of retry attempts (default: 3) */
    maxRetries: number;
    /** Initial delay in milliseconds (default: 1000) */
    initialDelayMs: number;
    /** Maximum delay cap in milliseconds (default: 10000) */
    maxDelayMs: number;
    /** Backoff multiplier (default: 2) */
    backoffMultiplier: number;
    /** Jitter factor 0-1 to add randomness (default: 0.1) */
    jitterFactor: number;
    /** Predicate to determine if error is retryable */
    isRetryable?: (error: unknown) => boolean;
    /** Callback for retry attempts (for logging/telemetry) */
    onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
};

/**
 * Default retryable error detection
 * Checks for network errors, 5xx status codes, and rate limiting
 */
export function isDefaultRetryable(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        // Network errors
        if (
            message.includes('network') ||
            message.includes('timeout') ||
            message.includes('econnrefused') ||
            message.includes('enotfound') ||
            message.includes('socket hang up')
        ) {
            return true;
        }

        // HTTP status errors (if error has status property)
        const anyError = error as any;
        if (typeof anyError.status === 'number') {
            // 5xx server errors
            if (anyError.status >= 500 && anyError.status < 600) {
                return true;
            }
            // 429 rate limiting
            if (anyError.status === 429) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateDelay(
    attempt: number,
    config: RetryConfig
): number {
    const { initialDelayMs, maxDelayMs, backoffMultiplier, jitterFactor } = config;

    // Exponential backoff: initialDelay * (multiplier ^ attempt)
    const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt);

    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * jitterFactor * Math.random();

    return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for async functions
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => fetchProteinStructure('1CRN'),
 *   { maxRetries: 3, onRetry: (attempt, error, delay) => console.log(`Retry ${attempt} after ${delay}ms`) }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    partialConfig?: Partial<RetryConfig>
): Promise<T> {
    const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        ...partialConfig,
    };

    const { maxRetries, isRetryable = isDefaultRetryable, onRetry } = config;

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if we should retry
            const shouldRetry = attempt < maxRetries && isRetryable(error);

            if (!shouldRetry) {
                throw error;
            }

            // Calculate delay for this attempt
            const delayMs = calculateDelay(attempt, config);

            // Notify callback if provided
            if (onRetry) {
                onRetry(attempt + 1, error, delayMs);
            }

            // Wait before retrying
            await sleep(delayMs);
        }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError;
}

/**
 * Create a retried version of a function
 * Useful for wrapping existing API methods
 * 
 * @example
 * ```typescript
 * const retriedFetch = withRetry(fetchProteinStructure, { maxRetries: 5 });
 * const result = await retriedFetch('1CRN');
 * ```
 */
export function withRetry<TArgs extends any[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    config?: Partial<RetryConfig>
): (...args: TArgs) => Promise<TResult> {
    return (...args: TArgs) => retryWithBackoff(() => fn(...args), config);
}

/**
 * Retry metadata for provenance tracking
 */
export interface RetryMetadata {
    /** Number of attempts made */
    attempts: number;
    /** Total time spent in retries (ms) */
    totalRetryTimeMs: number;
    /** Whether the result came from a retry */
    wasRetried: boolean;
    /** Errors encountered during retries */
    retryErrors: Array<{
        attempt: number;
        error: string;
        delayMs: number;
    }>;
}

/**
 * Retry with detailed metadata for provenance
 */
export async function retryWithMetadata<T>(
    fn: () => Promise<T>,
    partialConfig?: Partial<RetryConfig>
): Promise<{ result: T; metadata: RetryMetadata }> {
    const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        ...partialConfig,
    };

    const { maxRetries, isRetryable = isDefaultRetryable, onRetry } = config;

    const metadata: RetryMetadata = {
        attempts: 0,
        totalRetryTimeMs: 0,
        wasRetried: false,
        retryErrors: [],
    };

    let lastError: unknown;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        metadata.attempts = attempt + 1;

        try {
            const result = await fn();
            metadata.totalRetryTimeMs = Date.now() - startTime;
            return { result, metadata };
        } catch (error) {
            lastError = error;

            const shouldRetry = attempt < maxRetries && isRetryable(error);

            if (!shouldRetry) {
                metadata.totalRetryTimeMs = Date.now() - startTime;
                throw error;
            }

            metadata.wasRetried = true;

            const delayMs = calculateDelay(attempt, config);

            metadata.retryErrors.push({
                attempt: attempt + 1,
                error: error instanceof Error ? error.message : String(error),
                delayMs,
            });

            if (onRetry) {
                onRetry(attempt + 1, error, delayMs);
            }

            await sleep(delayMs);
        }
    }

    metadata.totalRetryTimeMs = Date.now() - startTime;
    throw lastError;
}
