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
  DISCHARGE_WITH_VISIT: "discharge_with_visit",
  DISCHARGE_WITHOUT_VISIT: "discharge_without_visit",
  EVAL_REFUSED: "eval_refused",
  MISSED_VISIT: "missed_visit",
};

export async function getPayrollData() {
  await requireRole("SUPERUSER", "ADMIN");

  const [therapists, patients, visits] = await Promise.all([
    prisma.therapist.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        fullName: true,
        credentials: true,
        discipline: true,
        status: true,
        rates: true,
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.patient.findMany({
      select: {
        id: true,
        dateOfBirth: true,
      },
    }),
    prisma.visitNote.findMany({
      where: {
        status: { in: ["COMPLETED", "SIGNED"] },
      },
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
        nonBillable: true,
      },
      orderBy: { visitDate: "desc" },
    }),
  ]);

  return {
    therapists: therapists.map((t) => ({
      id: t.id,
      full_name: t.fullName,
      credentials: t.credentials,
      discipline: THERAPY_DISPLAY[t.discipline] || t.discipline,
      status: t.status?.toLowerCase(),
      rates: t.rates || {},
    })),
    patients: patients.map((p) => ({
      id: p.id,
      date_of_birth: p.dateOfBirth?.toISOString?.().split("T")[0] || null,
    })),
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
      non_billable: v.nonBillable,
    })),
  };
}
