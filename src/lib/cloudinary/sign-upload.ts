import { v2 as cloudinary } from "cloudinary";
import { getServerEnv } from "@/lib/env";

export type CloudinaryUploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

export function getCollectionUploadFolder(collectionId: string): string {
  return `lensgraph/${collectionId}`;
}

export function createUploadSignature(
  folder: string,
): CloudinaryUploadSignature {
  const env = getServerEnv();
  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder };
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
  };
}

export function isCloudinaryPublicIdInFolder(
  publicId: string,
  folder: string,
): boolean {
  return publicId === folder || publicId.startsWith(`${folder}/`);
}
