import { expect, it, vi } from "vitest";
import { createVitalAlert } from "./vital-alerts";

it("notifies coordinators only on the first abnormal save", async () => {
  const db = {
    $queryRaw: vi.fn().mockResolvedValue([{ ready: true }]),
    patient: { findUnique: vi.fn().mockResolvedValue({ agencyId: "agency" }) },
    agency: { findUnique: vi.fn().mockResolvedValue({
      vitalSignsConfig: { limits: { oxygen_saturation: { lower: 92 } } },
    }) },
    communicationNote: { createMany: vi.fn()
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 }) },
    user: { findMany: vi.fn().mockResolvedValue([{ id: "coordinator", email: "coord@example.test" }]) },
    notification: { createMany: vi.fn() },
  };
  const visit = {
    id: "visit", patientId: "patient", patientName: "Test Patient",
    vitals: { oxygen_saturation: "90" },
  };
  const user = { id: "author", email: "author@example.test" };
  await createVitalAlert(db, visit, user);
  await createVitalAlert(db, visit, user);
  await createVitalAlert(db, { ...visit, vitals: { oxygen_saturation: "95" } }, user);

  expect(db.communicationNote.createMany).toHaveBeenCalledTimes(2);
  expect(db.communicationNote.createMany).toHaveBeenCalledWith({
    data: [expect.objectContaining({ vitalVisitId: "visit", noteType: "URGENT", note: expect.stringContaining("90") })],
    skipDuplicates: true,
  });
  expect(db.notification.createMany).toHaveBeenCalledExactlyOnceWith({
    data: [expect.objectContaining({ recipientId: "coordinator", link: "/Communications" })],
  });
});

it("uses default bounds for blank limits and skips unavailable alert storage", async () => {
  const db = {
    patient: { findUnique: vi.fn().mockResolvedValue({ agencyId: "agency" }) },
    agency: { findUnique: vi.fn().mockResolvedValue({ vitalSignsConfig: { limits: { oxygen_saturation: { lower: "" } } } }) },
    $queryRaw: vi.fn().mockResolvedValue([{ ready: false }]),
    communicationNote: { createMany: vi.fn() },
  };
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  try {
    await createVitalAlert(db, { id: "visit", patientId: "patient", vitals: { oxygen_saturation: 94 } }, {});
    expect(db.$queryRaw).toHaveBeenCalledOnce();
    expect(db.communicationNote.createMany).not.toHaveBeenCalled();
  } finally {
    warn.mockRestore();
  }
});
