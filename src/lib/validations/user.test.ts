import { describe, it, expect } from "vitest";
import { createUserSchema, loginSchema, updateUserSchema } from "./user";

describe("User validation", () => {
  const validUser = {
    email: "admin@therapyvisit.com",
    password: "securePass123",
    fullName: "Admin User",
    userType: "ADMIN" as const,
  };

  it("accepts valid user data", () => {
    const result = createUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("requires valid email", () => {
    const result = createUserSchema.safeParse({ ...validUser, email: "bad" });
    expect(result.success).toBe(false);
  });

  it("requires password min 8 chars", () => {
    const result = createUserSchema.safeParse({ ...validUser, password: "short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("8 characters");
    }
  });

  it("requires fullName", () => {
    const result = createUserSchema.safeParse({ ...validUser, fullName: "" });
    expect(result.success).toBe(false);
  });

  it("requires userType", () => {
    const { userType: _, ...noType } = validUser;
    const result = createUserSchema.safeParse(noType);
    expect(result.success).toBe(false);
  });

  it("validates all 7 user types", () => {
    const types = ["SUPERUSER", "ADMIN", "THERAPIST", "COORDINATOR", "HR", "GUEST", "CLIENT"];
    types.forEach((t) => {
      const result = createUserSchema.safeParse({ ...validUser, userType: t });
      expect(result.success).toBe(true);
    });
  });

  it("validates discipline enum", () => {
    const result = createUserSchema.safeParse({ ...validUser, discipline: "PT" });
    expect(result.success).toBe(true);

    const invalid = createUserSchema.safeParse({ ...validUser, discipline: "INVALID" });
    expect(invalid.success).toBe(false);
  });

  it("update schema makes all fields optional and omits password", () => {
    const result = updateUserSchema.safeParse({ phone: "555-0001" });
    expect(result.success).toBe(true);
  });
});

describe("Login validation", () => {
  it("accepts valid login", () => {
    const result = loginSchema.safeParse({ email: "user@test.com", password: "pass" });
    expect(result.success).toBe(true);
  });

  it("requires email", () => {
    const result = loginSchema.safeParse({ password: "pass" });
    expect(result.success).toBe(false);
  });

  it("requires password", () => {
    const result = loginSchema.safeParse({ email: "user@test.com" });
    expect(result.success).toBe(false);
  });

  it("validates email format", () => {
    const result = loginSchema.safeParse({ email: "not-email", password: "pass" });
    expect(result.success).toBe(false);
  });
});
