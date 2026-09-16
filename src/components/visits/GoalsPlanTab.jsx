"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus } from "lucide-react";
import { DictationTextarea } from "./DictationButton";
import TherapyOrdersSection from "./TherapyOrdersSection";

const INTERVENTION_OPTIONS = [
  "Posture Training Exercises", "Gait Training", "L.E. ROM Exercises",
  "L.E. Positioning and Body Alignment Exercises", "U.E. ROM Exercises",
  "U.E. Positioning and Body Alignment Exercises", "Upper Body Strengthening Exercises",
  "Lower Body Strengthening Exercises", "Balance Exercises: Sitting", "Balance Exercises: Standing",
  "Endurance / Strength Exercises", "Joint Mobility Program", "Splint Care", "Prosthetic Device",
  "Adaptive Device", "Circulatory Checks as Applicable", "Bed Mobility", "Transfer Techniques",
  "Establish / Upgrade HEP", "Patient Education", "O2 Saturation Monitor",
  "Modalities for Pain Control", "Home Safety Training", "Stair / Step Training",
];

export default function GoalsPlanTab({ form, set, selectedPatient }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Treatment Goals <span className="text-red-500 text-sm">★</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(form.eval_treatment_goals || []).map((goalEntry, goalIdx) => {
            const updateGoalEntry = (field, value) => { const updated = [...(form.eval_treatment_goals || [])]; updated[goalIdx] = { ...updated[goalIdx], [field]: value }; set("eval_treatment_goals", updated); };
            const selectedInterventions = goalEntry.interventions || [];
            const toggleIntervention = (opt) => { const next = selectedInterventions.includes(opt) ? selectedInterventions.filter(i => i !== opt) : [...selectedInterventions, opt]; updateGoalEntry("interventions", next); };
            const isOpen = goalEntry.interventions_open !== false;
            return (
              <div key={goalIdx} className="border rounded-lg bg-white">
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <span className="text-sm font-semibold text-slate-700">Goal {goalIdx + 1}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">Long Term<input type="checkbox" checked={goalEntry.is_long_term || false} onChange={(e) => updateGoalEntry("is_long_term", e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 cursor-pointer" /></label>
                    {(form.eval_treatment_goals || []).length > 1 && (<button type="button" onClick={() => set("eval_treatment_goals", form.eval_treatment_goals.filter((_, i) => i !== goalIdx))} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>)}
                  </div>
                </div>
                <div className="px-4 pb-4 space-y-3">
                  <textarea maxLength={1024} placeholder="Pt will improve..." value={goalEntry.goal || ""} onChange={(e) => updateGoalEntry("goal", e.target.value)} rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                  <div><Label className="text-xs text-slate-600">Initial Status</Label><textarea maxLength={300} value={goalEntry.initial_status || ""} onChange={(e) => updateGoalEntry("initial_status", e.target.value)} rows={2} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" /></div>
                  <div><Label className="text-xs text-slate-600">Expected Completion</Label><Input type="date" value={goalEntry.expected_completion || ""} onChange={(e) => updateGoalEntry("expected_completion", e.target.value)} className="max-w-xs" /></div>
                  <div>
                    <button type="button" onClick={() => updateGoalEntry("interventions_open", !isOpen)} className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"><span className="text-base leading-none">{isOpen ? "▲" : "▼"}</span> Interventions</button>
                    {isOpen && (
                      <div className="mt-2 space-y-1">
                        {INTERVENTION_OPTIONS.map((opt) => (<label key={opt} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={selectedInterventions.includes(opt)} onChange={() => toggleIntervention(opt)} className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 cursor-pointer" /><span className={`text-xs ${selectedInterventions.includes(opt) ? "text-teal-700 font-medium" : "text-slate-700"}`}>{opt}</span></label>))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <Button type="button" variant="outline" className="w-full gap-2 border-dashed" onClick={() => set("eval_treatment_goals", [...(form.eval_treatment_goals || []), { goal: "", interventions: [], is_long_term: false, initial_status: "", expected_completion: "", interventions_open: true }])}>
            <Plus className="w-4 h-4" /> Add Another Goal
          </Button>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-red-400">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800">Risk Factors <span className="text-red-500 text-sm">★</span></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            {form.therapy_type === "Speech Therapy" ? (
              <>
                <p className="text-sm font-semibold text-slate-700 mb-3">Risk Factors</p>
                <div className="space-y-2">
                  {[
                    { key: "altered_consciousness", label: "Altered Consciousness" },
                    { key: "low_motivation", label: "Low Motivation" },
                    { key: "progressive_neurological_disorder", label: "Progressive Neurological Disorder", sub: "(Parkinson's, ALS, Dementia, MS, etc)" },
                    { key: "dysphagia_aspiration_risk", label: "Dysphagia / Aspiration Risk" },
                    { key: "cognitive_impairment", label: "Cognitive Impairment" },
                    { key: "aphasia_communication_deficit", label: "Aphasia / Communication Deficit" },
                    { key: "caregiver_support_limited", label: "Limited Caregiver Support" },
                    { key: "history_of_aspiration_pneumonia", label: "History of Aspiration Pneumonia" },
                    { key: "tracheostomy", label: "Tracheostomy" },
                    { key: "behavioral_challenges", label: "Behavioral Challenges" },
                    { key: "sensory_deficit_slp", label: "Sensory Deficit (vision and/or Hearing)" },
                    { key: "decreased_cooperation_slp", label: "Decreased Level of Cooperation" },
                  ].map(({ key, label, sub }) => {
                    const checked = (form.risk_factors || {})[key] || false;
                    return (<label key={key} className="flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={checked} onChange={(e) => set("risk_factors", { ...(form.risk_factors || {}), [key]: e.target.checked })} className="w-4 h-4 mt-0.5 rounded border-slate-300 text-teal-600 cursor-pointer" /><span className="text-sm"><span className={checked ? "text-blue-600 font-medium" : "text-slate-700"}>{label}</span>{sub && <span className="block text-xs text-slate-500 italic">{sub}</span>}</span></label>);
                  })}
                  <label className="flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={form.risk_factors_other !== undefined && form.risk_factors_other !== null} onChange={(e) => set("risk_factors_other", e.target.checked ? "" : null)} className="w-4 h-4 mt-0.5 rounded border-slate-300 text-teal-600 cursor-pointer" /><span className="text-sm text-slate-700">Other</span></label>
                  {form.risk_factors_other !== undefined && form.risk_factors_other !== null && (<div className="ml-6"><div className="relative"><Textarea maxLength={300} value={form.risk_factors_other || ""} onChange={(e) => set("risk_factors_other", e.target.value)} rows={3} /></div><div className="text-right text-xs text-slate-400">of 300</div></div>)}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-700 mb-3">Risk Factors Predisposing for Fall</p>
                <div className="space-y-2">
                  {[
                    { key: "prosthesis_orthotics", label: "Prosthesis/Orthotics" }, { key: "weakness_pain", label: "Weakness/Pain" }, { key: "age_over_65", label: "Age over 65" },
                    { key: "confusion", label: "Confusion" }, { key: "vertigo_dizziness", label: "Vertigo/Dizziness" }, { key: "incontinence_urgency", label: "Incontinence/Urgency" },
                    { key: "alcohol_use", label: "Alcohol Use" }, { key: "gait_balance_coordination", label: "Gait/Balance/Coordination" }, { key: "assistive_device_malfunction", label: "Assistive Device Malfunction" },
                    { key: "history_of_falls", label: "History of Falls", sub: "(Past 3 mon.)" }, { key: "improper_use_assistive_device", label: "Improper use of Assistive device" },
                    { key: "home_safety_issues", label: "Home Safety issues / Structural Barriers" }, { key: "sensory_deficit", label: "↓ Sensory Deficit", sub: "(vision and/or Hearing)" },
                    { key: "decreased_cooperation", label: "Decreased Level of Cooperation" }, { key: "impaired_judgment", label: "Impaired Judgment/Poor Safety Awareness" },
                    { key: "lack_home_modifications", label: "Lack of Home Modifications", sub: "(bath, kitchen, stairs, entries & safety bars etc)" },
                    { key: "unable_to_ambulate", label: "Unable to Ambulate Independently", sub: "(needs to use ambulatory aid, etc)" },
                    { key: "postural_hypotension", label: "Postural Hypotension with Dizziness" },
                  ].map(({ key, label, sub }) => {
                    const checked = (form.risk_factors || {})[key] || false;
                    return (<label key={key} className="flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={checked} onChange={(e) => set("risk_factors", { ...(form.risk_factors || {}), [key]: e.target.checked })} className="w-4 h-4 mt-0.5 rounded border-slate-300 text-teal-600 cursor-pointer" /><span className="text-sm"><span className={checked ? "text-blue-600 font-medium" : "text-slate-700"}>{label}</span>{sub && <span className="block text-xs text-slate-500 italic">{sub}</span>}</span></label>);
                  })}
                  <label className="flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={form.risk_factors_other !== undefined && form.risk_factors_other !== null} onChange={(e) => set("risk_factors_other", e.target.checked ? "" : null)} className="w-4 h-4 mt-0.5 rounded border-slate-300 text-teal-600 cursor-pointer" /><span className="text-sm text-slate-700">Other</span></label>
                  {form.risk_factors_other !== undefined && form.risk_factors_other !== null && (<div className="ml-6"><div className="relative"><Textarea maxLength={300} value={form.risk_factors_other || ""} onChange={(e) => set("risk_factors_other", e.target.value)} rows={3} /></div><div className="text-right text-xs text-slate-400">of 300</div></div>)}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <TherapyOrdersSection therapyOrders={form.therapy_orders || {}} certPeriodStart={selectedPatient?.cert_period_start} certPeriodEnd={selectedPatient?.cert_period_end} visitDate={form.visit_date} onChange={(orders) => set("therapy_orders", orders)} />

      <Card className="border-l-4 border-l-indigo-500">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800">Need for Skilled Services <span className="text-red-500 text-sm">★</span></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label className="text-blue-700 font-semibold">Skilled Service Narrative <span className="text-red-500">★</span></Label><DictationTextarea maxLength={1024} placeholder="Describe the need for skilled services..." value={form.plan || ""} onChange={(e) => set("plan", e.target.value)} rows={4} /></div>
          <div>
            <Label className="text-blue-700 font-semibold mb-2 block">Other Skilled Service Recommendations</Label>
            <div className="space-y-2">
              {["OT", "SLP"].map((rec) => { const checked = (form.skilled_service_recommendations || []).includes(rec); return (<label key={rec} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={checked} onChange={(e) => { const current = form.skilled_service_recommendations || []; set("skilled_service_recommendations", e.target.checked ? [...current, rec] : current.filter((r) => r !== rec)); }} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" /><span className="text-sm text-slate-700">{rec}</span></label>); })}
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.skilled_service_other !== undefined && form.skilled_service_other !== null} onChange={(e) => set("skilled_service_other", e.target.checked ? "" : null)} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" /><span className="text-sm text-slate-700">Other</span></label>
              {form.skilled_service_other !== undefined && form.skilled_service_other !== null && (<div className="ml-6"><div className="relative"><input type="text" maxLength={50} value={form.skilled_service_other || ""} onChange={(e) => set("skilled_service_other", e.target.value)} className="w-full h-8 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" /></div><div className="text-right text-xs text-slate-400">{(form.skilled_service_other || "").length} of 50</div></div>)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-teal-400">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800">Care Coordination <span className="text-red-500 text-sm">★</span></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {["RN", "PTA", "SLP", "Scheduler", "LPN/LVN", "OT", "MSW", "MD", "PT", "COTA", "Agency"].map((item) => {
              const checked = ((form.care_coordination || {}).disciplines || []).includes(item);
              return (<label key={item} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={checked} onChange={(e) => { const current = (form.care_coordination || {}).disciplines || []; set("care_coordination", { ...(form.care_coordination || {}), disciplines: e.target.checked ? [...current, item] : current.filter((d) => d !== item) }); }} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" /><span className="text-sm text-slate-700">{item}</span></label>);
            })}
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-3 items-center"><Label className="text-sm text-slate-600 whitespace-nowrap">Other:</Label><Input placeholder="None" value={(form.care_coordination || {}).other || ""} onChange={(e) => set("care_coordination", { ...(form.care_coordination || {}), other: e.target.value })} /></div>
          <div><Label className="text-sm text-slate-600">Reason <span className="text-red-500">★</span></Label><DictationTextarea maxLength={300} placeholder="N/A" value={(form.care_coordination || {}).reason || ""} onChange={(e) => set("care_coordination", { ...(form.care_coordination || {}), reason: e.target.value })} rows={3} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
