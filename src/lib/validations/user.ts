import { z } from "zod";
import { Discipline, Role, UserType } from "./enums";

export const createUserSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
  role: Role.optional(),
  userType: UserType,
  therapistId: z.string().uuid().optional(),
  credentials: z.string().optional(),
  licenseNumber: z.string().optional(),
  discipline: Discipline.optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial().omit({ password: true });
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
