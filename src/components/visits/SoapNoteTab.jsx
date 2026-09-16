"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DictationTextarea } from "./DictationButton";

export default function SoapNoteTab({ form, set }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800">Treatment Note (SOAP)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label className="text-teal-700 font-semibold">Subjective</Label><DictationTextarea placeholder="Patient report, complaints..." value={form.subjective || ""} onChange={(e) => set("subjective", e.target.value)} rows={3} /></div>
          <div><Label className="text-blue-700 font-semibold">Objective</Label><DictationTextarea placeholder="Objective findings..." value={form.objective || ""} onChange={(e) => set("objective", e.target.value)} rows={4} /></div>
          <div><Label className="text-amber-700 font-semibold">Assessment</Label><DictationTextarea placeholder="Clinical assessment..." value={form.assessment || ""} onChange={(e) => set("assessment", e.target.value)} rows={3} /></div>
          <div><Label className="text-violet-700 font-semibold">Plan</Label><DictationTextarea placeholder="Treatment plan..." value={form.plan || ""} onChange={(e) => set("plan", e.target.value)} rows={3} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
