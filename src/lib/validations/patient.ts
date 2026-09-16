import { z } from "zod";
import { PatientStatus, Sex, TherapyType } from "./enums";

export const responsiblePartySchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  relationship: z.string().optional(),
});

export const physiciansSchema = z.object({
  primary: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  referring: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
});

export const createPatientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.coerce.date().optional(),
  sex: Sex.optional(),
  ssnEncrypted: z.string().optional(),
  medicareNumber: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  agencyId: z.string().uuid().optional(),
  insurance: z.string().optional(),
  coordinatorEmail: z.string().email().optional().or(z.literal("")),
  certPeriodStart: z.coerce.date().optional(),
  certPeriodEnd: z.coerce.date().optional(),
  authorizationNumber: z.string().optional(),
  authorizedVisits: z.number().int().min(0).optional(),
  therapyTypes: z.array(TherapyType).optional(),
  notes: z.string().optional(),
  status: PatientStatus.optional(),
  responsibleParty: responsiblePartySchema.optional(),
  physicians: physiciansSchema.optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = createPatientSchema.partial();
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
