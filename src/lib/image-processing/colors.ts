import { Vibrant } from "node-vibrant/node";
import type { Prisma } from "@/generated/prisma/client";

export type ExtractedColorPalette = {
  dominantHex?: string;
  paletteJson: Prisma.InputJsonValue;
  brightnessScore?: number;
  warmthScore?: number;
  contrastScore?: number;
};

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function warmthScoreFromHex(hex: string): number {
  const { r, b } = hexToRgb(hex);
  return Math.min(1, Math.max(0, (r - b + 255) / 510));
}

export async function extractColorPalette(
  buffer: Buffer,
): Promise<ExtractedColorPalette> {
  const palette = await Vibrant.from(buffer).getPalette();

  const paletteJson = {
    vibrant: palette.Vibrant?.hex ?? null,
    muted: palette.Muted?.hex ?? null,
    darkVibrant: palette.DarkVibrant?.hex ?? null,
    lightVibrant: palette.LightVibrant?.hex ?? null,
    darkMuted: palette.DarkMuted?.hex ?? null,
    lightMuted: palette.LightMuted?.hex ?? null,
  };

  const dominantHex = palette.Vibrant?.hex ?? palette.Muted?.hex ?? undefined;
  const hexSamples = Object.values(paletteJson).filter(Boolean) as string[];

  const brightnessScore = dominantHex
    ? Number(relativeLuminance(dominantHex).toFixed(3))
    : undefined;

  const warmthScore = dominantHex
    ? Number(warmthScoreFromHex(dominantHex).toFixed(3))
    : undefined;

  const contrastScore =
    hexSamples.length >= 2
      ? Number(
          Math.abs(
            relativeLuminance(hexSamples[0]) -
              relativeLuminance(hexSamples[hexSamples.length - 1]),
          ).toFixed(3),
        )
      : undefined;

  return {
    dominantHex,
    paletteJson,
    brightnessScore,
    warmthScore,
    contrastScore,
  };
}
