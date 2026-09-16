import { headers } from "next/headers";
import { createHash } from "crypto";
import { auth } from "./config";
import type { SessionUser } from "./types";
import type { UserType } from "@/lib/types/enums";
import { prisma } from "@/lib/db";

export async function getSession() {
  return auth();
}

async function getBearerUser(): Promise<SessionUser | null> {
  let authHeader: string | null;
  try {
    authHeader = (await headers()).get("authorization");
  } catch {
    // headers() throws when called outside a request scope (e.g. in unit tests
    // that mock auth() directly without a Next.js request context).
    return null;
  }
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;

  const hashedKey = createHash("sha256").update(token).digest("hex");
  const apiKey = await prisma.apiKey.findUnique({
    where: { hashedKey },
    include: { user: true },
  });

  if (!apiKey || apiKey.revokedAt) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  const { user } = apiKey;
  return {
    id: user.id,
    email: user.email,
    name: user.fullName ?? user.email,
    role: user.role,
    userType: user.userType,
    therapistId: user.therapistId,
    discipline: user.discipline,
  } satisfies SessionUser;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (session?.user) return session.user;
  return getBearerUser();
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(...allowedTypes: UserType[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!allowedTypes.includes(user.userType)) {
    throw new Error("Forbidden");
  }
  return user;
}
