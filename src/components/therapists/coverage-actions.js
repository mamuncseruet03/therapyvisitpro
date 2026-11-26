"use server";

import { requireRole } from "@/lib/auth/session";
import { coverageCounties, listCoverageStates } from "@/lib/geo/postal-areas";

export async function getCoverageOptions(state) {
  await requireRole("SUPERUSER", "ADMIN", "COORDINATOR", "HR");
  return { states: listCoverageStates(), ...coverageCounties(state) };
}
