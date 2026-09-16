"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DictationTextarea } from "./DictationButton";

const PT_OT_ITEMS = [
  "Therapeutic Exercise", "Neuromuscular Re-education", "Gait Training",
  "Therapeutic Activities", "Manual Therapy", "Self-Care / Home Management Training",
  "Caregiver / Patient Education", "Transfer Training", "Wheelchair Management",
  "Prosthetic / Orthotic Training", "Community Re-integration", "Work Hardening / Conditioning",
];

const SLP_ITEMS = [
  "Cognitive Skills Training", "Swallowing Therapy", "Speech/Language Treatment",
  "Voice Treatment", "Augmentative Communication Training", "Caregiver / Patient Education",
  "Oral Motor Exercises", "Dysphagia Management", "Aphasia Treatment",
  "Apraxia Treatment", "Fluency Treatment", "AAC Training",
];

const MINUTES_OPTIONS = ["", "5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80", "85", "90"];

export default function TreatmentRenderedSection({ treatmentRendered = {}, onChange, therapyType }) {
  const isSLP = therapyType === "Speech Therapy";
  const TREATMENT_ITEMS = isSLP ? SLP_ITEMS : PT_OT_ITEMS;

  const treatments = treatmentRendered.items || {};
  const setItem = (key, field, value) => {
    onChange({
      ...treatmentRendered,
      items: {
        ...treatments,
        [key]: { ...(treatments[key] || {}), [field]: value },
      },
    });
  };

  const setTop = (field, value) => onChange({ ...treatmentRendered, [field]: value });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800">Treatment Rendered</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b">
                <th className="text-left py-2 px-3 font-semibold text-slate-700 w-48">Treatment</th>
                <th className="text-center py-2 px-2 font-semibold text-slate-700 w-14">Done</th>
                <th className="text-center py-2 px-2 font-semibold text-slate-700 w-24">Minutes</th>
                {!isSLP && <th className="text-left py-2 px-2 font-semibold text-slate-700">Description</th>}
              </tr>
            </thead>
            <tbody>
              {TREATMENT_ITEMS.map((item, i) => {
                const key = item.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
                const row = treatments[key] || {};
                return (
                  <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="py-2 px-3 text-slate-700 font-medium">{item}</td>
                    <td className="py-2 px-2 text-center">
                      <input type="checkbox" checked={!!row.done} onChange={(e) => setItem(key, "done", e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Select value={row.minutes || ""} onValueChange={(v) => setItem(key, "minutes", v === "__none__" ? "" : v)}>
                        <SelectTrigger className="h-7 w-20 text-xs px-1"><SelectValue placeholder="--" /></SelectTrigger>
                        <SelectContent>
                          {MINUTES_OPTIONS.map((m) => (
                            <SelectItem key={m || "__none__"} value={m || "__none__"}>{m || "--"}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    {!isSLP && (
                      <td className="py-2 px-2">
                        <Input value={row.description || ""} onChange={(e) => setItem(key, "description", e.target.value)} placeholder="Description..." className="h-7 text-xs" />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pt-2">
          <Label className="text-sm text-slate-700 font-medium">Other Treatment / Notes</Label>
          <div className="relative mt-1">
            <DictationTextarea maxLength={500} placeholder="Describe any additional treatment rendered this visit..." value={treatmentRendered.notes || ""} onChange={(e) => setTop("notes", e.target.value)} rows={3} />
            <span className="absolute right-2 bottom-2 text-xs text-slate-400">{(treatmentRendered.notes || "").length} of 500</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
