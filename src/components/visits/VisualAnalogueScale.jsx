"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

function getSliderColor(value) {
  return getPainInfo(value).color;
}

export default function VisualAnalogueScale({ value, onChange, painLocation, onPainLocationChange }) {
  const numVal = Number(value) || 0;
  const info = getPainInfo(numVal);
  const percent = (numVal / 10) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800">
          Visual Analogue Scale (VAS) — Pain Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Pain Location */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Pain Location</label>
          <input
            type="text"
            placeholder="Describe the location of pain (e.g. lower back, left knee)..."
            value={painLocation || ""}
            onChange={(e) => onPainLocationChange && onPainLocationChange(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Current Value Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{info.emoji}</span>
            <div>
              <p className="text-2xl font-bold" style={{ color: info.color }}>{numVal}/10</p>
              <p className="text-sm font-medium text-slate-600">{info.label}</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>Visual Analogue Scale</p>
            <p>0 = No pain, 10 = Worst imaginable pain</p>
          </div>
        </div>

        {/* Gradient Bar + Slider */}
        <div className="space-y-2">
          <div
            className="relative h-6 rounded-full"
            style={{
              background: "linear-gradient(to right, #22c55e, #84cc16, #eab308, #f97316, #ef4444, #991b1b)",
            }}
          >
            {/* Thumb indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-4 shadow-md transition-all"
              style={{ left: `calc(${percent}% - 12px)`, borderColor: info.color }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={numVal}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 opacity-0 cursor-pointer -mt-7 relative z-10"
            style={{ marginTop: "-1.75rem" }}
          />
        </div>

        {/* Scale Labels */}
        <div className="flex justify-between text-xs text-slate-500 font-medium pt-1">
          {PAIN_LABELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => onChange(l.value)}
              className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <span className="text-base">{l.emoji}</span>
              <span>{l.value}</span>
              <span className="hidden sm:block text-[10px] text-center leading-tight max-w-12">{l.label}</span>
            </button>
          ))}
        </div>

        {/* Faces Scale Reference */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
          {PAIN_LABELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => onChange(l.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                numVal === l.value
                  ? "border-current bg-slate-50"
                  : "border-transparent hover:border-slate-200"
              }`}
              style={numVal === l.value ? { borderColor: l.color } : {}}
            >
              <span className="text-xl">{l.emoji}</span>
              <span className="text-xs font-semibold" style={{ color: l.color }}>{l.value}</span>
              <span className="text-[10px] text-slate-500 text-center leading-tight">{l.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
