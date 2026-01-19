// Google Generative AI (Gemini) Client Configuration STUB
// Replaced by Claude API - keeping this file for interface compatibility

// STUB: Throw error if Gemini usage is attempted
export function getGeminiModel(): any {
  throw new Error("Gemini model is deprecated. Use getClaudeModel() from @/lib/ai/anthropic instead.");
}

// STUB: Embedding model
export function getEmbeddingModel(): any {
  throw new Error("Gemini embedding model is deprecated.");
}

// MOCK: Generate embeddings for text (Stub implementation for PDF Extractor)
// Returns a random 768-dimensional vector to allow PDF uploads to proceed without error
// NOTE: Vector search functionality will be effectively disabled until a new embedding provider is integrated
export async function generateEmbedding(text: string): Promise<number[]> {
  console.warn("generateEmbedding: Returning mock embedding vector (Gemini removed).");
  // Return a simplified mock vector (length 768 is standard for many models, though Gemini's is 768)
  return Array(768).fill(0).map(() => Math.random());
}
