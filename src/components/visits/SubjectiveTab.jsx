"use client";

import React from "react";
import { Label } from "@/components/ui/label";
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

          {(form.therapy_type === "Physical Therapy" || form.therapy_type === "Occupational Therapy") && (
            <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
              <h4 className="font-semibold text-slate-800">Homebound <span className="text-red-500">★</span></h4>
              <div className="border-t pt-3">
                <p className="text-sm font-medium text-slate-700 mb-2">Homebound Reason</p>
                <div className="space-y-2">
                  {["Medical Restriction", "Needs assistance for all activities", "Residual Weakness", "Severe SOB, SOB upon exertion", "Confusion, unable to go out of home alone", "Dependent upon adaptive devices", "Requires assistance to ambulate", "Unable to safely leave home unassisted", "Not Homebound"].map((reason) => {
                    const checked = (form.homebound_reasons || []).includes(reason);
                    return (
                      <label key={reason} className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={checked} onChange={(e) => { const current = form.homebound_reasons || []; set("homebound_reasons", e.target.checked ? [...current, reason] : current.filter((r) => r !== reason)); }} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" />
                        <span className="text-sm text-slate-700">{reason}</span>
                      </label>
                    );
                  })}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={!!(form.homebound_other !== undefined && form.homebound_other !== null)} onChange={(e) => set("homebound_other", e.target.checked ? "" : null)} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" />
                    <span className="text-sm text-slate-700">Other</span>
                    {(form.homebound_other !== undefined && form.homebound_other !== null) && (
                      <div className="flex-1 relative">
                        <input type="text" maxLength={100} value={form.homebound_other || ""} onChange={(e) => set("homebound_other", e.target.value)} className="w-full h-8 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                        <span className="absolute right-2 bottom-1 text-[10px] text-slate-400">{(form.homebound_other || "").length}/100</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}

          <div><Label className="text-blue-700 font-semibold">Patient / Caregiver Goals <span className="text-red-500">★</span></Label><DictationTextarea placeholder="Goals expressed..." value={form.therapy_objective_patient_goals || ""} onChange={(e) => set("therapy_objective_patient_goals", e.target.value)} rows={3} className={(form.therapy_objective_patient_goals || "").trim().length < 2 ? "border-red-300" : ""} /></div>
          <div><Label className="text-blue-700 font-semibold">Precautions <span className="text-red-500">★</span></Label><DictationTextarea placeholder="Weight bearing status..." value={form.precautions || ""} onChange={(e) => set("precautions", e.target.value)} rows={3} className={(form.precautions || "").trim().length < 2 ? "border-red-300" : ""} /></div>
          <div><Label className="text-blue-700 font-semibold">Medication Changes <span className="text-red-500">★</span></Label><DictationTextarea placeholder="Recent medication changes..." value={form.medication_changes || ""} onChange={(e) => set("medication_changes", e.target.value)} rows={3} className={(form.medication_changes || "").trim().length < 2 ? "border-red-300" : ""} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
