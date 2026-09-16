"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/audit/logger";
import { createTherapistSchema, updateTherapistSchema } from "@/lib/validations/therapist";

const upper = (v) => (typeof v === "string" ? v.toUpperCase() : v);

// Builds the object createTherapistSchema/updateTherapistSchema expect
// (camelCase, upper-case enums, short-code discipline) from the snake_case
// wire payload. Deliberately excludes `rates`: the schema models
// {peds:{eval,returnVisit,...}, geriatrics:{...}} with numeric leaves, but
// TherapistForm.jsx actually sends a `return_visit` key (not `returnVisit`)
// and can send "" for an empty rate cell instead of omitting it — neither
// survives the schema as written, so validating it would reject real,
// currently-working saves. Left unvalidated, same as before this change,
// until the schema is reconciled with the real shape.
function toValidationInput(data) {
  return {
    fullName: data.full_name,
    discipline: DISCIPLINE_MAP[data.discipline] || data.discipline,
    credentials: data.credentials,
    licenseNumber: data.license_number,
    email: data.email,
    phone: data.phone,
    hireDate: data.hire_date || undefined,
    annualReviewDate: data.annual_review_date || undefined,
    status: data.status ? upper(data.status) : undefined,
    facilities: data.facilities,
  };
}

function toSnakeCase(t) {
  return {
    id: t.id,
    full_name: t.fullName,
    discipline: t.discipline === "PT" ? "Physical Therapy"
      : t.discipline === "OT" ? "Occupational Therapy"
      : t.discipline === "ST" ? "Speech Therapy"
      : t.discipline,
    credentials: t.credentials,
    license_number: t.licenseNumber,
    email: t.email,
    phone: t.phone,
    hire_date: t.hireDate,
    annual_review_date: t.annualReviewDate,
    status: t.status?.toLowerCase(),
    facilities: t.facilities || [],
    rates: t.rates || {},
    personal_files: t.personalFiles || {},
    disciplinary_actions: t.disciplinaryActions || [],
    created_at: t.createdAt,
  };
}

const DISCIPLINE_MAP = {
  "Physical Therapy": "PT",
  "Occupational Therapy": "OT",
  "Speech Therapy": "ST",
};

export async function getTherapists() {
  await requireRole("SUPERUSER", "ADMIN", "COORDINATOR", "HR");

  const therapists = await prisma.therapist.findMany({
    orderBy: { fullName: "asc" },
  });

  return therapists.map(toSnakeCase);
}

export async function getTherapistById(id) {
  await requireRole("SUPERUSER", "ADMIN", "COORDINATOR", "HR");

  const therapist = await prisma.therapist.findUnique({ where: { id } });
  return therapist ? toSnakeCase(therapist) : null;
}

export async function createTherapist(data) {
  const user = await requireRole("SUPERUSER", "ADMIN", "HR");

  const parsed = createTherapistSchema.safeParse(toValidationInput(data));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const v = parsed.data;

  const therapist = await prisma.therapist.create({
    data: {
      fullName: v.fullName,
      discipline: v.discipline,
      credentials: v.credentials || null,
      licenseNumber: v.licenseNumber || null,
      email: v.email || null,
      phone: v.phone || null,
      hireDate: v.hireDate ?? null,
      annualReviewDate: v.annualReviewDate ?? null,
      status: v.status || "ACTIVE",
      facilities: v.facilities || [],
      rates: data.rates || null,
      personalFiles: data.personal_files || null,
      disciplinaryActions: data.disciplinary_actions || null,
    },
  });

  const h = await headers();
  await logAudit({
    user,
    action: "CREATE",
    resourceType: "Therapist",
    resourceId: therapist.id,
    resourceLabel: data.full_name,
    details: "Created therapist profile",
    ipAddress: getClientIp(h),
  });

  return { success: true, id: therapist.id };
}

export async function updateTherapist(id, data) {
  const user = await requireRole("SUPERUSER", "ADMIN", "HR");

  const parsed = updateTherapistSchema.safeParse(toValidationInput(data));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const v = parsed.data;

  const updateData = {};
  if (v.fullName !== undefined) updateData.fullName = v.fullName;
  if (v.discipline !== undefined) updateData.discipline = v.discipline;
  if (v.credentials !== undefined) updateData.credentials = v.credentials || null;
  if (v.licenseNumber !== undefined) updateData.licenseNumber = v.licenseNumber || null;
  if (v.email !== undefined) updateData.email = v.email || null;
  if (v.phone !== undefined) updateData.phone = v.phone || null;
  // Presence-checked against the raw payload: an <input type="date"> can be
  // cleared to "", which toValidationInput maps away to undefined (so it
  // passes z.coerce.date()), but that still means "explicitly clear this date".
  if (data.hire_date !== undefined) updateData.hireDate = v.hireDate ?? null;
  if (data.annual_review_date !== undefined) updateData.annualReviewDate = v.annualReviewDate ?? null;
  if (v.status !== undefined) updateData.status = v.status;
  if (v.facilities !== undefined) updateData.facilities = v.facilities;
  if (data.rates !== undefined) updateData.rates = data.rates;
  if (data.personal_files !== undefined) updateData.personalFiles = data.personal_files;
  if (data.disciplinary_actions !== undefined) updateData.disciplinaryActions = data.disciplinary_actions;

  await prisma.therapist.update({ where: { id }, data: updateData });

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "Therapist",
    resourceId: id,
    details: "Updated therapist profile",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function deleteTherapist(id) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const therapist = await prisma.therapist.findUnique({
    where: { id },
    select: { fullName: true },
  });

  await prisma.therapist.delete({ where: { id } });

  const h = await headers();
  await logAudit({
    user,
    action: "DELETE",
    resourceType: "Therapist",
    resourceId: id,
    resourceLabel: therapist?.fullName || id,
    details: "Deleted therapist profile",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}
