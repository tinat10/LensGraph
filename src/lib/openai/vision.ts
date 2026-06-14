import { z } from "zod";
import { getOpenAiClient, OPENAI_VISION_MODEL } from "@/lib/openai/client";

const visionAnalysisSchema = z.object({
  caption: z.string().min(1).max(500),
  mood: z.string().min(1).max(80),
  subjects: z.array(z.string().min(1).max(40)).max(5),
  styles: z.array(z.string().min(1).max(40)).max(6),
  tags: z.array(z.string().min(1).max(40)).max(10),
});

export type VisionAnalysisResult = z.infer<typeof visionAnalysisSchema>;

const ANALYSIS_PROMPT = `You are tagging photos for a photographer's visual library. Tags should feel like a mood board — aesthetic, thematic, and atmospheric — NOT a list of literal objects.

Return JSON with:
- caption: one evocative sentence describing the feeling of the scene
- mood: short atmospheric phrase (e.g. "quiet and reflective", "warm nostalgia")
- subjects: 2–5 broad themes or genres — e.g. "nature", "urban life", "portraiture", "still life", "travel", "interiors". High-level only, never specific objects.
- styles: 3–6 photographic/aesthetic qualities — e.g. "minimalist", "golden hour", "high contrast", "soft light", "candid", "moody", "documentary", "film-like"
- tags: 6–10 lowercase aesthetic search terms — mood, atmosphere, color palette, genre, vibe. Examples: "nature", "serene", "earth tones", "cozy", "melancholic", "editorial", "dreamy", "urban", "intimate", "nostalgic"

Rules:
- All lowercase
- Do NOT tag literal objects, materials, or inventory (no "leather chair", "coffee cup", "brick wall", "wooden table")
- Prefer evocative, aesthetic language over descriptive cataloging
- No meta filler: "photo", "photography", "image", "beautiful", "picture"
- Do not mention AI or analysis`;

export async function analyzePhotoWithVision(
  imageUrl: string,
): Promise<VisionAnalysisResult> {
  const openai = getOpenAiClient();

  const response = await openai.chat.completions.create({
    model: OPENAI_VISION_MODEL,
    temperature: 0.5,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: ANALYSIS_PROMPT },
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "auto" },
          },
        ],
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI Vision returned an empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI Vision returned invalid JSON");
  }

  return visionAnalysisSchema.parse(parsed);
}
