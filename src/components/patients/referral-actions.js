"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/audit/logger";
import { therapistAssignmentError } from "@/lib/assignments/eligibility";
import { findPayerRules } from "@/lib/payer-rules";

const THERAPY_TYPE_DISPLAY = {
  pt: "Physical Therapy",
  physical: "Physical Therapy",
  physical_therapy: "Physical Therapy",
  "physical therapy": "Physical Therapy",
  ot: "Occupational Therapy",
  occupational: "Occupational Therapy",
  occupational_therapy: "Occupational Therapy",
  "occupational therapy": "Occupational Therapy",
  st: "Speech Therapy",
  slp: "Speech Therapy",
  speech: "Speech Therapy",
  speech_therapy: "Speech Therapy",
  "speech therapy": "Speech Therapy",
};

const DISCIPLINE_DISPLAY = { PT: "Physical Therapy", OT: "Occupational Therapy", ST: "Speech Therapy" };
const DISCIPLINE_ENUM = { "Physical Therapy": "PT", "Occupational Therapy": "OT", "Speech Therapy": "ST" };
const PATIENT_THERAPY_TYPE_ENUM = {
  "Physical Therapy": "PHYSICAL_THERAPY",
  "Occupational Therapy": "OCCUPATIONAL_THERAPY",
  "Speech Therapy": "SPEECH_THERAPY",
};

const THERAPY_ORDER_FIELDS = {
  pt_eval_visits: "ptEvalVisits",
  pt_treatment_visits: "ptTreatmentVisits",
  ot_eval_visits: "otEvalVisits",
  ot_treatment_visits: "otTreatmentVisits",
  st_eval_visits: "stEvalVisits",
  st_treatment_visits: "stTreatmentVisits",
  evaluating_therapist_pt: "evaluatingTherapistPt",
  evaluating_therapist_ot: "evaluatingTherapistOt",
  evaluating_therapist_st: "evaluatingTherapistSt",
  treating_therapist_pt: "treatingTherapistPt",
  treating_therapist_ot: "treatingTherapistOt",
  treating_therapist_st: "treatingTherapistSt",
};

const EVALUATOR_FIELDS = {
  "Physical Therapy": "evaluating_therapist_pt",
  "Occupational Therapy": "evaluating_therapist_ot",
  "Speech Therapy": "evaluating_therapist_st",
};

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const optionalNumber = (value) => value === "" || value === null || value === undefined ? null : Number(value);

function referralClinicalData(data, current = {}) {
  const clinicalData = {
    ...current,
    ...Object.fromEntries(["address", "city", "state", "zip"]
      .filter((key) => hasOwn(data, key)).map((key) => [key, data[key] || null])),
    referralSource: data.referral_source || null,
    primaryDiagnosis: data.primary_diagnosis || data.diagnosis || null,
    diagnoses: data.diagnoses || current.diagnoses || [],
    therapyTypes: data.therapy_types || [],
    insurance: data.insurance || null,
    agency: data.agency || null,
    rateType: data.rate_type || current.rateType || "standard",
    specialRates: data.special_rates || current.specialRates || {},
    physicianName: data.physician_name || null,
    physicianPhone: data.physician_phone || null,
    authorizationNumber: data.authorization_number || null,
    authorizedVisits: optionalNumber(data.authorized_visits),
    certPeriodStart: data.cert_period_start || null,
    certPeriodEnd: data.cert_period_end || null,
    notes: data.notes || null,
    faceSheet: hasOwn(data, "face_sheet") ? (data.face_sheet || null) : (current.faceSheet || null),
  };

  for (const [wireKey, storedKey] of Object.entries(THERAPY_ORDER_FIELDS)) {
    if (hasOwn(data, wireKey)) {
      clinicalData[storedKey] = wireKey.includes("visits") ? optionalNumber(data[wireKey]) : (data[wireKey] || null);
    }
  }
  return clinicalData;
}

