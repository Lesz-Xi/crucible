/**
 * Rate Limiter and Cache Utility
 * 
 * Provides production-ready rate limiting and caching for API calls.
 * Aligned with Demis Workflow: deterministic behavior, provenance tracking.
 */

// ── Rate Limiter ─────────────────────────────────────────────────────────────

export interface RateLimiterConfig {
    /** Maximum requests per window */
    maxRequests: number;
    /** Window size in milliseconds */
    windowMs: number;
    /** Key prefix for identification */
    keyPrefix?: string;
}

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

/**
 * In-memory rate limiter using sliding window algorithm
 */
export class RateLimiter {
    private entries: Map<string, RateLimitEntry> = new Map();
    private config: RateLimiterConfig;

    constructor(config: RateLimiterConfig) {
        this.config = config;
    }

    /**
     * Check if a request is allowed under the rate limit
     */
    isAllowed(key: string): { allowed: boolean; remaining: number; resetIn: number } {
        const now = Date.now();
        const fullKey = `${this.config.keyPrefix || ''}${key}`;
        const entry = this.entries.get(fullKey);

        // Clean up expired entries
        this.cleanup(now);

        if (!entry || now - entry.windowStart >= this.config.windowMs) {
            // New window
            this.entries.set(fullKey, {
                count: 1,
                windowStart: now,
            });
            return {
                allowed: true,
                remaining: this.config.maxRequests - 1,
                resetIn: this.config.windowMs,
            };
        }

        // Existing window
        if (entry.count < this.config.maxRequests) {
            entry.count++;
            const resetIn = this.config.windowMs - (now - entry.windowStart);
            return {
                allowed: true,
                remaining: this.config.maxRequests - entry.count,
                resetIn,
            };
        }

        // Rate limited
        const resetIn = this.config.windowMs - (now - entry.windowStart);
        return {
            allowed: false,
            remaining: 0,
            resetIn,
        };
    }

    /**
     * Clean up expired entries
     */
    private cleanup(now: number): void {
        for (const [key, entry] of this.entries.entries()) {
            if (now - entry.windowStart >= this.config.windowMs) {
                this.entries.delete(key);
            }
        }
    }

    /**
     * Reset rate limit for a key
     */
    reset(key: string): void {
        const fullKey = `${this.config.keyPrefix || ''}${key}`;
        this.entries.delete(fullKey);
    }

    /**
     * Get current status for a key
     */
    getStatus(key: string): { count: number; remaining: number; resetIn: number } {
        const now = Date.now();
        const fullKey = `${this.config.keyPrefix || ''}${key}`;
        const entry = this.entries.get(fullKey);

        if (!entry || now - entry.windowStart >= this.config.windowMs) {
            return {
                count: 0,
                remaining: this.config.maxRequests,
                resetIn: 0,
            };
        }

        return {
            count: entry.count,
            remaining: this.config.maxRequests - entry.count,
            resetIn: this.config.windowMs - (now - entry.windowStart),
        };
    }
}

// ── Cache ────────────────────────────────────────────────────────────────────

export interface CacheConfig {
    /** Default TTL in milliseconds */
    defaultTtlMs: number;
    /** Maximum number of entries */
    maxEntries?: number;
    /** Key prefix for identification */
    keyPrefix?: string;
}

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
    createdAt: number;
    metadata?: {
        source?: string;
        methodVersion?: string;
    };
}

/**
 * In-memory LRU cache with TTL support
 */
export class Cache<T> {
    private entries: Map<string, CacheEntry<T>> = new Map();
    private config: CacheConfig;
    private order: string[] = []; // For LRU eviction

    constructor(config: CacheConfig) {
        this.config = config;
    }

    /**
     * Get a value from cache
     */
    get(key: string): T | null {
        const fullKey = `${this.config.keyPrefix || ''}${key}`;
        const entry = this.entries.get(fullKey);

        if (!entry) {
            return null;
        }

        // Check expiration
        if (Date.now() > entry.expiresAt) {
            this.entries.delete(fullKey);
            this.order = this.order.filter(k => k !== fullKey);
            return null;
        }

        // Update LRU order (move to end)
        this.order = this.order.filter(k => k !== fullKey);
        this.order.push(fullKey);

        return entry.value;
    }

    /**
     * Set a value in cache
     */
    set(
        key: string,
        value: T,
        ttlMs?: number,
        metadata?: { source?: string; methodVersion?: string }
    ): void {
        const fullKey = `${this.config.keyPrefix || ''}${key}`;
        const now = Date.now();

        // Evict if at max capacity
        if (this.config.maxEntries && this.entries.size >= this.config.maxEntries) {
            this.evictOldest();
        }

        // Remove existing entry if present
        if (this.entries.has(fullKey)) {
            this.order = this.order.filter(k => k !== fullKey);
        }

        this.entries.set(fullKey, {
            value,
            expiresAt: now + (ttlMs ?? this.config.defaultTtlMs),
            createdAt: now,
            metadata,
        });
        this.order.push(fullKey);
    }

