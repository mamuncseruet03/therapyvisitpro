import { describe, it, expect } from "vitest";
import {
  Role,
  UserType,
  Discipline,
  Sex,
  PatientStatus,
  TherapyType,
  VisitType,
  VisitStatus,
  InvoiceStatus,
  TaskPriority,
  TaskStatus,
  AuditAction,
  AssignmentStatus,
  DeletionStatus,
} from "./enums";

describe("Enum validations", () => {
  it("validates Role enum", () => {
    expect(Role.parse("ADMIN")).toBe("ADMIN");
    expect(Role.parse("USER")).toBe("USER");
    expect(Role.parse("SUPERUSER")).toBe("SUPERUSER");
    expect(() => Role.parse("INVALID")).toThrow();
  });

  it("validates UserType enum — all 7 roles", () => {
    const types = ["SUPERUSER", "ADMIN", "THERAPIST", "COORDINATOR", "HR", "GUEST", "CLIENT"];
    types.forEach((t) => expect(UserType.parse(t)).toBe(t));
    expect(UserType.options).toHaveLength(7);
  });

  it("validates Discipline enum", () => {
    expect(Discipline.parse("PT")).toBe("PT");
    expect(Discipline.parse("OT")).toBe("OT");
    expect(Discipline.parse("ST")).toBe("ST");
    expect(() => Discipline.parse("SLP")).toThrow();
  });

  it("validates Sex enum", () => {
    expect(Sex.parse("MALE")).toBe("MALE");
    expect(Sex.parse("FEMALE")).toBe("FEMALE");
    expect(Sex.parse("OTHER")).toBe("OTHER");
  });

  it("validates PatientStatus enum", () => {
    expect(PatientStatus.options).toHaveLength(3);
    expect(PatientStatus.parse("ACTIVE")).toBe("ACTIVE");
  });

  it("validates TherapyType enum — 3 types", () => {
    expect(TherapyType.options).toHaveLength(3);
    expect(TherapyType.parse("PHYSICAL_THERAPY")).toBe("PHYSICAL_THERAPY");
    expect(TherapyType.parse("OCCUPATIONAL_THERAPY")).toBe("OCCUPATIONAL_THERAPY");
    expect(TherapyType.parse("SPEECH_THERAPY")).toBe("SPEECH_THERAPY");
  });

  it("validates VisitType enum — 8 types", () => {
    expect(VisitType.options).toHaveLength(8);
    expect(VisitType.parse("EVALUATION")).toBe("EVALUATION");
    expect(VisitType.parse("MISSED_VISIT")).toBe("MISSED_VISIT");
  });

  it("validates VisitStatus enum", () => {
    expect(VisitStatus.options).toHaveLength(4);
    expect(VisitStatus.parse("DRAFT")).toBe("DRAFT");
    expect(VisitStatus.parse("SIGNED")).toBe("SIGNED");
  });

  it("validates InvoiceStatus enum", () => {
    expect(InvoiceStatus.options).toHaveLength(5);
    expect(InvoiceStatus.parse("PARTIAL_PAID")).toBe("PARTIAL_PAID");
  });

  it("validates TaskPriority and TaskStatus enums", () => {
    expect(TaskPriority.options).toHaveLength(3);
    expect(TaskStatus.options).toHaveLength(4);
    expect(TaskStatus.parse("ESCALATED")).toBe("ESCALATED");
  });

  it("validates AuditAction enum — 8 actions", () => {
    expect(AuditAction.options).toHaveLength(8);
    expect(AuditAction.parse("LOGIN")).toBe("LOGIN");
    expect(AuditAction.parse("EXPORT")).toBe("EXPORT");
  });

  it("validates AssignmentStatus enum", () => {
    expect(AssignmentStatus.options).toHaveLength(4);
    expect(AssignmentStatus.parse("SCHEDULED")).toBe("SCHEDULED");
  });

  it("validates DeletionStatus enum", () => {
    expect(DeletionStatus.options).toHaveLength(3);
    expect(DeletionStatus.parse("APPROVED")).toBe("APPROVED");
  });

  it("rejects invalid enum values with proper error", () => {
    const result = Role.safeParse("NOT_A_ROLE");
    expect(result.success).toBe(false);
  });
});
