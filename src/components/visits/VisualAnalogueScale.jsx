"use client";

import React from "react";
import { Input } from "@/components/ui/input";

const PAIN_LABELS = [
  { value: 0, label: "No Pain", emoji: "😊", color: "#22c55e" },
  { value: 2, label: "Mild", emoji: "🙂", color: "#84cc16" },
  { value: 4, label: "Moderate", emoji: "😐", color: "#eab308" },
  { value: 6, label: "Severe", emoji: "😟", color: "#f97316" },
  { value: 8, label: "Very Severe", emoji: "😣", color: "#ef4444" },
  { value: 10, label: "Worst Pain", emoji: "😭", color: "#991b1b" },
];

function getPainInfo(value) {
  const v = Number(value) || 0;
  if (v === 0) return PAIN_LABELS[0];
  if (v <= 2) return PAIN_LABELS[1];
  if (v <= 4) return PAIN_LABELS[2];
  if (v <= 6) return PAIN_LABELS[3];
  if (v <= 8) return PAIN_LABELS[4];
  return PAIN_LABELS[5];
}

export default function VisualAnalogueScale({ value, onChange, painLocation, onPainLocationChange, siteNumber, onRemove }) {
  const score = Number(value) || 0;
  const info = getPainInfo(score);
  return (
    <fieldset className="space-y-3 rounded-md border p-3">
      <legend className="px-1 text-sm font-medium">Site {siteNumber}</legend>
      <div className="flex flex-wrap items-center gap-2">
        <Input className="min-w-48 flex-1" aria-label={`Site ${siteNumber} pain location`}
          placeholder="Pain location (e.g. lower back, left knee)" value={painLocation ?? ""}
          onChange={(event) => onPainLocationChange(event.target.value)} />
        <span className="text-sm font-semibold" style={{ color: info.color }}>
          {value === "" || value == null ? "No score entered" : `${score}/10 · ${info.label}`}
        </span>
        {onRemove && <button type="button" className="text-sm text-red-700" onClick={onRemove}>Remove Site</button>}
      </div>
      <input type="range" aria-label={`Site ${siteNumber} VAS score`} min={0} max={10} step={1} value={score}
        onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-teal-700" />
      <div className="flex flex-wrap justify-between gap-1">
        {PAIN_LABELS.map((level) => (
          <button key={level.value} type="button" aria-pressed={value !== "" && value != null && score === level.value}
            className="rounded px-2 py-1 text-xs hover:bg-slate-100 aria-pressed:bg-teal-100"
            onClick={() => onChange(level.value)}>{level.emoji} {level.value} {level.label}</button>
        ))}
      </div>
    </fieldset>
  );
}
