import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";

export type RegisterWithPasswordInput = {
  name?: string;
  email: string;
  password: string;
};

export async function registerWithPassword(input: RegisterWithPasswordInput) {
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim() || undefined;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  if (existing) {
    if (existing.passwordHash) {
      throw new Error("An account with this email already exists");
    }

    throw new Error(
      "This email is linked to GitHub or Google — sign in with that provider instead",
    );
  }

  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
}
