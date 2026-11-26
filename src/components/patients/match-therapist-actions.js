"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { resolvePostalArea } from "@/lib/geo/postal-areas";
import { milesToCoverageBoundary, normalizeServiceArea, pointInArea } from "@/lib/geo/service-area";
import { canAssignTherapist, normalizeDiscipline } from "@/lib/assignments/eligibility";
import { licenseBlocksAccess } from "@/lib/therapist-license";
import { findPayerRules } from "@/lib/payer-rules";

export async function findReferralTherapists({ zip, city, state, therapyTypes, agency, insurance }) {
  await requireRole("SUPERUSER", "ADMIN", "COORDINATOR");
  const area = resolvePostalArea({ zip, city, state });
  const disciplines = [...new Set(therapyTypes.map(normalizeDiscipline).filter(Boolean))];
  const [therapists, agencyRecord, payerRules] = await Promise.all([
    prisma.therapist.findMany({
      where: { status: "ACTIVE", discipline: { in: disciplines } },
      select: { id: true, fullName: true, discipline: true, credentials: true, status: true, personalFiles: true, facilities: true,
        user: { select: { isActive: true } } },
      orderBy: { fullName: "asc" },
    }),
    agency ? prisma.agency.findFirst({
      where: { name: { equals: agency, mode: "insensitive" } },
      select: { id: true, name: true, assistantsAllowed: true },
    }) : null,
    findPayerRules(insurance),
  ]);
  const agencyTherapists = new Set(agencyRecord && therapists.length
    ? (await prisma.visitNote.findMany({
        where: { agencyId: agencyRecord.id, therapistId: { in: therapists.map(({ id }) => id) }, status: { in: ["COMPLETED", "SIGNED"] } },
        distinct: ["therapistId"],
        select: { therapistId: true },
      })).map(({ therapistId }) => therapistId)
    : []);
  const assistantsAllowed = agencyRecord?.assistantsAllowed !== false && payerRules?.assistantsNotAllowed !== true;
  const matches = therapists.flatMap((therapist) => {
    if (therapist.user?.isActive === false || licenseBlocksAccess(therapist.personalFiles)) return [];
    const coverage = normalizeServiceArea(therapist.personalFiles?.service_area);
    const sameState = Boolean(area && coverage.state === area.state);
    const hasBoundary = sameState && coverage.points.length >= 3;
    const inside = hasBoundary && pointInArea([area.lat, area.lng], coverage.points);
    const county = sameState && coverage.counties.includes(area.county);
    const statewide = sameState && !coverage.counties.length && !coverage.points.length;
    if (area && !inside && !county && !statewide) return [];

    const worksWithAgency = agencyRecord && (agencyTherapists.has(therapist.id) ||
      therapist.facilities.some((facility) =>
        facility.trim().toLowerCase() === agencyRecord.name.toLowerCase() || facility === agencyRecord.id,
      ));
    const reasons = [];
    if (inside) reasons.push("Postal area center is inside the preferred coverage map");
    if (county) reasons.push(`Covers ${area.county}`);
    if (statewide) reasons.push(`Covers ${area.stateName} statewide`);
    if (hasBoundary && !inside) {
      const miles = milesToCoverageBoundary([area.lat, area.lng], coverage.points);
      reasons.push(`About ${miles.toFixed(1)} miles from the preferred coverage boundary`);
    }
    if (worksWithAgency) reasons.push(`Works with ${agencyRecord.name}`);
    if (!area) reasons.push("Address coverage unverified");
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
      rank: inside ? 3 : county ? 2 : statewide ? 1 : 0,
      worksWithAgency: Boolean(worksWithAgency),
      reasons,
    }];
  }).sort((a, b) => b.rank - a.rank || Number(b.worksWithAgency) - Number(a.worksWithAgency) || a.name.localeCompare(b.name));
  return { matches, location: area ? `${area.city}, ${area.state} ${area.zip}` : null };
}
