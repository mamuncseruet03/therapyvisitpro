import { describe, it, expect } from "vitest";
import { createTherapistSchema, updateTherapistSchema, therapistRatesSchema } from "./therapist";

describe("Therapist validation", () => {
  const validTherapist = {
    fullName: "Jane Smith, PT, DPT",
    discipline: "PT" as const,
    credentials: "DPT",
    licenseNumber: "PT-12345",
    email: "jane@therapy.com",
    phone: "555-0100",
  };

  it("accepts valid therapist data", () => {
    const result = createTherapistSchema.safeParse(validTherapist);
    expect(result.success).toBe(true);
  });

  it("requires fullName", () => {
    const result = createTherapistSchema.safeParse({ ...validTherapist, fullName: "" });
    expect(result.success).toBe(false);
  });

  it("requires discipline", () => {
    const { discipline: _, ...noDiscipline } = validTherapist;
    const result = createTherapistSchema.safeParse(noDiscipline);
    expect(result.success).toBe(false);
  });

  it("validates discipline values (PT/OT/ST)", () => {
    ["PT", "OT", "ST"].forEach((d) => {
      const result = createTherapistSchema.safeParse({ ...validTherapist, discipline: d });
      expect(result.success).toBe(true);
    });
  });

  it("rejects invalid discipline", () => {
    const result = createTherapistSchema.safeParse({ ...validTherapist, discipline: "SLP" });
    expect(result.success).toBe(false);
  });

  it("validates status enum", () => {
    const active = createTherapistSchema.safeParse({ ...validTherapist, status: "ACTIVE" });
    expect(active.success).toBe(true);

    const inactive = createTherapistSchema.safeParse({ ...validTherapist, status: "INACTIVE" });
    expect(inactive.success).toBe(true);

    const invalid = createTherapistSchema.safeParse({ ...validTherapist, status: "SUSPENDED" });
    expect(invalid.success).toBe(false);
  });

  it("validates facilities array", () => {
    const result = createTherapistSchema.safeParse({
      ...validTherapist,
      facilities: ["Facility A", "Facility B"],
    });
    expect(result.success).toBe(true);
  });

  it("update schema makes all fields optional", () => {
    const result = updateTherapistSchema.safeParse({ phone: "555-9999" });
    expect(result.success).toBe(true);
  });
});

describe("Therapist rates validation", () => {
  it("accepts valid peds/geriatrics rate structure", () => {
    const result = therapistRatesSchema.safeParse({
      peds: { eval: 150, returnVisit: 100, supervisory: 120, recert: 130, discharge: 110 },
      geriatrics: { eval: 140, returnVisit: 95 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts partial rate structure", () => {
    const result = therapistRatesSchema.safeParse({ peds: { eval: 150 } });
    expect(result.success).toBe(true);
  });

  it("accepts empty rates", () => {
    const result = therapistRatesSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
