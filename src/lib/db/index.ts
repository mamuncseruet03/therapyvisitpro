import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL ?? "";

const globalForPrisma = globalThis as unknown as {
  therapyDocsPrismaWithVitalAlerts: PrismaClient | undefined;
};

function createClient() {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.therapyDocsPrismaWithVitalAlerts ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.therapyDocsPrismaWithVitalAlerts = prisma;
}
