import OpenAI from "openai";

let client: OpenAI | null = null;

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to .env to enable AI enrichment.",
    );
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}

export const OPENAI_VISION_MODEL =
  process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";
