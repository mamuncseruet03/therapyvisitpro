import { selectedIdentifierLabels } from "@/lib/visit-identification";
import { NextRequest } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { existsSync } from "fs";
import { join } from "path";
import { createInvoicePdf, invoiceMoney } from "@/lib/documents/invoice-pdf";
import { createVisitNotesPdf, type PdfField, type VisitPdfContent } from "@/lib/documents/pdf";

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

function calculateVisitDuration(timeIn: unknown, timeOut: unknown, storedDuration: number | null | undefined) {
  if (typeof timeIn === "string" && typeof timeOut === "string") {
    const parseMinutes = (value: string) => {
      const match = value.match(/^(\d{1,2}):(\d{2})/);
      if (!match) return null;
      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
        ? hours * 60 + minutes
        : null;
    };
    const start = parseMinutes(timeIn);
    const end = parseMinutes(timeOut);
    if (start !== null && end !== null) {
      const elapsed = end >= start ? end - start : (24 * 60 - start) + end;
      if (elapsed >= 0) return elapsed;
    }
  }
  return storedDuration !== null && storedDuration !== undefined && storedDuration >= 0 ? storedDuration : null;
}

function patientIdentificationSummary(value: unknown) {
  return selectedIdentifierLabels(value).join(", ") || null;
}

