import { getOutOfRangeVitals } from "@/lib/vital-limits";

export async function createVitalAlert(db, visit, user) {
  if (!visit.vitals) return;
  const patient = await db.patient.findUnique({
    where: { id: visit.patientId },
    select: { agencyId: true },
  });
  const agencyId = visit.agencyId || patient?.agencyId;
  if (!agencyId) return;
  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    select: { vitalSignsConfig: true },
  });
  const readings = getOutOfRangeVitals(visit.vitals, agency?.vitalSignsConfig);
  if (!readings.length) return;

  const [{ ready }] = await db.$queryRaw`
    SELECT count(*) = 3 AS ready
    FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'communication_notes'
      AND column_name IN ('vital_visit_id', 'resolved_at', 'resolution')
  `;
  if (!ready) {
    console.warn("Vital alert requires the pending communication notes migration.");
    return;
  }

  const note = readings.map(({ label, reading, lower, upper }) => {
    const limit = lower != null && reading < lower ? `below ${lower}` : `above ${upper}`;
    return `${label}: ${reading} (${limit})`;
  }).join("; ");
  const { count } = await db.communicationNote.createMany({
    data: [{
      vitalVisitId: visit.id,
      patientId: visit.patientId,
      patientName: visit.patientName,
      authorId: user.id,
      authorName: user.name || user.email,
      authorEmail: user.email,
      note,
      noteType: "URGENT",
    }],
    skipDuplicates: true,
  });
  if (!count) return;

  const coordinators = await db.user.findMany({
    where: { userType: "COORDINATOR", isActive: true },
    select: { id: true, email: true },
  });
  if (!coordinators.length) return;
  await db.notification.createMany({
    data: coordinators.map(({ id, email }) => ({
      recipientId: id,
      recipientEmail: email,
      title: "Abnormal vital signs",
      message: `${visit.patientName} has an urgent vital alert to review.`,
      link: "/Communications",
      type: "COMMUNICATION_NOTE",
      relatedId: visit.id,
    })),
  });
}
