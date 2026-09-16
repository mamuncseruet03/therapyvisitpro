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

export async function getInvoices() {
  await requireAuth();

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lineItems: true,
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
    line_items: inv.lineItems.map((li) => ({
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
    status: "active",
    rates: a.rates.map((r) => ({
      therapy_type: THERAPY_DISPLAY[r.therapyType] || r.therapyType,
      visit_type: VISIT_TYPE_DISPLAY[r.visitType] || r.visitType?.toLowerCase(),
      rate: Number(r.rate),
    })),
  }));
}

export async function getCompletedVisitsForInvoice() {
  await requireAuth();

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
    },
    orderBy: { visitDate: "desc" },
  });

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
      agency_id: v.agencyId,
      special_price: v.specialPrice ? Number(v.specialPrice) : null,
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

export async function createInvoice(data) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const agency = await prisma.agency.findUnique({ where: { id: data.agency_id } });
  if (!agency) throw new Error("Agency not found");

  const invoiceNumber = data.invoice_number || generateInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      agencyId: data.agency_id,
      agencyName: agency.name,
      dateFrom: new Date(data.date_from),
      dateTo: new Date(data.date_to),
      totalAmount: data.total_amount,
      status: (data.status || "draft").toUpperCase(),
      notes: data.notes || null,
      lineItems: {
        create: (data.line_items || []).map((li) => ({
          visitNoteId: li.visit_note_id,
          patientName: li.patient_name,
          visitDate: new Date(li.visit_date),
          therapyType: li.therapy_type,
          visitType: li.visit_type || "treatment",
          therapistName: li.therapist_name,
          rate: li.rate,
          quantity: li.quantity || 1,
          subtotal: li.subtotal || li.rate,
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
    details: `Invoice created for ${agency.name} ($${data.total_amount})`,
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
    await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
    await prisma.invoiceLineItem.createMany({
      data: data.line_items.map((li) => ({
        invoiceId: id,
        visitNoteId: li.visit_note_id,
        patientName: li.patient_name,
        visitDate: new Date(li.visit_date),
        therapyType: li.therapy_type,
        visitType: li.visit_type || "treatment",
        therapistName: li.therapist_name,
        rate: li.rate,
        quantity: li.quantity || 1,
        subtotal: li.subtotal || li.rate,
      })),
    });
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
