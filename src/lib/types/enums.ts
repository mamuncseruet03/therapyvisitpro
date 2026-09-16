export type UserType =
  "SUPERUSER" | "ADMIN" | "THERAPIST" | "COORDINATOR" | "HR" | "GUEST" | "CLIENT";
export type Role = "ADMIN" | "USER" | "SUPERUSER";
export type Discipline = "PT" | "OT" | "ST";
export type PatientStatus = "ACTIVE" | "DISCHARGED" | "ON_HOLD";
export type TherapyType = "PHYSICAL_THERAPY" | "OCCUPATIONAL_THERAPY" | "SPEECH_THERAPY";
export type Sex = "MALE" | "FEMALE" | "OTHER";
export type TherapistStatus = "ACTIVE" | "INACTIVE";
export type ReferralSourceType = "MANUAL" | "PDF_IMPORT";
export type PatientAction = "CREATED" | "UPDATED" | "SKIPPED";
export type AssignmentStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "SCHEDULED";

export type VisitType =
  | "EVALUATION"
  | "TREATMENT"
  | "RE_EVALUATION"
  | "RECERTIFICATION"
  | "DISCHARGE_WITH_VISIT"
  | "DISCHARGE_WITHOUT_VISIT"
  | "EVAL_REFUSED"
  | "MISSED_VISIT";

export type VisitStatus = "DRAFT" | "SCHEDULED" | "COMPLETED" | "SIGNED";

export const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  EVALUATION: "Evaluation",
  TREATMENT: "Treatment",
  RE_EVALUATION: "Re-Evaluation",
  RECERTIFICATION: "Recertification",
  DISCHARGE_WITH_VISIT: "Discharge with Visit",
  DISCHARGE_WITHOUT_VISIT: "Discharge without Visit",
  EVAL_REFUSED: "Eval Refused",
  MISSED_VISIT: "Missed Visit",
};

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  SIGNED: "Signed",
};

export const THERAPY_TYPE_LABELS: Record<TherapyType, string> = {
  PHYSICAL_THERAPY: "Physical Therapy",
  OCCUPATIONAL_THERAPY: "Occupational Therapy",
  SPEECH_THERAPY: "Speech Therapy",
};

export const THERAPY_DISCIPLINE_MAP: Record<Discipline, TherapyType> = {
  PT: "PHYSICAL_THERAPY",
  OT: "OCCUPATIONAL_THERAPY",
  ST: "SPEECH_THERAPY",
};

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "PARTIAL_PAID" | "VOID";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
  PARTIAL_PAID: "Partial Paid",
  VOID: "Void",
};

export const PATIENT_ID_METHODS = [
  "Date of Birth",
  "Address",
  "Facial Recognition",
  "Family Member Verify",
  "SSN#",
] as const;

export type NoteType = "GENERAL" | "CLINICAL" | "BILLING" | "URGENT";

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  GENERAL: "General",
  CLINICAL: "Clinical",
  BILLING: "Billing",
  URGENT: "Urgent",
};

export type NotificationType = "COMMUNICATION_NOTE" | "TASK" | "GENERAL" | "HR_ALERT";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  COMMUNICATION_NOTE: "Communication Note",
  TASK: "Task",
  GENERAL: "General",
  HR_ALERT: "HR Alert",
};

export type DeletionStatus = "PENDING" | "APPROVED" | "REJECTED";

export const DELETION_STATUS_LABELS: Record<DeletionStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
