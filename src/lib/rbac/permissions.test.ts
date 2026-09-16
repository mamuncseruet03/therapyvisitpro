import { describe, it, expect } from "vitest";
import {
  hasRouteAccess,
  getAccessibleRoutes,
  hasRouteAccessByPath,
  hasResourceAccess,
} from "./permissions";
import type { UserType } from "@/lib/types/enums";

describe("Route permissions", () => {
  it("grants admin access to all admin routes", () => {
    const adminRoutes = [
      "dashboard",
      "patients",
      "therapists",
      "agencies",
      "visits",
      "invoices",
      "payroll",
      "reports",
      "schedule",
      "calendar",
      "tasks",
      "orders",
      "users",
      "settings",
      "audit-logs",
      "documents",
      "hr",
      "referrals",
    ] as const;

    adminRoutes.forEach((route) => {
      expect(hasRouteAccess("ADMIN", route)).toBe(true);
    });
  });

  it("restricts therapist to allowed routes only", () => {
    expect(hasRouteAccess("THERAPIST", "dashboard")).toBe(true);
    expect(hasRouteAccess("THERAPIST", "patients")).toBe(true);
    expect(hasRouteAccess("THERAPIST", "visits")).toBe(true);
    expect(hasRouteAccess("THERAPIST", "my-schedule")).toBe(true);
    expect(hasRouteAccess("THERAPIST", "my-profile")).toBe(true);
    expect(hasRouteAccess("THERAPIST", "weekly-close")).toBe(true);

    expect(hasRouteAccess("THERAPIST", "invoices")).toBe(false);
    expect(hasRouteAccess("THERAPIST", "payroll")).toBe(false);
    expect(hasRouteAccess("THERAPIST", "users")).toBe(false);
    expect(hasRouteAccess("THERAPIST", "settings")).toBe(false);
    expect(hasRouteAccess("THERAPIST", "audit-logs")).toBe(false);
  });

  it("restricts coordinator correctly", () => {
    expect(hasRouteAccess("COORDINATOR", "patients")).toBe(true);
    expect(hasRouteAccess("COORDINATOR", "visits")).toBe(true);
    expect(hasRouteAccess("COORDINATOR", "tasks")).toBe(true);
    expect(hasRouteAccess("COORDINATOR", "my-labor")).toBe(true);
    expect(hasRouteAccess("COORDINATOR", "referrals")).toBe(true);

    expect(hasRouteAccess("COORDINATOR", "invoices")).toBe(false);
    expect(hasRouteAccess("COORDINATOR", "therapists")).toBe(false);
  });

  it("restricts HR to therapists and HR routes", () => {
    expect(hasRouteAccess("HR", "therapists")).toBe(true);
    expect(hasRouteAccess("HR", "hr")).toBe(true);
    expect(hasRouteAccess("HR", "dashboard")).toBe(true);

    expect(hasRouteAccess("HR", "patients")).toBe(false);
    expect(hasRouteAccess("HR", "invoices")).toBe(false);
  });

  it("restricts guest to dashboard only", () => {
    expect(hasRouteAccess("GUEST", "dashboard")).toBe(true);
    expect(hasRouteAccess("GUEST", "patients")).toBe(false);
    expect(hasRouteAccess("GUEST", "visits")).toBe(false);
  });

  it("restricts client to dashboard only", () => {
    expect(hasRouteAccess("CLIENT", "dashboard")).toBe(true);
    expect(hasRouteAccess("CLIENT", "patients")).toBe(false);
  });

  it("superuser has access to everything admin has", () => {
    const adminRoutes = getAccessibleRoutes("ADMIN");
    const superuserRoutes = getAccessibleRoutes("SUPERUSER");
    adminRoutes.forEach((route) => {
      expect(superuserRoutes).toContain(route);
    });
  });
});

describe("getAccessibleRoutes", () => {
  it("returns correct number of routes per role", () => {
    expect(getAccessibleRoutes("ADMIN").length).toBeGreaterThan(15);
    expect(getAccessibleRoutes("THERAPIST").length).toBeGreaterThan(5);
    expect(getAccessibleRoutes("GUEST").length).toBe(1);
  });
});

describe("hasRouteAccessByPath", () => {
  it("checks path-based access", () => {
    expect(hasRouteAccessByPath("ADMIN", "/patients")).toBe(true);
    expect(hasRouteAccessByPath("ADMIN", "/patients/123")).toBe(true);
    expect(hasRouteAccessByPath("GUEST", "/patients")).toBe(false);
  });

  it("allows root path for everyone", () => {
    const types: UserType[] = [
      "SUPERUSER",
      "ADMIN",
      "THERAPIST",
      "COORDINATOR",
      "HR",
      "GUEST",
      "CLIENT",
    ];
    types.forEach((t) => {
      expect(hasRouteAccessByPath(t, "/")).toBe(true);
    });
  });

  it("allows unknown routes by default", () => {
    expect(hasRouteAccessByPath("GUEST", "/unknown-route")).toBe(true);
  });
});

describe("Resource permissions", () => {
  it("admin can CRUD patients", () => {
    expect(hasResourceAccess("ADMIN", "patient", "view")).toBe(true);
    expect(hasResourceAccess("ADMIN", "patient", "create")).toBe(true);
    expect(hasResourceAccess("ADMIN", "patient", "update")).toBe(true);
    expect(hasResourceAccess("ADMIN", "patient", "delete")).toBe(true);
  });

  it("therapist can view and create visit notes but not delete", () => {
    expect(hasResourceAccess("THERAPIST", "visitNote", "view")).toBe(true);
    expect(hasResourceAccess("THERAPIST", "visitNote", "create")).toBe(true);
    expect(hasResourceAccess("THERAPIST", "visitNote", "update")).toBe(true);
    expect(hasResourceAccess("THERAPIST", "visitNote", "sign")).toBe(true);
    expect(hasResourceAccess("THERAPIST", "visitNote", "delete")).toBe(false);
  });

  it("coordinator can view patients but not delete", () => {
    expect(hasResourceAccess("COORDINATOR", "patient", "view")).toBe(true);
    expect(hasResourceAccess("COORDINATOR", "patient", "create")).toBe(true);
    expect(hasResourceAccess("COORDINATOR", "patient", "delete")).toBe(false);
  });

  it("guest has no resource access", () => {
    expect(hasResourceAccess("GUEST", "patient", "view")).toBe(false);
    expect(hasResourceAccess("GUEST", "visitNote", "view")).toBe(false);
    expect(hasResourceAccess("GUEST", "invoice", "view")).toBe(false);
  });

  it("only admin can view audit logs", () => {
    expect(hasResourceAccess("ADMIN", "auditLog", "view")).toBe(true);
    expect(hasResourceAccess("SUPERUSER", "auditLog", "view")).toBe(true);
    expect(hasResourceAccess("THERAPIST", "auditLog", "view")).toBe(false);
    expect(hasResourceAccess("COORDINATOR", "auditLog", "view")).toBe(false);
  });

  it("returns false for unknown resource", () => {
    expect(hasResourceAccess("ADMIN", "nonexistent", "view")).toBe(false);
  });
});
