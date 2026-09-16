"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export async function getNotifications(recipientEmail) {
  await requireAuth();

  const notifications = await prisma.notification.findMany({
    where: recipientEmail ? { recipientEmail } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return notifications.map(n => ({
    id: n.id,
    recipient_email: n.recipientEmail,
    title: n.title,
    message: n.message,
    link: n.link,
    is_read: n.isRead,
    type: n.type?.toLowerCase(),
    related_id: n.relatedId,
    created_date: n.createdAt,
  }));
}

export async function markNotificationRead(id) {
  await requireAuth();

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return { success: true };
}

export async function markAllNotificationsRead(recipientEmail) {
  await requireAuth();

  await prisma.notification.updateMany({
    where: { recipientEmail, isRead: false },
    data: { isRead: true },
  });

  return { success: true };
}