    /**
     * Check if key exists and is not expired
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Delete a key from cache
     */
    delete(key: string): boolean {
        const fullKey = `${this.config.keyPrefix || ''}${key}`;
        if (this.entries.has(fullKey)) {
            this.entries.delete(fullKey);
            this.order = this.order.filter(k => k !== fullKey);
            return true;
        }
        return false;
    }

    /**
     * Clear all entries
     */
    clear(): void {
        this.entries.clear();
        this.order = [];
    }

    /**
     * Get cache statistics
     */
    getStats(): { size: number; maxEntries: number | undefined; keys: string[] } {
        return {
            size: this.entries.size,
            maxEntries: this.config.maxEntries,
            keys: Array.from(this.entries.keys()),
        };
    }

    /**
     * Evict oldest entry (LRU)
     */
    private evictOldest(): void {
        if (this.order.length > 0) {
            const oldestKey = this.order.shift();
            if (oldestKey) {
                this.entries.delete(oldestKey);
            }
        }
    }

    /**
     * Clean up expired entries
     */
    cleanup(): number {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.entries.entries()) {
            if (now > entry.expiresAt) {
                this.entries.delete(key);
                this.order = this.order.filter(k => k !== key);
                cleaned++;
            }
        }

        return cleaned;
    }
}

// ── Cached Fetch Wrapper ─────────────────────────────────────────────────────

export interface CachedFetchConfig {
    /** Cache instance */
    cache: Cache<Response>;
    /** Rate limiter instance */
    rateLimiter: RateLimiter;
    /** Default TTL for cached responses */
    defaultTtlMs?: number;
    /** Whether to cache only successful responses */
    cacheSuccessfulOnly?: boolean;
}

/**
 * Create a cached fetch wrapper with rate limiting
 */
export function createCachedFetch(config: CachedFetchConfig) {
    const { cache, rateLimiter, defaultTtlMs = 60000, cacheSuccessfulOnly = true } = config;

    return async function cachedFetch(
        url: string,
        options?: RequestInit,
        cacheKey?: string
    ): Promise<Response> {
        const key = cacheKey || url;

        // Check rate limit
        const rateLimit = rateLimiter.isAllowed(key);
        if (!rateLimit.allowed) {
            const error = new Error(`Rate limit exceeded. Reset in ${rateLimit.resetIn}ms`);
            (error as any).status = 429;
            (error as any).resetIn = rateLimit.resetIn;
            throw error;
        }

        // Check cache
        const cached = cache.get(key);
        if (cached) {
            return cached.clone();
        }

        // Fetch
        const response = await fetch(url, options);

        // Cache successful responses
        if (!cacheSuccessfulOnly || response.ok) {
            cache.set(key, response.clone(), defaultTtlMs);
        }

        return response;
    };
}

// ── Pre-configured Instances ────────────────────────────────────────────────

/**
 * Default rate limiter for RCSB PDB API
 * RCSB allows ~10 requests per second
 */
export const rcsbRateLimiter = new RateLimiter({
    maxRequests: 10,
    windowMs: 1000,
    keyPrefix: 'rcsb:',
});

/**
 * Default cache for protein structures
 * Cache for 24 hours since structures rarely change
 */
export const proteinStructureCache = new Cache<string>({
    defaultTtlMs: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 100,
    keyPrefix: 'pdb:',
});

/**
 * Default cache for analysis results
 * Cache for 1 hour
 */
export const analysisResultCache = new Cache<any>({
    defaultTtlMs: 60 * 60 * 1000, // 1 hour
    maxEntries: 50,
    keyPrefix: 'analysis:',
});

// ── Utility Functions ───────────────────────────────────────────────────────

/**
 * Generate a cache key from input
 */
export function generateCacheKey(prefix: string, input: unknown): string {
    const hash = JSON.stringify(input);
    return `${prefix}:${hash}`;
}

/**
 * Create a memoized version of an async function
 */
export function memoizeAsync<TArgs extends any[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    cache: Cache<TResult>,
    keyGenerator: (...args: TArgs) => string
): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs) => {
        const key = keyGenerator(...args);
        const cached = cache.get(key);

        if (cached !== null) {
            return cached;
        }

        const result = await fn(...args);
        cache.set(key, result);
        return result;
    };
}
