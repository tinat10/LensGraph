import type { Prisma } from "@/generated/prisma/client";
import { getCloudinary } from "@/lib/cloudinary/client";

type CloudinaryResourceDetails = {
  image_metadata?: Record<string, string>;
  media_metadata?: Record<string, string>;
  colors?: [string, number][];
  predominant?: {
    google?: [string, number][];
    cloudinary?: [string, number][];
  };
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
};

export type ParsedCloudinaryMetadata = {
  format?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  takenAt?: Date;
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  focalLength?: number;
  aperture?: number;
  shutterSpeed?: number;
  iso?: number;
  latitude?: number;
  longitude?: number;
  rawExifJson?: Record<string, unknown> | null;
  dominantHex?: string;
  paletteJson?: Prisma.InputJsonValue;
  brightnessScore?: number;
  warmthScore?: number;
  contrastScore?: number;
};

function parseRational(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  if (value.includes("/")) {
    const [numerator, denominator] = value.split("/").map(Number);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getMetaValue(
  metadata: Record<string, string>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = metadata[key];
    if (value) {
      return value;
    }
  }

  return undefined;
}

function parseTakenAt(metadata: Record<string, string>): Date | undefined {
  const raw = getMetaValue(metadata, [
    "DateTimeOriginal",
    "CreateDate",
    "DateTime",
  ]);

  if (!raw) {
    return undefined;
  }

  const parsed = new Date(raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3"));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseGpsCoordinate(
  metadata: Record<string, string>,
  valueKeys: string[],
  refKey: string,
): number | undefined {
  const raw = getMetaValue(metadata, valueKeys);
  if (!raw) {
    return undefined;
  }

  const parts = raw.split(",").map((part) => part.trim());
  let decimal = 0;

  for (const part of parts) {
    decimal = decimal * 60 + (parseRational(part) ?? 0);
  }

  const ref = metadata[refKey];
  if (ref === "S" || ref === "W") {
    decimal *= -1;
  }

  return decimal || undefined;
}

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

function buildPaletteFromColors(colors: [string, number][] | undefined) {
  if (!colors || colors.length === 0) {
    return null;
  }

  const paletteJson = Object.fromEntries(
    colors.slice(0, 6).map(([hex], index) => [`swatch${index + 1}`, hex]),
  ) as Record<string, string | null>;

  const dominantHex = colors[0]?.[0];
  const hexSamples = colors.slice(0, 6).map(([hex]) => hex);

  return {
    dominantHex,
    paletteJson,
    brightnessScore: dominantHex
      ? Number(relativeLuminance(dominantHex).toFixed(3))
      : undefined,
    warmthScore: dominantHex
      ? Number(warmthScoreFromHex(dominantHex).toFixed(3))
      : undefined,
    contrastScore:
      hexSamples.length >= 2
        ? Number(
            Math.abs(
              relativeLuminance(hexSamples[0]) -
                relativeLuminance(hexSamples[hexSamples.length - 1]),
            ).toFixed(3),
          )
        : undefined,
  };
}

export function parseCloudinaryResourceMetadata(
  resource: CloudinaryResourceDetails,
): ParsedCloudinaryMetadata {
  const metadata = {
    ...(resource.image_metadata ?? {}),
    ...(resource.media_metadata ?? {}),
  };

  const isoRaw = getMetaValue(metadata, ["ISO", "ISOSpeedRatings", "PhotographicSensitivity"]);
  const iso = isoRaw ? parseInt(isoRaw, 10) : undefined;

  const palette = buildPaletteFromColors(resource.colors);

  return {
    format: resource.format,
    width: resource.width,
    height: resource.height,
    fileSize: resource.bytes,
    takenAt: parseTakenAt(metadata),
    cameraMake: getMetaValue(metadata, ["Make"]),
    cameraModel: getMetaValue(metadata, ["Model"]),
    lensModel: getMetaValue(metadata, ["LensModel", "Lens"]),
    focalLength: parseRational(getMetaValue(metadata, ["FocalLength", "FocalLengthIn35mmFilm"])),
    aperture: parseRational(getMetaValue(metadata, ["FNumber", "ApertureValue"])),
    shutterSpeed: parseRational(getMetaValue(metadata, ["ExposureTime", "ShutterSpeedValue"])),
    iso: Number.isFinite(iso) ? iso : undefined,
    latitude:
      parseGpsCoordinate(metadata, ["GPSLatitude"], "GPSLatitudeRef") ??
      parseRational(getMetaValue(metadata, ["latitude", "GPSLatitudeDecimal"])),
    longitude:
      parseGpsCoordinate(metadata, ["GPSLongitude"], "GPSLongitudeRef") ??
      parseRational(getMetaValue(metadata, ["longitude", "GPSLongitudeDecimal"])),
    rawExifJson: Object.keys(metadata).length > 0 ? metadata : null,
    ...palette,
  };
}

export async function fetchCloudinaryResourceMetadata(
  publicId: string,
): Promise<ParsedCloudinaryMetadata | null> {
  try {
    const cloudinary = getCloudinary();
    const resource = (await cloudinary.api.resource(publicId, {
      colors: true,
      media_metadata: true,
      image_metadata: true,
    })) as CloudinaryResourceDetails;

    return parseCloudinaryResourceMetadata(resource);
  } catch (error) {
    console.warn("[cloudinary/metadata] resource lookup failed:", error);
    return null;
  }
}
