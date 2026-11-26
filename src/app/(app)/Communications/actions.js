"use server";

import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function loadVitalAlerts() {
  await requireRole("SUPERUSER", "ADMIN", "COORDINATOR");
  return prisma.communicationNote.findMany({
    where: { vitalVisitId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, patientName: true, note: true, vitalVisitId: true,
      resolvedAt: true, resolution: true,
    },
  });
}

export async function resolveVitalAlert(id, message) {
  await requireRole("SUPERUSER", "ADMIN", "COORDINATOR");
  const resolution = typeof message === "string" ? message.trim() : "";
  if (!resolution || resolution.length > 2000) {
    throw new Error("Enter a resolution of up to 2,000 characters.");
  }
  await prisma.$transaction(async (db) => {
    const alert = await db.communicationNote.findUniqueOrThrow({
      where: { id },
      select: { patientName: true, vitalVisitId: true, vitalVisit: { select: { therapistId: true } } },
    });
    if (!alert.vitalVisitId) throw new Error("Vital alert not found.");
    const { count } = await db.communicationNote.updateMany({
      where: { id, resolvedAt: null },
      data: { resolvedAt: new Date(), resolution },
    });
    if (!count) return;
    const therapist = await db.user.findUnique({
      where: { therapistId: alert.vitalVisit.therapistId },
      select: { id: true, email: true },
    });
    if (!therapist) return;
    await db.notification.create({
      data: {
        recipientId: therapist.id,
        recipientEmail: therapist.email,
        title: `Vital alert follow-up for ${alert.patientName}`,
        message: resolution,
        link: `/VisitNoteDetail?id=${alert.vitalVisitId}`,
        type: "COMMUNICATION_NOTE",
        relatedId: alert.id,
      },
    });
  });
}

export async function loadTherapistVitalMessages() {
  const user = await requireRole("THERAPIST");
  return prisma.notification.findMany({
    where: { recipientId: user.id, type: "COMMUNICATION_NOTE", isRead: false },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, message: true },
  });
}

export async function acknowledgeVitalMessage(id) {
  const user = await requireRole("THERAPIST");
  await prisma.notification.updateMany({
    where: { id, recipientId: user.id, type: "COMMUNICATION_NOTE", isRead: false },
    data: { isRead: true },
  });
}
