import { z } from "zod";

export const Role = z.enum(["ADMIN", "USER", "SUPERUSER"]);
export type Role = z.infer<typeof Role>;

export const UserType = z.enum([
  "SUPERUSER",
  "ADMIN",
  "THERAPIST",
  "COORDINATOR",
  "HR",
  "GUEST",
  "CLIENT",
]);
export type UserType = z.infer<typeof UserType>;

export const Discipline = z.enum(["PT", "OT", "ST"]);
export type Discipline = z.infer<typeof Discipline>;

export const Sex = z.enum(["MALE", "FEMALE", "OTHER"]);
export type Sex = z.infer<typeof Sex>;

export const PatientStatus = z.enum(["ACTIVE", "DISCHARGED", "ON_HOLD"]);
export type PatientStatus = z.infer<typeof PatientStatus>;

export const TherapistStatus = z.enum(["ACTIVE", "INACTIVE"]);
export type TherapistStatus = z.infer<typeof TherapistStatus>;

export const TherapyType = z.enum(["PHYSICAL_THERAPY", "OCCUPATIONAL_THERAPY", "SPEECH_THERAPY"]);
export type TherapyType = z.infer<typeof TherapyType>;

export const VisitType = z.enum([
  "EVALUATION",
  "TREATMENT",
  "RE_EVALUATION",
  "RECERTIFICATION",
  "DISCHARGE_WITH_VISIT",
  "DISCHARGE_WITHOUT_VISIT",
  "EVAL_REFUSED",
  "MISSED_VISIT",
]);
export type VisitType = z.infer<typeof VisitType>;

export const VisitStatus = z.enum(["DRAFT", "SCHEDULED", "COMPLETED", "SIGNED"]);
export type VisitStatus = z.infer<typeof VisitStatus>;

export const InvoiceStatus = z.enum(["DRAFT", "SENT", "PAID", "PARTIAL_PAID", "VOID"]);
export type InvoiceStatus = z.infer<typeof InvoiceStatus>;

export const TaskPriority = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type TaskPriority = z.infer<typeof TaskPriority>;

export const TaskStatus = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "ESCALATED"]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const AuditAction = z.enum([
  "VIEW",
  "CREATE",
  "UPDATE",
  "DELETE",
  "EXPORT",
  "SIGN",
  "LOGIN",
  "LOGOUT",
]);
export type AuditAction = z.infer<typeof AuditAction>;

export const NoteType = z.enum(["GENERAL", "CLINICAL", "BILLING", "URGENT"]);
export type NoteType = z.infer<typeof NoteType>;

export const NotificationType = z.enum(["COMMUNICATION_NOTE", "TASK", "GENERAL", "HR_ALERT"]);
export type NotificationType = z.infer<typeof NotificationType>;

export const AssignmentStatus = z.enum(["PENDING", "ACCEPTED", "DECLINED", "SCHEDULED"]);
export type AssignmentStatus = z.infer<typeof AssignmentStatus>;

export const DeletionStatus = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type DeletionStatus = z.infer<typeof DeletionStatus>;

export const AnnouncementColor = z.enum(["BLUE", "AMBER", "GREEN", "RED"]);
export type AnnouncementColor = z.infer<typeof AnnouncementColor>;

export const AgencyDocMode = z.enum(["THERADOCS", "AGENCY_DOCS"]);
export type AgencyDocMode = z.infer<typeof AgencyDocMode>;
