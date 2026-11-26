"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCoverageOptions } from "./coverage-actions";

const MAP_SIZE = 512;
const TILE_SIZE = 256;

function project([lat, lng], zoom) {
  const size = TILE_SIZE * 2 ** zoom;
  const radians = lat * Math.PI / 180;
  return [(lng + 180) / 360 * size, (1 - Math.asinh(Math.tan(radians)) / Math.PI) * size / 2];
}

function unproject([x, y], zoom) {
  const size = TILE_SIZE * 2 ** zoom;
  return [
    Math.max(-85, Math.min(85, Math.atan(Math.sinh(Math.PI * (1 - 2 * y / size))) * 180 / Math.PI)),
    ((x / size * 360 + 180) % 360 + 360) % 360 - 180,
  ];
}

export default function TherapistCoverage({ value, onChange }) {
  const { state = "", counties = [], points = [] } = value || {};
  const [options, setOptions] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [failedTiles, setFailedTiles] = useState(false);
  const [view, setView] = useState(null);
  useEffect(() => {
    let active = true;
    getCoverageOptions(state).then((data) => {
      if (active) {
        setOptions(data);
        setLoadError(false);
      }
    }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [state]);

  const selectedCounty = options?.counties.find(({ name }) => name === counties[0]);
  const fallback = selectedCounty ?? options?.center;
  const center = view?.center ?? points[0] ?? (fallback ? [fallback.lat, fallback.lng] : [39.5, -98.35]);
  const zoom = view?.zoom ?? (points.length || selectedCounty ? 9 : 6);
  const [centerX, centerY] = project(center, zoom);
  const left = centerX - MAP_SIZE / 2;
  const top = centerY - MAP_SIZE / 2;
  const tiles = [];
  const tileCount = 2 ** zoom;
  for (let x = Math.floor(left / TILE_SIZE); x <= Math.floor((left + MAP_SIZE) / TILE_SIZE); x++) {
    for (let y = Math.floor(top / TILE_SIZE); y <= Math.floor((top + MAP_SIZE) / TILE_SIZE); y++) {
      if (y >= 0 && y < tileCount) tiles.push({ x, y, column: (x + tileCount) % tileCount });
    }
  }
  const plot = (point) => {
    const [x, y] = project(point, zoom);
    return [x - left, y - top];
  };
  const change = (patch) => onChange({ state, counties, points, ...patch });
  const addPoint = (event) => {
    if (points.length >= 100) return;
    const box = event.currentTarget.getBoundingClientRect();
    const point = unproject([left + (event.clientX - box.left) / box.width * MAP_SIZE,
      top + (event.clientY - box.top) / box.height * MAP_SIZE], zoom);
    setView({ center, zoom });
    change({ points: [...points, point] });
  };
  const pan = (x, y) => setView({ zoom, center: unproject([centerX + x, centerY + y], zoom) });

  return (
    <section aria-label="Service Area" className="space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold">Service Area</h3>
      <label className="grid gap-1 text-sm">
        State
        <select className="rounded border p-2" value={state} onChange={(event) => {
          setView(null);
          change({ state: event.target.value, counties: [], points: [] });
        }}>
          <option value="">Select state</option>
          {options?.states.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </select>
      </label>
      {loadError && <p role="alert">Could not load service-area options.</p>}
      {state && (
        <>
          <fieldset className="max-h-40 overflow-auto rounded border p-2">
            <legend className="text-sm">Counties ({counties.length} selected)</legend>
            {options?.counties.map(({ name }) => (
              <label key={name} className="flex gap-2 text-sm">
                <input type="checkbox" checked={counties.includes(name)} onChange={(event) => {
                  setView(null);
                  change({ counties: event.target.checked ? [...counties, name] : counties.filter((item) => item !== name) });
                }} />
                {name}
              </label>
            ))}
          </fieldset>
          <p className="text-sm">Click the map to outline preferred coverage. Use at least three points.</p>
          <div className="flex flex-wrap gap-1">
            {[["←", -128, 0, "west"], ["↑", 0, -128, "north"], ["↓", 0, 128, "south"], ["→", 128, 0, "east"]].map(([label, x, y, direction]) => (
              <Button key={direction} type="button" size="sm" variant="outline" aria-label={`Pan ${direction}`} onClick={() => pan(x, y)}>{label}</Button>
            ))}
            <Button type="button" size="sm" variant="outline" aria-label="Zoom in" disabled={zoom >= 16} onClick={() => setView({ center, zoom: zoom + 1 })}>+</Button>
            <Button type="button" size="sm" variant="outline" aria-label="Zoom out" disabled={zoom <= 3} onClick={() => setView({ center, zoom: zoom - 1 })}>−</Button>
          </div>
          <div className="relative aspect-square w-full max-w-lg overflow-hidden rounded border bg-slate-100">
            <svg viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`} onClick={addPoint} aria-label="Coverage map" className="h-full w-full cursor-crosshair">
              {tiles.map(({ x, y, column }) => (
                <image key={`${zoom}/${x}/${y}`} href={`https://tile.openstreetmap.org/${zoom}/${column}/${y}.png`}
                  x={x * TILE_SIZE - left} y={y * TILE_SIZE - top} width={TILE_SIZE} height={TILE_SIZE}
                  onError={() => setFailedTiles(true)} />
              ))}
              <polygon points={points.map((point) => plot(point).join(",")).join(" ")} fill={points.length >= 3 ? "#14b8a655" : "none"} stroke="#0f766e" strokeWidth="3" />
              {points.map((point, index) => {
                const [x, y] = plot(point);
                return <circle key={index} cx={x} cy={y} r="5" fill="#0f766e" stroke="white" strokeWidth="2" />;
              })}
            </svg>
          </div>
          {failedTiles && <p role="status" className="text-sm">Some map tiles are unavailable. County selection and saved points are still available.</p>}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="text-xs underline">© OpenStreetMap contributors</a>
          <div className="flex items-center gap-2">
            <span className="text-sm">{points.length} points</span>
            <Button type="button" size="sm" variant="outline" disabled={!points.length} onClick={() => change({ points: points.slice(0, -1) })}>Undo</Button>
            <Button type="button" size="sm" variant="outline" disabled={!points.length} onClick={() => change({ points: [] })}>Clear</Button>
          </div>
          <a href="https://www.geonames.org/export/zip/" target="_blank" rel="noreferrer" className="text-xs underline">Postal data by GeoNames (CC BY 4.0)</a>
        </>
      )}
    </section>
  );
}