function formatSignatureTimestamp(value: unknown) {
  if (typeof value !== "string") return value;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return value;
  const [, year, month, day, rawHour, minute, second] = match;
  const hour = Number(rawHour);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${month}/${day}/${year}, ${String(displayHour).padStart(2, "0")}:${minute}:${second} ${suffix} EST`;
}

function primaryPhysician(value: unknown) {
  const physician = Array.isArray(value)
    ? value[0]
    : value && typeof value === "object" ? value : null;
  if (!physician || typeof physician !== "object") return null;
  const record = physician as Record<string, unknown>;
  return {
    name: record.name || record.physician_name || record.full_name || record.primaryName || record.referringName || null,
    phone: record.phone || record.physician_phone || record.primaryPhone || record.referringPhone || null,
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

function readableClinicalValue(value: unknown) {
  if (typeof value !== "string") return value;
  return value.includes("_") ? humanize(value) : value;
}

function buildAssessmentFields(data: Record<string, unknown>): PdfField[] {
  const fields: PdfField[] = [];
  const assessment = data.assessment;
  const assessmentRecord = assessment && typeof assessment === "object" && !Array.isArray(assessment)
    ? assessment as Record<string, unknown>
    : {};
  const narrative = typeof assessment === "string"
    ? assessment
    : assessmentRecord.clinical_impression_prognosis
      ?? assessmentRecord.clinical_impression
      ?? assessmentRecord.narrative
      ?? assessmentRecord.assessment;

  const riskLabels: Record<string, string> = {
    weakness_pain: "Weakness / pain",
    age_over_65: "Age over 65",
    confusion: "Confusion",
    impaired_judgment: "Impaired judgment",
    unable_to_ambulate: "Unable to ambulate",
    incontinence_urgency: "Incontinence / urgency",
    improper_assistive_device: "Improper use of assistive device",
    history_of_falls: "History of falls",
    dizziness_vertigo: "Dizziness / vertigo",
    medication_risk: "Medication-related risk",
    prosthesis_orthotics: "Prosthesis / orthotics",
  };
  const riskRecord = data.risk_factors && typeof data.risk_factors === "object" && !Array.isArray(data.risk_factors)
    ? data.risk_factors as Record<string, unknown>
    : {};
  const riskFactors = Object.entries(riskRecord)
    .filter(([, value]) => value === true || String(value).toLowerCase() === "yes")
    .map(([key]) => riskLabels[key] || humanize(key));

  if (hasValue(narrative) || riskFactors.length) {
    fields.push({
      label: "Clinical Impression & Prognosis",
      layout: "assessment-summary",
      data: { narrative, riskFactors },
    });
  }

  const standardizedTests = Array.isArray(data.standardized_tests)
    ? data.standardized_tests
    : Array.isArray(data.standardized_testing)
      ? data.standardized_testing
      : [];
  if (standardizedTests.some(hasValue)) {
    fields.push({ label: "Standardized Testing", layout: "standardized-tests", data: standardizedTests });
  }

  const balance = data.balance_assessment && typeof data.balance_assessment === "object" && !Array.isArray(data.balance_assessment)
    ? data.balance_assessment as Record<string, unknown>
    : data.balance && typeof data.balance === "object" && !Array.isArray(data.balance)
      ? data.balance as Record<string, unknown>
      : {};
  const balanceRows: Array<[string, unknown]> = [
    ["Sitting Static", balance.sitting_static], ["Sitting Dynamic", balance.sitting_dynamic],
    ["Standing Static", balance.standing_static], ["Standing Dynamic", balance.standing_dynamic],
  ];
  if (balanceRows.some(([, value]) => hasValue(value))) {
    fields.push({ label: "Balance Assessment", subheading: true });
    balanceRows.filter(([, value]) => hasValue(value)).forEach(([label, value]) => fields.push({ label, value: readableClinicalValue(value) }));
  }

  const remaining: Record<string, unknown> = {};
  const handled = new Set(["assessment", "risk_factors", "standardized_tests", "standardized_testing", "balance", "balance_assessment"]);
  Object.entries(data).forEach(([key, value]) => {
    if (!handled.has(key)) remaining[key] = value;
  });
  flattenFilledFields(remaining, fields);
  return fields;
}

function buildMobilityFields(data: Record<string, unknown>): PdfField[] {
  const fields: PdfField[] = [];
  const addGroup = (title: string, rows: Array<[string, unknown]>) => {
    const filled = rows.filter(([, value]) => hasValue(value));
    if (!filled.length) return;
    fields.push({ label: title, section: true });
    filled.forEach(([label, value]) => fields.push({ label, value: readableClinicalValue(value) }));
  };
  const objectValue = (key: string) => data[key] && typeof data[key] === "object" && !Array.isArray(data[key])
    ? data[key] as Record<string, unknown>
    : {};
  const bed = objectValue("mobility_bed");
  const transfers = objectValue("mobility_transfers");
  const wheelchair = objectValue("wheelchair_management");
  const wheelchairSelections = Array.isArray(data.wheelchair_management) ? data.wheelchair_management : [];
  const weightBearing = objectValue("weight_bearing");
  const ambulation = objectValue("ambulation");
  const firstValue = (record: Record<string, unknown>, ...keys: string[]) =>
    keys.map((key) => record[key]).find((value) => value !== undefined && value !== null && value !== "");

  addGroup("Bed Mobility", [
    ["Rolling Right", firstValue(bed, "Rolling Right", "rolling_right")], ["Rolling Left", firstValue(bed, "Rolling Left", "rolling_left")],
    ["Supine to Sit", firstValue(bed, "Supine to Sit", "supine_to_sit")], ["Sit to Supine", firstValue(bed, "Sit to Supine", "sit_to_supine")],
  ]);
  addGroup("Transfers", [
    ["Sit to Stand", firstValue(transfers, "Sit to Stand", "sit_to_stand")], ["Stand to Sit", firstValue(transfers, "Stand to Sit", "stand_to_sit")],
    ["Bed to Chair", firstValue(transfers, "Bed to Chair", "bed_to_chair")], ["Chair to Bed", firstValue(transfers, "Chair to Bed", "chair_to_bed")],
    ["Toilet Transfer", firstValue(transfers, "Toilet Transfer", "toilet_transfer")], ["Tub/Shower Transfer", firstValue(transfers, "Tub/Shower Transfer", "tub_shower_transfer")],
  ]);
  addGroup("Wheelchair Management", [
    ["Selected", wheelchairSelections.length ? wheelchairSelections : null],
    ["Level Surface", firstValue(wheelchair, "Level Surface", "level_surface")],
    ["Uneven Surface", firstValue(wheelchair, "Uneven Surface", "uneven_surface")],
    ["Brakes / Arms / Leg Rests", firstValue(wheelchair, "Management Brakes/Arms/Leg Rests", "Management Brakes / Arms / Leg Rests", "management")],
  ]);
  addGroup("Ambulation", [
    ["Assistance", data.ambulation_level ?? ambulation.assistance], ["Device", data.ambulation_device ?? ambulation.device],
    ["Distance", data.ambulation_distance ?? ambulation.distance], ["Surfaces", data.ambulation_surfaces ?? data.ambulation_surface],
    ["Weight Bearing Status", data.ambulation_weight_bearing_status], ["Gait Deviations", data.gait_deviations],
    ["Gait Evaluation Notes", data.gait_evaluation_notes],
  ]);
  addGroup("Weight Bearing", [
    ["Right LE", weightBearing.right_le], ["Left LE", weightBearing.left_le],
    ["Right UE", weightBearing.right_ue], ["Left UE", weightBearing.left_ue],
    ["Notes", data.weight_bearing_notes],
  ]);
  const ambulationNotes = data.ambulation_notes ?? ambulation.notes;
  if (hasValue(ambulationNotes)) fields.push({ label: "Ambulation Notes", value: ambulationNotes });
  addGroup("Stairs / Steps", [
    ["Not Applicable", data.stairs_not_applicable], ["Stair Negotiation", data.stair_negotiation],
    ["Steps at Home", data.stairs_at_home], ["Stair Notes", data.stair_notes],
  ]);
  if (hasValue(data.mobility_notes)) fields.push({ label: "General Mobility Notes", value: data.mobility_notes });

  const remaining: Record<string, unknown> = {};
  const handled = new Set([
    "mobility_bed", "mobility_transfers", "wheelchair_management", "ambulation_level", "ambulation_device", "ambulation_distance",
    "ambulation_surface", "ambulation_surfaces", "ambulation_weight_bearing_status", "gait_deviations", "gait_evaluation_notes",
    "weight_bearing", "weight_bearing_notes", "ambulation", "ambulation_notes", "stairs_not_applicable",
    "stair_negotiation", "stairs_at_home", "stair_notes", "mobility_notes",
  ]);
  Object.entries(data).forEach(([key, value]) => { if (!handled.has(key)) remaining[key] = value; });
  flattenFilledFields(remaining, fields);
  return fields;
}

function addTherapyOrdersSection(fields: PdfField[], data: unknown, includeSection = true) {
  if (!data || typeof data !== "object") return;
  const orders = data as Record<string, unknown>;
  const weeklyVisits = Array.isArray(orders.weekly_visits)
    ? orders.weekly_visits.filter((week): week is Record<string, unknown> => !!week && typeof week === "object")
    : [];
  const evalOnly = orders.eval_only === true;
  if (!evalOnly && weeklyVisits.length === 0 && !hasValue(orders.frequency)) return;

  if (includeSection) fields.push({ label: "Therapy Orders and Frequency", section: true });
  else fields.push({ label: "Therapy Orders", subheading: true });
  fields.push({ label: "Order Type", value: evalOnly ? "Evaluation only - no treatment visits ordered" : "Evaluation followed by treatment visits" });
  if (evalOnly) {
    if (hasValue(orders.eval_only_reason)) fields.push({ label: "Evaluation Only Reason", value: orders.eval_only_reason });
    return;
  }

  const visitCounts = weeklyVisits
    .map((week) => Number(week.visits))
    .filter((visits) => Number.isFinite(visits));
  const configuredFrequency = Number(orders.frequency);
  let frequencySummary = "Not specified";
  if (visitCounts.length > 0) {
    const uniqueCounts = [...new Set(visitCounts)];
    if (uniqueCounts.length === 1) {
      frequencySummary = `${uniqueCounts[0]} visit${uniqueCounts[0] === 1 ? "" : "s"} per week`;
    } else {
      const ranges: Array<{ start: number; end: number; visits: number }> = [];
      visitCounts.forEach((visits, index) => {
        const previous = ranges[ranges.length - 1];
        if (previous?.visits === visits) previous.end = index + 1;
        else ranges.push({ start: index + 1, end: index + 1, visits });
      });
      frequencySummary = ranges.map((range) => {
        const weeks = range.start === range.end ? `Week ${range.start}` : `Weeks ${range.start}-${range.end}`;
        return `${weeks}: ${range.visits} visit${range.visits === 1 ? "" : "s"}/week`;
      }).join("; ");
    }
  } else if (Number.isFinite(configuredFrequency) && configuredFrequency >= 0) {
    frequencySummary = `${configuredFrequency} visit${configuredFrequency === 1 ? "" : "s"} per week`;
  }
  fields.push({ label: "Ordered Frequency", value: frequencySummary });
  if (visitCounts.length > 0) {
    fields.push({ label: "Total Ordered Visits", value: visitCounts.reduce((total, visits) => total + visits, 0) });
    fields.push({ label: "Weekly Schedule", subheading: true });
    weeklyVisits.forEach((week, index) => {
      const label = String(week.week_label || `Week ${index + 1}`);
      const dateRange = [week.week_start, week.week_end].filter(Boolean).join(" to ");
      const visits = Number(week.visits || 0);
      fields.push({
        label: dateRange ? `${label} (${dateRange})` : label,
        value: `${visits} visit${visits === 1 ? "" : "s"}`,
        fullWidth: true,
      });
    });
  }
}

function snapshotSection(key: string) {
  if (key === "vitals") return "Vitals";
  if (/^(vas_|pain_)/.test(key)) return "Pain Assessment";
  if (["medical_history", "past_surgical_history", "subjective", "prior_function", "living_environment", "equipment_dme_home", "caregiver_support", "fall_history", "falls_last_3_months", "homebound_reasons", "homebound_other", "therapy_objective_patient_goals", "precautions", "medication_changes"].includes(key)) return "Subjective";
  if (/^rom_/.test(key)) return "Range of Motion";
  if (/^(strength_|other_findings|slp_objective|mental_status)/.test(key)) return "Objective";
  if (/^(adl_|iadl_|slp_adl)/.test(key) || ["condition_notes", "functional_status_notes"].includes(key)) return "Activities of Daily Living";
  if (/^(balance_)/.test(key) || key === "balance") return "Assessment";
  if (/^(mobility_|wheelchair_|ambulation_|weight_bearing|stair|sensory_|cognitive_|prosthetic_)/.test(key) || ["ambulation", "weight_bearing"].includes(key)) return "Mobility";
  if (["assessment", "standardized_testing", "standardized_tests", "medical_complexity", "risk_factors"].includes(key)) return "Assessment";
  if (key === "treatment_rendered") return "Treatment Rendered";
  if (key === "slp_swallow") return "Swallow Function";
  if (/^(follow_up_goals|eval_treatment_goals|goals_|interventions|plan|skilled_service|care_coordination|therapy_orders|precipitating_events|new_clinical_changes|why_skilled_therapy_needed_now)/.test(key)) return "Goals and Plan";
  if (/^(dc_plan|patient_education)/.test(key)) return "Discharge Plan and Education";
  if (/^(discharge|nomnc|oasis|soc_oasis|roc_oasis)/.test(key)) return "Discharge";
  if (/^(therapist_signature|patient_signature|cpt_codes|library_documents|agency_documents|additional_uploads)/.test(key)) return "Signatures";
  if (["visit_date", "therapy_type", "visit_type", "agency", "time_in", "time_out", "punch_out_date", "duration_minutes", "medical_diagnoses", "treatment_diagnoses", "patient_identification", "non_billable", "special_price", "punch_in_reason", "punch_out_reason"].includes(key)) return "Intake";
  return "Additional Documentation";
}

function addSnapshotSections(fields: PdfField[], snapshot: Record<string, unknown>) {
  const order = ["Vitals", "Pain Assessment", "Subjective", "Objective", "Range of Motion", "Activities of Daily Living", "Mobility", "Swallow Function", "Assessment", "Treatment Rendered", "Goals and Plan", "Discharge", "Additional Documentation", "Discharge Plan and Education"];
  const grouped: Record<string, Record<string, unknown>> = {};
  const intakeExtras: Record<string, unknown> = {};
  const displayedIntakeKeys = new Set(["visit_date", "therapy_type", "visit_type", "agency", "time_in", "time_out", "duration_minutes", "patient_identification", "patient_id_method"]);
  const structuredSnapshotKeys = new Set([
    "subjective_data", "objective_data", "mobility_data", "adl_data", "soap_notes", "assessment_data",
    "goals_plan", "time_tracking", "visit_diagnoses", "signatures", "documents",
    "other_findings", "dc_plan", "patient_education",
  ]);
  for (const [key, value] of Object.entries(snapshot)) {
    if (key === "therapy_orders") continue;
    if (structuredSnapshotKeys.has(key)) continue;
    if (["eval_treatment_goals", "medical_complexity", "adl_grid", "rom_evaluation", "strength_evaluation"].includes(key)) continue;
    const section = snapshotSection(key);
    if (TECHNICAL_FIELDS.has(key) || section === "Signatures") continue;
    if (section === "Intake") {
      if (!displayedIntakeKeys.has(key)) intakeExtras[key] = value;
      continue;
    }
    grouped[section] ||= {};
    if (key === "vitals" && value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(grouped[section], value);
    } else if (key === "pain_sites" && Array.isArray(value)) {
      value.forEach((site, index) => {
        if (!site || typeof site !== "object") return;
        const number = index + 2;
        grouped[section][`site_${number}_location`] = site.location;
        grouped[section][`site_${number}_vas_score`] = site.score;
      });
    } else {
      grouped[section][key] = value;
    }
  }
  flattenFilledFields(intakeExtras, fields);
  for (const section of order) {
    const sectionFields: PdfField[] = [];
    if (section === "Mobility") sectionFields.push(...buildMobilityFields(grouped[section] || {}));
    else if (section === "Assessment") sectionFields.push(...buildAssessmentFields(grouped[section] || {}));
    else flattenFilledFields(grouped[section], sectionFields);
    if (section === "Activities of Daily Living" && snapshot.adl_grid && typeof snapshot.adl_grid === "object" && hasValue(snapshot.adl_grid)) {
      sectionFields.unshift({ label: "ADL Functional Status", layout: "adl-grid", data: snapshot.adl_grid });
    }
    if (section === "Objective") {
      const objectiveLayouts: PdfField[] = [];
      if (snapshot.strength_evaluation && typeof snapshot.strength_evaluation === "object") objectiveLayouts.push({ label: "Strength Evaluation", layout: "strength-grid", data: snapshot.strength_evaluation });
      if (snapshot.other_findings && typeof snapshot.other_findings === "object" && hasValue(snapshot.other_findings)) objectiveLayouts.push({ label: "Other Findings", layout: "other-findings", data: snapshot.other_findings });
      sectionFields.unshift(...objectiveLayouts);
    }
    if (section === "Range of Motion" && snapshot.rom_evaluation && typeof snapshot.rom_evaluation === "object" && hasValue(snapshot.rom_evaluation)) {
      sectionFields.unshift({ label: "Range of Motion", layout: "rom-grid", data: snapshot.rom_evaluation });
    }
    if (section === "Assessment" && snapshot.medical_complexity && typeof snapshot.medical_complexity === "object") {
      const complexity = snapshot.medical_complexity as Record<string, unknown>;
      if (hasValue(complexity.level)) sectionFields.push({ label: "Evaluation Complexity Level", value: humanize(String(complexity.level)), layout: "complexity" });
    }
    if (section === "Goals and Plan" && Array.isArray(snapshot.eval_treatment_goals)) {
      const goals = snapshot.eval_treatment_goals.flatMap((goal, index): PdfField[] =>
        goal && typeof goal === "object" && hasValue(goal)
          ? [{ label: `Goal ${index + 1}`, layout: "goal", data: goal }]
          : []
      );
      sectionFields.unshift(...goals);
    }
    if (section === "Discharge Plan and Education" && (hasValue(snapshot.dc_plan) || hasValue(snapshot.patient_education))) {
      sectionFields.unshift({
        label: "Discharge Plan and Education",
        layout: "discharge-plan",
        data: { dcPlan: snapshot.dc_plan, education: snapshot.patient_education },
      });
    }
    const hasOrders = section === "Goals and Plan" && hasValue(snapshot.therapy_orders);
    if (sectionFields.length || hasOrders) {
      if (section === "Mobility") fields.push(...sectionFields);
      else fields.push({ label: section, section: true }, ...sectionFields);
      if (hasOrders) addTherapyOrdersSection(fields, snapshot.therapy_orders, false);
    }
  }
}

function hasSnapshotSection(snapshot: Record<string, unknown>, section: string) {
  return Object.entries(snapshot).some(([key, value]) =>
    key !== "therapy_orders" && !TECHNICAL_FIELDS.has(key) && snapshotSection(key) === section && hasValue(value)
  );
}

const visitPdfInclude = { patient: { include: { diagnoses: true, agency: true } } } satisfies Prisma.VisitNoteInclude;
type VisitPdfNote = Prisma.VisitNoteGetPayload<{ include: typeof visitPdfInclude }>;

async function visitPdfBranding() {
  const companyInfo = await prisma.companyInfo.findFirst();
  const configuredLogoPath = companyInfo?.logoUrl?.startsWith("/")
    ? join(process.cwd(), "public", companyInfo.logoUrl)
    : null;
  const defaultLogoPath = join(process.cwd(), "public", "apex-rehab-logo.png");
  const logoPath = configuredLogoPath && existsSync(configuredLogoPath)
    ? configuredLogoPath
    : existsSync(defaultLogoPath) ? defaultLogoPath : null;
  return {
    companyName: companyInfo?.companyName || "TherapyDocs",
    generatedDate: new Date().toLocaleDateString("en-US"),
    logoPath,
  };
}

function visitPdfContent(note: VisitPdfNote, branding: Awaited<ReturnType<typeof visitPdfBranding>>): VisitPdfContent {
  const documents = note.documents && typeof note.documents === "object" && !Array.isArray(note.documents)
    ? note.documents as Record<string, unknown>
    : {};
  const snapshot = documents.formSnapshot && typeof documents.formSnapshot === "object"
    ? documents.formSnapshot as Record<string, unknown>
    : {};
  const physician = primaryPhysician(note.patient?.physicians);
  const storedTimeTracking = note.timeTracking && typeof note.timeTracking === "object" && !Array.isArray(note.timeTracking)
    ? note.timeTracking as Record<string, unknown>
    : {};
  const timeIn = snapshot.time_in || storedTimeTracking.timeIn || storedTimeTracking.time_in || null;
  const timeOut = snapshot.time_out || storedTimeTracking.timeOut || storedTimeTracking.time_out || null;
  const durationMinutes = calculateVisitDuration(timeIn, timeOut, note.durationMinutes);
  const identifiedBy = patientIdentificationSummary(snapshot.patient_identification || snapshot.patient_id_method || note.patientIdMethod);

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
    { label: "Punch In", value: timeIn || "N/A" },
    { label: "Punch Out", value: timeOut || "N/A" },
    { label: "Punch Out Date", value: snapshot.punch_out_date || formatUsDate(note.visitDate) },
    { label: "Therapy", value: humanize(note.therapyType.toLowerCase()) },
    { label: "Visit Type", value: note.visitType?.toLowerCase().replaceAll("_", " ") },
    { label: "Patient Identified By", value: identifiedBy },
    { label: "Duration", value: durationMinutes !== null ? `${durationMinutes} minutes` : null },
  ];

  if (Object.keys(snapshot).length > 0) {
    addSnapshotSections(fields, snapshot);
    // Older notes may contain only a partial form snapshot. Fill missing
    // evaluation sections from the normalized clinical JSON columns.
    if (!hasSnapshotSection(snapshot, "Vitals")) {
      addSection(fields, "Vitals", note.vitals);
      addSection(fields, "Pain Assessment", note.painAssessment);
    }
    if (!hasSnapshotSection(snapshot, "Subjective")) addSection(fields, "Subjective", note.subjectiveData);
    if (!hasSnapshotSection(snapshot, "Objective")) {
      const objectiveData = note.objectiveData && typeof note.objectiveData === "object" && !Array.isArray(note.objectiveData)
        ? note.objectiveData as Record<string, unknown>
        : {};
      const { romEvaluation: _romEvaluation, ...objectiveWithoutRom } = objectiveData;
      addSection(fields, "Objective", objectiveWithoutRom);
    }
    if (!hasSnapshotSection(snapshot, "Range of Motion")) {
      const objectiveData = note.objectiveData && typeof note.objectiveData === "object" && !Array.isArray(note.objectiveData)
        ? note.objectiveData as Record<string, unknown>
        : {};
      if (hasValue(objectiveData.romEvaluation)) {
        fields.push(
          { label: "Range of Motion", section: true },
          { label: "Range of Motion", layout: "rom-grid", data: objectiveData.romEvaluation },
        );
      }
    }
    if (!hasSnapshotSection(snapshot, "Mobility")) addSection(fields, "Mobility", note.mobilityData);
    if (!hasSnapshotSection(snapshot, "Activities of Daily Living")) addSection(fields, "Activities of Daily Living", note.adlData);
    if (!hasSnapshotSection(snapshot, "Assessment")) addSection(fields, "Assessment", note.assessmentData);
    if (!hasSnapshotSection(snapshot, "Goals and Plan")) {
      addSection(fields, "Goals and Plan", note.goalsPlan);
      addTherapyOrdersSection(fields, note.therapyOrders);
    } else if (!hasValue(snapshot.therapy_orders)) {
      addTherapyOrdersSection(fields, note.therapyOrders);
    }
    if (!hasSnapshotSection(snapshot, "Discharge Plan and Education")) addSection(fields, "Discharge Plan and Education", note.dcPlanEducation);
    if (!hasSnapshotSection(snapshot, "Discharge")) {
      addSection(fields, "Discharge", note.dischargeData);
      addSection(fields, "NOMNC", note.nomncData);
      addSection(fields, "OASIS", note.oasisData);
    }
  } else {
    addSection(fields, "Vitals", note.vitals);
    addSection(fields, "Pain Assessment", note.painAssessment);
    addSection(fields, "Subjective", note.subjectiveData);
    const objectiveData = note.objectiveData && typeof note.objectiveData === "object" && !Array.isArray(note.objectiveData)
      ? note.objectiveData as Record<string, unknown>
      : {};
    const { romEvaluation: _romEvaluation, ...objectiveWithoutRom } = objectiveData;
    addSection(fields, "Objective", objectiveWithoutRom);
    if (hasValue(objectiveData.romEvaluation)) {
      fields.push(
        { label: "Range of Motion", section: true },
        { label: "Range of Motion", layout: "rom-grid", data: objectiveData.romEvaluation },
      );
    }
    addSection(fields, "Mobility", note.mobilityData);
    addSection(fields, "Activities of Daily Living", note.adlData);
    addSection(fields, "SOAP Note", note.soapNotes);
    addSection(fields, "Assessment", note.assessmentData);
    addSection(fields, "Goals and Plan", note.goalsPlan);
    addTherapyOrdersSection(fields, note.therapyOrders);
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
  // A missing physician name must not suppress the approval section or stop
  // the rest of the visit note from being generated.
  if (note.treatmentApproved) {
    fields.push({
      label: "Physician Review & Approval",
      layout: "physician-approval",
      data: { physicianName: physician?.name || "N/A" },
    });
  }
  const importedSigning = note.signatures as { base44TherapistSignedAt?: string; base44PatientSignedAt?: string } | null;
  if (typeof therapistSignature === "string" || typeof patientSignature === "string" ||
      importedSigning?.base44TherapistSignedAt || importedSigning?.base44PatientSignedAt) {
    fields.push({ label: "Signatures", section: true });
    if (Array.isArray(snapshot.library_documents) && snapshot.library_documents.length) {
      fields.push({ label: "Attached Documents (Library)", value: snapshot.library_documents.map(String).join(", ") });
    }
    if (typeof therapistSignature === "string") {
      fields.push({ label: "Therapist Signature", imageDataUrl: therapistSignature });
    }
    if (snapshot.therapist_signature_timestamp) {
      fields.push({ label: "Therapist Signed At", value: formatSignatureTimestamp(snapshot.therapist_signature_timestamp) });
    } else if (importedSigning?.base44TherapistSignedAt) {
      fields.push({ label: "Therapist Signed At (Base44)", value: importedSigning.base44TherapistSignedAt });
    }
    if (typeof patientSignature === "string") {
      fields.push({ label: "Patient Signature", imageDataUrl: patientSignature });
    }
    if (snapshot.patient_signature_timestamp) {
      fields.push({ label: "Patient Signed At", value: formatSignatureTimestamp(snapshot.patient_signature_timestamp) });
    } else if (importedSigning?.base44PatientSignedAt) {
      fields.push({ label: "Patient Signed At (Base44)", value: importedSigning.base44PatientSignedAt });
    }
  }
  return {
    title: `Visit Note - ${note.patientName}`,
    fields,
    options: {
      ...branding,
      subtitle: `${humanize(note.therapyType.toLowerCase())} - ${humanize(note.visitType?.toLowerCase() || "visit")}`,
      patientName: note.patientName,
    },
  };
}

async function buildDocument(type: string, id: string) {
  if (type === "visit") {
    const note = await prisma.visitNote.findUnique({ where: { id }, include: visitPdfInclude });
    if (!note) return null;
    const branding = await visitPdfBranding();
    return {
      filename: `visit-note-${id}.pdf`,
      buffer: await createVisitNotesPdf([visitPdfContent(note, branding)]),
    };
  }

  if (type === "invoice") {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { lineItems: { orderBy: [{ visitDate: "asc" }, { id: "asc" }] }, agency: { select: { vitalSignsConfig: true } } },
    });
    if (!invoice) return null;
    const config = invoice.agency?.vitalSignsConfig as { agency_preferences?: { invoice_terms?: string; invoice_footer?: string } } | null;
    const preferences = config?.agency_preferences;
    const date = (value: Date) => value.toISOString().slice(0, 10);
    const disciplines: Record<string, string> = { physical: "PT", occupational: "OT", speech: "ST", pt: "PT", ot: "OT", st: "ST", slp: "ST" };
    const visitLabels: Record<string, string> = { evaluation: "Eval", treatment: "Tx", re_evaluation: "Re-eval", recertification: "Recert", discharge_with_visit: "DC", discharge_without_visit: "DC" };
    return {
      filename: `${invoice.invoiceNumber}.pdf`,
      buffer: await createInvoicePdf({
        number: invoice.invoiceNumber,
        agency: invoice.agencyName,
        period: `${date(invoice.dateFrom)} – ${date(invoice.dateTo)}`,
        status: invoice.status,
        total: Number(invoice.totalAmount),
        terms: preferences?.invoice_terms,
        notes: !["Minimal", "None"].includes(preferences?.invoice_footer ?? "") ? invoice.notes : null,
        rows: invoice.lineItems.map((item) => [
          item.patientName,
          date(item.visitDate),
          item.therapistName,
          disciplines[item.therapyType.toLowerCase().split(/[ _]/)[0]] ?? item.therapyType,
          visitLabels[item.visitType.toLowerCase()] ?? humanize(item.visitType.toLowerCase()),
          invoiceMoney(Number(item.rate)),
        ]),
      }),
    };
  }

  if (type === "invoice-notes") {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        lineItems: {
          orderBy: [{ visitDate: "asc" }, { id: "asc" }],
          include: { visitNote: { include: visitPdfInclude } },
        },
      },
    });
    if (!invoice?.lineItems.length) return null;

    const branding = await visitPdfBranding();
    const notes = new Map(invoice.lineItems.map(({ visitNote }) => [visitNote.id, visitNote]));
    return {
      filename: `${invoice.invoiceNumber}-visit-notes.pdf`,
      buffer: await createVisitNotesPdf(Array.from(notes.values(), (note) => visitPdfContent(note, branding))),
    };
  }
  return null;
}

export async function GET(request: NextRequest) {
  const user = await requireAuth();
  const type = request.nextUrl.searchParams.get("type") || "";
  const id = request.nextUrl.searchParams.get("id") || "";
  if (type === "invoice-notes" && user.userType !== "SUPERUSER" && user.userType !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
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
  const user = await requireAuth();
  const { type, id, recipient, subject, message } = await request.json();
  if (!recipient || !subject) return Response.json({ error: "Recipient and subject are required" }, { status: 400 });
  if (type === "invoice-notes" && user.userType !== "SUPERUSER" && user.userType !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
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
