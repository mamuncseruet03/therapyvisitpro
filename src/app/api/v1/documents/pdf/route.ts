import { NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { createSimplePdf } from "@/lib/documents/pdf";

async function buildDocument(type: string, id: string) {
  if (type === "visit") {
    const note = await prisma.visitNote.findUnique({ where: { id } });
    if (!note) return null;
    return {
      filename: `visit-note-${id}.pdf`,
      buffer: await createSimplePdf(`Visit Note - ${note.patientName}`, [
        { label: "Patient", value: note.patientName },
        { label: "Therapist", value: note.therapistName },
        { label: "Visit Date", value: note.visitDate.toISOString().slice(0, 10) },
        { label: "Discipline", value: note.therapyType.replaceAll("_", " ") },
        { label: "Visit Type", value: note.visitType?.replaceAll("_", " ") },
        { label: "Status", value: note.status },
        { label: "Subjective", value: note.soapNotes && typeof note.soapNotes === "object" ? (note.soapNotes as Record<string, unknown>).subjective : null },
        { label: "Objective", value: note.soapNotes && typeof note.soapNotes === "object" ? (note.soapNotes as Record<string, unknown>).objective : null },
        { label: "Assessment", value: note.soapNotes && typeof note.soapNotes === "object" ? (note.soapNotes as Record<string, unknown>).assessment : null },
        { label: "Plan", value: note.soapNotes && typeof note.soapNotes === "object" ? (note.soapNotes as Record<string, unknown>).plan : null },
      ]),
    };
  }

  if (type === "invoice") {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return null;
    return {
      filename: `invoice-${invoice.invoiceNumber}.pdf`,
      buffer: await createSimplePdf(`Invoice ${invoice.invoiceNumber}`, [
        { label: "Agency", value: invoice.agencyName },
        { label: "Period", value: `${invoice.dateFrom.toISOString().slice(0, 10)} - ${invoice.dateTo.toISOString().slice(0, 10)}` },
        { label: "Total", value: `$${invoice.totalAmount}` },
        { label: "Status", value: invoice.status },
        { label: "Notes", value: invoice.notes },
      ]),
    };
  }

  if (type === "invoice-notes") {
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { lineItems: true } });
    if (!invoice) return null;
    return {
      filename: `visit-notes-${invoice.invoiceNumber}.pdf`,
      buffer: await createSimplePdf(`Visit Notes - ${invoice.invoiceNumber}`, invoice.lineItems.flatMap((item, index) => [
        { label: `Visit ${index + 1} Patient`, value: item.patientName },
        { label: "Date / Therapist", value: `${item.visitDate.toISOString().slice(0, 10)} / ${item.therapistName}` },
        { label: "Discipline / Type", value: `${item.therapyType} / ${item.visitType}` },
      ])),
    };
  }
  return null;
}

export async function GET(request: NextRequest) {
  await requireAuth();
  const type = request.nextUrl.searchParams.get("type") || "";
  const id = request.nextUrl.searchParams.get("id") || "";
  const result = await buildDocument(type, id);
  if (!result) return Response.json({ error: "Document not found" }, { status: 404 });
  return new Response(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
    },
  });
}

export async function POST(request: NextRequest) {
  await requireAuth();
  const { type, id, recipient, subject, message } = await request.json();
  if (!recipient || !subject) return Response.json({ error: "Recipient and subject are required" }, { status: 400 });
  const result = await buildDocument(type, id);
  if (!result) return Response.json({ error: "Document not found" }, { status: 404 });

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    return Response.json({ error: "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM." }, { status: 503 });
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT || 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  await transporter.sendMail({
    from: SMTP_FROM,
    to: recipient,
    subject,
    text: message || "Please find the requested PDF attached.",
    attachments: [{ filename: result.filename, content: result.buffer, contentType: "application/pdf" }],
  });
  return Response.json({ success: true });
}
