import { expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { findPayerRules } from "@/lib/payer-rules";
import { createInvoice, getCompletedVisitsForInvoice } from "./actions";

vi.mock("@/lib/db", () => ({
  prisma: { agency: { findUnique: vi.fn() }, visitNote: { findMany: vi.fn() }, invoice: { create: vi.fn() } },
}));
vi.mock("@/lib/payer-rules", () => ({ findPayerRules: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requireRole: vi.fn(), requireAuth: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));
vi.mock("@/lib/audit/logger", () => ({ getClientIp: vi.fn() }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));

it("recalculates the saved total for payer rates, including zero, and preserves other lines", async () => {
  prisma.agency.findUnique.mockResolvedValue({ id: "agency", name: "Agency" });
  prisma.visitNote.findMany.mockResolvedValue([
    { id: "one", therapyType: "PHYSICAL_THERAPY", visitType: "TREATMENT", patient: { insurance: "Payer" } },
    { id: "two", therapyType: "OCCUPATIONAL_THERAPY", visitType: "TREATMENT", patient: { insurance: "Payer" } },
    { id: "three", therapyType: "SPEECH_THERAPY", visitType: "TREATMENT" },
  ]);
  findPayerRules.mockResolvedValue({ specialRates: { "PT:treatment": 85.5, "OT:treatment": 0 } });
  prisma.invoice.create.mockImplementation(async ({ data }) => ({ id: "invoice", totalAmount: data.totalAmount }));
  await createInvoice({
    agency_id: "agency",
    date_from: "2026-11-01",
    date_to: "2026-11-30",
    total_amount: 230,
    line_items: [
      { visit_note_id: "one", rate: 90, quantity: 2, subtotal: 180 },
      { visit_note_id: "two", rate: 20, subtotal: 20 },
      { visit_note_id: "three", rate: 30, subtotal: 30 },
    ].map((line) => ({ ...line, visit_date: "2026-11-15" })),
  });
  const { data } = prisma.invoice.create.mock.calls[0][0];
  expect(data.totalAmount).toBe(201);
  expect(data.lineItems.create.map(({ subtotal }) => subtotal)).toEqual([171, 0, 30]);
});

it("lists a legacy completed visit against its patient agency and preserves zero pricing", async () => {
  prisma.visitNote.findMany.mockResolvedValue([
    { id: "legacy", agencyId: null, patient: { agencyId: "agency" }, status: "COMPLETED", specialPrice: 0 },
    { id: "assigned", agencyId: "original", patient: { agencyId: "different" }, status: "SIGNED" },
    { id: "excluded", agencyId: "agency", status: "COMPLETED", nonBillable: true },
  ]);

  const visits = await getCompletedVisitsForInvoice();
  expect(visits).toEqual([
    expect.objectContaining({ id: "legacy", agency_id: "agency", special_price: 0 }),
    expect.objectContaining({ id: "assigned", agency_id: "original" }),
  ]);
});

it("includes a legacy visit through its patient agency when creating an invoice", async () => {
  prisma.agency.findUnique.mockResolvedValue({ id: "agency", name: "Agency" });
  prisma.visitNote.findMany.mockResolvedValue([{ id: "legacy", patient: { agencyId: "agency" } }]);
  prisma.invoice.create.mockImplementation(async ({ data }) => ({ id: "legacy-invoice", totalAmount: data.totalAmount }));

  await expect(createInvoice({
    agency_id: "agency",
    date_from: "2026-11-01",
    date_to: "2026-11-30",
    line_items: [{ visit_note_id: "legacy", visit_date: "2026-11-26", rate: 87.25, subtotal: 87.25 }],
  })).resolves.toMatchObject({ id: "legacy-invoice" });

  expect(prisma.visitNote.findMany).toHaveBeenLastCalledWith(expect.objectContaining({
    where: {
      id: { in: ["legacy"] },
      OR: [{ agencyId: "agency" }, { agencyId: null, patient: { agencyId: "agency" } }],
    },
  }));
  expect(prisma.invoice.create).toHaveBeenLastCalledWith(expect.objectContaining({
    data: expect.objectContaining({ totalAmount: 87.25 }),
  }));
});
