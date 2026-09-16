"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DictationTextarea } from "./DictationButton";
import DischargeOasisSection from "./DischargeOasisSection";

const FUNCTIONAL_LEVELS = [
  { value: "independent", label: "Independent" },
  { value: "modified_independent", label: "Modified Independent" },
  { value: "supervision", label: "Supervision" },
  { value: "minimal_assist", label: "Minimal Assist" },
  { value: "moderate_assist", label: "Moderate Assist" },
  { value: "maximal_assist", label: "Maximal Assist" },
  { value: "dependent", label: "Dependent" },
];

export default function DischargeTab({ form, set }) {
  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800">Discharge Summary</CardTitle><p className="text-xs text-slate-500 mt-1">Document final status and outcomes</p></CardHeader>
        <CardContent className="space-y-4">
          <div><Label className="text-green-700 font-semibold">Treatment Summary</Label><DictationTextarea placeholder="Total visits, duration..." value={form.subjective || ""} onChange={(e) => set("subjective", e.target.value)} rows={3} /></div>
          <div><Label className="text-green-700 font-semibold">Outcomes & Goal Achievement</Label><DictationTextarea placeholder="Final measurements..." value={form.objective || ""} onChange={(e) => set("objective", e.target.value)} rows={4} /></div>
          <div><Label className="text-green-700 font-semibold">Reason for Discharge</Label><DictationTextarea placeholder="Goals met, plateaued..." value={form.assessment || ""} onChange={(e) => set("assessment", e.target.value)} rows={3} /></div>
          <div><Label className="text-green-700 font-semibold">HEP & Recommendations</Label><DictationTextarea placeholder="HEP instructions..." value={form.plan || ""} onChange={(e) => set("plan", e.target.value)} rows={3} /></div>
        </CardContent>
      </Card>
      {form.require_discharge_oasis && (<DischargeOasisSection oasis={form.discharge_oasis || {}} onChange={(v) => set("discharge_oasis", v)} />)}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800">Discharge Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Final Functional Status</Label><Select value={form.functional_status || ""} onValueChange={(v) => set("functional_status", v)}><SelectTrigger><SelectValue placeholder="Select final level" /></SelectTrigger><SelectContent>{FUNCTIONAL_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></div>
        </CardContent>
      </Card>
    </div>
  );
}
