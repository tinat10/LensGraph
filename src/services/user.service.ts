import { prisma } from "@/lib/db/prisma";

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      passwordHash: true,
      accounts: {
        select: {
          provider: true,
        },
      },
    },
  });
}

export async function updateUserProfile(
  userId: string,
  data: { name: string },
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name.trim(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });
}
