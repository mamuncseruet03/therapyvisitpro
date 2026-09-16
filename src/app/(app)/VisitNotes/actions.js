"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/audit/logger";

const THERAPY_DISPLAY = {
  PHYSICAL_THERAPY: "Physical Therapy",
  OCCUPATIONAL_THERAPY: "Occupational Therapy",
  SPEECH_THERAPY: "Speech Therapy",
};

const THERAPY_ENUM = {
  "Physical Therapy": "PHYSICAL_THERAPY",
  "Occupational Therapy": "OCCUPATIONAL_THERAPY",
  "Speech Therapy": "SPEECH_THERAPY",
};

const VISIT_TYPE_MAP = {
  evaluation: "EVALUATION",
  treatment: "TREATMENT",
  re_evaluation: "RE_EVALUATION",
  recertification: "RECERTIFICATION",
  discharge_with_visit: "DISCHARGE_WITH_VISIT",
  discharge_without_visit: "DISCHARGE_WITHOUT_VISIT",
  eval_refused: "EVAL_REFUSED",
  missed_visit: "MISSED_VISIT",
};

const VISIT_TYPE_DISPLAY = {
  ...Object.fromEntries(Object.entries(VISIT_TYPE_MAP).map(([k, v]) => [v, k])),
  DISCHARGE_WITH_VISIT: "discharge",
  DISCHARGE_WITHOUT_VISIT: "discharge",
};

function toSnakeCase(note) {
  return {
    id: note.id,
    patient_id: note.patientId,
    patient_name: note.patientName,
    therapist_id: note.therapistId,
    therapist_name: note.therapistName,
    visit_date: note.visitDate?.toISOString?.().split("T")[0] ?? note.visitDate,
    therapy_type: THERAPY_DISPLAY[note.therapyType] || note.therapyType,
    visit_type: VISIT_TYPE_DISPLAY[note.visitType] || note.visitType?.toLowerCase() || null,
    agency_id: note.agencyId,
    status: note.status?.toLowerCase(),
    duration_minutes: note.durationMinutes,
    time_in: note.timeTracking?.timeIn || null,
    time_out: note.timeTracking?.timeOut || null,
    non_billable: note.nonBillable,
    special_price: note.specialPrice ? Number(note.specialPrice) : null,
    cpt_codes: note.cptCodes || [],
    include_soc_oasis: note.includeSocOasis,
    include_roc_oasis: note.includeRocOasis,
    require_discharge_oasis: note.requireDischargeOasis,
    include_nomnc: note.includeNomnc,
    treatment_approved: note.treatmentApproved,
    treatment_approved_date: note.treatmentApprovedDate?.toISOString?.() || null,
    vitals: note.vitals || null,
    pain_assessment: note.painAssessment || null,
    subjective_data: note.subjectiveData || null,
    objective_data: note.objectiveData || null,
    mobility_data: note.mobilityData || null,
    adl_data: note.adlData || null,
    soap_notes: note.soapNotes || null,
    assessment_data: note.assessmentData || null,
    goals_plan: note.goalsPlan || null,
    therapy_orders: note.therapyOrders || null,
    dc_plan_education: note.dcPlanEducation || null,
    nomnc_data: note.nomncData || null,
    discharge_data: note.dischargeData || null,
    reeval_data: note.reevalData || null,
    signatures: note.signatures || null,
    time_tracking: note.timeTracking || null,
    documents: note.documents || null,
    visit_diagnoses: note.visitDiagnoses || null,
    medical_diagnoses: note.visitDiagnoses?.medicalDiagnoses || note.visitDiagnoses?.medical_diagnoses || [],
    treatment_diagnoses: note.visitDiagnoses?.treatmentDiagnoses || note.visitDiagnoses?.treatment_diagnoses || [],
    patient_id_method: note.patientIdMethod || null,
    patient_identification: note.patientIdMethod || null,
    oasis_data: note.oasisData || null,
    pta_supervision: note.ptaSupervision || null,
    missed_visit_data: note.missedVisitData || null,
    subjective: note.subjectiveData?.subjective || note.soapNotes?.subjective || "",
    objective: note.subjectiveData?.objective || note.soapNotes?.objective || "",
    assessment: note.soapNotes?.assessment || "",
    plan: note.soapNotes?.plan || "",
    medical_history: note.subjectiveData?.medicalHistory || "",
    prior_function: note.subjectiveData?.priorFunction || "",
    living_environment: note.subjectiveData?.livingEnvironment || "",
    rom_evaluation: note.objectiveData?.romEvaluation || {},
    strength_evaluation: note.objectiveData?.strengthEvaluation || {},
    gait_analysis: note.objectiveData?.gaitAnalysis || "",
    standardized_testing: note.assessmentData?.standardizedTesting || "",
    standardized_tests: note.assessmentData?.standardizedTests || [],
    goals_addressed: note.goalsPlan?.goalsAddressed || [],
    interventions: note.goalsPlan?.interventions || [],
    patient_response: note.goalsPlan?.patientResponse || "",
    functional_status: note.goalsPlan?.functionalStatus || "",
    eval_treatment_goals: note.goalsPlan?.evalTreatmentGoals || [{ goal: "", interventions: [], functional_status: "" }],
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  };
}

