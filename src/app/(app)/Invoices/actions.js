"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/audit/logger";
import { findPayerRules } from "@/lib/payer-rules";

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

function payerRateForVisit(visit, rules) {
  const discipline = { PHYSICAL_THERAPY: "PT", OCCUPATIONAL_THERAPY: "OT", SPEECH_THERAPY: "ST" }[visit.therapyType];
  const type = visit.visitType?.startsWith("DISCHARGE") ? "discharge" : visit.visitType?.toLowerCase();
  return rules?.specialRates?.[`${discipline}:${type}`] ?? null;
}

async function loadPayerRulesForVisits(visits) {
  const names = [...new Set(visits.map((visit) => visit.patient?.insurance).filter(Boolean))];
  return new Map(await Promise.all(names.map(async (name) => [name, await findPayerRules(name)])));
}

function orderInvoiceItems(items, order) {
  const key = {
    "Patient Last Name": (item) => item.patientName?.trim().split(/\s+/).at(-1),
    "Patient First Name": (item) => item.patientName?.trim().split(/\s+/)[0],
    "Visit Date": (item) => item.visitDate?.toISOString(),
    "Therapist Name": (item) => item.therapistName,
  }[order];
  return key ? [...items].sort((a, b) => String(key(a) ?? "").localeCompare(String(key(b) ?? ""))) : items;
}

export async function getInvoices() {
  await requireRole("SUPERUSER", "ADMIN");

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lineItems: true,
      agency: { select: { vitalSignsConfig: true } },
    },
  });

  return invoices.map((inv) => ({
    id: inv.id,
    invoice_number: inv.invoiceNumber,
    agency_id: inv.agencyId,
    agency_name: inv.agencyName,
    date_from: inv.dateFrom?.toISOString().split("T")[0],
    date_to: inv.dateTo?.toISOString().split("T")[0],
    total_amount: Number(inv.totalAmount),
    status: inv.status?.toLowerCase(),
    notes: inv.notes,
    check_details: inv.checkDetails,
    agency_preferences: inv.agency?.vitalSignsConfig?.agency_preferences,
    line_items: orderInvoiceItems(inv.lineItems, inv.agency?.vitalSignsConfig?.agency_preferences?.invoice_sort_order).map((li) => ({
      id: li.id,
      visit_note_id: li.visitNoteId,
      patient_name: li.patientName,
      visit_date: li.visitDate?.toISOString().split("T")[0],
      therapy_type: li.therapyType,
      visit_type: li.visitType,
      therapist_name: li.therapistName,
      rate: Number(li.rate),
      quantity: li.quantity,
      subtotal: Number(li.subtotal),
    })),
    created_at: inv.createdAt,
  }));
}

