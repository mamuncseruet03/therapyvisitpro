"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

function toSnakeCase(l) {
  return {
    id: l.id,
    coordinator_id: l.coordinatorId,
    coordinator_name: l.coordinatorName,
    coordinator_email: l.coordinatorEmail,
    clock_in: l.clockIn?.toISOString(),
    clock_out: l.clockOut?.toISOString() || null,
    log_date: l.logDate,
    duration_minutes: l.durationMinutes,
    notes: l.notes,
    created_at: l.createdAt,
  };
}

export async function getTimeLogs(email) {
  await requireAuth();

  const logs = await prisma.coordinatorTimeLog.findMany({
    where: { coordinatorEmail: email },
    orderBy: { clockIn: "desc" },
  });

  return logs.map(toSnakeCase);
}

export async function clockIn(userId, userName, userEmail) {
  await requireAuth();

  const log = await prisma.coordinatorTimeLog.create({
    data: {
      coordinatorId: userId,
      coordinatorName: userName,
      coordinatorEmail: userEmail,
      clockIn: new Date(),
      logDate: new Date(),
    },
  });

  return { success: true, id: log.id };
}

export async function clockOut(logId) {
  await requireAuth();

  const log = await prisma.coordinatorTimeLog.findUnique({ where: { id: logId } });
  if (!log || log.clockOut) return { success: false };

  const now = new Date();
  const durationMinutes = Math.round((now.getTime() - log.clockIn.getTime()) / 60000);

  await prisma.coordinatorTimeLog.update({
    where: { id: logId },
    data: { clockOut: now, durationMinutes },
  });

  return { success: true };
}
