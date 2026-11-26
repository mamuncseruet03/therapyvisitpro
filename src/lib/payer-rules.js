import { prisma } from "@/lib/db";

export async function findPayerRules(name) {
  if (typeof name !== "string" || !name.trim()) return null;
  try {
    const payer = await prisma.payer.findFirst({
      where: { name: { equals: name.trim(), mode: "insensitive" }, status: "ACTIVE" },
      orderBy: { id: "asc" },
      select: { treatmentRules: true },
    });
    return payer?.treatmentRules ?? null;
  } catch (error) {
    if (["P2021", "P2022"].includes(error?.code)) return null;
    throw error;
  }
}
