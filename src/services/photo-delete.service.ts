import { prisma } from "@/lib/db/prisma";
import { deleteCloudinaryImage } from "@/lib/cloudinary/client";

export async function deletePhoto(photoId: string, userId: string): Promise<void> {
  const photo = await prisma.photo.findFirst({
    where: {
      id: photoId,
      collection: { userId },
    },
    select: {
      id: true,
      cloudinaryPublicId: true,
      collectionId: true,
    },
  });

  if (!photo) {
    throw new Error("Photo not found");
  }

  await deleteCloudinaryImage(photo.cloudinaryPublicId);

  await prisma.$transaction([
    prisma.collection.updateMany({
      where: { coverPhotoId: photo.id },
      data: { coverPhotoId: null },
    }),
    prisma.photo.delete({ where: { id: photo.id } }),
    prisma.collection.update({
      where: { id: photo.collectionId },
      data: { updatedAt: new Date() },
    }),
  ]);
}