function jsonSafe(data) {
  if (data === null || data === undefined) return undefined;
  return JSON.parse(JSON.stringify(data));
}

export async function getVisitNotes() {
  await requireAuth();

  const notes = await prisma.visitNote.findMany({
    orderBy: { visitDate: "desc" },
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
      createdAt: true,
    },
  });

  return notes.map((n) => ({
    id: n.id,
    patient_id: n.patientId,
    patient_name: n.patientName,
    therapist_id: n.therapistId,
    therapist_name: n.therapistName,
    visit_date: n.visitDate?.toISOString?.().split("T")[0],
    therapy_type: THERAPY_DISPLAY[n.therapyType] || n.therapyType,
    visit_type: VISIT_TYPE_DISPLAY[n.visitType] || n.visitType?.toLowerCase() || null,
    status: n.status?.toLowerCase(),
    duration_minutes: n.durationMinutes,
    agency_id: n.agencyId,
    created_at: n.createdAt,
  }));
}

export async function getVisitNoteById(id) {
  await requireAuth();

  const note = await prisma.visitNote.findUnique({ where: { id } });
  if (!note) return null;

  return toSnakeCase(note);
}

export async function getVisitFormData() {
  await requireAuth();

  const [patients, therapists, agencies] = await Promise.all([
    prisma.patient.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        agencyId: true,
        agency: { select: { name: true } },
        therapyTypes: true,
        diagnoses: true,
        authorizationNumber: true,
      },
      orderBy: { lastName: "asc" },
    }),
    prisma.therapist.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        fullName: true,
        discipline: true,
        credentials: true,
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.agency.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    patients: patients.map((p) => ({
      id: p.id,
      first_name: p.firstName,
      last_name: p.lastName,
      agency_id: p.agencyId,
      agency: p.agency?.name ?? null,
      therapy_types: p.therapyTypes,
      diagnoses: p.diagnoses,
      authorization_number: p.authorizationNumber,
    })),
    therapists: therapists.map((t) => ({
      id: t.id,
      full_name: t.fullName,
      discipline: THERAPY_DISPLAY[t.discipline] || t.discipline,
      credentials: t.credentials,
    })),
    agencies: agencies.map((a) => ({
      id: a.id,
      name: a.name,
    })),
  };
}

