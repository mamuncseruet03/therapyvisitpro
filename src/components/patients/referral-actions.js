"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/audit/logger";

export async function getReferrals() {
  await requireAuth();

  const referrals = await prisma.referral.findMany({
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
      referral_date: r.referralDate,
      referral_source: cd.referralSource || null,
      primary_diagnosis: cd.primaryDiagnosis || null,
      diagnoses: cd.diagnoses || [],
      therapy_types: cd.therapyTypes || [],
      insurance: cd.insurance || null,
      agency: cd.agency || null,
      rate_type: cd.rateType || "standard",
      special_rates: cd.specialRates || {},
      physician_name: cd.physicianName || null,
      physician_phone: cd.physicianPhone || null,
      authorization_number: cd.authorizationNumber || null,
      authorized_visits: cd.authorizedVisits || null,
      cert_period_start: cd.certPeriodStart || null,
      cert_period_end: cd.certPeriodEnd || null,
      notes: cd.notes || null,
      source_type: r.sourceType?.toLowerCase(),
      patient_id: r.patientId,
      patient_action: r.patientAction?.toLowerCase(),
      created_at: r.createdAt,
    };
  });
}

const DISCIPLINE_DISPLAY = { PT: "Physical Therapy", OT: "Occupational Therapy", ST: "Speech Therapy" };
const DISCIPLINE_ENUM = { "Physical Therapy": "PT", "Occupational Therapy": "OT", "Speech Therapy": "ST" };

function assignmentToSnakeCase(a) {
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
    assignment_history: a.assignmentHistory || [],
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
    ? await prisma.therapist.findUnique({ where: { id: data.therapist_id }, select: { fullName: true } })
    : null;

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

  const referral = await prisma.referral.create({
    data: {
      firstName: data.first_name,
      lastName: data.last_name,
      dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : null,
      phone: data.phone || null,
      referralDate: data.referral_date ? new Date(data.referral_date) : null,
      sourceType: (data.source_type || "manual").toUpperCase(),
      patientId: data.patient_id || null,
      patientAction: data.patient_action ? data.patient_action.toUpperCase() : null,
      clinicalData: {
        referralSource: data.referral_source || null,
        primaryDiagnosis: data.primary_diagnosis || null,
        diagnoses: data.diagnoses || [],
        therapyTypes: data.therapy_types || [],
        insurance: data.insurance || null,
        agency: data.agency || null,
        rateType: data.rate_type || "standard",
        specialRates: data.special_rates || {},
        physicianName: data.physician_name || null,
        physicianPhone: data.physician_phone || null,
        authorizationNumber: data.authorization_number || null,
        authorizedVisits: data.authorized_visits || null,
        certPeriodStart: data.cert_period_start || null,
        certPeriodEnd: data.cert_period_end || null,
        notes: data.notes || null,
      },
    },
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