function therapyOrderWireData(clinicalData, patient) {
  const counts = patient?.visitCounts && typeof patient.visitCounts === "object" ? patient.visitCounts : {};
  const therapists = patient?.assignedTherapists && typeof patient.assignedTherapists === "object" ? patient.assignedTherapists : {};
  const patientFallback = {
    pt_eval_visits: counts.ptEval,
    pt_treatment_visits: counts.ptTreatment,
    ot_eval_visits: counts.otEval,
    ot_treatment_visits: counts.otTreatment,
    st_eval_visits: counts.stEval,
    st_treatment_visits: counts.stTreatment,
    evaluating_therapist_pt: therapists.evaluatingPt,
    evaluating_therapist_ot: therapists.evaluatingOt,
    evaluating_therapist_st: therapists.evaluatingSt,
    treating_therapist_pt: therapists.treatingPt,
    treating_therapist_ot: therapists.treatingOt,
    treating_therapist_st: therapists.treatingSt,
  };
  return Object.fromEntries(
    Object.entries(THERAPY_ORDER_FIELDS).map(([wireKey, storedKey]) => [
      wireKey,
      clinicalData[storedKey] ?? patientFallback[wireKey] ?? null,
    ]),
  );
}

async function syncLinkedPatient(tx, patientId, data) {
  if (!patientId) return;
  const patient = await tx.patient.findUnique({
    where: { id: patientId },
    select: { visitCounts: true, assignedTherapists: true },
  });
  if (!patient) return;

  const agency = data.agency
    ? await tx.agency.findFirst({
        where: { name: { equals: data.agency, mode: "insensitive" } },
        select: { id: true },
      })
    : null;
  const currentCounts = patient.visitCounts && typeof patient.visitCounts === "object" ? patient.visitCounts : {};
  const currentTherapists = patient.assignedTherapists && typeof patient.assignedTherapists === "object" ? patient.assignedTherapists : {};
  const visitCounts = {
    ...currentCounts,
    ...(hasOwn(data, "pt_eval_visits") && { ptEval: optionalNumber(data.pt_eval_visits) }),
    ...(hasOwn(data, "pt_treatment_visits") && { ptTreatment: optionalNumber(data.pt_treatment_visits) }),
    ...(hasOwn(data, "ot_eval_visits") && { otEval: optionalNumber(data.ot_eval_visits) }),
    ...(hasOwn(data, "ot_treatment_visits") && { otTreatment: optionalNumber(data.ot_treatment_visits) }),
    ...(hasOwn(data, "st_eval_visits") && { stEval: optionalNumber(data.st_eval_visits) }),
    ...(hasOwn(data, "st_treatment_visits") && { stTreatment: optionalNumber(data.st_treatment_visits) }),
  };
  const assignedTherapists = {
    ...currentTherapists,
    ...(hasOwn(data, "evaluating_therapist_pt") && { evaluatingPt: data.evaluating_therapist_pt || null }),
    ...(hasOwn(data, "treating_therapist_pt") && { treatingPt: data.treating_therapist_pt || null }),
    ...(hasOwn(data, "evaluating_therapist_ot") && { evaluatingOt: data.evaluating_therapist_ot || null }),
    ...(hasOwn(data, "treating_therapist_ot") && { treatingOt: data.treating_therapist_ot || null }),
    ...(hasOwn(data, "evaluating_therapist_st") && { evaluatingSt: data.evaluating_therapist_st || null }),
    ...(hasOwn(data, "treating_therapist_st") && { treatingSt: data.treating_therapist_st || null }),
  };

  await tx.patient.update({
    where: { id: patientId },
    data: {
      firstName: data.first_name,
      lastName: data.last_name,
      dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      agencyId: agency?.id,
      insurance: data.insurance || null,
      certPeriodStart: data.cert_period_start ? new Date(data.cert_period_start) : null,
      certPeriodEnd: data.cert_period_end ? new Date(data.cert_period_end) : null,
      authorizationNumber: data.authorization_number || null,
      authorizedVisits: optionalNumber(data.authorized_visits),
      therapyTypes: normalizeTherapyTypes(data.therapy_types)
        .map((type) => PATIENT_THERAPY_TYPE_ENUM[type])
        .filter(Boolean),
      visitCounts,
      assignedTherapists,
    },
  });
}

