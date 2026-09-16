import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password utilities", () => {
  it("hashes a password", async () => {
    const hash = await hashPassword("testPassword123");
    expect(hash).toBeTruthy();
    expect(hash).not.toBe("testPassword123");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("produces different hashes for the same password", async () => {
    const hash1 = await hashPassword("samePassword");
    const hash2 = await hashPassword("samePassword");
    expect(hash1).not.toBe(hash2);
  });

  it("verifies correct password", async () => {
    const hash = await hashPassword("correctPassword");
    const result = await verifyPassword("correctPassword", hash);
    expect(result).toBe(true);
  });

  it("rejects incorrect password", async () => {
    const hash = await hashPassword("correctPassword");
    const result = await verifyPassword("wrongPassword", hash);
    expect(result).toBe(false);
  });

  it("handles empty password", async () => {
    const hash = await hashPassword("");
    const result = await verifyPassword("", hash);
    expect(result).toBe(true);
  });

  it("handles special characters in password", async () => {
    const password = "p@$$w0rd!#%^&*()_+{}|:<>?";
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it("handles unicode characters", async () => {
    const password = "パスワード123";
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });
});
