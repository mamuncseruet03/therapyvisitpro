"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { DictationTextarea } from "./DictationButton";

const FUNCTIONAL_LEVELS = [
  { value: "independent", label: "Independent" },
  { value: "modified_independent", label: "Modified Independent" },
  { value: "supervision", label: "Supervision" },
  { value: "minimal_assist", label: "Minimal Assist" },
  { value: "moderate_assist", label: "Moderate Assist" },
  { value: "maximal_assist", label: "Maximal Assist" },
  { value: "dependent", label: "Dependent" },
];

export default function TreatmentGoalsTab({ form, set, patientVisits = [] }) {
  const [interventionInput, setInterventionInput] = useState("");
  const addIntervention = () => { if (!interventionInput.trim()) return; set("interventions", [...(form.interventions || []), interventionInput.trim()]); setInterventionInput(""); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT: Documentation fields */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800">Session Documentation</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Interventions</Label><div className="flex gap-2 mt-1"><Input placeholder="Enter an intervention…" value={interventionInput} onChange={(e) => setInterventionInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIntervention())} /><Button type="button" size="icon" variant="outline" onClick={addIntervention}><Plus className="w-4 h-4" /></Button></div><div className="flex flex-wrap gap-2 mt-2">{(form.interventions || []).map((g, i) => (<Badge key={i} variant="secondary" className="gap-1 pr-1">{g}<button onClick={() => set("interventions", form.interventions.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button></Badge>))}</div></div>
          <div><Label>Patient Response</Label><DictationTextarea placeholder="How did the patient respond?" value={form.patient_response || ""} onChange={(e) => set("patient_response", e.target.value)} rows={3} /></div>
          <div><Label>Functional Status</Label><Select value={form.functional_status || ""} onValueChange={(v) => set("functional_status", v)}><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger><SelectContent>{FUNCTIONAL_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></div>
        </CardContent>
      </Card>

      {/* RIGHT: Eval goals to select from */}
      <Card className="border-l-4 border-l-blue-400">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Goals from Evaluation</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Select the goals addressed this session</p>
        </CardHeader>
        <CardContent>
          {(() => {
            const evalNote = patientVisits.find(v =>
              v.visit_type === 'evaluation' &&
              v.therapy_type === form.therapy_type &&
              (v.status === 'completed' || v.status === 'signed') &&
              v.eval_treatment_goals?.length > 0
            );
            const evalGoals = evalNote?.eval_treatment_goals?.filter(g => (g.goal || '').trim()) || [];
            if (evalGoals.length === 0) {
              return <p className="text-sm text-slate-400 italic">No evaluation goals found for this therapy type.</p>;
            }
            const selectedGoals = form.goals_addressed || [];
            return (
              <div className="space-y-2">
                {evalGoals.map((g, i) => {
                  const isSelected = selectedGoals.includes(g.goal);
                  return (
                    <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const cur = form.goals_addressed || [];
                          set("goals_addressed", e.target.checked ? [...cur, g.goal] : cur.filter(x => x !== g.goal));
                        }}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-teal-600 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <p className={`text-sm leading-snug ${isSelected ? 'text-blue-800 font-medium' : 'text-slate-700'}`}>{g.goal}</p>
                        {g.is_long_term && <span className="text-[10px] text-purple-500 font-medium uppercase tracking-wide">Long Term</span>}
                      </div>
                    </label>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
