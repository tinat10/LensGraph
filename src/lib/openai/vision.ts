import { z } from "zod";
import { getOpenAiClient, OPENAI_VISION_MODEL } from "@/lib/openai/client";

const visionAnalysisSchema = z.object({
  caption: z.string().min(1).max(500),
  mood: z.string().min(1).max(80),
  subjects: z.array(z.string().min(1).max(40)).max(6),
  styles: z.array(z.string().min(1).max(40)).max(4),
  tags: z.array(z.string().min(1).max(40)).max(8),
});

export type VisionAnalysisResult = z.infer<typeof visionAnalysisSchema>;

const ANALYSIS_PROMPT = `Analyze this photograph for a photographer's portfolio app.

Return JSON with:
- caption: one evocative sentence describing the scene
- mood: single mood word or short phrase (e.g. "melancholic", "golden hour calm")
- subjects: concrete subjects visible (people, objects, landscapes)
- styles: visual style descriptors (e.g. "minimalist", "candid", "high contrast")
- tags: searchable keywords combining subject, mood, and style (lowercase)

Be specific to what is visible. Do not mention AI or analysis.`;

export async function analyzePhotoWithVision(
  imageUrl: string,
): Promise<VisionAnalysisResult> {
  const openai = getOpenAiClient();

  const response = await openai.chat.completions.create({
    model: OPENAI_VISION_MODEL,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: ANALYSIS_PROMPT },
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "low" },
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
