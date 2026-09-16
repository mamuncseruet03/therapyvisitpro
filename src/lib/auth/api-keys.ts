import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/db";

const KEY_PREFIX = "tvp_";

function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export async function generateApiKey(userId: string, label?: string) {
  const rawKey = `${KEY_PREFIX}${randomBytes(32).toString("hex")}`;
  const hashedKey = hashKey(rawKey);

  const apiKey = await prisma.apiKey.create({
    data: { userId, hashedKey, label },
  });

  // rawKey is only ever available here — the stored hash cannot be reversed.
  return { id: apiKey.id, rawKey, label: apiKey.label, createdAt: apiKey.createdAt };
}

export async function listApiKeys(userId: string) {
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return keys.map((k) => ({
    id: k.id,
    label: k.label,
    lastUsedAt: k.lastUsedAt,
    expiresAt: k.expiresAt,
    revokedAt: k.revokedAt,
    createdAt: k.createdAt,
  }));
}

export async function revokeApiKey(id: string, userId: string) {
  const apiKey = await prisma.apiKey.findUnique({ where: { id } });
  if (!apiKey || apiKey.userId !== userId) {
    throw new Error("Not found");
  }

  return prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}
