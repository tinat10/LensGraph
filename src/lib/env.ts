import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),
  AUTH_GITHUB_ID: z.string().min(1),
  AUTH_GITHUB_SECRET: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z
    .string()
    .min(1)
    .refine((value) => value !== "your-api-secret" && !/^\*+$/.test(value), {
      message:
        "CLOUDINARY_API_SECRET must be your real Cloudinary secret (Dashboard → API Key → reveal secret)",
    }),
  // Optional — AI enrichment works when set; app runs without it
  OPENAI_API_KEY: z.string().min(1).optional(),
  // TODO(Mapbox): Uncomment when implementing GPS reverse geocoding
  // MAPBOX_ACCESS_TOKEN: z.string().min(1).optional(),
  // TODO(OpenWeather): Uncomment when implementing story page weather context
  // OPENWEATHER_API_KEY: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Missing or invalid environment variables:\n${parsed.error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n")}`,
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
