import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuthFn = vi.fn();

vi.mock("./config", () => ({
  auth: (...args: unknown[]) => {
    if (args.length === 0) return mockAuthFn();
    return mockAuthFn;
  },
}));

import { getCurrentUser, requireAuth, requireRole } from "./session";

describe("session utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCurrentUser", () => {
    it("returns user when session exists", async () => {
      const mockUser = {
        id: "user-1",
        email: "admin@test.com",
        name: "Admin",
        role: "ADMIN" as const,
        userType: "ADMIN" as const,
        therapistId: null,
        discipline: null,
      };
      mockAuthFn.mockResolvedValue({ user: mockUser, expires: "" });

      const user = await getCurrentUser();
      expect(user).toEqual(mockUser);
    });

    it("returns null when no session", async () => {
      mockAuthFn.mockResolvedValue(null);

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe("requireAuth", () => {
    it("returns user when authenticated", async () => {
      const mockUser = {
        id: "user-1",
        email: "admin@test.com",
        name: "Admin",
        role: "ADMIN" as const,
        userType: "ADMIN" as const,
        therapistId: null,
        discipline: null,
      };
      mockAuthFn.mockResolvedValue({ user: mockUser, expires: "" });

      const user = await requireAuth();
      expect(user).toEqual(mockUser);
    });

    it("throws when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      await expect(requireAuth()).rejects.toThrow("Unauthorized");
    });
  });

  describe("requireRole", () => {
    it("returns user when role matches", async () => {
      const mockUser = {
        id: "user-1",
        email: "admin@test.com",
        name: "Admin",
        role: "ADMIN" as const,
        userType: "ADMIN" as const,
        therapistId: null,
        discipline: null,
      };
      mockAuthFn.mockResolvedValue({ user: mockUser, expires: "" });

      const user = await requireRole("ADMIN", "SUPERUSER");
      expect(user).toEqual(mockUser);
    });

    it("throws when role does not match", async () => {
      const mockUser = {
        id: "user-2",
        email: "therapist@test.com",
        name: "Therapist",
        role: "USER" as const,
        userType: "THERAPIST" as const,
        therapistId: "t-1",
        discipline: "PT" as const,
      };
      mockAuthFn.mockResolvedValue({ user: mockUser, expires: "" });

      await expect(requireRole("ADMIN", "SUPERUSER")).rejects.toThrow("Forbidden");
    });

    it("throws when not authenticated", async () => {
      mockAuthFn.mockResolvedValue(null);

      await expect(requireRole("ADMIN")).rejects.toThrow("Unauthorized");
    });

    it("accepts multiple allowed roles", async () => {
      const mockUser = {
        id: "user-3",
        email: "coord@test.com",
        name: "Coordinator",
        role: "USER" as const,
        userType: "COORDINATOR" as const,
        therapistId: null,
        discipline: null,
      };
      mockAuthFn.mockResolvedValue({ user: mockUser, expires: "" });

      const user = await requireRole("ADMIN", "COORDINATOR", "HR");
      expect(user.userType).toBe("COORDINATOR");
    });

    it("validates all 7 user types can be checked", async () => {
      const types = [
        "SUPERUSER",
        "ADMIN",
        "THERAPIST",
        "COORDINATOR",
        "HR",
        "GUEST",
        "CLIENT",
      ] as const;

      for (const userType of types) {
        const mockUser = {
          id: "u",
          email: "e@t.com",
          name: "n",
          role: "USER" as const,
          userType,
          therapistId: null,
          discipline: null,
        };
        mockAuthFn.mockResolvedValue({ user: mockUser, expires: "" });

        const user = await requireRole(userType);
        expect(user.userType).toBe(userType);
      }
    });
  });
});
