const DISCIPLINE_CODES: Record<string, "PT" | "OT" | "ST"> = {
  pt: "PT",
  physical: "PT",
  physical_therapy: "PT",
  "physical therapy": "PT",
  ot: "OT",
  occupational: "OT",
  occupational_therapy: "OT",
  "occupational therapy": "OT",
  st: "ST",
  slp: "ST",
  speech: "ST",
  speech_therapy: "ST",
  "speech therapy": "ST",
};

export type AssignmentTherapist = {
  credentials?: string | null;
  discipline?: string | null;
  status?: string | null;
};

export function normalizeDiscipline(value?: string | null) {
  return DISCIPLINE_CODES[String(value || "").trim().toLowerCase()] || null;
}

export function isAssistantTherapist(credentials?: string | null) {
  const normalized = String(credentials || "").trim().toUpperCase().replaceAll(".", "");
  return /(^|[^A-Z])(PTA|COTA)([^A-Z]|$)/.test(normalized);
}

export function isEvaluationVisit(visitType?: string | null) {
  const normalized = String(visitType || "").trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
  return normalized === "evaluation" || normalized === "eval";
}

export function therapistAssignmentError(
  therapist: AssignmentTherapist,
  therapyType: string,
  visitType: string,
  assistantsAllowed = true,
) {
  if (String(therapist.status || "").toLowerCase() !== "active") {
    return "Only active therapists can be assigned";
  }
  if (normalizeDiscipline(therapist.discipline) !== normalizeDiscipline(therapyType)) {
    return "Therapist discipline does not match the assigned therapy type";
  }
  if (isEvaluationVisit(visitType) && isAssistantTherapist(therapist.credentials)) {
    return "PTA and COTA cannot be assigned to evaluations; select a licensed PT or OT";
  }
  if (!assistantsAllowed && isAssistantTherapist(therapist.credentials)) {
    return "This agency does not allow assistant therapists";
  }
  return null;
}

export function canAssignTherapist(
  therapist: AssignmentTherapist,
  therapyType: string,
  visitType: string,
  assistantsAllowed = true,
) {
  return therapistAssignmentError(therapist, therapyType, visitType, assistantsAllowed) === null;
}
