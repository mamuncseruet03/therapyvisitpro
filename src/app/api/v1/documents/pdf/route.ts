import { NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { existsSync } from "fs";
import { join } from "path";
import { createSimplePdf, createVisitNotePdf, type PdfField } from "@/lib/documents/pdf";

const TECHNICAL_FIELDS = new Set([
  "id", "patient_id", "therapist_id", "patient_name", "therapist_name",
  "status", "created_at", "updated_at", "documents", "pdf_template_url",
  "filled_pdf_url", "therapist_signature", "patient_signature",
]);

function humanize(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "" || value === false) return false;
  if (Array.isArray(value)) return value.some(hasValue);
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).some(hasValue);
  return true;
}

function printableValue(value: unknown) {
  if (typeof value === "string" && value.startsWith("data:image/")) return "Captured";
  if (typeof value === "string" && /^https?:\/\//.test(value)) return "Attached";
  if (value === true) return "Yes";
  return value;
}

function formatUsDate(value: Date | null | undefined) {
  if (!value) return null;
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${month}/${day}/${value.getUTCFullYear()}`;
}

function primaryPhysician(value: unknown) {
  if (!Array.isArray(value) || !value.length || typeof value[0] !== "object" || value[0] === null) return null;
  const physician = value[0] as Record<string, unknown>;
  return {
    name: physician.name || physician.physician_name || physician.full_name || null,
    phone: physician.phone || physician.physician_phone || null,
  };
}

function flattenFilledFields(
  data: unknown,
  fields: PdfField[],
  prefix = "",
) {
  if (!data || typeof data !== "object") return;

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (TECHNICAL_FIELDS.has(key) || !hasValue(value)) continue;
    const label = prefix ? `${prefix} — ${humanize(key)}` : humanize(key);

    if (Array.isArray(value)) {
      if (value.every((item) => typeof item !== "object" || item === null)) {
        fields.push({ label, value: value.map(printableValue).join(", ") });
      } else {
        value.forEach((item, index) => {
          if (typeof item === "object" && item !== null) {
            flattenFilledFields(item, fields, `${label} ${index + 1}`);
          } else if (hasValue(item)) {
            fields.push({ label: `${label} ${index + 1}`, value: printableValue(item) });
          }
        });
      }
    } else if (typeof value === "object") {
      flattenFilledFields(value, fields, label);
    } else {
      fields.push({ label, value: printableValue(value) });
    }
  }
}

function addSection(fields: PdfField[], title: string, data: unknown) {
  const sectionFields: PdfField[] = [];
  flattenFilledFields(data, sectionFields);
  if (sectionFields.length > 0) {
    fields.push({ label: title, section: true }, ...sectionFields);
  }
}

function snapshotSection(key: string) {
  if (/^(vitals|vas_|pain_)/.test(key)) return "Vitals";
  if (["medical_history", "past_surgical_history", "subjective", "prior_function", "living_environment", "homebound_reasons", "homebound_other", "therapy_objective_patient_goals", "precautions", "medication_changes"].includes(key)) return "Subjective";
  if (/^(rom_|strength_|other_findings|slp_objective)/.test(key)) return "Objective";
  if (/^(adl_|iadl_|slp_adl)/.test(key)) return "Activities of Daily Living";
  if (/^(mobility_|ambulation_|weight_bearing|balance_|stair|sensory_|cognitive_|prosthetic_)/.test(key)) return "Mobility";
  if (["assessment", "standardized_testing", "standardized_tests", "medical_complexity"].includes(key)) return "Assessment";
  if (/^(eval_treatment_goals|goals_|interventions|plan|skilled_service|care_coordination|therapy_orders)/.test(key)) return "Goals and Plan";
  if (/^(dc_plan|patient_education)/.test(key)) return "Discharge Plan and Education";
  if (/^(discharge|nomnc|oasis|soc_oasis|roc_oasis)/.test(key)) return "Discharge";
  if (/^(therapist_signature|patient_signature|cpt_codes|library_documents|agency_documents|additional_uploads)/.test(key)) return "Signatures";
  if (["visit_date", "therapy_type", "visit_type", "agency", "time_in", "time_out", "duration_minutes", "medical_diagnoses", "treatment_diagnoses", "patient_identification", "non_billable", "special_price", "punch_in_reason", "punch_out_reason"].includes(key)) return "Intake";
  return "Additional Documentation";
}

function addSnapshotSections(fields: PdfField[], snapshot: Record<string, unknown>) {
  const order = ["Vitals", "Subjective", "Objective", "Activities of Daily Living", "Mobility", "Assessment", "Goals and Plan", "Discharge Plan and Education", "Discharge", "Additional Documentation"];
  const grouped: Record<string, Record<string, unknown>> = {};
  const intakeExtras: Record<string, unknown> = {};
  const displayedIntakeKeys = new Set(["visit_date", "therapy_type", "visit_type", "agency", "time_in", "time_out", "duration_minutes"]);
  for (const [key, value] of Object.entries(snapshot)) {
    const section = snapshotSection(key);
    if (TECHNICAL_FIELDS.has(key) || section === "Signatures") continue;
    if (section === "Intake") {
      if (!displayedIntakeKeys.has(key)) intakeExtras[key] = value;
      continue;
    }
    grouped[section] ||= {};
    grouped[section][key] = value;
  }
  flattenFilledFields(intakeExtras, fields);
  for (const section of order) addSection(fields, section, grouped[section]);
}

async function buildDocument(type: string, id: string) {
  if (type === "visit") {
    const note = await prisma.visitNote.findUnique({
      where: { id },
      include: { patient: { include: { diagnoses: true, agency: true } } },
    });
    if (!note) return null;
    const documents = note.documents && typeof note.documents === "object" && !Array.isArray(note.documents)
      ? note.documents as Record<string, unknown>
      : {};
    const snapshot = documents.formSnapshot && typeof documents.formSnapshot === "object"
      ? documents.formSnapshot as Record<string, unknown>
      : {};
    const physician = primaryPhysician(note.patient?.physicians);

    const fields: PdfField[] = [
      { label: "Intake", section: true },
      { label: "Patient Information", subheading: true },
      { label: "Patient", value: note.patientName },
      { label: "Date of Birth", value: formatUsDate(note.patient?.dateOfBirth) },
      { label: "Phone", value: note.patient?.phone },
      { label: "Address", value: [note.patient?.address, note.patient?.city, note.patient?.state, note.patient?.zip].filter(Boolean).join(", ") },
      { label: "Insurance", value: note.patient?.insurance },
      { label: "Agency", value: note.patient?.agency?.name || snapshot.agency },
      { label: "Auth #", value: note.patient?.authorizationNumber },
      { label: "Cert Period", value: note.patient?.certPeriodStart && note.patient?.certPeriodEnd ? `${formatUsDate(note.patient.certPeriodStart)} to ${formatUsDate(note.patient.certPeriodEnd)}` : null },
      { label: "Referring Physician", value: physician?.name || snapshot.physician_name || snapshot.referring_physician },
      { label: "Physician Phone", value: physician?.phone || snapshot.physician_phone },
      { label: "Diagnoses", value: note.patient?.diagnoses?.map((diagnosis) => `• ${diagnosis.diagnosis}${diagnosis.icd10Code ? ` (${diagnosis.icd10Code})` : ""}`).join("\n") },
      { label: "Visit Information", subheading: true },
      { label: "Therapist", value: note.therapistName },
      { label: "Date", value: formatUsDate(note.visitDate) },
      { label: "Punch In", value: snapshot.time_in || "N/A" },
      { label: "Punch Out", value: snapshot.time_out || "N/A" },
      { label: "Therapy", value: humanize(note.therapyType.toLowerCase()) },
      { label: "Visit Type", value: note.visitType?.toLowerCase().replaceAll("_", " ") },
      { label: "Duration", value: note.durationMinutes ? `${note.durationMinutes} minutes` : null },
    ];

    if (Object.keys(snapshot).length > 0) {
      addSnapshotSections(fields, snapshot);
    } else {
      addSection(fields, "Vitals", note.vitals);
      addSection(fields, "Pain Assessment", note.painAssessment);
      addSection(fields, "Subjective", note.subjectiveData);
      addSection(fields, "Objective", note.objectiveData);
      addSection(fields, "Mobility", note.mobilityData);
      addSection(fields, "Activities of Daily Living", note.adlData);
      addSection(fields, "SOAP Note", note.soapNotes);
      addSection(fields, "Assessment", note.assessmentData);
      addSection(fields, "Goals and Plan", note.goalsPlan);
      addSection(fields, "Therapy Orders", note.therapyOrders);
      addSection(fields, "Discharge Plan and Education", note.dcPlanEducation);
      addSection(fields, "Re-evaluation", note.reevalData);
      addSection(fields, "Discharge", note.dischargeData);
      addSection(fields, "NOMNC", note.nomncData);
      addSection(fields, "OASIS", note.oasisData);
      addSection(fields, "PTA Supervision", note.ptaSupervision);
      addSection(fields, "Missed Visit", note.missedVisitData);
    }

    if (note.visitType?.toLowerCase().includes("discharge") && !fields.some((field) => field.section && field.label === "Discharge")) {
      fields.push({ label: "Discharge", section: true });
    }

    const therapistSignature = snapshot.therapist_signature;
    const patientSignature = snapshot.patient_signature;
    if (typeof therapistSignature === "string" || typeof patientSignature === "string") {
      fields.push({ label: "Signatures", section: true });
      if (typeof therapistSignature === "string") {
        fields.push({ label: "Therapist Signature", imageDataUrl: therapistSignature });
      }
      if (snapshot.therapist_signature_timestamp) {
        fields.push({ label: "Therapist Signed At", value: snapshot.therapist_signature_timestamp });
      }
      if (typeof patientSignature === "string") {
        fields.push({ label: "Patient Signature", imageDataUrl: patientSignature });
      }
      if (snapshot.patient_signature_timestamp) {
        fields.push({ label: "Patient Signed At", value: snapshot.patient_signature_timestamp });
      }
    }

    const companyInfo = await prisma.companyInfo.findFirst();
    const configuredLogoPath = companyInfo?.logoUrl?.startsWith("/")
      ? join(process.cwd(), "public", companyInfo.logoUrl)
      : null;
    const defaultLogoPath = join(process.cwd(), "public", "apex-rehab-logo.png");
    const logoPath = configuredLogoPath && existsSync(configuredLogoPath)
      ? configuredLogoPath
      : existsSync(defaultLogoPath) ? defaultLogoPath : null;

    return {
      filename: `visit-note-${id}.pdf`,
      buffer: await createVisitNotePdf(`Visit Note - ${note.patientName}`, fields, {
        companyName: companyInfo?.companyName || "TherapyDocs",
        subtitle: `${humanize(note.therapyType.toLowerCase())} - ${humanize(note.visitType?.toLowerCase() || "visit")}`,
        patientName: note.patientName,
        generatedDate: new Date().toLocaleDateString("en-US"),
        logoPath,
      }),
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
