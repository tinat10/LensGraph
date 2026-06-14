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
  // Keep the original file format so EXIF/GPS survive ingest (Cloudinary converts on delivery).
  const params = {
    timestamp,
    folder,
    media_metadata: true,
    colors: true,
  };
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
    uploadFormat: "",
  };
}

export function isCloudinaryPublicIdInFolder(
  publicId: string,
  folder: string,
): boolean {
  return publicId === folder || publicId.startsWith(`${folder}/`);
}
