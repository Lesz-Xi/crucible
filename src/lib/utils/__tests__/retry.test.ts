import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    retryWithBackoff,
    withRetry,
    retryWithMetadata,
    calculateDelay,
    isDefaultRetryable,
    DEFAULT_RETRY_CONFIG,
    type RetryConfig,
} from '../retry';

describe('retry utility', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('calculateDelay', () => {
        it('should calculate exponential backoff correctly', () => {
            const config: RetryConfig = {
                ...DEFAULT_RETRY_CONFIG,
                initialDelayMs: 1000,
                backoffMultiplier: 2,
                jitterFactor: 0, // No jitter for deterministic testing
                maxDelayMs: 10000,
            };

            expect(calculateDelay(0, config)).toBe(1000);
            expect(calculateDelay(1, config)).toBe(2000);
            expect(calculateDelay(2, config)).toBe(4000);
            expect(calculateDelay(3, config)).toBe(8000);
        });

        it('should cap delay at maxDelayMs', () => {
            const config: RetryConfig = {
                ...DEFAULT_RETRY_CONFIG,
                initialDelayMs: 1000,
                backoffMultiplier: 2,
                jitterFactor: 0,
                maxDelayMs: 5000,
            };

            // Would be 8000 without cap
            expect(calculateDelay(3, config)).toBe(5000);
            // Would be 16000 without cap
            expect(calculateDelay(4, config)).toBe(5000);
        });

        it('should add jitter within expected range', () => {
            const config: RetryConfig = {
                ...DEFAULT_RETRY_CONFIG,
                initialDelayMs: 1000,
                backoffMultiplier: 1,
                jitterFactor: 0.1,
                maxDelayMs: 10000,
            };

            // With jitter, delay should be between 1000 and 1100
            for (let i = 0; i < 100; i++) {
                const delay = calculateDelay(0, config);
                expect(delay).toBeGreaterThanOrEqual(1000);
                expect(delay).toBeLessThanOrEqual(1100);
            }
        });
    });

    describe('isDefaultRetryable', () => {
        it('should retry network errors', () => {
            expect(isDefaultRetryable(new Error('Network error'))).toBe(true);
            expect(isDefaultRetryable(new Error('ECONNREFUSED'))).toBe(true);
            expect(isDefaultRetryable(new Error('ENOTFOUND'))).toBe(true);
            expect(isDefaultRetryable(new Error('socket hang up'))).toBe(true);
            expect(isDefaultRetryable(new Error('Timeout exceeded'))).toBe(true);
        });

        it('should retry 5xx server errors', () => {
            const error500 = new Error('Internal Server Error') as any;
            error500.status = 500;
            expect(isDefaultRetryable(error500)).toBe(true);

            const error502 = new Error('Bad Gateway') as any;
            error502.status = 502;
            expect(isDefaultRetryable(error502)).toBe(true);

            const error503 = new Error('Service Unavailable') as any;
            error503.status = 503;
            expect(isDefaultRetryable(error503)).toBe(true);
        });

        it('should retry 429 rate limiting', () => {
            const error429 = new Error('Too Many Requests') as any;
            error429.status = 429;
            expect(isDefaultRetryable(error429)).toBe(true);
        });

        it('should not retry 4xx client errors (except 429)', () => {
            const error400 = new Error('Bad Request') as any;
            error400.status = 400;
            expect(isDefaultRetryable(error400)).toBe(false);

            const error401 = new Error('Unauthorized') as any;
            error401.status = 401;
            expect(isDefaultRetryable(error401)).toBe(false);

            const error404 = new Error('Not Found') as any;
            error404.status = 404;
            expect(isDefaultRetryable(error404)).toBe(false);
        });

        it('should not retry unknown errors', () => {
            expect(isDefaultRetryable(new Error('Some random error'))).toBe(false);
            expect(isDefaultRetryable('string error')).toBe(false);
            expect(isDefaultRetryable(null)).toBe(false);
        });
    });

    describe('retryWithBackoff', () => {
        it('should return result on first successful attempt', async () => {
            const fn = vi.fn().mockResolvedValue('success');

            const resultPromise = retryWithBackoff(fn, {
                initialDelayMs: 100,
                jitterFactor: 0,
            });

            await vi.runAllTimersAsync();
            const result = await resultPromise;

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should retry on retryable errors', async () => {
            const retryableError = new Error('Network error');
            const fn = vi
                .fn()
                .mockRejectedValueOnce(retryableError)
                .mockRejectedValueOnce(retryableError)
                .mockResolvedValue('success');

            const onRetry = vi.fn();
            const resultPromise = retryWithBackoff(fn, {
                maxRetries: 3,
                initialDelayMs: 100,
                jitterFactor: 0,
                onRetry,
            });

            await vi.runAllTimersAsync();
            const result = await resultPromise;

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(3);
            expect(onRetry).toHaveBeenCalledTimes(2);
        });

        it('should throw after max retries exceeded', async () => {
            const retryableError = new Error('Network error');
            const fn = vi.fn().mockRejectedValue(retryableError);

            const onRetry = vi.fn();
            // Catch the promise early to avoid unhandled rejection
            const resultPromise = retryWithBackoff(fn, {
                maxRetries: 2,
                initialDelayMs: 100,
                jitterFactor: 0,
                onRetry,
            }).catch(e => e); // Catch to prevent unhandled rejection

            await vi.runAllTimersAsync();

            const result = await resultPromise;
            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('Network error');
            expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
            expect(onRetry).toHaveBeenCalledTimes(2);
        });

        it('should not retry non-retryable errors', async () => {
            const nonRetryableError = new Error('Bad Request') as any;
            nonRetryableError.status = 400;
            const fn = vi.fn().mockRejectedValue(nonRetryableError);

            // Catch the promise early to avoid unhandled rejection
            const resultPromise = retryWithBackoff(fn, {
                maxRetries: 3,
                initialDelayMs: 100,
            }).catch(e => e);

            await vi.runAllTimersAsync();

            const result = await resultPromise;
            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toBe('Bad Request');
            expect(fn).toHaveBeenCalledTimes(1); // No retries
        });

        it('should use custom isRetryable predicate', async () => {
            const customError = new Error('Custom retryable error');
            const fn = vi
                .fn()
                .mockRejectedValueOnce(customError)
                .mockResolvedValue('success');

            const resultPromise = retryWithBackoff(fn, {
                maxRetries: 3,
                initialDelayMs: 100,
                jitterFactor: 0,
                isRetryable: (err) => err instanceof Error && err.message.includes('Custom'),
            });

            await vi.runAllTimersAsync();
            const result = await resultPromise;

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(2);
        });
    });

    describe('withRetry', () => {
        it('should create a retried version of a function', async () => {
            const fetchMock = vi
                .fn()
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValue('data');

            const retriedFetch = withRetry(fetchMock, {
                maxRetries: 3,
                initialDelayMs: 100,
                jitterFactor: 0,
            });

            const resultPromise = retriedFetch('arg1', 'arg2');

            await vi.runAllTimersAsync();
            const result = await resultPromise;

            expect(result).toBe('data');
            expect(fetchMock).toHaveBeenCalledWith('arg1', 'arg2');
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });
    });

    describe('retryWithMetadata', () => {
        it('should return metadata for successful first attempt', async () => {
            const fn = vi.fn().mockResolvedValue('success');

            const resultPromise = retryWithMetadata(fn, {
                initialDelayMs: 100,
                jitterFactor: 0,
            });

            await vi.runAllTimersAsync();
            const { result, metadata } = await resultPromise;

            expect(result).toBe('success');
            expect(metadata.attempts).toBe(1);
            expect(metadata.wasRetried).toBe(false);
            expect(metadata.retryErrors).toHaveLength(0);
        });

        it('should track retry errors in metadata', async () => {
            const retryableError = new Error('Network error');
            const fn = vi
                .fn()
                .mockRejectedValueOnce(retryableError)
                .mockRejectedValueOnce(retryableError)
                .mockResolvedValue('success');

            const resultPromise = retryWithMetadata(fn, {
                maxRetries: 3,
                initialDelayMs: 100,
                jitterFactor: 0,
            });

            await vi.runAllTimersAsync();
            const { result, metadata } = await resultPromise;

            expect(result).toBe('success');
            expect(metadata.attempts).toBe(3);
            expect(metadata.wasRetried).toBe(true);
            expect(metadata.retryErrors).toHaveLength(2);
            expect(metadata.retryErrors[0].error).toBe('Network error');
            expect(metadata.retryErrors[0].attempt).toBe(1);
        });

        it('should track total retry time', async () => {
            const retryableError = new Error('Network error');
            const fn = vi
                .fn()
                .mockRejectedValueOnce(retryableError)
                .mockResolvedValue('success');

            const resultPromise = retryWithMetadata(fn, {
                maxRetries: 3,
                initialDelayMs: 500,
                jitterFactor: 0,
            });

            await vi.runAllTimersAsync();
            const { metadata } = await resultPromise;

            // Should include the delay time
            expect(metadata.totalRetryTimeMs).toBeGreaterThanOrEqual(500);
        });
    });
});
