"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/audit/logger";

export async function getDeletionRequests() {
  await requireAuth();

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
    reason: r.reason,
    approved_by: r.approvedBy,
    approved_by_name: r.approvedByName,
    approved_at: r.approvedAt?.toISOString() || null,
    status: r.status?.toLowerCase(),
    visit_notes_count: r.visitNotesCount,
    created_date: r.createdAt?.toISOString(),
  }));
}

export async function approveDeletionRequest(id) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const request = await prisma.deletionRequest.findUnique({ where: { id } });
  if (!request) throw new Error("Request not found");
  if (request.requestedBy === user.email) {
    throw new Error("Cannot approve your own deletion request");
  }

  await prisma.$transaction(async (tx) => {
    await tx.visitNote.deleteMany({ where: { patientId: request.patientId } });
    await tx.patient.delete({ where: { id: request.patientId } });
    await tx.deletionRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy: user.email,
        approvedByName: user.fullName || user.email,
        approvedAt: new Date(),
      },
    });
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
