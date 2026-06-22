import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma/client";

export async function getOrCreateUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: {
      name: clerkUser.fullName ?? clerkUser.firstName ?? undefined,
      email,
    },
    create: {
      clerkId,
      name: clerkUser.fullName ?? clerkUser.firstName ?? "User",
      email,
    },
  });

  return user;
}

export async function requireUser() {
  const user = await getOrCreateUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
