"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/audit/logger";

function toSnakeCase(t) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    assigned_to: t.assignedTo,
    assigned_to_name: t.assignedToName,
    due_date: t.dueDate,
    priority: t.priority?.toLowerCase(),
    status: t.status?.toLowerCase(),
    is_daily_recurring: t.isDailyRecurring,
    completed_date: t.completedDate,
    notes: t.notes,
    created_at: t.createdAt,
  };
}

export async function getTasks() {
  await requireAuth();

  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
  });

  return tasks.map(toSnakeCase);
}

export async function getMyTasks(userEmail) {
  await requireAuth();

  const tasks = await prisma.task.findMany({
    where: { assignedTo: userEmail },
    orderBy: { createdAt: "desc" },
  });

  return tasks.map(toSnakeCase);
}

export async function createTask(data) {
  const user = await requireAuth();

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      assignedTo: data.assigned_to,
      assignedToName: data.assigned_to_name || null,
      dueDate: data.due_date ? new Date(data.due_date) : null,
      priority: (data.priority || "medium").toUpperCase(),
      status: "PENDING",
      isDailyRecurring: data.is_daily_recurring || false,
    },
  });

  const h = await headers();
  await logAudit({
    user,
    action: "CREATE",
    resourceType: "Task",
    resourceId: task.id,
    resourceLabel: data.title,
    details: `Assigned to ${data.assigned_to_name || data.assigned_to}`,
    ipAddress: getClientIp(h),
  });

  return { success: true, id: task.id };
}

export async function updateTaskStatus(id, status) {
  const user = await requireAuth();

  const updateData = { status: status.toUpperCase() };
  if (status === "completed") {
    updateData.completedDate = new Date();
  }

  await prisma.task.update({ where: { id }, data: updateData });

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "Task",
    resourceId: id,
    details: `Status changed to ${status}`,
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function updateTask(id, data) {
  const user = await requireAuth();

  const updateData = {};
  if (data.status !== undefined) updateData.status = data.status.toUpperCase();
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.completed_date !== undefined) updateData.completedDate = data.completed_date ? new Date(data.completed_date) : null;
  if (data.escalation_data !== undefined) updateData.escalationData = data.escalation_data;

  await prisma.task.update({ where: { id }, data: updateData });

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "Task",
    resourceId: id,
    details: `Task updated: ${Object.keys(updateData).join(", ")}`,
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function escalateTask({ taskId, escalatedTo, escalatedToName, reason, followUpDate, createdByEmail, createdByName }) {
  const user = await requireAuth();

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "ESCALATED",
      escalationData: {
        escalatedTo,
        escalatedToName,
        reason,
        escalationDate: new Date().toISOString().split("T")[0],
        followUpDate,
      },
    },
  });

  const followUp = await prisma.task.create({
    data: {
      title: `Follow up escalated task`,
      description: `Escalated to: ${escalatedToName} (${escalatedTo}). Reason: ${reason}`,
      assignedTo: createdByEmail,
      assignedToName: createdByName || null,
      dueDate: followUpDate ? new Date(followUpDate) : null,
      priority: "HIGH",
      status: "PENDING",
      isDailyRecurring: false,
    },
  });

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "Task",
    resourceId: taskId,
    details: `Task escalated to ${escalatedToName}. Follow-up task created.`,
    ipAddress: getClientIp(h),
  });

  return { success: true, followUpId: followUp.id };
}

export async function deleteTask(id) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  await prisma.task.delete({ where: { id } });

  const h = await headers();
  await logAudit({
    user,
    action: "DELETE",
    resourceType: "Task",
    resourceId: id,
    details: "Deleted task",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function getUsersForSelect() {
  await requireAuth();

  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  return users.map(u => ({
    id: u.id,
    email: u.email,
    full_name: u.fullName,
  }));
}
