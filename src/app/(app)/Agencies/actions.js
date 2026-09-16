"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/audit/logger";
import { createAgencySchema, updateAgencySchema } from "@/lib/validations/agency";

const upper = (v) => (typeof v === "string" ? v.toUpperCase() : v);

// Builds the object createAgencySchema/updateAgencySchema expect (camelCase,
// upper-case enums) from the snake_case wire payload. Deliberately excludes
// `rates`: createAgency/updateAgency below never persist it (agency rates
// aren't wired up in this action file at all), so validating it would just
// mask that gap rather than fix it. Contact rows with a blank name are
// filtered out before validation, matching the filter already applied at
// persist time (the "Add Contact" UI adds a blank row before it's filled in).
// `supervisoryVisitFrequency` is left out when falsy/absent since the schema
// requires a positive int — the UI sends an explicit `null` to clear it, which
// updateAgency below handles separately against the raw payload.
function toValidationInput(data) {
  return {
    name: data.name,
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip,
    phone: data.phone,
    fax: data.fax,
    email: data.email,
    documentMode: data.document_mode ? upper(data.document_mode) : undefined,
    assistantsAllowed: data.assistants_allowed,
    supervisoryVisitFrequency: data.supervisory_visit_frequency || undefined,
    workWeekStartDay: data.work_week_start_day,
    requiredVisitDocuments: data.required_visit_documents,
    notes: data.notes,
    status: data.status ? upper(data.status) : undefined,
    contacts: Array.isArray(data.contacts)
      ? data.contacts
          .filter((c) => c.name?.trim())
          .map((c) => ({
            name: c.name,
            title: c.title,
            phone: c.phone,
            email: c.email,
          }))
      : undefined,
  };
}

function toSnakeCase(a) {
  return {
    id: a.id,
    name: a.name,
    address: a.address,
    city: a.city,
    state: a.state,
    zip: a.zip,
    phone: a.phone,
    fax: a.fax,
    email: a.email,
    document_mode: a.documentMode?.toLowerCase(),
    assistants_allowed: a.assistantsAllowed,
    supervisory_visit_frequency: a.supervisoryVisitFrequency,
    work_week_start_day: a.workWeekStartDay,
    documentation_setup: a.documentationSetup,
    required_visit_documents: a.requiredVisitDocuments || [],
    agency_documents: a.agencyDocuments,
    notes: a.notes,
    status: a.status?.toLowerCase(),
    contacts: (a.contacts || []).map(c => ({
      id: c.id,
      name: c.name,
      title: c.title,
      phone: c.phone,
      email: c.email,
    })),
    rates: (a.rates || []).map(r => ({
      id: r.id,
      therapy_type: r.therapyType,
      visit_type: r.visitType,
      rate: parseFloat(r.rate),
    })),
    created_at: a.createdAt,
  };
}

export async function getAgencies() {
  await requireRole("SUPERUSER", "ADMIN", "COORDINATOR");

  const agencies = await prisma.agency.findMany({
    include: {
      contacts: true,
      rates: true,
    },
    orderBy: { name: "asc" },
  });

  return agencies.map(toSnakeCase);
}

export async function getAgencyById(id) {
  await requireRole("SUPERUSER", "ADMIN", "COORDINATOR");

  const agency = await prisma.agency.findUnique({
    where: { id },
    include: { contacts: true, rates: true },
  });

  return agency ? toSnakeCase(agency) : null;
}

export async function createAgency(data) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const parsed = createAgencySchema.safeParse(toValidationInput(data));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const v = parsed.data;

  const agency = await prisma.agency.create({
    data: {
      name: v.name,
      address: v.address || null,
      city: v.city || null,
      state: v.state || null,
      zip: v.zip || null,
      phone: v.phone || null,
      fax: v.fax || null,
      email: v.email || null,
      notes: v.notes || null,
      status: v.status || "ACTIVE",
      documentMode: v.documentMode || "THERADOCS",
      assistantsAllowed: v.assistantsAllowed !== false,
      supervisoryVisitFrequency: v.supervisoryVisitFrequency || null,
      contacts: v.contacts?.length ? {
        create: v.contacts.map(c => ({
          name: c.name,
          title: c.title || null,
          phone: c.phone || null,
          email: c.email || null,
        })),
      } : undefined,
    },
  });

  const h = await headers();
  await logAudit({
    user,
    action: "CREATE",
    resourceType: "Agency",
    resourceId: agency.id,
    resourceLabel: data.name,
    details: "Created agency",
    ipAddress: getClientIp(h),
  });

  return { success: true, id: agency.id };
}

export async function updateAgency(id, data) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const parsed = updateAgencySchema.safeParse(toValidationInput(data));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const v = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (data.contacts) {
      await tx.agencyContact.deleteMany({ where: { agencyId: id } });
    }

    const updateData = {};
    if (v.name !== undefined) updateData.name = v.name;
    if (v.address !== undefined) updateData.address = v.address || null;
    if (v.city !== undefined) updateData.city = v.city || null;
    if (v.state !== undefined) updateData.state = v.state || null;
    if (v.zip !== undefined) updateData.zip = v.zip || null;
    if (v.phone !== undefined) updateData.phone = v.phone || null;
    if (v.fax !== undefined) updateData.fax = v.fax || null;
    if (v.email !== undefined) updateData.email = v.email || null;
    if (v.notes !== undefined) updateData.notes = v.notes || null;
    if (v.status !== undefined) updateData.status = v.status;
    if (v.documentMode !== undefined) updateData.documentMode = v.documentMode;
    if (v.assistantsAllowed !== undefined) updateData.assistantsAllowed = v.assistantsAllowed;
    // Presence-checked against the raw payload (not `v`) because the UI sends an
    // explicit `null` to clear this field, and the schema's min(1) constraint
    // means a falsy value never survives into `v` — see toValidationInput above.
    if (data.supervisory_visit_frequency !== undefined) {
      updateData.supervisoryVisitFrequency = v.supervisoryVisitFrequency ?? null;
    }
    if (data.documentation_setup !== undefined) updateData.documentationSetup = data.documentation_setup;
    if (v.requiredVisitDocuments !== undefined) updateData.requiredVisitDocuments = v.requiredVisitDocuments;
    if (v.workWeekStartDay !== undefined) updateData.workWeekStartDay = v.workWeekStartDay;

    if (v.contacts?.length) {
      updateData.contacts = {
        create: v.contacts.map(c => ({
          name: c.name,
          title: c.title || null,
          phone: c.phone || null,
          email: c.email || null,
        })),
      };
    }

    await tx.agency.update({ where: { id }, data: updateData });
  });

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "Agency",
    resourceId: id,
    details: "Updated agency",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function deleteAgency(id) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const agency = await prisma.agency.findUnique({
    where: { id },
    select: { name: true },
  });

  await prisma.agency.delete({ where: { id } });

  const h = await headers();
  await logAudit({
    user,
    action: "DELETE",
    resourceType: "Agency",
    resourceId: id,
    resourceLabel: agency?.name || id,
    details: "Deleted agency",
    ipAddress: getClientIp(h),
  });

  return { success: true };
}
