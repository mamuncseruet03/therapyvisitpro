"use client";

import React from "react";
import HomeboundSection from "./HomeboundSection";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DictationTextarea } from "./DictationButton";

export default function SubjectiveTab({ form, set }) {
  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800">Subjective</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label className="text-blue-700 font-semibold">Medical History <span className="text-red-500">★</span></Label><DictationTextarea placeholder="Relevant medical history..." value={form.medical_history || ""} onChange={(e) => set("medical_history", e.target.value)} rows={2} className={(form.medical_history || "").trim().length < 2 ? "border-red-300" : ""} /></div>
          <div><Label className="text-blue-700 font-semibold">Past Surgical History <span className="text-red-500">★</span></Label><DictationTextarea placeholder="Previous surgeries..." value={form.past_surgical_history || ""} onChange={(e) => set("past_surgical_history", e.target.value)} rows={2} className={(form.past_surgical_history || "").trim().length < 2 ? "border-red-300" : ""} /></div>
          <div><Label className="text-blue-700 font-semibold">Reason for Referral <span className="text-red-500">★</span></Label><DictationTextarea placeholder="Chief complaint..." value={form.subjective || ""} onChange={(e) => set("subjective", e.target.value)} rows={2} className={(form.subjective || "").trim().length < 2 ? "border-red-300" : ""} /></div>
          <div><Label className="text-blue-700 font-semibold">Prior Level of Function <span className="text-red-500">★</span></Label><DictationTextarea placeholder="Functional abilities prior..." value={form.prior_function || ""} onChange={(e) => set("prior_function", e.target.value)} rows={2} className={(form.prior_function || "").trim().length < 2 ? "border-red-300" : ""} /></div>
          <div><Label className="text-blue-700 font-semibold">Living Environment <span className="text-red-500">★</span></Label><DictationTextarea placeholder="Home setup, stairs..." value={form.living_environment || ""} onChange={(e) => set("living_environment", e.target.value)} rows={2} className={(form.living_environment || "").trim().length < 2 ? "border-red-300" : ""} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label className="text-blue-700 font-semibold">Equipment / DME at Home</Label><DictationTextarea value={form.equipment_dme_home || ""} onChange={(e) => set("equipment_dme_home", e.target.value)} rows={2} /></div>
            <div><Label className="text-blue-700 font-semibold">Caregiver Support</Label><DictationTextarea value={form.caregiver_support || ""} onChange={(e) => set("caregiver_support", e.target.value)} rows={2} /></div>
          </div>
          <div className="rounded-lg border p-3"><Label className="mb-2 block text-blue-700 font-semibold">Fall History</Label><div className="flex items-center gap-5">{["Yes", "No"].map((choice) => <label key={choice} className="flex items-center gap-2 text-sm"><input type="radio" name="fall_history" checked={form.fall_history === choice} onChange={() => set("fall_history", choice)} />{choice}</label>)}</div>{form.fall_history === "Yes" && <Input className="mt-3 max-w-xs" type="number" min="0" placeholder="Falls in last 3 months" value={form.falls_last_3_months || ""} onChange={(e) => set("falls_last_3_months", e.target.value)} />}</div>

          {(form.visit_type === "treatment" || form.therapy_type === "Physical Therapy" || form.therapy_type === "Occupational Therapy") && (
            <HomeboundSection form={form} set={set} />
          )}

          <div><Label className="text-blue-700 font-semibold">Patient / Caregiver Goals <span className="text-red-500">★</span></Label><DictationTextarea placeholder="Goals expressed..." value={form.therapy_objective_patient_goals || ""} onChange={(e) => set("therapy_objective_patient_goals", e.target.value)} rows={3} className={(form.therapy_objective_patient_goals || "").trim().length < 2 ? "border-red-300" : ""} /></div>
          <div><Label className="text-blue-700 font-semibold">Precautions <span className="text-red-500">★</span></Label><DictationTextarea placeholder="Weight bearing status..." value={form.precautions || ""} onChange={(e) => set("precautions", e.target.value)} rows={3} className={(form.precautions || "").trim().length < 2 ? "border-red-300" : ""} /></div>
          <div><Label className="text-blue-700 font-semibold">Medication Changes <span className="text-red-500">★</span></Label><DictationTextarea placeholder="Recent medication changes..." value={form.medication_changes || ""} onChange={(e) => set("medication_changes", e.target.value)} rows={3} className={(form.medication_changes || "").trim().length < 2 ? "border-red-300" : ""} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
