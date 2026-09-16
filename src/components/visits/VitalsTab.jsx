"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DictationTextarea } from "./DictationButton";
import VisualAnalogueScale from "./VisualAnalogueScale";

export default function VitalsTab({ form, set }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-800">Vital Signs <span className="text-red-500 text-sm">★</span></CardTitle>
            <Button type="button" variant="outline" size="sm"
              className={`gap-2 ${form.vitals_not_taken_reason !== undefined && form.vitals_not_taken_reason !== null ? "bg-orange-50 border-orange-400 text-orange-800" : "border-orange-300 text-orange-700 hover:bg-orange-50"}`}
              onClick={() => { if (form.vitals_not_taken_reason !== undefined && form.vitals_not_taken_reason !== null) set("vitals_not_taken_reason", null); else set("vitals_not_taken_reason", ""); }}>
              Vitals Not Taken
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.vitals_not_taken_reason !== undefined && form.vitals_not_taken_reason !== null ? (
            <div className="border border-orange-200 bg-orange-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-orange-800">Reason vitals were not taken <span className="text-red-500">★</span></p>
              <DictationTextarea placeholder="e.g. Patient refused, equipment unavailable..." value={form.vitals_not_taken_reason || ""} onChange={(e) => set("vitals_not_taken_reason", e.target.value)} rows={2} className="text-sm bg-white" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><Label>Blood Pressure</Label><Input placeholder="120/80" value={form.vitals?.blood_pressure || ""} onChange={(e) => set("vitals", { ...form.vitals, blood_pressure: e.target.value })} /></div>
              <div><Label>Heart Rate (bpm)</Label><Input type="number" placeholder="72" value={form.vitals?.heart_rate || ""} onChange={(e) => set("vitals", { ...form.vitals, heart_rate: e.target.value ? parseInt(e.target.value) : "" })} /></div>
              <div><Label>Respiratory Rate (rpm)</Label><Input type="number" placeholder="16" value={form.vitals?.respiratory_rate || ""} onChange={(e) => set("vitals", { ...form.vitals, respiratory_rate: e.target.value ? parseInt(e.target.value) : "" })} /></div>
              <div><Label>Temperature (F)</Label><Input type="number" step="0.1" placeholder="98.6" value={form.vitals?.temperature || ""} onChange={(e) => set("vitals", { ...form.vitals, temperature: e.target.value ? parseFloat(e.target.value) : "" })} /></div>
              <div><Label>O2 Saturation (%)</Label><Input type="number" placeholder="98" value={form.vitals?.oxygen_saturation || ""} onChange={(e) => set("vitals", { ...form.vitals, oxygen_saturation: e.target.value ? parseInt(e.target.value) : "" })} /></div>
            </div>
          )}
        </CardContent>
      </Card>

      <VisualAnalogueScale value={form.vas_pain_score ?? ""} onChange={(v) => set("vas_pain_score", v)} painLocation={form.pain_location || ""} onPainLocationChange={(v) => set("pain_location", v)} />

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800">Frequency of Pain interfering with activity or movement</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {["No pain or pain does not interfere with activity or movement.", "Less often than daily.", "Daily, but not constantly.", "All of the time."].map((option) => (
              <label key={option} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="pain_frequency" value={option} checked={form.pain_frequency === option} onChange={() => set("pain_frequency", option)} className="w-4 h-4 text-teal-600 cursor-pointer" />
                <span className="text-sm text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {form.visit_type === "evaluation" && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-blue-700">Pain Management Effectiveness</CardTitle></CardHeader>
          <CardContent>
            <div className="relative">
              <DictationTextarea placeholder="" maxLength={100} value={form.pain_management_effectiveness || ""} onChange={(e) => set("pain_management_effectiveness", e.target.value)} rows={3} />
              <span className="absolute right-2 bottom-2 text-xs text-amber-600">of 100</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
