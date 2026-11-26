"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { resolvePostalArea } from "@/lib/geo/postal-areas";
import { normalizeServiceArea, pointInArea } from "@/lib/geo/service-area";
import { canAssignTherapist, normalizeDiscipline } from "@/lib/assignments/eligibility";
import { licenseBlocksAccess } from "@/lib/therapist-license";
import { findPayerRules } from "@/lib/payer-rules";

export async function findReferralTherapists({ zip, city, state, therapyTypes, agency, insurance }) {
  await requireRole("SUPERUSER", "ADMIN", "COORDINATOR");
  const area = resolvePostalArea({ zip, city, state });
  if (!area) return { matches: [], location: null };
  const disciplines = [...new Set(therapyTypes.map(normalizeDiscipline).filter(Boolean))];
  const [therapists, agencyRecord, payerRules] = await Promise.all([
    prisma.therapist.findMany({
      where: { status: "ACTIVE", discipline: { in: disciplines } },
      select: { id: true, fullName: true, discipline: true, credentials: true, status: true, personalFiles: true,
        user: { select: { isActive: true } } },
      orderBy: { fullName: "asc" },
    }),
    agency ? prisma.agency.findFirst({
      where: { name: { equals: agency, mode: "insensitive" } },
      select: { assistantsAllowed: true },
    }) : null,
    findPayerRules(insurance),
  ]);
  const assistantsAllowed = agencyRecord?.assistantsAllowed !== false && payerRules?.assistantsNotAllowed !== true;
  const matches = therapists.flatMap((therapist) => {
    const coverage = normalizeServiceArea(therapist.personalFiles?.service_area);
    if (coverage.state !== area.state || therapist.user?.isActive === false || licenseBlocksAccess(therapist.personalFiles)) return [];
    const polygon = coverage.points.length >= 3 && pointInArea([area.lat, area.lng], coverage.points);
    const county = coverage.counties.includes(area.county);
    const stateOnly = !coverage.counties.length && !coverage.points.length;
    if (!polygon && !county && !stateOnly) return [];
    const evaluating = canAssignTherapist(therapist, therapist.discipline, "evaluation");
    const treating = canAssignTherapist(therapist, therapist.discipline, "treatment", assistantsAllowed);
    if (!evaluating && !treating) return [];
    return [{
      id: therapist.id,
      name: therapist.fullName,
      discipline: therapist.discipline,
      credentials: therapist.credentials,
      evaluating,
      treating,
      rank: polygon ? 3 : county ? 2 : 1,
      reason: polygon ? "Postal area center is inside the preferred coverage map" : county ? `Covers ${area.county}` : `Covers ${area.stateName} statewide`,
    }];
  }).sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name));
  return { matches, location: `${area.city}, ${area.state} ${area.zip}` };
}
