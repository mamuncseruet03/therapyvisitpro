import { describe, expect, it } from "vitest";
import {
  canAssignTherapist,
  isAssistantTherapist,
  therapistAssignmentError,
} from "./eligibility";

describe("therapist assignment eligibility", () => {
  const activePt = { status: "active", discipline: "Physical Therapy", credentials: "PT" };
  const activePta = { status: "active", discipline: "PT", credentials: "PTA" };
  const activeOt = { status: "ACTIVE", discipline: "OT", credentials: "OTR/L" };
  const activeCota = { status: "ACTIVE", discipline: "Occupational Therapy", credentials: "COTA" };

  it("allows licensed PT and OT therapists to perform evaluations", () => {
    expect(canAssignTherapist(activePt, "PT", "evaluation")).toBe(true);
    expect(canAssignTherapist(activeOt, "Occupational Therapy", "eval")).toBe(true);
  });

  it("blocks PTA and COTA from evaluations", () => {
    expect(canAssignTherapist(activePta, "Physical Therapy", "evaluation")).toBe(false);
    expect(canAssignTherapist(activeCota, "OT", "eval")).toBe(false);
    expect(therapistAssignmentError(activePta, "PT", "evaluation")).toContain("cannot be assigned");
  });

  it("allows PTA and COTA to perform treatment visits when the agency permits assistants", () => {
    expect(canAssignTherapist(activePta, "PT", "treatment", true)).toBe(true);
    expect(canAssignTherapist(activeCota, "OT", "treatment", true)).toBe(true);
  });

  it("blocks assistants from treatment when the agency disallows them", () => {
    expect(canAssignTherapist(activePta, "PT", "treatment", false)).toBe(false);
  });

  it("rejects inactive or wrong-discipline therapists", () => {
    expect(canAssignTherapist({ ...activePt, status: "inactive" }, "PT", "evaluation")).toBe(false);
    expect(canAssignTherapist(activePt, "OT", "evaluation")).toBe(false);
  });

  it("recognizes common assistant credential formatting", () => {
    expect(isAssistantTherapist("PTA, LPTA")).toBe(true);
    expect(isAssistantTherapist("C.O.T.A")).toBe(true);
    expect(isAssistantTherapist("DPT")).toBe(false);
  });
});
