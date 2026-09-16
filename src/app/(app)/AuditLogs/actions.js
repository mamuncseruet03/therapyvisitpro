"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";

export async function getAuditLogs() {
  await requireRole("SUPERUSER", "ADMIN");

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return logs.map(l => ({
    id: l.id,
    user_name: l.userName,
    user_email: l.userEmail,
    action: l.action?.toLowerCase(),
    resource_type: l.resourceType,
    resource_id: l.resourceId,
    resource_label: l.resourceLabel,
    details: l.details,
    ip_address: l.ipAddress,
    timestamp: l.createdAt,
  }));
}
