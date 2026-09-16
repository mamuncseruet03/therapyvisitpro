"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/audit/logger";
import { createPatientSchema, updatePatientSchema } from "@/lib/validations/patient";

const upper = (v) => (typeof v === "string" ? v.toUpperCase() : v);

// Builds the object createPatientSchema/updatePatientSchema expect (camelCase,
// upper-case enums) from the snake_case wire payload. Deliberately excludes
// `physicians`: the schema models {primary:{name,phone}, referring:{name,phone}}
// but the data actually persisted/read (see toSnakeCase below) is flat
// ({primaryName, primaryPhone, referringName, referringPhone}) — the schema
// doesn't match the real shape, so validating it would either reject valid
// input or require changing the persisted JSON shape. Left unvalidated,
// same as before this change, until that's reconciled on its own.
function toValidationInput(data) {
  return {
    firstName: data.first_name,
    lastName: data.last_name,
    dateOfBirth: data.date_of_birth || undefined,
    sex: upper(data.sex),
    ssnEncrypted: data.ssn,
    medicareNumber: data.medicare_number,
    phone: data.phone,
    email: data.email,
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip,
    agencyId: data.agency_id,
    insurance: data.insurance,
    coordinatorEmail: data.coordinator_email,
    certPeriodStart: data.cert_period_start || undefined,
    certPeriodEnd: data.cert_period_end || undefined,
    authorizationNumber: data.authorization_number,
    authorizedVisits:
      data.authorized_visits !== undefined && data.authorized_visits !== null && data.authorized_visits !== ""
        ? Number(data.authorized_visits)
        : undefined,
    therapyTypes: Array.isArray(data.therapy_types) ? data.therapy_types.map(upper) : undefined,
    notes: data.notes,
    status: upper(data.status),
    responsibleParty:
      data.responsible_party_name || data.responsible_party_phone
        ? {
            name: data.responsible_party_name,
            phone: data.responsible_party_phone,
            relationship: data.responsible_party_relationship,
          }
        : undefined,
  };
}

