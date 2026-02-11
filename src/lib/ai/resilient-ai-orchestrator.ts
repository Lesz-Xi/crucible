/**
 * Resilient AI Orchestrator
 * 
 * Provides retry/backoff logic and provider fallback for AI service calls.
 * Guards M6 benchmark runtime against transient failures (rate limits, timeouts, network errors).
 * 
 * Architecture:
 * - Exponential backoff with jitter (prevents thundering herd)
 * - Provider health tracking (quota exhaustion detection)
 * - Quota-aware fallback routing (Anthropic → Gemini)
 * - Structured telemetry for observability
 */

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts: number;
  
  /** Base delay in milliseconds for exponential backoff (default: 1000ms) */
  baseDelayMs: number;
  
  /** Maximum delay cap in milliseconds (default: 30000ms = 30s) */
  maxDelayMs: number;
  
  /** Jitter factor for randomization (default: 0.2 = ±20%) */
  jitterFactor: number;
  
  /** Error codes that should trigger retry */
  retryableErrors: Set<string>;
}

export interface ProviderHealth {
  provider: 'anthropic' | 'gemini';
  quotaExhausted: boolean;
  lastError?: { code: string; timestamp: number };
  consecutiveFailures: number;
}

export interface TelemetryEvent {
  timestamp: number;
  provider: 'anthropic' | 'gemini';
  operation: string;
  attempt: number;
  delayMs?: number;
  status: 'success' | 'retry' | 'fallback' | 'failure';
  error?: { code: string; message: string };
  latencyMs?: number;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterFactor: 0.2,
  retryableErrors: new Set([
    'RATE_LIMIT',
    'TIMEOUT',
    'SERVER_ERROR',
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
  ]),
};

// Provider health state (in-memory)
const providerHealth = new Map<string, ProviderHealth>([
  ['anthropic', { provider: 'anthropic', quotaExhausted: false, consecutiveFailures: 0 }],
  ['gemini', { provider: 'gemini', quotaExhausted: false, consecutiveFailures: 0 }],
]);

// Telemetry events (last 100)
const telemetryBuffer: TelemetryEvent[] = [];
const MAX_TELEMETRY_BUFFER = 100;

/**
 * Calculate exponential backoff delay with jitter
 * Formula: min(baseDelay * 2^(attempt-1), maxDelay) * (1 ± jitter)
 */
function calculateBackoff(attempt: number, config: RetryConfig): number {
  const exponentialDelay = Math.min(
    config.baseDelayMs * Math.pow(2, attempt - 1),
    config.maxDelayMs
  );
  
  // Add jitter: randomize ±jitterFactor%
  const jitter = 1 + (Math.random() * 2 - 1) * config.jitterFactor;
  return Math.floor(exponentialDelay * jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Classify error as retryable or fatal
 */
function isRetryableError(error: unknown, config: RetryConfig): boolean {
  if (!(error instanceof Error)) return false;
  
  // Check error message for known patterns
  const message = error.message.toLowerCase();
  
  // Rate limit / quota errors
  if (message.includes('429') || message.includes('rate limit') || message.includes('quota')) {
    return true;
  }
  
  // Server errors (5xx)
  if (message.includes('503') || message.includes('500') || message.includes('server error')) {
    return true;
  }
  
  // Network errors
  const networkErrors = ['timeout', 'econnreset', 'econnrefused', 'etimedout'];
  if (networkErrors.some((pattern) => message.includes(pattern))) {
    return true;
  }
  
  return false;
}

/**
 * Detect if error is due to quota exhaustion
 */
function isQuotaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('429') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('quota exceeded')
  );
}

/**
 * Extract error code from error object
 */
function extractErrorCode(error: unknown): string {
  if (!(error instanceof Error)) return 'UNKNOWN';
  
  const message = error.message;
  if (message.includes('429')) return 'RATE_LIMIT';
  if (message.includes('503')) return 'SERVER_ERROR';
  if (message.includes('timeout')) return 'TIMEOUT';
  if (message.includes('ECONNRESET')) return 'ECONNRESET';
  
  return 'UNKNOWN';
}

/**
 * Emit telemetry event
 */
function emitTelemetry(event: TelemetryEvent): void {
  telemetryBuffer.push(event);
  
  // Trim buffer to max size
  if (telemetryBuffer.length > MAX_TELEMETRY_BUFFER) {
    telemetryBuffer.shift();
  }
  
  // Log to console (structured JSON)
  const isDebug = process.env.AI_DEBUG === 'true' || process.env.NODE_ENV === 'development';
  if (isDebug) {
    console.log('[ResilientAI]', JSON.stringify(event));
  }
}

/**
 * Mark provider as unhealthy (quota exhausted or consecutive failures)
 */
export function markProviderUnhealthy(provider: 'anthropic' | 'gemini', error: unknown): void {
  const health = providerHealth.get(provider);
  if (!health) return;
  
  health.consecutiveFailures += 1;
  health.lastError = {
    code: extractErrorCode(error),
    timestamp: Date.now(),
  };
  
  if (isQuotaError(error)) {
    health.quotaExhausted = true;
    console.warn(`[ResilientAI] ${provider} quota exhausted, switching to fallback`);
    
    // Auto-recovery after 60 seconds
    setTimeout(() => {
      health.quotaExhausted = false;
      console.log(`[ResilientAI] ${provider} quota flag cleared (auto-recovery)`);
    }, 60000);
  }
  
  providerHealth.set(provider, health);
}