async function syncEvaluationAssignments(tx, data) {
  if (!data.patient_id) return;
  const therapyTypes = normalizeTherapyTypes(data.therapy_types);
  const agency = data.agency
    ? await tx.agency.findFirst({
        where: { name: { equals: data.agency, mode: "insensitive" } },
        select: { assistantsAllowed: true },
      })
    : null;
  for (const therapyType of therapyTypes) {
    const evaluatorName = data[EVALUATOR_FIELDS[therapyType]];
    if (!evaluatorName) continue;
    const discipline = DISCIPLINE_ENUM[therapyType];
    const therapist = await tx.therapist.findFirst({
      where: {
        fullName: { equals: evaluatorName, mode: "insensitive" },
        discipline,
        status: "ACTIVE",
      },
      select: { id: true, fullName: true, credentials: true, discipline: true, status: true },
    });
    if (!therapist) continue;
    const eligibilityError = therapistAssignmentError(
      therapist,
      therapyType,
      "evaluation",
      agency?.assistantsAllowed !== false,
    );
    if (eligibilityError) throw new Error(eligibilityError);

    const latest = await tx.referralAssignment.findFirst({
      where: { patientId: data.patient_id, therapyType: discipline, visitType: "EVALUATION" },
      orderBy: { createdAt: "desc" },
    });
    const historyEntry = {
      therapist_id: therapist.id,
      therapist_name: therapist.fullName,
      action: "assigned",
      date: new Date().toISOString(),
    };
    if (latest?.status === "PENDING") {
      if (latest.therapistId !== therapist.id) {
        const history = Array.isArray(latest.assignmentHistory) ? latest.assignmentHistory : [];
        await tx.referralAssignment.update({
          where: { id: latest.id },
          data: {
            therapistId: therapist.id,
            therapistName: therapist.fullName,
            agency: data.agency || null,
            recalledFrom: null,
            declinedBy: null,
            declinedReason: null,
            assignmentHistory: [...history, historyEntry],
          },
        });
      }
      continue;
    }
    if (latest && ["ACCEPTED", "SCHEDULED"].includes(latest.status)) continue;
    await tx.referralAssignment.create({
      data: {
        patientId: data.patient_id,
        patientName: `${data.first_name} ${data.last_name}`.trim(),
        therapistId: therapist.id,
        therapistName: therapist.fullName,
        therapyType: discipline,
        visitType: "EVALUATION",
        agency: data.agency || null,
        status: "PENDING",
        approvedWeeklyVisits: [],
        assignmentHistory: [historyEntry],
      },
    });
  }
}

function normalizeTherapyTypes(types) {
  if (!Array.isArray(types)) return [];
  return [...new Set(types.map(type => THERAPY_TYPE_DISPLAY[String(type).trim().toLowerCase()] || type))];
}

