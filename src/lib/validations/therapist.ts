import { z } from "zod";
import { Discipline, TherapistStatus } from "./enums";

export const therapistRatesSchema = z.object({
  peds: z
    .object({
      eval: z.number().optional(),
      returnVisit: z.number().optional(),
      supervisory: z.number().optional(),
      recert: z.number().optional(),
      discharge: z.number().optional(),
    })
    .optional(),
  geriatrics: z
    .object({
      eval: z.number().optional(),
      returnVisit: z.number().optional(),
      supervisory: z.number().optional(),
      recert: z.number().optional(),
      discharge: z.number().optional(),
    })
    .optional(),
});

export const createTherapistSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  discipline: Discipline,
  credentials: z.string().optional(),
  licenseNumber: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  hireDate: z.coerce.date().optional(),
  annualReviewDate: z.coerce.date().optional(),
  status: TherapistStatus.optional(),
  facilities: z.array(z.string()).optional(),
  rates: therapistRatesSchema.optional(),
});

export type CreateTherapistInput = z.infer<typeof createTherapistSchema>;

export const updateTherapistSchema = createTherapistSchema.partial();
export type UpdateTherapistInput = z.infer<typeof updateTherapistSchema>;
