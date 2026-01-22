import { GoogleGenerativeAI } from "@google/generative-ai";

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_API_KEY not found. Embeddings will fail.");
    throw new Error("GOOGLE_API_KEY missing");
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: "text-embedding-004" });
    
    // Truncate if too long (approx 2000 chars) to stay safe
    const safeText = text.slice(0, 8000); 

    const result = await model.embedContent(safeText);
    const embedding = result.embedding;
    
    if (!embedding || !embedding.values) {
        throw new Error("Empty embedding returned");
    }
    
    return embedding.values;
  } catch (error) {
    console.warn("Gemini Embedding Failed, returning zero vector:", error);
    // Fallback to zero vector to prevent crash, but warn heavily
    return Array(768).fill(0);
  }
}