/**
 * Select provider based on health status
 * Prefers Anthropic (higher quality), falls back to Gemini if unhealthy
 */
export function selectProvider(): 'anthropic' | 'gemini' {
  // Check for env var override
  const forced = process.env.FORCE_PROVIDER?.toLowerCase();
  if (forced === 'anthropic' || forced === 'gemini') {
    return forced as 'anthropic' | 'gemini';
  }
  
  const anthropicHealth = providerHealth.get('anthropic');
  
  // Prefer Anthropic if healthy
  if (
    anthropicHealth &&
    !anthropicHealth.quotaExhausted &&
    anthropicHealth.consecutiveFailures < 3
  ) {
    return 'anthropic';
  }
  
  // Fallback to Gemini
  return 'gemini';
}

/**
 * Execute operation with retry logic and exponential backoff
 * 
 * @param operation - Async function to execute
 * @param config - Retry configuration (optional)
 * @returns Promise resolving to operation result
 * @throws Last error if all retries exhausted
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> & { provider?: 'anthropic' | 'gemini'; operationName?: string } = {}
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const provider = config.provider || 'anthropic';
  const operationName = config.operationName || 'unknown';
  const startTime = Date.now();
  
  let lastError: unknown = null;
  
  for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      // Success telemetry
      emitTelemetry({
        timestamp: Date.now(),
        provider,
        operation: operationName,
        attempt,
        status: 'success',
        latencyMs: Date.now() - startTime,
      });
      
      // Reset consecutive failures on success
      const health = providerHealth.get(provider);
      if (health) {
        health.consecutiveFailures = 0;
        providerHealth.set(provider, health);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      const shouldRetry = isRetryableError(error, fullConfig);
      const isLastAttempt = attempt === fullConfig.maxAttempts;
      
      if (!shouldRetry || isLastAttempt) {
        // Failure telemetry
        emitTelemetry({
          timestamp: Date.now(),
          provider,
          operation: operationName,
          attempt,
          status: 'failure',
          error: {
            code: extractErrorCode(error),
            message: error instanceof Error ? error.message : String(error),
          },
          latencyMs: Date.now() - startTime,
        });
        
        // Mark provider unhealthy
        markProviderUnhealthy(provider, error);
        
        throw error;
      }
      
      // Calculate backoff delay
      const delayMs = calculateBackoff(attempt, fullConfig);
      
      // Retry telemetry
      emitTelemetry({
        timestamp: Date.now(),
        provider,
        operation: operationName,
        attempt,
        delayMs,
        status: 'retry',
        error: {
          code: extractErrorCode(error),
          message: error instanceof Error ? error.message : String(error),
        },
      });
      
      console.warn(
        `[ResilientAI] Retry ${attempt}/${fullConfig.maxAttempts} for ${provider} after ${delayMs}ms:`,
        error instanceof Error ? error.message : String(error)
      );
      
      await sleep(delayMs);
    }
  }
  
  throw lastError;
}

/**
 * Execute operation with provider fallback
 * If primary provider fails with quota error, automatically switch to fallback
 * 
 * @param operation - Function that takes provider name and returns promise
 * @param config - Retry configuration
 * @returns Promise resolving to operation result
 */
export async function executeWithFallback<T>(
  operation: (provider: 'anthropic' | 'gemini') => Promise<T>,
  config: Partial<RetryConfig> & { operationName?: string } = {}
): Promise<T> {
  const primaryProvider = selectProvider();
  const fallbackProvider = primaryProvider === 'anthropic' ? 'gemini' : 'anthropic';
  const operationName = config.operationName || 'unknown';
  
  try {
    return await executeWithRetry(
      () => operation(primaryProvider),
      { ...config, provider: primaryProvider, operationName }
    );
  } catch (primaryError) {
    // If quota error, try fallback provider
    if (isQuotaError(primaryError)) {
      console.warn(
        `[ResilientAI] ${primaryProvider} quota exhausted, falling back to ${fallbackProvider}`
      );
      
      emitTelemetry({
        timestamp: Date.now(),
        provider: primaryProvider,
        operation: operationName,
        attempt: 1,
        status: 'fallback',
        error: {
          code: 'QUOTA_EXHAUSTED',
          message: primaryError instanceof Error ? primaryError.message : String(primaryError),
        },
      });
      
      markProviderUnhealthy(primaryProvider, primaryError);
      
      return await executeWithRetry(
        () => operation(fallbackProvider),
        { ...config, provider: fallbackProvider, operationName }
      );
    }
    
    throw primaryError;
  }
}

/**
 * Get recent telemetry events (for debugging/monitoring)
 */
export function getTelemetry(limit: number = 20): TelemetryEvent[] {
  return telemetryBuffer.slice(-limit);
}

/**
 * Get current provider health status
 */
export function getProviderHealth(): Map<string, ProviderHealth> {
  return new Map(providerHealth);
}

/**
 * Reset provider health (useful for testing)
 */
export function resetProviderHealth(): void {
  providerHealth.set('anthropic', {
    provider: 'anthropic',
    quotaExhausted: false,
    consecutiveFailures: 0,
  });
  providerHealth.set('gemini', {
    provider: 'gemini',
    quotaExhausted: false,
    consecutiveFailures: 0,
  });
}
