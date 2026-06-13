import exifr from "exifr";
import sharp from "sharp";

export type ExtractedExif = {
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
};

function serializeExif(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;

  try {
    return JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function extractImageMetadata(
  buffer: Buffer,
): Promise<ExtractedExif> {
  const [sharpMeta, exif] = await Promise.all([
    sharp(buffer).metadata(),
    exifr.parse(buffer).catch(() => null),
  ]);

  const takenAtRaw =
    exif && typeof exif === "object" && "DateTimeOriginal" in exif
      ? exif.DateTimeOriginal
      : exif && typeof exif === "object" && "CreateDate" in exif
        ? exif.CreateDate
        : undefined;

  const takenAt =
    takenAtRaw instanceof Date
      ? takenAtRaw
      : takenAtRaw
        ? new Date(String(takenAtRaw))
        : undefined;

  const getString = (key: string) => {
    if (!exif || typeof exif !== "object" || !(key in exif)) return undefined;
    const value = exif[key as keyof typeof exif];
    return typeof value === "string" ? value : undefined;
  };

  const getNumber = (key: string) => {
    if (!exif || typeof exif !== "object" || !(key in exif)) return undefined;
    const value = exif[key as keyof typeof exif];
    return typeof value === "number" ? value : undefined;
  };

  return {
    format: sharpMeta.format,
    width: sharpMeta.width,
    height: sharpMeta.height,
    fileSize: sharpMeta.size ?? buffer.byteLength,
    takenAt,
    cameraMake: getString("Make"),
    cameraModel: getString("Model"),
    lensModel: getString("LensModel"),
    focalLength: getNumber("FocalLength"),
    aperture: getNumber("FNumber"),
    shutterSpeed: getNumber("ExposureTime"),
    iso: getNumber("ISO"),
    latitude: getNumber("latitude"),
    longitude: getNumber("longitude"),
    rawExifJson: serializeExif(exif),
    // TODO(Mapbox): Reverse-geocode latitude/longitude into location tags
  };
}