export async function getAgenciesForInvoice() {
  await requireAuth();

  const agencies = await prisma.agency.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      vitalSignsConfig: true,
      rates: {
        select: {
          therapyType: true,
          visitType: true,
          rate: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return agencies.map((a) => ({
    id: a.id,
    name: a.name,
    billing_schedule: a.vitalSignsConfig?.agency_preferences?.billing_schedule,
    status: "active",
    rates: a.rates.map((r) => ({
      therapy_type: THERAPY_DISPLAY[r.therapyType] || r.therapyType,
      visit_type: VISIT_TYPE_DISPLAY[r.visitType] || r.visitType?.toLowerCase(),
      rate: Number(r.rate),
    })),
  }));
}

export async function getCompletedVisitsForInvoice() {
  await requireRole("SUPERUSER", "ADMIN");

  const visits = await prisma.visitNote.findMany({
    where: {
      status: { in: ["COMPLETED", "SIGNED"] },
    },
    select: {
      id: true,
      patientName: true,
      therapistName: true,
      visitDate: true,
      therapyType: true,
      visitType: true,
      status: true,
      agencyId: true,
      specialPrice: true,
      nonBillable: true,
      patient: { select: { insurance: true, agencyId: true } },
    },
    orderBy: { visitDate: "desc" },
  });

  const rules = await loadPayerRulesForVisits(visits);
  return visits
    .filter((v) => !v.nonBillable)
    .map((v) => ({
      id: v.id,
      patient_name: v.patientName,
      therapist_name: v.therapistName,
      visit_date: v.visitDate?.toISOString().split("T")[0],
      therapy_type: THERAPY_DISPLAY[v.therapyType] || v.therapyType,
      visit_type: VISIT_TYPE_DISPLAY[v.visitType] || v.visitType?.toLowerCase() || null,
      status: v.status?.toLowerCase(),
      agency_id: v.agencyId ?? v.patient?.agencyId ?? null,
      special_price: v.specialPrice != null ? Number(v.specialPrice) : null,
      payer_rate: payerRateForVisit(v, rules.get(v.patient?.insurance)),
    }));
}

function generateInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${y}${m}${d}-${rand}`;
}

async function applyPayerRates(agencyId, requestedItems) {
  const visits = await prisma.visitNote.findMany({
    where: {
      id: { in: requestedItems.map((item) => item.visit_note_id) },
      OR: [{ agencyId }, { agencyId: null, patient: { agencyId } }],
    },
    select: { id: true, therapyType: true, visitType: true, patient: { select: { insurance: true } } },
  });
  const visitById = new Map(visits.map((visit) => [visit.id, visit]));
  const rulesByPayer = await loadPayerRulesForVisits(visits);
  return requestedItems.map((item) => {
    const visit = visitById.get(item.visit_note_id);
    if (!visit) throw new Error("Invoice visit does not belong to the selected agency");
    const override = payerRateForVisit(visit, rulesByPayer.get(visit.patient?.insurance));
    return override == null ? item : { ...item, rate: override, subtotal: Math.round(override * (item.quantity || 1) * 100) / 100 };
  });
}

export async function createInvoice(data) {
  const user = await requireRole("SUPERUSER", "ADMIN");
  const agency = await prisma.agency.findUnique({ where: { id: data.agency_id } });
  if (!agency) throw new Error("Agency not found");
  const invoiceNumber = data.invoice_number || generateInvoiceNumber();
  const lineItems = await applyPayerRates(agency.id, data.line_items || []);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      agencyId: data.agency_id,
      agencyName: agency.name,
      dateFrom: new Date(data.date_from),
      dateTo: new Date(data.date_to),
      totalAmount: lineItems.length ? Math.round(lineItems.reduce((sum, item) => sum + Number(item.subtotal ?? item.rate), 0) * 100) / 100 : data.total_amount,
      status: (data.status || "draft").toUpperCase(),
      notes: data.notes || null,
      lineItems: {
        create: lineItems.map((li) => ({
          visitNoteId: li.visit_note_id,
          patientName: li.patient_name,
          visitDate: new Date(li.visit_date),
          therapyType: li.therapy_type,
          visitType: li.visit_type || "treatment",
          therapistName: li.therapist_name,
          rate: li.rate,
          quantity: li.quantity || 1,
          subtotal: li.subtotal ?? li.rate,
        })),
      },
    },
  });

  const h = await headers();
  await logAudit({
    user,
    action: "CREATE",
    resourceType: "Invoice",
    resourceId: invoice.id,
    resourceLabel: invoiceNumber,
    details: `Invoice created for ${agency.name} ($${Number(invoice.totalAmount).toFixed(2)})`,
    ipAddress: getClientIp(h),
  });

  return { success: true, id: invoice.id };
}

export async function updateInvoice(id, data) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const updateData = {};

  if (data.status !== undefined) {
    updateData.status = data.status.toUpperCase();
  }
  if (data.total_amount !== undefined) {
    updateData.totalAmount = data.total_amount;
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes;
  }
  if (data.check_details !== undefined) {
    updateData.checkDetails = data.check_details;
  }

  if (data.line_items !== undefined) {
    const invoice = await prisma.invoice.findUnique({ where: { id }, select: { agencyId: true } });
    if (!invoice) throw new Error("Invoice not found");
    const lineItems = await applyPayerRates(invoice.agencyId, data.line_items);
    updateData.totalAmount = Math.round(lineItems.reduce((sum, item) => sum + Number(item.subtotal ?? item.rate), 0) * 100) / 100;
    updateData.lineItems = {
      deleteMany: {},
      create: lineItems.map((li) => ({
        visitNoteId: li.visit_note_id,
        patientName: li.patient_name,
        visitDate: new Date(li.visit_date),
        therapyType: li.therapy_type,
        visitType: li.visit_type || "treatment",
        therapistName: li.therapist_name,
        rate: li.rate,
        quantity: li.quantity || 1,
        subtotal: li.subtotal ?? li.rate,
      })),
    };
  }

  await prisma.invoice.update({ where: { id }, data: updateData });

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "Invoice",
    resourceId: id,
    details: `Invoice updated: ${Object.keys(updateData).join(", ")}`,
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function deleteInvoice(id) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new Error("Invoice not found");

  await prisma.invoice.delete({ where: { id } });

  const h = await headers();
  await logAudit({
    user,
    action: "DELETE",
    resourceType: "Invoice",
    resourceId: id,
    resourceLabel: invoice.invoiceNumber,
    details: `Deleted invoice ${invoice.invoiceNumber}`,
    ipAddress: getClientIp(h),
  });

  return { success: true };
}