export async function saveVisitNote(data) {
  const user = await requireAuth();

  const therapyEnum = THERAPY_ENUM[data.therapy_type] || data.therapy_type;
  const visitEnum = VISIT_TYPE_MAP[data.visit_type] || data.visit_type?.toUpperCase() || null;
  const statusEnum = (data.status || "draft").toUpperCase();

  const visitData = {
    patientId: data.patient_id,
    patientName: data.patient_name,
    therapistId: data.therapist_id,
    therapistName: data.therapist_name,
    visitDate: new Date(data.visit_date),
    therapyType: therapyEnum,
    visitType: visitEnum,
    agencyId: data.agency_id || null,
    status: statusEnum,
    durationMinutes: data.duration_minutes ? parseInt(data.duration_minutes, 10) : null,
    nonBillable: !!data.non_billable,
    specialPrice: data.special_price || null,
    cptCodes: data.cpt_codes || [],
    includeSocOasis: !!data.include_soc_oasis,
    includeRocOasis: !!data.include_roc_oasis,
    requireDischargeOasis: !!data.require_discharge_oasis,
    includeNomnc: !!data.include_nomnc,
    timeTracking: jsonSafe(data.time_tracking || { timeIn: data.time_in, timeOut: data.time_out }),
    vitals: jsonSafe(data.vitals),
    painAssessment: jsonSafe(data.pain_assessment),
    visitDiagnoses: jsonSafe({
      medicalDiagnoses: data.medical_diagnoses || [],
      treatmentDiagnoses: data.treatment_diagnoses || [],
    }),
    patientIdMethod: jsonSafe(data.patient_identification || data.patient_id_method),
    subjectiveData: jsonSafe(data.subjective_data || {
      subjective: data.subjective || "",
      medicalHistory: data.medical_history || "",
      priorFunction: data.prior_function || "",
      livingEnvironment: data.living_environment || "",
    }),
    objectiveData: jsonSafe(data.objective_data || {
      objective: data.objective || "",
      romEvaluation: data.rom_evaluation || {},
      strengthEvaluation: data.strength_evaluation || {},
      gaitAnalysis: data.gait_analysis || "",
    }),
    mobilityData: jsonSafe(data.mobility_data),
    adlData: jsonSafe(data.adl_data),
    soapNotes: jsonSafe(data.soap_notes || {
      subjective: data.subjective || "",
      objective: data.objective || "",
      assessment: data.assessment || "",
      plan: data.plan || "",
    }),
    assessmentData: jsonSafe(data.assessment_data || {
      standardizedTesting: data.standardized_testing || "",
      standardizedTests: data.standardized_tests || [],
    }),
    goalsPlan: jsonSafe(data.goals_plan || {
      goalsAddressed: data.goals_addressed || [],
      interventions: data.interventions || [],
      patientResponse: data.patient_response || "",
      functionalStatus: data.functional_status || "",
      evalTreatmentGoals: data.eval_treatment_goals || [],
    }),
    therapyOrders: jsonSafe(data.therapy_orders),
    dcPlanEducation: jsonSafe(data.dc_plan_education),
    nomncData: jsonSafe(data.nomnc_data),
    dischargeData: jsonSafe(data.discharge_data),
    reevalData: jsonSafe(data.reeval_data),
    signatures: jsonSafe(data.signatures),
    documents: jsonSafe(data.documents),
    oasisData: jsonSafe(data.oasis_data),
    ptaSupervision: jsonSafe(data.pta_supervision),
    missedVisitData: jsonSafe(data.missed_visit_data),
    treatmentApproved: data.treatment_approved ?? null,
    treatmentApprovedDate: data.treatment_approved_date ? new Date(data.treatment_approved_date) : null,
  };

  let noteId;

  if (data.id) {
    await prisma.visitNote.update({
      where: { id: data.id },
      data: visitData,
    });
    noteId = data.id;
  } else {
    const created = await prisma.visitNote.create({ data: visitData });
    noteId = created.id;
  }

  const h = await headers();
  await logAudit({
    user,
    action: data.id ? "UPDATE" : "CREATE",
    resourceType: "VisitNote",
    resourceId: noteId,
    resourceLabel: `${data.patient_name} — ${data.visit_type || "draft"}`,
    details: `Visit note ${data.id ? "updated" : "created"} (${data.status})`,
    ipAddress: getClientIp(h),
  });

  return { success: true, id: noteId };
}

export async function updateVisitNoteField(id, field, value) {
  const user = await requireAuth();

  const fieldMap = {
    visit_type: "visitType",
    status: "status",
  };

  const prismaField = fieldMap[field] || field;
  let prismaValue = value;

  if (field === "visit_type") {
    prismaValue = VISIT_TYPE_MAP[value] || value?.toUpperCase() || null;
  }
  if (field === "status") {
    prismaValue = value?.toUpperCase();
  }

  await prisma.visitNote.update({
    where: { id },
    data: { [prismaField]: prismaValue },
  });

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "VisitNote",
    resourceId: id,
    details: `Updated ${field} to ${value}`,
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function deleteVisitNote(id) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const note = await prisma.visitNote.findUnique({ where: { id } });
  if (!note) throw new Error("Visit note not found");

  await prisma.visitNote.delete({ where: { id } });

  const h = await headers();
  await logAudit({
    user,
    action: "DELETE",
    resourceType: "VisitNote",
    resourceId: id,
    resourceLabel: note.patientName,
    details: `Deleted visit note for ${note.patientName}`,
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function getPatientVisits(patientId) {
  await requireAuth();

  const visits = await prisma.visitNote.findMany({
    where: { patientId },
    orderBy: { visitDate: "desc" },
    select: {
      id: true,
      visitDate: true,
      therapyType: true,
      visitType: true,
      status: true,
      therapistName: true,
    },
  });

  return visits.map((v) => ({
    id: v.id,
    visit_date: v.visitDate?.toISOString?.().split("T")[0],
    therapy_type: THERAPY_DISPLAY[v.therapyType] || v.therapyType,
    visit_type: VISIT_TYPE_DISPLAY[v.visitType] || v.visitType?.toLowerCase() || null,
    status: v.status?.toLowerCase(),
    therapist_name: v.therapistName,
  }));
}
