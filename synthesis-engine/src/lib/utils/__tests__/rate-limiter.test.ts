import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RateLimiter, Cache, memoizeAsync, generateCacheKey } from '../rate-limiter';

describe('RateLimiter', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
        limiter = new RateLimiter({
            maxRequests: 3,
            windowMs: 1000,
            keyPrefix: 'test:',
        });
    });

    describe('isAllowed', () => {
        it('should allow requests under the limit', () => {
            const result1 = limiter.isAllowed('user1');
            expect(result1.allowed).toBe(true);
            expect(result1.remaining).toBe(2);

            const result2 = limiter.isAllowed('user1');
            expect(result2.allowed).toBe(true);
            expect(result2.remaining).toBe(1);

            const result3 = limiter.isAllowed('user1');
            expect(result3.allowed).toBe(true);
            expect(result3.remaining).toBe(0);
        });

        it('should deny requests over the limit', () => {
            limiter.isAllowed('user1');
            limiter.isAllowed('user1');
            limiter.isAllowed('user1');

            const result = limiter.isAllowed('user1');
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('should track different keys independently', () => {
            limiter.isAllowed('user1');
            limiter.isAllowed('user1');

            const resultUser2 = limiter.isAllowed('user2');
            expect(resultUser2.allowed).toBe(true);
            expect(resultUser2.remaining).toBe(2);
        });

        it('should reset after window expires', async () => {
            limiter.isAllowed('user1');
            limiter.isAllowed('user1');
            limiter.isAllowed('user1');

            // Should be limited
            expect(limiter.isAllowed('user1').allowed).toBe(false);

            // Wait for window to expire
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Should be allowed again
            const result = limiter.isAllowed('user1');
            expect(result.allowed).toBe(true);
        });
    });

    describe('reset', () => {
        it('should reset rate limit for a key', () => {
            limiter.isAllowed('user1');
            limiter.isAllowed('user1');
            limiter.isAllowed('user1');

            limiter.reset('user1');

            const result = limiter.isAllowed('user1');
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(2);
        });
    });

    describe('getStatus', () => {
        it('should return current status', () => {
            limiter.isAllowed('user1');
            limiter.isAllowed('user1');

            const status = limiter.getStatus('user1');
            expect(status.count).toBe(2);
            expect(status.remaining).toBe(1);
        });

        it('should return empty status for new key', () => {
            const status = limiter.getStatus('newuser');
            expect(status.count).toBe(0);
            expect(status.remaining).toBe(3);
        });
    });
});

describe('Cache', () => {
    let cache: Cache<string>;

    beforeEach(() => {
        cache = new Cache<string>({
            defaultTtlMs: 1000,
            maxEntries: 3,
            keyPrefix: 'test:',
        });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('get and set', () => {
        it('should store and retrieve values', () => {
            cache.set('key1', 'value1');
            expect(cache.get('key1')).toBe('value1');
        });

        it('should return null for missing keys', () => {
            expect(cache.get('missing')).toBeNull();
        });

        it('should return null for expired entries', () => {
            cache.set('key1', 'value1', 500);

            vi.advanceTimersByTime(600);

            expect(cache.get('key1')).toBeNull();
        });

        it('should use default TTL if not specified', () => {
            cache.set('key1', 'value1');

            vi.advanceTimersByTime(999);
            expect(cache.get('key1')).toBe('value1');

            vi.advanceTimersByTime(2);
            expect(cache.get('key1')).toBeNull();
        });
    });

    describe('has', () => {
        it('should return true for existing non-expired entries', () => {
            cache.set('key1', 'value1');
            expect(cache.has('key1')).toBe(true);
        });

        it('should return false for missing entries', () => {
            expect(cache.has('missing')).toBe(false);
        });

        it('should return false for expired entries', () => {
            cache.set('key1', 'value1', 500);

            vi.advanceTimersByTime(600);

            expect(cache.has('key1')).toBe(false);
        });
    });

    describe('delete', () => {
        it('should delete existing entries', () => {
            cache.set('key1', 'value1');
            expect(cache.delete('key1')).toBe(true);
            expect(cache.get('key1')).toBeNull();
        });

        it('should return false for missing entries', () => {
            expect(cache.delete('missing')).toBe(false);
        });
    });

    describe('clear', () => {
        it('should clear all entries', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');

            cache.clear();

            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBeNull();
        });
    });

    describe('LRU eviction', () => {
        it('should evict oldest entry when at max capacity', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');

            // Adding a 4th entry should evict the oldest
            cache.set('key4', 'value4');

            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key4')).toBe('value4');
        });

        it('should update LRU order on access', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');

            // Access key1 to move it to end
            cache.get('key1');

            // Adding a 4th entry should evict key2 (now oldest)
            cache.set('key4', 'value4');

            expect(cache.get('key1')).toBe('value1');
            expect(cache.get('key2')).toBeNull();
        });
    });

    describe('getStats', () => {
        it('should return cache statistics', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');

            const stats = cache.getStats();
            expect(stats.size).toBe(2);
            expect(stats.maxEntries).toBe(3);
            expect(stats.keys).toHaveLength(2);
        });
    });

    describe('cleanup', () => {
        it('should remove expired entries', () => {
            cache.set('key1', 'value1', 500);
            cache.set('key2', 'value2', 2000);

            vi.advanceTimersByTime(600);

            const cleaned = cache.cleanup();
            expect(cleaned).toBe(1);
            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBe('value2');
        });
    });
});

describe('memoizeAsync', () => {
    let cache: Cache<number>;

    beforeEach(() => {
        cache = new Cache<number>({
            defaultTtlMs: 1000,
            maxEntries: 10,
        });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should cache function results', async () => {
        const fn = vi.fn().mockResolvedValue(42);
        const memoized = memoizeAsync(
            fn,
            cache,
            (x: number) => `calc:${x}`
        );

        const result1 = await memoized(5);
        const result2 = await memoized(5);

        expect(result1).toBe(42);
        expect(result2).toBe(42);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call function for different arguments', async () => {
        const fn = vi.fn().mockImplementation((x: number) => Promise.resolve(x * 2));
        const memoized = memoizeAsync(
            fn,
            cache,
            (x: number) => `calc:${x}`
        );

        const result1 = await memoized(5);
        const result2 = await memoized(10);

        expect(result1).toBe(10);
        expect(result2).toBe(20);
        expect(fn).toHaveBeenCalledTimes(2);
    });
});

describe('generateCacheKey', () => {
    it('should generate consistent keys for same input', () => {
        const key1 = generateCacheKey('prefix', { a: 1, b: 2 });
        const key2 = generateCacheKey('prefix', { a: 1, b: 2 });
        expect(key1).toBe(key2);
    });

    it('should generate different keys for different input', () => {
        const key1 = generateCacheKey('prefix', { a: 1 });
        const key2 = generateCacheKey('prefix', { a: 2 });
        expect(key1).not.toBe(key2);
    });

    it('should include prefix in key', () => {
        const key = generateCacheKey('myprefix', { data: 'test' });
        expect(key).toMatch(/^myprefix:/);
    });
});