function toSnakeCase(p) {
  const rp = p.responsibleParty || {};
  const ph = p.physicians || {};
  const at = p.assignedTherapists || {};
  const vc = p.visitCounts || {};

  return {
    id: p.id,
    first_name: p.firstName,
    last_name: p.lastName,
    date_of_birth: p.dateOfBirth,
    sex: p.sex?.toLowerCase(),
    ssn: p.ssnEncrypted || null,
    medicare_number: p.medicareNumber,
    phone: p.phone,
    email: p.email,
    address: p.address,
    city: p.city,
    state: p.state,
    zip: p.zip,
    agency_id: p.agencyId,
    agency: p.agency?.name || null,
    agency_name: p.agency?.name || null,
    insurance: p.insurance,
    coordinator_email: p.coordinatorEmail,
    cert_period_start: p.certPeriodStart,
    cert_period_end: p.certPeriodEnd,
    authorization_number: p.authorizationNumber,
    authorized_visits: p.authorizedVisits,
    therapy_types: (p.therapyTypes || []).map(t => t.toLowerCase()),
    notes: p.notes,
    status: p.status?.toLowerCase(),
    responsible_party_name: rp.name || null,
    responsible_party_phone: rp.phone || null,
    responsible_party_relationship: rp.relationship || null,
    primary_physician: ph.primaryName || null,
    primary_physician_phone: ph.primaryPhone || null,
    referring_physician: ph.referringName || null,
    referring_physician_phone: ph.referringPhone || null,
    evaluating_therapist_pt: at.evaluatingPt || null,
    treating_therapist_pt: at.treatingPt || null,
    evaluating_therapist_ot: at.evaluatingOt || null,
    treating_therapist_ot: at.treatingOt || null,
    evaluating_therapist_st: at.evaluatingSt || null,
    treating_therapist_st: at.treatingSt || null,
    pt_eval_visits: vc.ptEval || null,
    pt_treatment_visits: vc.ptTreatment || null,
    ot_eval_visits: vc.otEval || null,
    ot_treatment_visits: vc.otTreatment || null,
    st_eval_visits: vc.stEval || null,
    st_treatment_visits: vc.stTreatment || null,
    diagnoses: p.diagnoses?.map(d => ({
      id: d.id,
      diagnosis: d.diagnosis,
      icd10_code: d.icd10Code,
      is_primary: d.isPrimary,
    })),
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export async function getPatients() {
  await requireAuth();

  const patients = await prisma.patient.findMany({
    include: {
      agency: { select: { name: true } },
      diagnoses: { orderBy: { isPrimary: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return patients.map(toSnakeCase);
}

export async function getPatientById(id) {
  await requireAuth();

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      agency: { select: { id: true, name: true } },
      diagnoses: { orderBy: { isPrimary: "desc" } },
    },
  });

  return patient ? toSnakeCase(patient) : null;
}

export async function getAgenciesForSelect() {
  return prisma.agency.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createPatient(data) {
  const user = await requireRole("SUPERUSER", "ADMIN", "COORDINATOR");

  const parsed = createPatientSchema.safeParse(toValidationInput(data));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const v = parsed.data;

  const patient = await prisma.patient.create({
    data: {
      firstName: v.firstName,
      lastName: v.lastName,
      dateOfBirth: v.dateOfBirth ?? null,
      sex: v.sex ?? null,
      medicareNumber: v.medicareNumber ?? null,
      phone: v.phone ?? null,
      email: v.email ?? null,
      address: v.address ?? null,
      city: v.city ?? null,
      state: v.state ?? null,
      zip: v.zip ?? null,
      agencyId: v.agencyId ?? null,
      insurance: v.insurance ?? null,
      coordinatorEmail: v.coordinatorEmail ?? null,
      certPeriodStart: v.certPeriodStart ?? null,
      certPeriodEnd: v.certPeriodEnd ?? null,
      authorizationNumber: v.authorizationNumber ?? null,
      authorizedVisits: v.authorizedVisits ?? null,
      therapyTypes: v.therapyTypes ?? [],
      notes: v.notes ?? null,
      status: v.status ?? "ACTIVE",
      responsibleParty: v.responsibleParty ?? null,
      physicians: (data.primary_physician || data.referring_physician) ? {
        primaryName: data.primary_physician || null,
        primaryPhone: data.primary_physician_phone || null,
        referringName: data.referring_physician || null,
        referringPhone: data.referring_physician_phone || null,
      } : null,
      assignedTherapists: {
        evaluatingPt: data.evaluating_therapist_pt || null,
        treatingPt: data.treating_therapist_pt || null,
        evaluatingOt: data.evaluating_therapist_ot || null,
        treatingOt: data.treating_therapist_ot || null,
        evaluatingSt: data.evaluating_therapist_st || null,
        treatingSt: data.treating_therapist_st || null,
      },
      visitCounts: {
        ptEval: data.pt_eval_visits || null,
        ptTreatment: data.pt_treatment_visits || null,
        otEval: data.ot_eval_visits || null,
        otTreatment: data.ot_treatment_visits || null,
        stEval: data.st_eval_visits || null,
        stTreatment: data.st_treatment_visits || null,
      },
      diagnoses: data.diagnoses?.length ? {
        create: data.diagnoses
          .filter(d => d.diagnosis?.trim())
          .map((d, i) => ({
            diagnosis: d.diagnosis,
            icd10Code: d.icd10_code || null,
            isPrimary: i === 0,
          })),
      } : undefined,
    },
  });

  const h = await headers();
  await logAudit({
    user,
    action: "CREATE",
    resourceType: "Patient",
    resourceId: patient.id,
    resourceLabel: `${data.first_name} ${data.last_name}`,
    details: "Created patient record",
    ipAddress: getClientIp(h),
  });

  return { success: true, id: patient.id };
}

export async function updatePatient(id, data) {
  const user = await requireRole("SUPERUSER", "ADMIN", "COORDINATOR");

  const parsed = updatePatientSchema.safeParse(toValidationInput(data));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const v = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (data.diagnoses) {
      await tx.patientDiagnosis.deleteMany({ where: { patientId: id } });
    }

    const updateData = {};
    if (v.firstName !== undefined) updateData.firstName = v.firstName;
    if (v.lastName !== undefined) updateData.lastName = v.lastName;
    if (v.dateOfBirth !== undefined) updateData.dateOfBirth = v.dateOfBirth ?? null;
    if (v.sex !== undefined) updateData.sex = v.sex ?? null;
    if (v.medicareNumber !== undefined) updateData.medicareNumber = v.medicareNumber ?? null;
    if (v.phone !== undefined) updateData.phone = v.phone ?? null;
    if (v.email !== undefined) updateData.email = v.email ?? null;
    if (v.address !== undefined) updateData.address = v.address ?? null;
    if (v.city !== undefined) updateData.city = v.city ?? null;
    if (v.state !== undefined) updateData.state = v.state ?? null;
    if (v.zip !== undefined) updateData.zip = v.zip ?? null;
    if (v.agencyId !== undefined) updateData.agencyId = v.agencyId ?? null;
    if (v.insurance !== undefined) updateData.insurance = v.insurance ?? null;
    if (v.status !== undefined) updateData.status = v.status;
    if (v.therapyTypes !== undefined) updateData.therapyTypes = v.therapyTypes;
    if (v.notes !== undefined) updateData.notes = v.notes ?? null;
    if (v.responsibleParty !== undefined) updateData.responsibleParty = v.responsibleParty;
    if (data.primary_physician !== undefined || data.referring_physician !== undefined) {
      updateData.physicians = {
        primaryName: data.primary_physician || null,
        primaryPhone: data.primary_physician_phone || null,
        referringName: data.referring_physician || null,
        referringPhone: data.referring_physician_phone || null,
      };
    }
    if (data.evaluating_therapist_pt !== undefined || data.treating_therapist_pt !== undefined) {
      updateData.assignedTherapists = {
        evaluatingPt: data.evaluating_therapist_pt || null,
        treatingPt: data.treating_therapist_pt || null,
        evaluatingOt: data.evaluating_therapist_ot || null,
        treatingOt: data.treating_therapist_ot || null,
        evaluatingSt: data.evaluating_therapist_st || null,
        treatingSt: data.treating_therapist_st || null,
      };
    }
    if (data.pt_eval_visits !== undefined || data.ot_eval_visits !== undefined || data.st_eval_visits !== undefined) {
      updateData.visitCounts = {
        ptEval: data.pt_eval_visits || null,
        ptTreatment: data.pt_treatment_visits || null,
        otEval: data.ot_eval_visits || null,
        otTreatment: data.ot_treatment_visits || null,
        stEval: data.st_eval_visits || null,
        stTreatment: data.st_treatment_visits || null,
      };
    }

    if (data.diagnoses?.length) {
      updateData.diagnoses = {
        create: data.diagnoses
          .filter(d => d.diagnosis?.trim())
          .map((d, i) => ({
            diagnosis: d.diagnosis,
            icd10Code: d.icd10_code || null,
            isPrimary: i === 0,
          })),
      };
    }

    await tx.patient.update({ where: { id }, data: updateData });
  });

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "Patient",
    resourceId: id,
    details: "Updated patient record",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function deletePatient(id) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const patient = await prisma.patient.findUnique({
    where: { id },
    select: { firstName: true, lastName: true },
  });

  await prisma.patient.delete({ where: { id } });

  const h = await headers();
  await logAudit({
    user,
    action: "DELETE",
    resourceType: "Patient",
    resourceId: id,
    resourceLabel: patient ? `${patient.firstName} ${patient.lastName}` : id,
    details: "Deleted patient record",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}
