import { v2 as cloudinary } from "cloudinary";
import { getServerEnv } from "@/lib/env";

let configured = false;

export function getCloudinary() {
  if (!configured) {
    const env = getServerEnv();
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }

  return cloudinary;
}

export type CloudinaryUploadResult = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  bytes: number;
};

export async function uploadImageBuffer(
  buffer: Buffer,
  folder: string,
  filename: string,
): Promise<CloudinaryUploadResult> {
  const cloudinaryClient = getCloudinary();

  return new Promise((resolve, reject) => {
    cloudinaryClient.uploader
      .upload_stream(
        {
          folder,
          public_id: filename.replace(/\.[^/.]+$/, ""),
          resource_type: "image",
          overwrite: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            const cloudinaryError =
              error instanceof Error
                ? error.message
                : typeof error === "object" &&
                    error !== null &&
                    "message" in error
                  ? String(error.message)
                  : "Cloudinary upload failed";
            reject(new Error(cloudinaryError));
            return;
          }

          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        },
      )
      .end(buffer);
  });
}

export function buildThumbnailUrl(publicId: string): string {
  const cloudinaryClient = getCloudinary();
  return cloudinaryClient.url(publicId, {
    width: 600,
    height: 600,
    crop: "limit",
    quality: "auto",
    fetch_format: "auto",
  });
}

/** JPEG URL for server-side EXIF/palette extraction (HEIC/HEIF-safe). */
export function buildProcessingUrl(publicId: string): string {
  const cloudinaryClient = getCloudinary();
  return cloudinaryClient.url(publicId, {
    transformation: [{ fetch_format: "jpg", quality: "auto" }],
    secure: true,
  });
}

export async function fetchImageBufferFromUrl(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  const cloudinaryClient = getCloudinary();
  await cloudinaryClient.uploader.destroy(publicId, { resource_type: "image" });
}
