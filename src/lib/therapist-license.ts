export function licenseBlocksAccess(files: unknown, currentDate = new Date().toISOString().slice(0, 10)) {
  if (!files || typeof files !== "object" || !("license_settings" in files)) return false;
  const settings = files.license_settings;
  if (!settings || typeof settings !== "object") return false;
  const { expiration_date, suspend_on_expiry } = settings as Record<string, unknown>;
  return suspend_on_expiry === true &&
    typeof expiration_date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(expiration_date) &&
    expiration_date < currentDate;
}
