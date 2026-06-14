import { prisma } from "@/lib/db/prisma";
import { buildThumbnailUrl } from "@/lib/cloudinary/client";
import {
  getCollectionUploadFolder,
  isCloudinaryPublicIdInFolder,
} from "@/lib/cloudinary/sign-upload";
import { getCollectionForUser } from "@/services/collection.service";

export type CloudinaryRegisteredUpload = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  bytes: number;
  format?: string;
  originalFilename: string;
};

export type UploadPhotoResult = {
  id: string;
  originalFilename: string;
  secureUrl: string;
  thumbnailUrl: string | null;
};

async function createPhotoRecord(
  collectionId: string,
  upload: CloudinaryRegisteredUpload,
) {
  return prisma.photo.create({
    data: {
      collectionId,
      cloudinaryPublicId: upload.public_id,
      secureUrl: upload.secure_url,
      thumbnailUrl: buildThumbnailUrl(upload.public_id),
      originalFilename: upload.originalFilename,
      format: upload.format ?? null,
      width: upload.width,
      height: upload.height,
      fileSize: upload.bytes,
      uploadedAt: new Date(),
      metadata: {
        create: {},
      },
    },
  });
}

export async function registerPhotoFromCloudinary(
  collectionId: string,
  userId: string,
  upload: CloudinaryRegisteredUpload,
): Promise<UploadPhotoResult> {
  const collection = await getCollectionForUser(collectionId, userId);
  if (!collection) {
    throw new Error("Collection not found");
  }

  const folder = getCollectionUploadFolder(collectionId);
  if (!isCloudinaryPublicIdInFolder(upload.public_id, folder)) {
    throw new Error("Upload does not belong to this collection");
  }

  const photo = await createPhotoRecord(collectionId, upload);

  await prisma.collection.update({
    where: { id: collectionId },
    data: { updatedAt: new Date() },
  });

  return {
    id: photo.id,
    originalFilename: photo.originalFilename,
    secureUrl: photo.secureUrl,
    thumbnailUrl: photo.thumbnailUrl,
  };
}

export async function registerPhotosFromCloudinary(
  collectionId: string,
  userId: string,
  uploads: CloudinaryRegisteredUpload[],
): Promise<UploadPhotoResult[]> {
  const results: UploadPhotoResult[] = [];

  for (const upload of uploads) {
    results.push(await registerPhotoFromCloudinary(collectionId, userId, upload));
  }

  return results;
}