export async function getReferrals() {
  await requireAuth();

  const referrals = await prisma.referral.findMany({
    include: {
      patient: {
        select: {
          address: true,
          city: true,
          state: true,
          zip: true,
          authorizedVisits: true,
          authorizationNumber: true,
          certPeriodStart: true,
          certPeriodEnd: true,
          visitCounts: true,
          assignedTherapists: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return referrals.map(r => {
    const cd = r.clinicalData || {};
    return {
      id: r.id,
      first_name: r.firstName,
      last_name: r.lastName,
      date_of_birth: r.dateOfBirth,
      phone: r.phone,
      ...Object.fromEntries(["address", "city", "state", "zip"]
        .map((key) => [key, hasOwn(cd, key) ? cd[key] : r.patient?.[key] ?? null])),
      referral_date: r.referralDate,
      referral_source: cd.referralSource || null,
      primary_diagnosis: cd.primaryDiagnosis || null,
      diagnoses: cd.diagnoses || [],
      therapy_types: normalizeTherapyTypes(cd.therapyTypes),
      insurance: cd.insurance || null,
      agency: cd.agency || null,
      rate_type: cd.rateType || "standard",
      special_rates: cd.specialRates || {},
      physician_name: cd.physicianName || null,
      physician_phone: cd.physicianPhone || null,
      authorization_number: cd.authorizationNumber ?? r.patient?.authorizationNumber ?? null,
      authorized_visits: cd.authorizedVisits ?? r.patient?.authorizedVisits ?? null,
      cert_period_start: cd.certPeriodStart ?? r.patient?.certPeriodStart ?? null,
      cert_period_end: cd.certPeriodEnd ?? r.patient?.certPeriodEnd ?? null,
      notes: cd.notes || null,
      face_sheet: cd.faceSheet || null,
      ...therapyOrderWireData(cd, r.patient),
      source_type: r.sourceType?.toLowerCase(),
      patient_id: r.patientId,
      patient_action: r.patientAction?.toLowerCase(),
      created_at: r.createdAt,
    };
  });
}

function assignmentToSnakeCase(a) {
  const history = Array.isArray(a.assignmentHistory) ? a.assignmentHistory : [];
  const latestAssigned = [...history].reverse().find((entry) => entry?.action === "assigned" && entry?.date);
  return {
    id: a.id,
    patient_id: a.patientId,
    patient_name: a.patientName,
    therapist_id: a.therapistId,
    therapist_name: a.therapistName,
    supervising_therapist_id: a.supervisingTherapistId,
    supervising_therapist_name: a.supervisingTherapistName,
    therapy_type: DISCIPLINE_DISPLAY[a.therapyType] || a.therapyType,
    visit_type: a.visitType?.toLowerCase(),
    agency: a.agency,
    status: a.status?.toLowerCase(),
    eval_visit_note_id: a.evalVisitNoteId,
    approved_weekly_visits: a.approvedWeeklyVisits || [],
    assignment_history: history,
    assigned_at: latestAssigned?.date || (a.therapistId ? (a.updatedAt || a.createdAt) : null),
    declined_by: a.declinedBy,
    declined_reason: a.declinedReason,
    recalled_from: a.recalledFrom,
    created_at: a.createdAt,
  };
}

export async function getAssignments() {
  await requireAuth();

  const assignments = await prisma.referralAssignment.findMany({
    orderBy: { createdAt: "desc" },
  });

  return assignments.map(assignmentToSnakeCase);
}

export async function createAssignment(data) {
  const user = await requireRole("SUPERUSER", "ADMIN", "COORDINATOR");

  const therapist = data.therapist_id
    ? await prisma.therapist.findUnique({
        where: { id: data.therapist_id },
        select: { fullName: true, credentials: true, discipline: true, status: true },
      })
    : null;
  const agency = data.agency
    ? await prisma.agency.findFirst({
        where: { name: { equals: data.agency, mode: "insensitive" } },
        select: { assistantsAllowed: true },
      })
    : null;

  if (data.therapist_id && !therapist) {
    return { error: "Therapist not found" };
  }
  if (therapist) {
    const patient = await prisma.patient.findUnique({ where: { id: data.patient_id }, select: { insurance: true } });
    const payerRules = await findPayerRules(patient?.insurance);
    const eligibilityError = therapistAssignmentError(
      therapist,
      data.therapy_type,
      data.visit_type || "evaluation",
      agency?.assistantsAllowed !== false && payerRules?.assistantsNotAllowed !== true,
    );
    if (eligibilityError) return { error: eligibilityError };
  }

  const assignment = await prisma.referralAssignment.create({
    data: {
      patientId: data.patient_id,
      patientName: data.patient_name,
      therapistId: data.therapist_id || null,
      therapistName: therapist?.fullName || data.therapist_name || null,
      supervisingTherapistId: data.supervising_therapist_id || null,
      supervisingTherapistName: data.supervising_therapist_name || null,
      therapyType: DISCIPLINE_ENUM[data.therapy_type] || data.therapy_type,
      visitType: (data.visit_type || "evaluation").toUpperCase(),
      agency: data.agency || null,
      status: "PENDING",
      approvedWeeklyVisits: data.approved_weekly_visits || [],
      evalVisitNoteId: data.eval_visit_note_id || null,
      assignmentHistory: therapist ? [{
        therapist_id: data.therapist_id,
        therapist_name: therapist.fullName,
        action: "assigned",
        date: new Date().toISOString(),
      }] : [],
    },
  });

  const h = await headers();
  await logAudit({
    user,
    action: "CREATE",
    resourceType: "ReferralAssignment",
    resourceId: assignment.id,
    resourceLabel: `${data.patient_name} - ${data.therapy_type}`,
    details: `Assigned ${therapist?.fullName || "unassigned"} for ${data.visit_type}`,
    ipAddress: getClientIp(h),
  });

  return { success: true, id: assignment.id };
}

export async function updateAssignment(id, data) {
  const user = await requireRole("SUPERUSER", "ADMIN", "COORDINATOR", "THERAPIST");

  if (data.therapist_id) {
    const [assignment, therapist] = await Promise.all([
      prisma.referralAssignment.findUnique({
        where: { id },
        select: { therapyType: true, visitType: true, agency: true, assignmentHistory: true, patient: { select: { insurance: true } } },
      }),
      prisma.therapist.findUnique({
        where: { id: data.therapist_id },
        select: { fullName: true, credentials: true, discipline: true, status: true },
      }),
    ]);
    if (!assignment) return { error: "Assignment not found" };
    if (!therapist) return { error: "Therapist not found" };

    const agency = assignment.agency
      ? await prisma.agency.findFirst({
          where: { name: { equals: assignment.agency, mode: "insensitive" } },
          select: { assistantsAllowed: true },
        })
      : null;

    const payerRules = await findPayerRules(assignment.patient?.insurance);
    const eligibilityError = therapistAssignmentError(
      therapist,
      assignment.therapyType,
      assignment.visitType,
      agency?.assistantsAllowed !== false && payerRules?.assistantsNotAllowed !== true,
    );
    if (eligibilityError) return { error: eligibilityError };

    const history = Array.isArray(assignment.assignmentHistory) ? assignment.assignmentHistory : [];
    data = {
      ...data,
      therapist_name: therapist.fullName,
      assignment_history: [...history, {
        therapist_id: data.therapist_id,
        therapist_name: therapist.fullName,
        action: "assigned",
        date: new Date().toISOString(),
      }],
    };
  }

  const updateData = {};
  if (data.status !== undefined) updateData.status = data.status.toUpperCase();
  if (data.therapist_id !== undefined) updateData.therapistId = data.therapist_id;
  if (data.therapist_name !== undefined) updateData.therapistName = data.therapist_name;
  if (data.declined_by !== undefined) updateData.declinedBy = data.declined_by;
  if (data.declined_reason !== undefined) updateData.declinedReason = data.declined_reason;
  if (data.recalled_from !== undefined) updateData.recalledFrom = data.recalled_from;
  if (data.approved_weekly_visits !== undefined) updateData.approvedWeeklyVisits = data.approved_weekly_visits;
  if (data.assignment_history !== undefined) updateData.assignmentHistory = data.assignment_history;
  if (data.eval_visit_note_id !== undefined) updateData.evalVisitNoteId = data.eval_visit_note_id;

  await prisma.referralAssignment.update({ where: { id }, data: updateData });

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "ReferralAssignment",
    resourceId: id,
    details: `Updated assignment: ${JSON.stringify(data)}`,
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function scheduleAssignment(id, data) {
  const user = await requireRole("SUPERUSER", "ADMIN", "THERAPIST");

  const assignment = await prisma.referralAssignment.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          certPeriodStart: true,
          certPeriodEnd: true,
          agencyId: true,
        },
      },
      therapist: { select: { id: true, fullName: true } },
    },
  });

  if (!assignment) return { error: "Assignment not found" };
  if (!assignment.therapistId || !assignment.therapist) {
    return { error: "A therapist must be assigned before scheduling" };
  }
  if (user.userType === "THERAPIST" && user.therapistId !== assignment.therapistId) {
    return { error: "This patient is assigned to another therapist" };
  }

  const requestedDates = Array.isArray(data?.dates) ? data.dates : [];
  if (requestedDates.length === 0) return { error: "Select at least one visit date" };

  const dates = requestedDates.map((value) => {
    const dateText = typeof value === "string" ? value : value?.date;
    const visitType = typeof value === "string" ? assignment.visitType : (value?.visit_type || assignment.visitType);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText || "")) return null;
    return {
      dateText,
      date: new Date(`${dateText}T00:00:00.000Z`),
      visitType: String(visitType || "evaluation").toUpperCase(),
    };
  });
  if (dates.some((item) => !item || Number.isNaN(item.date.getTime()))) {
    return { error: "One or more visit dates are invalid" };
  }

  const certStart = assignment.patient.certPeriodStart;
  const certEnd = assignment.patient.certPeriodEnd;
  const outsideCertPeriod = dates.find(({ date }) =>
    (certStart && date < certStart) || (certEnd && date > certEnd)
  );
  if (outsideCertPeriod) {
    return { error: `${outsideCertPeriod.dateText} is outside the patient's certification period` };
  }

  const therapyType = {
    PT: "PHYSICAL_THERAPY",
    OT: "OCCUPATIONAL_THERAPY",
    ST: "SPEECH_THERAPY",
  }[assignment.therapyType];
  if (!therapyType) return { error: "Invalid therapy discipline" };
  const allowedVisitTypes = new Set([
    "EVALUATION", "TREATMENT", "RE_EVALUATION", "RECERTIFICATION",
    "DISCHARGE_WITH_VISIT", "DISCHARGE_WITHOUT_VISIT", "EVAL_REFUSED", "MISSED_VISIT",
  ]);
  if (dates.some(({ visitType }) => !allowedVisitTypes.has(visitType))) {
    return { error: "Invalid visit type" };
  }

  const result = await prisma.$transaction(async (tx) => {
    const noteIds = [];
    for (const { date, visitType } of dates) {
      const existing = await tx.visitNote.findFirst({
        where: {
          patientId: assignment.patientId,
          therapistId: assignment.therapistId,
          visitDate: date,
          therapyType,
          visitType,
        },
        select: { id: true },
      });
      if (existing) {
        noteIds.push(existing.id);
        continue;
      }
      const note = await tx.visitNote.create({
        data: {
          patientId: assignment.patientId,
          patientName: assignment.patientName,
          therapistId: assignment.therapistId,
          therapistName: assignment.therapist.fullName,
          visitDate: date,
          therapyType,
          visitType,
          agencyId: assignment.patient.agencyId,
          status: "SCHEDULED",
          cptCodes: [],
        },
        select: { id: true },
      });
      noteIds.push(note.id);
    }

    const evaluationIndex = dates.findIndex(({ visitType }) => visitType === "EVALUATION");
    await tx.referralAssignment.update({
      where: { id },
      data: {
        status: "SCHEDULED",
        ...(evaluationIndex >= 0 && { evalVisitNoteId: noteIds[evaluationIndex] }),
      },
    });
    return noteIds;
  });

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "ReferralAssignment",
    resourceId: id,
    resourceLabel: `${assignment.patientName} - ${assignment.therapyType}`,
    details: `Scheduled ${result.length} visit(s)`,
    ipAddress: getClientIp(h),
  });

  return { success: true, visit_note_ids: result };
}

