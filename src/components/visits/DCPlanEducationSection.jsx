"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DictationTextarea } from "@/components/visits/DictationButton";

const EDUCATION_TOPICS = [
  "Disease Process / Diagnosis",
  "Medication Management",
  "Fall Prevention",
  "Energy Conservation",
  "Home Exercise Program",
  "Activity Modifications",
  "Equipment / Assistive Device Use",
  "Safety Precautions / Weight Bearing",
  "Pain Management Techniques",
  "Wound Care / Skin Integrity",
  "Nutrition / Hydration",
  "Community Resources",
];

export default function DCPlanEducationSection({ form, set }) {
  return (
    <div className="space-y-6">
      {/* Discharge Plan */}
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Discharge Plan <span className="text-red-500 text-sm">&#9733;</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-emerald-700 font-semibold">Anticipated Discharge Setting <span className="text-red-500">&#9733;</span></Label>
            <div className="flex flex-wrap gap-4 mt-2">
              {["Home", "Assisted Living", "SNF", "Rehab Facility", "Hospital", "Other"].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dc_setting"
                    checked={(form.dc_plan || {}).discharge_setting === opt}
                    onChange={() => set("dc_plan", { ...(form.dc_plan || {}), discharge_setting: opt })}
                    className="w-4 h-4 text-teal-600 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-emerald-700 font-semibold">Discharge Criteria / Goals for Discharge <span className="text-red-500">&#9733;</span></Label>
            <DictationTextarea
              maxLength={500}
              placeholder="Describe criteria that must be met prior to discharge..."
              value={(form.dc_plan || {}).discharge_criteria || ""}
              onChange={(e) => set("dc_plan", { ...(form.dc_plan || {}), discharge_criteria: e.target.value })}
              rows={3}
              className="mt-1"
            />
            <div className="text-right text-xs text-slate-400">{((form.dc_plan || {}).discharge_criteria || "").length} of 500</div>
          </div>
          <div>
            <Label className="text-emerald-700 font-semibold">Discharge Plan Notes</Label>
            <DictationTextarea
              maxLength={500}
              placeholder="Follow-up care, referrals, community resources..."
              value={(form.dc_plan || {}).discharge_notes || ""}
              onChange={(e) => set("dc_plan", { ...(form.dc_plan || {}), discharge_notes: e.target.value })}
              rows={3}
              className="mt-1"
            />
            <div className="text-right text-xs text-slate-400">{((form.dc_plan || {}).discharge_notes || "").length} of 500</div>
          </div>
        </CardContent>
      </Card>

      {/* Patient / Caregiver Education */}
      <Card className="border-l-4 border-l-blue-400">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Patient / Caregiver Education <span className="text-red-500 text-sm">&#9733;</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-blue-700 font-semibold mb-2 block">Topics Covered <span className="text-red-500">&#9733;</span></Label>
            <div className="space-y-2">
              {EDUCATION_TOPICS.map((topic) => {
                const checked = ((form.patient_education || {}).topics || []).includes(topic);
                return (
                  <label key={topic} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const current = (form.patient_education || {}).topics || [];
                        set("patient_education", {
                          ...(form.patient_education || {}),
                          topics: e.target.checked ? [...current, topic] : current.filter((t) => t !== topic),
                        });
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer"
                    />
                    <span className="text-sm text-slate-700">{topic}</span>
                  </label>
                );
              })}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form.patient_education || {}).other_checked || false}
                  onChange={(e) => set("patient_education", {
                    ...(form.patient_education || {}),
                    other_checked: e.target.checked,
                    other_topic: e.target.checked ? (form.patient_education || {}).other_topic || "" : "",
                  })}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer"
                />
                <span className="text-sm text-slate-700">Other:</span>
                {(form.patient_education || {}).other_checked && (
                  <Input
                    placeholder="Specify..."
                    value={(form.patient_education || {}).other_topic || ""}
                    onChange={(e) => set("patient_education", { ...(form.patient_education || {}), other_topic: e.target.value })}
                    className="max-w-xs h-8 text-sm"
                  />
                )}
              </label>
            </div>
          </div>

          <div>
            <Label className="text-blue-700 font-semibold">Educated To <span className="text-red-500">&#9733;</span></Label>
            <div className="flex flex-wrap gap-4 mt-2">
              {["Patient", "Caregiver", "Family Member", "Other"].map((who) => {
                const checked = ((form.patient_education || {}).educated_to || []).includes(who);
                return (
                  <label key={who} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const current = (form.patient_education || {}).educated_to || [];
                        set("patient_education", {
                          ...(form.patient_education || {}),
                          educated_to: e.target.checked ? [...current, who] : current.filter((w) => w !== who),
                        });
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer"
                    />
                    <span className="text-sm text-slate-700">{who}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-blue-700 font-semibold">Patient / Caregiver Response to Education <span className="text-red-500">&#9733;</span></Label>
            <div className="flex flex-wrap gap-4 mt-2">
              {["Verbalized Understanding", "Demonstrated Understanding", "Requires Further Education", "Unable to Participate"].map((resp) => (
                <label key={resp} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="edu_response"
                    checked={(form.patient_education || {}).response === resp}
                    onChange={() => set("patient_education", { ...(form.patient_education || {}), response: resp })}
                    className="w-4 h-4 text-teal-600 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700">{resp}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-blue-700 font-semibold">Education Notes</Label>
            <DictationTextarea
              maxLength={400}
              placeholder="Additional notes regarding patient/caregiver education..."
              value={(form.patient_education || {}).notes || ""}
              onChange={(e) => set("patient_education", { ...(form.patient_education || {}), notes: e.target.value })}
              rows={3}
              className="mt-1"
            />
            <div className="text-right text-xs text-slate-400">{((form.patient_education || {}).notes || "").length} of 400</div>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Performed / Rehab Potential / Barriers */}
      <Card className="border-l-4 border-l-violet-400">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Treatment & Progress <span className="text-red-500 text-sm">&#9733;</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-violet-700 font-semibold">Treatment Performed This Visit <span className="text-red-500">&#9733;</span></Label>
            <DictationTextarea
              maxLength={1024}
              placeholder="Describe treatment performed this visit..."
              value={(form.dc_plan || {}).treatment_performed || ""}
              onChange={(e) => set("dc_plan", { ...(form.dc_plan || {}), treatment_performed: e.target.value })}
              rows={4}
              className="mt-1"
            />
            <div className="text-right text-xs text-slate-400">{((form.dc_plan || {}).treatment_performed || "").length} of 1024</div>
          </div>
          <div>
            <Label className="text-violet-700 font-semibold">Rehabilitation Potential <span className="text-red-500">&#9733;</span></Label>
            <DictationTextarea
              maxLength={300}
              placeholder="e.g. Strong, Fair, Poor..."
              value={(form.dc_plan || {}).rehab_potential || ""}
              onChange={(e) => set("dc_plan", { ...(form.dc_plan || {}), rehab_potential: e.target.value })}
              rows={3}
              className="mt-1"
            />
            <div className="text-right text-xs text-slate-400">{((form.dc_plan || {}).rehab_potential || "").length} of 300</div>
          </div>
          <div>
            <Label className="text-violet-700 font-semibold">Barriers to Progress</Label>
            <DictationTextarea
              maxLength={300}
              placeholder="e.g. Poor safety awareness, health complications..."
              value={(form.dc_plan || {}).barriers_to_progress || ""}
              onChange={(e) => set("dc_plan", { ...(form.dc_plan || {}), barriers_to_progress: e.target.value })}
              rows={3}
              className="mt-1"
            />
            <div className="text-right text-xs text-slate-400">{((form.dc_plan || {}).barriers_to_progress || "").length} of 300</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
