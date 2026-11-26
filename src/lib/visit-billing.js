export const CPT_REQUIRED_MESSAGE = "Select at least one CPT code for Medicare B or HMO B.";

export function requiresCptCode(payer) {
  return typeof payer === "string" && /^(medicare|hmo)(?: part)? b$/i.test(payer.trim());
}

export function hasCptCode(codes) {
  return Array.isArray(codes) && codes.some((code) => typeof code === "string" && /^[0-9A-Z]{5}$/i.test(code.trim()));
}
