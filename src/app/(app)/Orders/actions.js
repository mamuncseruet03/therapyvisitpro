"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { executePatientDeletion } from "@/lib/patients/delete-record";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/audit/logger";

export async function getDeletionRequests() {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const requests = await prisma.deletionRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r) => ({
    id: r.id,
    patient_id: r.patientId,
    patient_name: r.patientName,
    patient_snapshot: r.patientSnapshot,
    requested_by: r.requestedBy,
    requested_by_name: r.requestedByName,
    is_current_user_request:
      r.requestedBy === user.email ||
      r.patientSnapshot?.localRequesterEmail === user.email,
    reason: r.reason,
    approved_by: r.approvedBy,
    approved_by_name: r.approvedByName,
    approved_at: r.approvedAt?.toISOString() || null,
    status: r.status?.toLowerCase(),
    visit_notes_count: r.visitNotesCount,
    created_date: r.createdAt?.toISOString(),
  }));
}

export async function approveDeletionRequest(id, password) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const account = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (typeof password !== "string" || !account?.passwordHash || !await verifyPassword(password, account.passwordHash)) {
    return { error: "Incorrect password" };
  }
  const request = await prisma.$transaction(async (tx) => {
    const pending = await tx.deletionRequest.findFirst({ where: { id, status: "PENDING" } });
    if (!pending) throw new Error("Pending request not found");
    await executePatientDeletion(tx, pending.patientId);
    return pending;
  });

  const h = await headers();
  await logAudit({
    user,
    action: "DELETE",
    resourceType: "Patient",
    resourceId: request.patientId,
    resourceLabel: request.patientName,
    details: `Approved medical record deletion. Reason: ${request.reason}`,
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function rejectDeletionRequest(id) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  await prisma.deletionRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      approvedBy: user.email,
      approvedByName: user.fullName || user.email,
      approvedAt: new Date(),
    },
  });

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "DeletionRequest",
    resourceId: id,
    details: "Rejected deletion request",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}
