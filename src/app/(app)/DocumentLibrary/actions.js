"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/audit/logger";

function toSnakeCase(d) {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    category: d.category,
    file_url: d.fileUrl,
    file_name: d.fileName,
    is_active: d.isActive,
    created_at: d.createdAt,
  };
}

export async function getDocuments() {
  await requireAuth();

  const docs = await prisma.documentLibrary.findMany({
    orderBy: { createdAt: "desc" },
  });

  return docs.map(toSnakeCase);
}

export async function createDocument(data) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const doc = await prisma.documentLibrary.create({
    data: {
      name: data.name,
      description: data.description || null,
      category: data.category || null,
      fileUrl: data.file_url || null,
      fileName: data.file_name || null,
    },
  });

  const h = await headers();
  await logAudit({
    user,
    action: "CREATE",
    resourceType: "Document",
    resourceId: doc.id,
    resourceLabel: data.name,
    details: "Added document to library",
    ipAddress: getClientIp(h),
  });

  return { success: true, id: doc.id };
}

export async function updateDocument(id, data) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.category !== undefined) updateData.category = data.category || null;
  if (data.file_url !== undefined) updateData.fileUrl = data.file_url || null;
  if (data.file_name !== undefined) updateData.fileName = data.file_name || null;
  if (data.is_active !== undefined) updateData.isActive = data.is_active;

  await prisma.documentLibrary.update({ where: { id }, data: updateData });

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "Document",
    resourceId: id,
    details: "Updated document",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function deleteDocument(id) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  await prisma.documentLibrary.delete({ where: { id } });

  const h = await headers();
  await logAudit({
    user,
    action: "DELETE",
    resourceType: "Document",
    resourceId: id,
    details: "Deleted document from library",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}
