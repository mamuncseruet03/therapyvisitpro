"use server";

import { requireRole } from "@/lib/auth/session";

export async function searchIcd10(value) {
  await requireRole("SUPERUSER", "ADMIN", "COORDINATOR", "THERAPIST");
  const terms = typeof value === "string" ? value.trim() : "";
  if (terms.length < 2 || terms.length > 100) return [];
  const url = new URL("https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search");
  url.search = new URLSearchParams({ terms, sf: "code,name", df: "code,name", maxList: "12" });
  const response = await fetch(url, { signal: AbortSignal.timeout(6000), cache: "no-store" });
  if (!response.ok) throw new Error("Diagnosis search is unavailable.");
  const data = await response.json();
  return (Array.isArray(data[3]) ? data[3] : []).flatMap((row) =>
    Array.isArray(row) && typeof row[0] === "string" && typeof row[1] === "string"
      ? [{ code: row[0], description: row[1] }]
      : [],
  );
}
