"use server";

import { findPayerRules } from "@/lib/payer-rules";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";

const shape = (payer) => ({
  id: payer.id,
  name: payer.name,
  payer_code: payer.payerCode || "",
  phone: payer.phone || "",
  fax: payer.fax || "",
  email: payer.email || "",
  address: payer.address || "",
  city: payer.city || "",
  state: payer.state || "",
  zip: payer.zip || "",
  authorization_required: payer.authorizationRequired,
  treatment_rules: payer.treatmentRules || {},
  notes: payer.notes || "",
  status: payer.status.toLowerCase(),
});

function normalizeRules(rules) {
  const frequency = Number(rules?.supervisoryFrequency);
  const specialRates = {};
  for (const discipline of ["PT", "OT", "ST"]) {
    for (const visit of ["evaluation", "treatment", "re_evaluation", "recertification", "discharge"]) {
      const key = `${discipline}:${visit}`;
      const value = rules?.specialRates?.[key];
      if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) continue;
      const rate = Number(value);
      if (Number.isFinite(rate) && rate >= 0) specialRates[key] = rate;
    }
  }
  return {
    assistantsNotAllowed: rules?.assistantsNotAllowed === true,
    supervisoryFrequency: Number.isInteger(frequency) && frequency >= 1 && frequency <= 10 ? frequency : null,
    specialRates,
  };
}

const payload = (data) => ({
  name: String(data.name || "").trim(),
  payerCode: String(data.payer_code || "").trim() || null,
  phone: String(data.phone || "").trim() || null,
  fax: String(data.fax || "").trim() || null,
  email: String(data.email || "").trim() || null,
  address: String(data.address || "").trim() || null,
  city: String(data.city || "").trim() || null,
  state: String(data.state || "").trim() || null,
  zip: String(data.zip || "").trim() || null,
  authorizationRequired: !!data.authorization_required,
  ...(data.treatment_rules !== undefined ? { treatmentRules: normalizeRules(data.treatment_rules) } : {}),
  notes: String(data.notes || "").trim() || null,
  status: String(data.status || "active").toUpperCase(),
});

export async function getPayers() {
  await requireRole("SUPERUSER", "ADMIN", "COORDINATOR");
  return (await prisma.payer.findMany({ orderBy: { name: "asc" } })).map(shape);
}

export async function createPayer(data) {
  await requireRole("SUPERUSER", "ADMIN");
  const next = payload(data);
  if (!next.name) throw new Error("Payer name is required");
  return shape(await prisma.payer.create({ data: next }));
}

export async function updatePayer(id, data) {
  await requireRole("SUPERUSER", "ADMIN");
  const next = payload(data);
  if (!next.name) throw new Error("Payer name is required");
  return shape(await prisma.payer.update({ where: { id }, data: next }));
}

export async function deletePayer(id) {
  await requireRole("SUPERUSER", "ADMIN");
  await prisma.payer.delete({ where: { id } });
  return { success: true };
}

export async function patientAllowsAssistants(patientId) {
  await requireRole("SUPERUSER", "ADMIN", "COORDINATOR");
  const patient = await prisma.patient.findUniqueOrThrow({
    where: { id: patientId },
    select: { insurance: true },
  });
  const rules = await findPayerRules(patient.insurance);
  return rules?.assistantsNotAllowed !== true;
}
