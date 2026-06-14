import { v2 as cloudinary } from "cloudinary";
import { getServerEnv } from "@/lib/env";

export type CloudinaryUploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadFormat: string;
};

export function getCollectionUploadFolder(collectionId: string): string {
  return `lensgraph/${collectionId}`;
}

export function createUploadSignature(
  folder: string,
): CloudinaryUploadSignature {
  const env = getServerEnv();
  const timestamp = Math.round(Date.now() / 1000);
  // Convert HEIC/HEIF and other formats to JPEG at ingest for broad compatibility.
  const uploadFormat = "jpg";
  const params = { timestamp, folder, format: uploadFormat };
  const signature = cloudinary.utils.api_sign_request(
    params,
    env.CLOUDINARY_API_SECRET,
  );

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    uploadFormat,
  };
}

export function isCloudinaryPublicIdInFolder(
  publicId: string,
  folder: string,
): boolean {
  return publicId === folder || publicId.startsWith(`${folder}/`);
}
