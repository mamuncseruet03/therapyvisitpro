import { describe, it, expect } from "vitest";
import { createPatientSchema, updatePatientSchema } from "./patient";

describe("Patient validation", () => {
  const validPatient = {
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1990-01-15",
    sex: "MALE" as const,
    phone: "555-0100",
    email: "john@example.com",
    address: "123 Main St",
    city: "Springfield",
    state: "IL",
    zip: "62701",
  };

  it("accepts valid patient data", () => {
    const result = createPatientSchema.safeParse(validPatient);
    expect(result.success).toBe(true);
  });

  it("requires firstName", () => {
    const result = createPatientSchema.safeParse({ ...validPatient, firstName: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("firstName");
    }
  });

  it("requires lastName", () => {
    const result = createPatientSchema.safeParse({ ...validPatient, lastName: "" });
    expect(result.success).toBe(false);
  });

  it("validates email format", () => {
    const result = createPatientSchema.safeParse({ ...validPatient, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("allows empty string for optional email", () => {
    const result = createPatientSchema.safeParse({ ...validPatient, email: "" });
    expect(result.success).toBe(true);
  });

  it("coerces dateOfBirth string to Date", () => {
    const result = createPatientSchema.safeParse(validPatient);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dateOfBirth).toBeInstanceOf(Date);
    }
  });

  it("validates sex enum", () => {
    const result = createPatientSchema.safeParse({ ...validPatient, sex: "INVALID" });
    expect(result.success).toBe(false);
  });

  it("validates therapyTypes array", () => {
    const result = createPatientSchema.safeParse({
      ...validPatient,
      therapyTypes: ["PHYSICAL_THERAPY", "OCCUPATIONAL_THERAPY"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid therapyType values", () => {
    const result = createPatientSchema.safeParse({
      ...validPatient,
      therapyTypes: ["INVALID_TYPE"],
    });
    expect(result.success).toBe(false);
  });

  it("validates authorizedVisits is non-negative integer", () => {
    const valid = createPatientSchema.safeParse({ ...validPatient, authorizedVisits: 20 });
    expect(valid.success).toBe(true);

    const negative = createPatientSchema.safeParse({ ...validPatient, authorizedVisits: -1 });
    expect(negative.success).toBe(false);
  });

  it("validates status enum", () => {
    const result = createPatientSchema.safeParse({ ...validPatient, status: "ACTIVE" });
    expect(result.success).toBe(true);

    const invalid = createPatientSchema.safeParse({ ...validPatient, status: "UNKNOWN" });
    expect(invalid.success).toBe(false);
  });

  it("validates responsible party structure", () => {
    const result = createPatientSchema.safeParse({
      ...validPatient,
      responsibleParty: { name: "Jane Doe", phone: "555-0200", relationship: "Spouse" },
    });
    expect(result.success).toBe(true);
  });

  it("validates physicians structure", () => {
    const result = createPatientSchema.safeParse({
      ...validPatient,
      physicians: {
        primary: { name: "Dr. Smith", phone: "555-0300" },
        referring: { name: "Dr. Jones" },
      },
    });
    expect(result.success).toBe(true);
  });

  it("allows all fields optional in update schema", () => {
    const result = updatePatientSchema.safeParse({ phone: "555-9999" });
    expect(result.success).toBe(true);
  });

  it("accepts minimum required fields only", () => {
    const result = createPatientSchema.safeParse({ firstName: "A", lastName: "B" });
    expect(result.success).toBe(true);
  });
});
