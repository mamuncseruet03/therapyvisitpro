"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";

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

export async function getReportsData() {
  await requireRole("SUPERUSER", "ADMIN");

  const [visits, patients, therapists] = await Promise.all([
    prisma.visitNote.findMany({
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
      },
      orderBy: { visitDate: "desc" },
    }),
    prisma.patient.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        agencyId: true,
        agency: { select: { name: true } },
      },
    }),
    prisma.therapist.findMany({
      select: {
        id: true,
        fullName: true,
        discipline: true,
        status: true,
      },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return {
    visits: visits.map((v) => ({
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
      agency_id: v.agencyId,
    })),
    patients: patients.map((p) => ({
      id: p.id,
      first_name: p.firstName,
      last_name: p.lastName,
      full_name: `${p.firstName} ${p.lastName}`,
      status: p.status?.toLowerCase(),
      agency: p.agency?.name || null,
    })),
    therapists: therapists.map((t) => ({
      id: t.id,
      full_name: t.fullName,
      discipline: THERAPY_DISPLAY[t.discipline] || t.discipline,
      status: t.status?.toLowerCase(),
    })),
  };
}