export async function deleteAssignment(id) {
  const user = await requireRole("SUPERUSER", "ADMIN", "COORDINATOR");

  await prisma.referralAssignment.delete({ where: { id } });

  const h = await headers();
  await logAudit({
    user,
    action: "DELETE",
    resourceType: "ReferralAssignment",
    resourceId: id,
    details: "Deleted referral assignment",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function createReferral(data) {
  const user = await requireRole("SUPERUSER", "ADMIN", "COORDINATOR");

  if (!data.first_name?.trim() || !data.last_name?.trim()) {
    return { error: "First name and last name are required" };
  }
  if (!Array.isArray(data.therapy_types) || data.therapy_types.length === 0) {
    return { error: "Select at least one therapy type" };
  }
  if (!data.agency || !data.cert_period_start || !data.cert_period_end) {
    return { error: "Agency and certification period start/end dates are required" };
  }
  if (data.cert_period_end < data.cert_period_start) {
    return { error: "Certification period end date cannot be before the start date" };
  }

  const referral = await prisma.$transaction(async (tx) => {
    const created = await tx.referral.create({
      data: {
        firstName: data.first_name,
        lastName: data.last_name,
        dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : null,
        phone: data.phone || null,
        referralDate: data.referral_date ? new Date(data.referral_date) : null,
        sourceType: (data.source_type || "manual").toUpperCase(),
        patientId: data.patient_id || null,
        patientAction: data.patient_action ? data.patient_action.toUpperCase() : null,
        clinicalData: referralClinicalData(data),
      },
    });
    await syncLinkedPatient(tx, data.patient_id, data);
    await syncEvaluationAssignments(tx, data);
    return created;
  });

  const h = await headers();
  await logAudit({
    user,
    action: "CREATE",
    resourceType: "Referral",
    resourceId: referral.id,
    resourceLabel: `${data.first_name} ${data.last_name}`,
    details: `Referral logged via ${data.source_type || "manual"}`,
    ipAddress: getClientIp(h),
  });

  return { success: true, id: referral.id };
}

export async function updateReferral(id, data) {
  const user = await requireRole("SUPERUSER", "ADMIN", "COORDINATOR");

  if (!data.first_name?.trim() || !data.last_name?.trim()) {
    return { error: "First name and last name are required" };
  }
  if (!Array.isArray(data.therapy_types) || data.therapy_types.length === 0) {
    return { error: "Select at least one therapy type" };
  }
  if (!data.agency || !data.cert_period_start || !data.cert_period_end) {
    return { error: "Agency and certification period start/end dates are required" };
  }
  if (data.cert_period_end < data.cert_period_start) {
    return { error: "Certification period end date cannot be before the start date" };
  }

  const current = await prisma.referral.findUnique({ where: { id } });
  if (!current) return { error: "Referral not found" };
  const currentClinical = current.clinicalData || {};

  await prisma.$transaction(async (tx) => {
    await tx.referral.update({
      where: { id },
      data: {
        firstName: data.first_name,
        lastName: data.last_name,
        dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : null,
        phone: data.phone || null,
        referralDate: data.referral_date ? new Date(data.referral_date) : null,
        clinicalData: referralClinicalData(data, currentClinical),
      },
    });
    const patientId = current.patientId || data.patient_id;
    const syncData = { ...data, patient_id: patientId };
    await syncLinkedPatient(tx, patientId, syncData);
    await syncEvaluationAssignments(tx, syncData);
  });

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "Referral",
    resourceId: id,
    resourceLabel: `${data.first_name} ${data.last_name}`,
    details: "Updated referral intake record",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}
