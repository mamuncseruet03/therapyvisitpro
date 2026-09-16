"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

const THERAPY_DISPLAY = {
  PHYSICAL_THERAPY: "Physical Therapy",
  OCCUPATIONAL_THERAPY: "Occupational Therapy",
  SPEECH_THERAPY: "Speech Therapy",
};

const VISIT_TYPE_DISPLAY = {
  EVALUATION: "evaluation",
  TREATMENT: "treatment",
  RE_EVALUATION: "re_evaluation",
  RECERTIFICATION: "recertification",
  DISCHARGE_WITH_VISIT: "discharge",
  DISCHARGE_WITHOUT_VISIT: "discharge",
  EVAL_REFUSED: "eval_refused",
  MISSED_VISIT: "missed_visit",
};

export async function getCalendarVisits() {
  await requireAuth();

  const visits = await prisma.visitNote.findMany({
    select: {
      id: true,
      patientId: true,
      patientName: true,
      therapistId: true,
      therapistName: true,
      visitDate: true,
      therapyType: true,
      visitType: true,
      status: true,
      durationMinutes: true,
      agencyId: true,
      timeIn: true,
      timeOut: true,
    },
    orderBy: { visitDate: "desc" },
  });

  const agencyMap = {};
  if (visits.some((v) => v.agencyId)) {
    const agencies = await prisma.agency.findMany({
      select: { id: true, name: true },
    });
    for (const a of agencies) agencyMap[a.id] = a.name;
  }

  return visits.map((v) => ({
    id: v.id,
    patient_id: v.patientId,
    patient_name: v.patientName,
    therapist_id: v.therapistId,
    therapist_name: v.therapistName,
    visit_date: v.visitDate?.toISOString?.().split("T")[0],
    therapy_type: THERAPY_DISPLAY[v.therapyType] || v.therapyType,
    visit_type: VISIT_TYPE_DISPLAY[v.visitType] || v.visitType?.toLowerCase() || null,
    status: v.status?.toLowerCase(),
    duration_minutes: v.durationMinutes,
    agency: agencyMap[v.agencyId] || null,
    time_in: v.timeIn,
    time_out: v.timeOut,
  }));
}

export async function getTherapistsForSchedule() {
  await requireAuth();

  const therapists = await prisma.therapist.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      discipline: true,
      status: true,
    },
    orderBy: { fullName: "asc" },
  });

  return therapists.map((t) => ({
    id: t.id,
    full_name: t.fullName,
    email: t.email,
    discipline: THERAPY_DISPLAY[t.discipline] || t.discipline,
    status: t.status?.toLowerCase(),
  }));
}

export async function getWeeklyCloseData() {
  await requireAuth();

  const [draftNotes, tasks] = await Promise.all([
    prisma.visitNote.findMany({
      where: { status: "DRAFT" },
      select: {
        id: true,
        patientName: true,
        therapistName: true,
        visitDate: true,
        therapyType: true,
        status: true,
      },
      orderBy: { visitDate: "desc" },
    }),
    prisma.task.findMany({
      where: { status: { not: "COMPLETED" } },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
      },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const completedUnsigned = await prisma.visitNote.findMany({
    where: { status: "COMPLETED" },
    select: {
      id: true,
      patientName: true,
      therapistName: true,
      visitDate: true,
      therapyType: true,
      status: true,
    },
    orderBy: { visitDate: "desc" },
  });

  return {
    draftNotes: draftNotes.map((n) => ({
      id: n.id,
      patient_name: n.patientName,
      therapist_name: n.therapistName,
      visit_date: n.visitDate?.toISOString?.().split("T")[0],
      therapy_type: THERAPY_DISPLAY[n.therapyType] || n.therapyType,
      status: n.status?.toLowerCase(),
    })),
    unsignedNotes: completedUnsigned.map((n) => ({
      id: n.id,
      patient_name: n.patientName,
      therapist_name: n.therapistName,
      visit_date: n.visitDate?.toISOString?.().split("T")[0],
      therapy_type: THERAPY_DISPLAY[n.therapyType] || n.therapyType,
      status: n.status?.toLowerCase(),
    })),
    myTasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status?.toLowerCase(),
      priority: t.priority?.toLowerCase(),
      due_date: t.dueDate?.toISOString?.().split("T")[0] || null,
    })),
  };
}
