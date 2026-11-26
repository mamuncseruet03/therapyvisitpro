export async function executePatientDeletion(tx, patientId) {
  const patient = await tx.patient.findUniqueOrThrow({
    where: { id: patientId },
    select: { firstName: true, lastName: true },
  });
  const billedVisit = await tx.invoiceLineItem.findFirst({
    where: { visitNote: { patientId } },
    select: { id: true },
  });
  if (billedVisit) throw new Error("This patient has invoiced visits and cannot be deleted.");
  await tx.deletionRequest.deleteMany({ where: { patientId } });
  await tx.referralAssignment.deleteMany({ where: { patientId } });
  await tx.referral.updateMany({ where: { patientId }, data: { patientId: null } });
  await tx.visitNote.deleteMany({ where: { patientId } });
  await tx.patient.delete({ where: { id: patientId } });
  return patient;
}
