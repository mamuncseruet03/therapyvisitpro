"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export async function getCommunicationNotes(patientId) {
  await requireAuth();

  const notes = await prisma.communicationNote.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  });

  return notes.map(n => ({
    id: n.id,
    patient_id: n.patientId,
    patient_name: n.patientName,
    author_id: n.authorId,
    author_name: n.authorName,
    author_email: n.authorEmail,
    note: n.note,
    note_type: n.noteType?.toLowerCase(),
    created_date: n.createdAt,
  }));
}

export async function addCommunicationNote({ patientId, patientName, note, noteType }) {
  const user = await requireAuth();

  const created = await prisma.communicationNote.create({
    data: {
      patientId,
      patientName,
      authorId: user.id,
      authorName: user.name || user.email,
      authorEmail: user.email,
      note,
      noteType: (noteType || "general").toUpperCase(),
    },
  });

  return { success: true, id: created.id };
}
