import { GoogleGenerativeAI } from "@google/generative-ai";
import { executeWithRetry } from "./resilient-ai-orchestrator";

type EmbeddingProvider = "gemini" | "openai";

const DEFAULT_VECTOR_DIMENSION = 768;
const MAX_EMBEDDING_INPUT_CHARS = 8000;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getTargetVectorDimension(): number {
  return parsePositiveInt(process.env.EMBEDDING_VECTOR_DIMENSION, DEFAULT_VECTOR_DIMENSION);
}

function normalizeEmbeddingDimension(values: number[], targetDimension: number): number[] {
  if (values.length === targetDimension) {
    return values;
  }

  if (values.length > targetDimension) {
    // Downsample by averaging buckets to preserve signal across the full vector.
    const ratio = values.length / targetDimension;
    const reduced = new Array<number>(targetDimension);
    for (let i = 0; i < targetDimension; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.max(start + 1, Math.floor((i + 1) * ratio));
      let sum = 0;
      let count = 0;
      for (let j = start; j < end && j < values.length; j++) {
        sum += values[j];
        count += 1;
      }
      reduced[i] = count > 0 ? sum / count : 0;
    }
    return reduced;
  }

  // Pad short vectors to keep DB vector dimensions stable.
  return [...values, ...new Array<number>(targetDimension - values.length).fill(0)];
}

function resolveEmbeddingProvider(): EmbeddingProvider {
  const configured = process.env.EMBEDDING_PROVIDER?.trim().toLowerCase();
  if (configured === "openai") return "openai";
  return "gemini";
}

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey =
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_API_KEY not found. Embeddings will fail.");
    throw new Error("GOOGLE_API_KEY missing");
  }
  return new GoogleGenerativeAI(apiKey);
}

function buildGeminiModelCandidates(): string[] {
  return Array.from(
    new Set(
      [process.env.GEMINI_EMBEDDING_MODEL?.trim(), "gemini-embedding-001", "text-embedding-004"].filter(
        (value): value is string => Boolean(value && value.length > 0)
      )
    )
  );
}

function getOpenAIKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY missing");
  }
  return apiKey;
}

function getOpenAIBaseUrl(): string {
  return (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
}

function buildOpenAIModelCandidates(): string[] {
  return Array.from(
    new Set(
      [process.env.OPENAI_EMBEDDING_MODEL?.trim(), "text-embedding-3-large", "text-embedding-3-small"].filter(
        (value): value is string => Boolean(value && value.length > 0)
      )
    )
  );
}

async function generateGeminiEmbedding(text: string, targetDimension: number): Promise<number[]> {
  const client = getGeminiClient();
  const safeText = text.slice(0, MAX_EMBEDDING_INPUT_CHARS);
  const modelCandidates = buildGeminiModelCandidates();

  let lastError: unknown = null;
  for (const modelName of modelCandidates) {
    try {
      // Add retry logic for each model attempt
      const embedding = await executeWithRetry(
        async () => {
          const model = client.getGenerativeModel({ model: modelName });
          const result = await model.embedContent(safeText);
          return result.embedding;
        },
        {
          provider: 'gemini',
          operationName: `gemini-embed-content-${modelName}`,
          maxAttempts: 2, // Fewer retries per model (we have model fallback)
        }
      );

      if (!embedding || !embedding.values || embedding.values.length === 0) {
        throw new Error(`Empty embedding returned for model ${modelName}`);
      }

      return normalizeEmbeddingDimension(embedding.values, targetDimension);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("No Gemini embedding models available");
}

async function generateOpenAIEmbedding(text: string, targetDimension: number): Promise<number[]> {
  const apiKey = getOpenAIKey();
  const baseUrl = getOpenAIBaseUrl();
  const safeText = text.slice(0, MAX_EMBEDDING_INPUT_CHARS);
  const modelCandidates = buildOpenAIModelCandidates();
  const requestedDimension = parsePositiveInt(process.env.OPENAI_EMBEDDING_DIMENSION, targetDimension);

  let lastError: unknown = null;
  for (const model of modelCandidates) {
    try {
      const response = await fetch(`${baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: safeText,
          dimensions: requestedDimension,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI embeddings request failed (${response.status}): ${errorBody}`);
      }

      const payload = (await response.json()) as {
        data?: Array<{ embedding?: number[] }>;
      };
      const embedding = payload.data?.[0]?.embedding;
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error(`OpenAI embeddings response missing vector for model ${model}`);
      }

      return normalizeEmbeddingDimension(embedding, targetDimension);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("No OpenAI embedding models available");
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const targetDimension = getTargetVectorDimension();
  const provider = resolveEmbeddingProvider();

  const providerOrder: EmbeddingProvider[] =
    provider === "openai" ? ["openai", "gemini"] : ["gemini", "openai"];

  for (const activeProvider of providerOrder) {
    try {
      if (activeProvider === "openai") {
        return await generateOpenAIEmbedding(text, targetDimension);
      }
      return await generateGeminiEmbedding(text, targetDimension);
    } catch (error) {
      console.warn(`[Embedding] ${activeProvider} provider failed, trying fallback:`, error);
    }
  }

  console.warn("[Embedding] All providers failed, returning zero vector.");
  // Fallback to zero vector to prevent crash, but warn heavily
  return Array(targetDimension).fill(0);
}

export async function getGeminiModel(modelName: string = process.env.GEMINI_TEXT_MODEL || "gemini-1.5-flash") {
  const client = getGeminiClient();
  return client.getGenerativeModel({ model: modelName });
}
