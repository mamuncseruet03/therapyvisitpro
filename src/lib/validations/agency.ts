import { z } from "zod";
import { AgencyDocMode, TherapistStatus } from "./enums";

export const agencyContactSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  title: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export const agencyRateSchema = z.object({
  therapyType: z.string().min(1),
  visitType: z.string().min(1),
  rate: z.number().min(0, "Rate must be positive"),
});

export const createAgencySchema = z.object({
  name: z.string().min(1, "Agency name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  documentMode: AgencyDocMode.optional(),
  assistantsAllowed: z.boolean().optional(),
  supervisoryVisitFrequency: z.number().int().min(1).optional(),
  workWeekStartDay: z.number().int().min(0).max(6).optional(),
  requiredVisitDocuments: z.array(z.string()).optional(),
  notes: z.string().optional(),
  status: TherapistStatus.optional(),
  contacts: z.array(agencyContactSchema).optional(),
  rates: z.array(agencyRateSchema).optional(),
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;

export const updateAgencySchema = createAgencySchema.partial();
export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;
