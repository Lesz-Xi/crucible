interface RetryOptions {
  provider: string;
  operationName: string;
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computeDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const expDelay = baseDelayMs * 2 ** (attempt - 1);
  const jitter = Math.floor(Math.random() * Math.max(50, Math.floor(baseDelayMs / 2)));
  return clamp(expDelay + jitter, baseDelayMs, maxDelayMs);
}

function shouldRetry(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("rate limit") ||
    msg.includes("429") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("network") ||
    msg.includes("econnreset") ||
    msg.includes("temporarily unavailable")
  );
}

/**
 * Executes a provider call with bounded retries and exponential backoff.
 * Retries transient/provider-side failures while keeping deterministic limits.
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 400;
  const maxDelayMs = options.maxDelayMs ?? 5_000;

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const finalAttempt = attempt >= maxAttempts;
      const retryable = shouldRetry(error);

      if (finalAttempt || !retryable) {
        break;
      }

      const delay = computeDelay(attempt, baseDelayMs, maxDelayMs);
      console.warn(
        `[AI Retry] provider=${options.provider} op=${options.operationName} attempt=${attempt}/${maxAttempts} delayMs=${delay}`
      );
      await sleep(delay);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        `Operation failed after retries: provider=${options.provider}, op=${options.operationName}`
      );
}
