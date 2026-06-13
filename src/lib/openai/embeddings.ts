import { getOpenAiClient } from "@/lib/openai/client";

export const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";

export const EMBEDDING_DIMENSIONS = 1536;

export async function generatePhotoEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAiClient();
  const input = text.trim();

  if (!input) {
    throw new Error("Cannot generate embedding from empty text");
  }

  const response = await openai.embeddings.create({
    model: OPENAI_EMBEDDING_MODEL,
    input,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  const embedding = response.data[0]?.embedding;
  if (!embedding) {
    throw new Error("OpenAI embeddings returned an empty vector");
  }

  return embedding;
}

export function formatVectorForPg(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
