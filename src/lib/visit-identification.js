export const PATIENT_IDENTIFIERS = {
  date_of_birth: "Date of Birth",
  address: "Address",
  facial_recognition: "Facial Recognition",
  family_member_verify: "Family Member Verify",
  ssn: "SSN",
};

export const TWO_IDENTIFIERS_REQUIRED = "At least two patient identifiers are required";

export function patientIdentifierLabel(key) {
  return Object.hasOwn(PATIENT_IDENTIFIERS, key) ? PATIENT_IDENTIFIERS[key] : key.replace(/^custom:/, "").replaceAll("_", " ");
}

export function identifierKey(label) {
  return label.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function selectedIdentifierLabels(identifiers) {
  if (!identifiers || typeof identifiers !== "object" || Array.isArray(identifiers)) return [];
  return [...new Map(Object.entries(identifiers)
    .filter(([, checked]) => checked === true)
    .map(([key]) => patientIdentifierLabel(key))
    .filter((label) => identifierKey(label))
    .map((label) => [identifierKey(label), label])).values()];
}

export function minimumIdentifiers(therapyType, visitType) {
  const isPt = ["Physical Therapy", "PHYSICAL_THERAPY"].includes(therapyType);
  return isPt && visitType?.toLowerCase() === "evaluation" ? 2 : 1;
}
