/**
 * RetrievalOrchestratorService — SCM-Grounded Report Analysis
 *
 * Orchestrates multi-family web retrieval via the Brave Search API.
 * Fail-closed: throws BraveUnavailableError if BRAVE_API_KEY is absent.
 * Never throws silently — callers must handle errors and emit pipeline_error events.
 *
 * @version 1.0.0
 * @methodVersion retrieval-orchestrator-v1.0
 */

import { SourceRecord } from "@/types/report-analysis";
import {
    SourceScoringService,
    extractDomain,
} from "./source-scoring-service";
import { v4 as uuidv4 } from "uuid";

export const RETRIEVAL_ORCHESTRATOR_METHOD_VERSION =
    "retrieval-orchestrator-v1.0" as const;

export const DEFAULT_K = 8;
export const MAX_K = 15;
const MAX_EXCERPT_CHARS = 2000;
const MAX_CONCURRENT_REQUESTS = 2;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

export type QueryFamilyType =
    | "direct"
    | "historical"
    | "opposing"
    | "data"
    | "falsifier";

const ALL_QUERY_FAMILIES: QueryFamilyType[] = [
    "direct",
    "historical",
    "opposing",
    "data",
    "falsifier",
];

export function buildFamilyQuery(
    baseQuery: string,
    family: QueryFamilyType
): string {
    switch (family) {
        case "direct":
            return baseQuery;
        case "historical":
            return `${baseQuery} historical background context`;
        case "opposing":
            return `${baseQuery} counter-argument opposing view criticism`;
        case "data":
            return `${baseQuery} data statistics evidence quantitative`;
        case "falsifier":
            return `${baseQuery} failed refuted debunked incorrect`;
    }
}

export class BraveUnavailableError extends Error {
    public readonly code = "BRAVE_UNAVAILABLE" as const;
    constructor(detail?: string) {
        super(
            `Brave Search API is unavailable${detail ? `: ${detail}` : ""}. ` +
            `Ensure BRAVE_API_KEY is set in the environment.`
        );
        this.name = "BraveUnavailableError";
    }
}

export class RetrievalError extends Error {
    constructor(
        message: string,
        public readonly family: QueryFamilyType
    ) {
        super(message);
        this.name = "RetrievalError";
    }
}

interface BraveSearchResult {
    url: string;
    title: string;
    description: string;
    profile?: { url?: string };
    age?: string;
}

interface BraveSearchResponse {
    web?: {
        results?: BraveSearchResult[];
    };
}

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBraveResults(
    query: string,
    k: number,
    apiKey: string
): Promise<BraveSearchResult[]> {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(Math.min(k, MAX_K)));
    url.searchParams.set("search_lang", "en");

    let lastError: Error | undefined;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1));
        }

        try {
            const response = await fetch(url.toString(), {
                headers: {
                    Accept: "application/json",
                    "Accept-Encoding": "gzip",
                    "X-Subscription-Token": apiKey,
                },
                signal: AbortSignal.timeout(10_000),
            });

            if (response.status === 429) {
                continue;
            }

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new BraveUnavailableError(
                        `API key rejected (HTTP ${response.status})`
                    );
                }
                throw new RetrievalError(
                    `Brave returned HTTP ${response.status} for query: "${query}"`,
                    "direct"
                );
            }

            const data = (await response.json()) as BraveSearchResponse;
            return data.web?.results ?? [];
        } catch (err) {
            if (err instanceof BraveUnavailableError) throw err;
            lastError = err instanceof Error ? err : new Error(String(err));
        }
    }

    throw lastError ?? new RetrievalError(`Failed to fetch results after ${MAX_RETRIES} retries`, "direct");
}

async function withConcurrencyLimit<T>(
    tasks: (() => Promise<T>)[],
    limit: number
): Promise<PromiseSettledResult<T>[]> {
    const results: PromiseSettledResult<T>[] = [];
    const queue = [...tasks];

    while (queue.length > 0) {
        const batch = queue.splice(0, limit).map((t) => t());
        const batchResults = await Promise.allSettled(batch);
        results.push(...batchResults);
    }

    return results;
}

export interface OrchestrateRetrievalParams {
    query: string;
    k?: number;
    queryFamilies?: QueryFamilyType[];
    computeRunId: string;
}

export interface OrchestrateRetrievalResult {
    sources: SourceRecord[];
    failedFamilies: { family: QueryFamilyType; reason: string }[];
}

export class RetrievalOrchestratorService {
    private static instance: RetrievalOrchestratorService;
    private readonly scorer: SourceScoringService;

    // Plan requirement: Add environment variable validation at constructor
    private constructor(scorer?: SourceScoringService) {
        if (!process.env.BRAVE_API_KEY) {
            throw new Error('BRAVE_API_KEY not configured');
        }
        this.scorer = scorer ?? SourceScoringService.getInstance();
    }

    public static getInstance(): RetrievalOrchestratorService {
        if (!RetrievalOrchestratorService.instance) {
            RetrievalOrchestratorService.instance = new RetrievalOrchestratorService();
        }
        return RetrievalOrchestratorService.instance;
    }

    async orchestrateRetrieval(
        params: OrchestrateRetrievalParams
    ): Promise<OrchestrateRetrievalResult> {
        const apiKey = process.env.BRAVE_API_KEY!;

        const {
            query,
            k = DEFAULT_K,
            queryFamilies = ALL_QUERY_FAMILIES,
            computeRunId,
        } = params;

        const cappedK = Math.min(k, MAX_K);
        // Use computeRunId as ingestionId directly or generate a new one
        const ingestionId = uuidv4();

        const tasks: Array<() => Promise<{ family: QueryFamilyType; results: BraveSearchResult[] }>> =
            queryFamilies.map((family) => async () => {
                const familyQuery = buildFamilyQuery(query, family);
                const results = await fetchBraveResults(familyQuery, cappedK, apiKey);
                return { family, results };
            });

        const settled = await withConcurrencyLimit(tasks, MAX_CONCURRENT_REQUESTS);

        const allResults: BraveSearchResult[] = [];
        const failedFamilies: OrchestrateRetrievalResult["failedFamilies"] = [];

        for (const result of settled) {
            if (result.status === "fulfilled") {
                allResults.push(...result.value.results);
            } else {
                const reason = result.reason instanceof Error
                    ? result.reason.message
                    : String(result.reason);
                failedFamilies.push({ family: "direct", reason });
            }
        }

        const seen = new Set<string>();
        const unique = allResults.filter((r) => {
            if (seen.has(r.url)) return false;
            seen.add(r.url);
            return true;
        });

        const scoringParams = unique.map((r) => ({
            url: r.url,
            publishedAt: r.age,
            excerpt: (r.description ?? "").slice(0, MAX_EXCERPT_CHARS),
            ingestionId,
        }));

        const sources = this.scorer.scoreSourceBatch(scoringParams);

        return { sources, failedFamilies };
    }
}
