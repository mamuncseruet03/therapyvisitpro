"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DictationTextarea } from "./DictationButton";
import PTASupervisionSection from "./PTASupervisionSection";

const PTA_COTA = ["PTA", "COTA"];

export default function ReevalTab({ form, set, isAssistant, therapistName, therapists = [], selectedPatient }) {
  const treatingTherapistName = selectedPatient?.treating_therapist_pt || selectedPatient?.treating_therapist_ot || selectedPatient?.treating_therapist_st;
  const treatingTherapist = therapists.find(t => t.full_name === treatingTherapistName);
  const hasPTAInEpisode = PTA_COTA.includes(treatingTherapist?.credentials?.trim().toUpperCase());

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Re-evaluation</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Document progress and update treatment plan</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-amber-700 font-semibold">Therapy Effectiveness</Label>
            <DictationTextarea placeholder="Patient is making significant progress with goals..." value={form.therapy_effectiveness || ""} onChange={(e) => set("therapy_effectiveness", e.target.value)} rows={3} maxLength={300} />
            <div className="text-right text-xs text-slate-400 mt-0.5">{(form.therapy_effectiveness || "").length} of 300</div>
          </div>
          <div>
            <Label className="text-amber-700 font-semibold">Current Functional Status</Label>
            <DictationTextarea placeholder="MIN ASSIST..." value={form.current_functional_status || ""} onChange={(e) => set("current_functional_status", e.target.value)} rows={3} maxLength={300} />
            <div className="text-right text-xs text-slate-400 mt-0.5">{(form.current_functional_status || "").length} of 300</div>
          </div>
          <div>
            <Label className="text-amber-700 font-semibold">Justification for Continued Skilled Therapy</Label>
            <DictationTextarea placeholder="To further improve standing balance, quality of gait, with reduced fall risks..." value={form.justification_skilled_therapy || ""} onChange={(e) => set("justification_skilled_therapy", e.target.value)} rows={3} maxLength={300} />
            <div className="text-right text-xs text-slate-400 mt-0.5">{(form.justification_skilled_therapy || "").length} of 300</div>
          </div>
          <div>
            <Label className="text-amber-700 font-semibold">Skilled Therapy Performed This Visit</Label>
            <DictationTextarea placeholder="Therapeutic exercises and gait training..." value={form.skilled_therapy_performed || ""} onChange={(e) => set("skilled_therapy_performed", e.target.value)} rows={3} maxLength={300} />
            <div className="text-right text-xs text-slate-400 mt-0.5">{(form.skilled_therapy_performed || "").length} of 300</div>
          </div>
        </CardContent>
      </Card>

      {hasPTAInEpisode && (
        <PTASupervisionSection
          supervision={form.pta_supervision || {}}
          onChange={(v) => set("pta_supervision", v)}
        />
      )}

      {/* Discharge Planning */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Discharge Planning Provided At This Visit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-sm text-slate-600">Discussed with:</Label>
            <Input
              placeholder="e.g. PATIENT"
              value={(form.reeval_discharge_planning || {}).discussed_with || ""}
              onChange={(e) => set("reeval_discharge_planning", { ...(form.reeval_discharge_planning || {}), discussed_with: e.target.value })}
              className="mt-1"
            />
          </div>
          <p className="text-xs text-slate-400 italic">(check all that apply)</p>
          <div className="space-y-2">
            {[
              "Discharge Notice/Medicare non coverage forms given",
              "Teaching Hep and Safety",
              "Understanding of S/S of disease processes",
              "Discharge to outpatient therapy services",
            ].map((item) => {
              const checked = ((form.reeval_discharge_planning || {}).items || []).includes(item);
              return (
                <label key={item} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const current = (form.reeval_discharge_planning || {}).items || [];
                      const updated = checked ? current.filter((i) => i !== item) : [...current, item];
                      set("reeval_discharge_planning", { ...(form.reeval_discharge_planning || {}), items: updated });
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700">{item}</span>
                </label>
              );
            })}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={!!(form.reeval_discharge_planning || {}).other_checked}
                onChange={() => set("reeval_discharge_planning", { ...(form.reeval_discharge_planning || {}), other_checked: !(form.reeval_discharge_planning || {}).other_checked })}
                className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer mt-1"
              />
              <div className="flex-1">
                <span className="text-sm text-slate-700">Other</span>
                {(form.reeval_discharge_planning || {}).other_checked && (
                  <Textarea
                    rows={2}
                    className="mt-1 text-sm"
                    value={(form.reeval_discharge_planning || {}).other_text || ""}
                    onChange={(e) => set("reeval_discharge_planning", { ...(form.reeval_discharge_planning || {}), other_text: e.target.value })}
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Care Coordination */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Care Coordination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {["RN", "LPN/LVN", "PT", "PTA", "OT", "COTA", "SLP", "MSW", "Agency", "Scheduler", "MD"].map((item) => {
              const disciplines = (form.care_coordination || {}).disciplines || [];
              const checked = disciplines.includes(item);
              return (
                <label key={item} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const updated = checked ? disciplines.filter((d) => d !== item) : [...disciplines, item];
                      set("care_coordination", { ...(form.care_coordination || {}), disciplines: updated });
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700">{item}</span>
                </label>
              );
            })}
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
            <Label className="text-sm text-slate-600 whitespace-nowrap">Other:</Label>
            <Input
              placeholder="None"
              value={(form.care_coordination || {}).other || ""}
              onChange={(e) => set("care_coordination", { ...(form.care_coordination || {}), other: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
            <Label className="text-sm text-slate-600 whitespace-nowrap pt-2">Reason:</Label>
            <div>
              <DictationTextarea
                maxLength={300}
                placeholder="N/A"
                value={(form.care_coordination || {}).reason || ""}
                onChange={(e) => set("care_coordination", { ...(form.care_coordination || {}), reason: e.target.value })}
                rows={3}
              />
              <div className="text-right text-xs text-slate-400">{((form.care_coordination || {}).reason || "").length} of 300</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient / Caregiver Education */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Patient / Caregiver Education</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {["Hep/Safety Precautions", "Balance", "Gait/Assistive Device", "Mobility", "Patient/CG understands instructions", "Exercise"].map((topic) => {
            const topics = (form.patient_education || {}).topics || [];
            const checked = topics.includes(topic);
            return (
              <label key={topic} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const updated = checked ? topics.filter((t) => t !== topic) : [...topics, topic];
                    set("patient_education", { ...(form.patient_education || {}), topics: updated });
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer"
                />
                <span className="text-sm text-slate-700">{topic}</span>
              </label>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
