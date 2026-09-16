import type { UserType, Discipline, Role } from "@/lib/types/enums";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  userType: UserType;
  therapistId: string | null;
  discipline: Discipline | null;
}

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
  userType: UserType;
  therapistId: string | null;
  discipline: Discipline | null;
}

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }

  interface User {
    role: Role;
    userType: UserType;
    therapistId: string | null;
    discipline: Discipline | null;
  }
}
