export type Point = [number, number];
export type ServiceArea = { state: string; counties: string[]; points: Point[] };

export function normalizeServiceArea(input: unknown): ServiceArea {
  const value = input as Partial<ServiceArea> | null;
  const state = typeof value?.state === "string" && /^[A-Z]{2}$/.test(value.state) ? value.state : "";
  const counties = Array.isArray(value?.counties) && state
    ? [...new Set(value.counties.filter((county) => typeof county === "string" && county.length <= 100))].slice(0, 300)
    : [];
  const points: Point[] = Array.isArray(value?.points) && state
    ? value.points.filter((point): point is Point =>
      Array.isArray(point) && point.length === 2 &&
      point.every(Number.isFinite) && Math.abs(point[0]) <= 85 && Math.abs(point[1]) <= 180,
    ).slice(0, 100)
    : [];
  return { state, counties, points: points.length >= 3 ? points : [] };
}

export function pointInArea([lat, lng]: Point, polygon: Point[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [aLat, aLng] = polygon[i];
    const [bLat, bLng] = polygon[j];
    if ((aLat > lat) !== (bLat > lat) && lng < (bLng - aLng) * (lat - aLat) / (bLat - aLat) + aLng) {
      inside = !inside;
    }
  }
  return inside;
}
