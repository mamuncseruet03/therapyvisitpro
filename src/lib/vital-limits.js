export const VITAL_LIMIT_FIELDS = [
  ["systolic", "Systolic blood pressure (mmHg)", "blood_pressure"],
  ["diastolic", "Diastolic blood pressure (mmHg)", "blood_pressure"],
  ["heart_rate", "Heart rate (bpm)"],
  ["respiratory_rate", "Respiratory rate (rpm)"],
  ["temperature", "Temperature (°F)"],
  ["oxygen_saturation", "Oxygen saturation (%)"],
];

function numberOrMissing(value) {
  if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function getOutOfRangeVitals(vitals, config) {
  const [systolic, diastolic] = String(vitals?.blood_pressure ?? "").split("/");
  const readings = { ...vitals, systolic, diastolic };
  return VITAL_LIMIT_FIELDS.flatMap(([key, label, field = key]) => {
    if (Array.isArray(config?.enabled) && !config.enabled.includes(field)) return [];
    const reading = numberOrMissing(readings[key]);
    const lower = numberOrMissing(config?.limits?.[key]?.lower);
    const upper = numberOrMissing(config?.limits?.[key]?.upper);
    if (reading === null || (lower !== null && upper !== null && lower > upper)) return [];
    return (lower !== null && reading < lower) || (upper !== null && reading > upper)
      ? [{ key, label, reading, lower, upper }]
      : [];
  });
}
