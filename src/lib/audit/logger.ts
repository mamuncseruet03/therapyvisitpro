import { prisma } from "@/lib/db";
import type { AuditAction } from "@/generated/prisma/client";
import type { SessionUser } from "@/lib/auth/types";

interface AuditLogEntry {
  user: SessionUser;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  resourceLabel?: string;
  details?: string;
  ipAddress?: string;
}

export async function logAudit(entry: AuditLogEntry) {
  return prisma.auditLog.create({
    data: {
      userId: entry.user.id,
      userName: entry.user.name,
      userEmail: entry.user.email,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      resourceLabel: entry.resourceLabel,
      details: entry.details,
      ipAddress: entry.ipAddress,
    },
  });
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headers.get("x-real-ip") ?? "unknown"
  );
}
