import { describe, it, expect } from "vitest";
import { createAgencySchema, agencyContactSchema, agencyRateSchema } from "./agency";

describe("Agency validation", () => {
  const validAgency = {
    name: "ABC Home Health",
    address: "456 Oak Ave",
    city: "Chicago",
    state: "IL",
    zip: "60601",
    phone: "555-0200",
    email: "info@abchh.com",
  };

  it("accepts valid agency data", () => {
    const result = createAgencySchema.safeParse(validAgency);
    expect(result.success).toBe(true);
  });

  it("requires name", () => {
    const result = createAgencySchema.safeParse({ ...validAgency, name: "" });
    expect(result.success).toBe(false);
  });

  it("validates document mode enum", () => {
    const theradocs = createAgencySchema.safeParse({
      ...validAgency,
      documentMode: "THERADOCS",
    });
    expect(theradocs.success).toBe(true);

    const agency = createAgencySchema.safeParse({
      ...validAgency,
      documentMode: "AGENCY_DOCS",
    });
    expect(agency.success).toBe(true);

    const invalid = createAgencySchema.safeParse({
      ...validAgency,
      documentMode: "CUSTOM",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates workWeekStartDay range (0-6)", () => {
    const sunday = createAgencySchema.safeParse({ ...validAgency, workWeekStartDay: 0 });
    expect(sunday.success).toBe(true);

    const saturday = createAgencySchema.safeParse({ ...validAgency, workWeekStartDay: 6 });
    expect(saturday.success).toBe(true);

    const invalid = createAgencySchema.safeParse({ ...validAgency, workWeekStartDay: 7 });
    expect(invalid.success).toBe(false);
  });

  it("validates supervisoryVisitFrequency is positive integer", () => {
    const valid = createAgencySchema.safeParse({ ...validAgency, supervisoryVisitFrequency: 8 });
    expect(valid.success).toBe(true);

    const zero = createAgencySchema.safeParse({ ...validAgency, supervisoryVisitFrequency: 0 });
    expect(zero.success).toBe(false);
  });

  it("accepts contacts array", () => {
    const result = createAgencySchema.safeParse({
      ...validAgency,
      contacts: [
        { name: "John Doe", title: "Director", phone: "555-0300", email: "john@abc.com" },
        { name: "Jane Doe", title: "Coordinator" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts rates array", () => {
    const result = createAgencySchema.safeParse({
      ...validAgency,
      rates: [
        { therapyType: "PHYSICAL_THERAPY", visitType: "EVALUATION", rate: 150 },
        { therapyType: "OCCUPATIONAL_THERAPY", visitType: "TREATMENT", rate: 100 },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("Agency contact validation", () => {
  it("requires contact name", () => {
    const result = agencyContactSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("validates email format", () => {
    const result = agencyContactSchema.safeParse({ name: "John", email: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("Agency rate validation", () => {
  it("requires positive rate", () => {
    const result = agencyRateSchema.safeParse({
      therapyType: "PT",
      visitType: "EVAL",
      rate: -50,
    });
    expect(result.success).toBe(false);
  });

  it("requires therapyType and visitType", () => {
    const result = agencyRateSchema.safeParse({ rate: 100 });
    expect(result.success).toBe(false);
  });
});
