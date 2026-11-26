import rows from "./us-postal-areas.json";

type PostalArea = { zip: string; city: string; stateName: string; state: string; county: string; lat: number; lng: number };
const postalAreas = (rows as [string, string, string, string, string, number, number][]).map(
  ([zip, city, stateName, state, county, lat, lng]): PostalArea => ({ zip, city, stateName, state, county, lat, lng }),
);

export function listCoverageStates() {
  return [...new Map(postalAreas.map(({ state, stateName }) => [state, stateName])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1]));
}

export function coverageCounties(state: string) {
  const areas = postalAreas.filter((area) => area.state === state);
  const groups = new Map<string, PostalArea[]>();
  for (const area of areas) {
    if (!area.county) continue;
    const entries = groups.get(area.county) ?? [];
    entries.push(area);
    groups.set(area.county, entries);
  }
  const center = (entries: PostalArea[]) => ({
    lat: entries.reduce((total, area) => total + area.lat, 0) / entries.length,
    lng: entries.reduce((total, area) => total + area.lng, 0) / entries.length,
  });
  return {
    center: areas.length ? center(areas) : null,
    counties: [...groups.entries()].map(([name, entries]) => ({ name, ...center(entries) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function resolvePostalArea({ zip = "", city = "", state = "" }) {
  const postalCode = zip.trim().match(/^\d{5}(?=-\d{4}$|$)/)?.[0];
  const cleanCity = city.trim().toLowerCase();
  const cleanState = state.trim().toLowerCase();
  if ((zip.trim() && !postalCode) || (!postalCode && !(cleanCity && cleanState))) return null;
  const matches = postalAreas.filter((area) =>
    (!postalCode || area.zip === postalCode) &&
    (!cleanState || area.state.toLowerCase() === cleanState || area.stateName.toLowerCase() === cleanState) &&
    (postalCode || area.city.toLowerCase() === cleanCity),
  );
  return matches.find((area) => area.city.toLowerCase() === cleanCity) ?? matches[0] ?? null;
}
