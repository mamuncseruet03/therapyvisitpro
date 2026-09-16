import type { UserType } from "@/lib/types/enums";

export type RouteKey =
  | "dashboard"
  | "patients"
  | "therapists"
  | "agencies"
  | "visits"
  | "invoices"
  | "payroll"
  | "reports"
  | "schedule"
  | "calendar"
  | "tasks"
  | "orders"
  | "users"
  | "settings"
  | "audit-logs"
  | "documents"
  | "hr"
  | "my-schedule"
  | "my-tasks"
  | "my-labor"
  | "my-profile"
  | "weekly-close"
  | "referrals"
  | "communication-notes"
  | "deletion-requests"
  | "announcements";

const ROUTE_PERMISSIONS: Record<RouteKey, UserType[]> = {
  dashboard: ["SUPERUSER", "ADMIN", "THERAPIST", "COORDINATOR", "HR", "GUEST", "CLIENT"],
  patients: ["SUPERUSER", "ADMIN", "THERAPIST", "COORDINATOR"],
  therapists: ["SUPERUSER", "ADMIN", "HR"],
  agencies: ["SUPERUSER", "ADMIN"],
  visits: ["SUPERUSER", "ADMIN", "THERAPIST", "COORDINATOR"],
  invoices: ["SUPERUSER", "ADMIN"],
  payroll: ["SUPERUSER", "ADMIN"],
  reports: ["SUPERUSER", "ADMIN"],
  schedule: ["SUPERUSER", "ADMIN", "COORDINATOR"],
  calendar: ["SUPERUSER", "ADMIN", "COORDINATOR"],
  tasks: ["SUPERUSER", "ADMIN", "COORDINATOR"],
  orders: ["SUPERUSER", "ADMIN"],
  users: ["SUPERUSER", "ADMIN"],
  settings: ["SUPERUSER", "ADMIN"],
  "audit-logs": ["SUPERUSER", "ADMIN"],
  documents: ["SUPERUSER", "ADMIN", "THERAPIST", "COORDINATOR"],
  hr: ["SUPERUSER", "ADMIN", "HR"],
  "my-schedule": ["THERAPIST"],
  "my-tasks": ["THERAPIST", "COORDINATOR"],
  "my-labor": ["COORDINATOR"],
  "my-profile": ["THERAPIST"],
  "weekly-close": ["THERAPIST"],
  referrals: ["SUPERUSER", "ADMIN", "COORDINATOR"],
  "communication-notes": ["SUPERUSER", "ADMIN", "THERAPIST", "COORDINATOR"],
  "deletion-requests": ["SUPERUSER", "ADMIN"],
  announcements: ["SUPERUSER", "ADMIN"],
};

export function hasRouteAccess(userType: UserType, route: RouteKey): boolean {
  const allowed = ROUTE_PERMISSIONS[route];
  return allowed ? allowed.includes(userType) : false;
}

export function getAccessibleRoutes(userType: UserType): RouteKey[] {
  return (Object.keys(ROUTE_PERMISSIONS) as RouteKey[]).filter((route) =>
    ROUTE_PERMISSIONS[route].includes(userType),
  );
}

export function hasRouteAccessByPath(userType: UserType, pathname: string): boolean {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment) return true;

  const routeKey = segment as RouteKey;
  if (!(routeKey in ROUTE_PERMISSIONS)) return true;

  return hasRouteAccess(userType, routeKey);
}

export type ResourceAction = "view" | "create" | "update" | "delete" | "export" | "sign";

const RESOURCE_PERMISSIONS: Record<string, Partial<Record<ResourceAction, UserType[]>>> = {
  patient: {
    view: ["SUPERUSER", "ADMIN", "THERAPIST", "COORDINATOR"],
    create: ["SUPERUSER", "ADMIN", "COORDINATOR"],
    update: ["SUPERUSER", "ADMIN", "COORDINATOR"],
    delete: ["SUPERUSER", "ADMIN"],
  },
  therapist: {
    view: ["SUPERUSER", "ADMIN", "HR", "THERAPIST"],
    create: ["SUPERUSER", "ADMIN"],
    update: ["SUPERUSER", "ADMIN", "HR"],
    delete: ["SUPERUSER", "ADMIN"],
  },
  visitNote: {
    view: ["SUPERUSER", "ADMIN", "THERAPIST", "COORDINATOR"],
    create: ["SUPERUSER", "ADMIN", "THERAPIST"],
    update: ["SUPERUSER", "ADMIN", "THERAPIST"],
    delete: ["SUPERUSER", "ADMIN"],
    sign: ["THERAPIST"],
  },
  invoice: {
    view: ["SUPERUSER", "ADMIN"],
    create: ["SUPERUSER", "ADMIN"],
    update: ["SUPERUSER", "ADMIN"],
    delete: ["SUPERUSER", "ADMIN"],
    export: ["SUPERUSER", "ADMIN"],
  },
  agency: {
    view: ["SUPERUSER", "ADMIN"],
    create: ["SUPERUSER", "ADMIN"],
    update: ["SUPERUSER", "ADMIN"],
    delete: ["SUPERUSER", "ADMIN"],
  },
  user: {
    view: ["SUPERUSER", "ADMIN"],
    create: ["SUPERUSER", "ADMIN"],
    update: ["SUPERUSER", "ADMIN"],
    delete: ["SUPERUSER", "ADMIN"],
  },
  task: {
    view: ["SUPERUSER", "ADMIN", "THERAPIST", "COORDINATOR"],
    create: ["SUPERUSER", "ADMIN", "COORDINATOR"],
    update: ["SUPERUSER", "ADMIN", "COORDINATOR", "THERAPIST"],
  },
  auditLog: {
    view: ["SUPERUSER", "ADMIN"],
    export: ["SUPERUSER", "ADMIN"],
  },
};

export function hasResourceAccess(
  userType: UserType,
  resource: string,
  action: ResourceAction,
): boolean {
  const perms = RESOURCE_PERMISSIONS[resource];
  if (!perms) return false;

  const allowed = perms[action];
  return allowed ? allowed.includes(userType) : false;
}
