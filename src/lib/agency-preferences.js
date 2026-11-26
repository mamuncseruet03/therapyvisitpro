export const agencyPreferenceChoices = {
  invoice_sort_order: ["Patient Last Name", "Patient First Name", "Visit Date", "Therapist Name"],
  invoice_terms: ["Due on Receipt", "Net 15", "Net 30", "Net 45", "Net 60", "Net 90"],
  invoice_footer: ["Detailed", "Summary", "Minimal", "None"],
  billing_schedule: ["Weekly", "Biweekly", "Semimonthly", "Monthly"],
  agency_software: ["Homecare Homebase", "Axxess", "Kinnser / WellSky", "MatrixCare", "Other", "None"],
  work_week_start: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  co_signature: ["No", "Yes"],
};

export const agencyPreferenceFlags = ["inactive", "no_thera_docs", "document_in_agency_software", "allow_alt_patient_signature"];
export const agencyContactFields = ["emergency_contact_number", "nurse_on_call_number"];

export const NO_THERA_DOCS_MESSAGE = "Visit documentation for this agency must be completed outside TheraDocs.";
