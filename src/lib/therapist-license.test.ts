import { expect, it } from "vitest";
import { licenseBlocksAccess } from "./therapist-license";

it("blocks access only after the configured license expiry date", () => {
  const settings = { expiration_date: "2026-11-25", suspend_on_expiry: true };
  expect(licenseBlocksAccess({ license_settings: settings }, "2026-11-26")).toBe(true);
  expect(licenseBlocksAccess({ license_settings: settings }, "2026-11-25")).toBe(false);
  expect(licenseBlocksAccess({ license_settings: { ...settings, suspend_on_expiry: false } }, "2026-11-26")).toBe(false);
  expect(licenseBlocksAccess({ license_document: "/uploads/license.pdf" }, "2026-11-26")).toBe(false);
});
