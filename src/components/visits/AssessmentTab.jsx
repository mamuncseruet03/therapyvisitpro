"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DictationTextarea } from "./DictationButton";
import StandardizedTestForm from "./StandardizedTestForm";

export default function AssessmentTab({ form, set }) {
  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800">Assessment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-blue-700 font-semibold">Clinical Impression & Prognosis <span className="text-red-500">*</span></Label>
            <div className={!form.assessment?.trim() ? "rounded-md ring-1 ring-red-300" : ""}>
              <DictationTextarea placeholder="Diagnosis, rehab potential..." value={form.assessment || ""} onChange={(e) => set("assessment", e.target.value)} rows={5} />
            </div>
          </div>
          <div className="border-t pt-4">
            <Label className="text-blue-700 font-semibold mb-3 block">Standardized Testing</Label>
            <StandardizedTestForm tests={form.standardized_tests || []} onChange={(tests) => set("standardized_tests", tests)} />
            <div className="mt-3"><Label className="text-sm text-slate-600">Additional Notes</Label><DictationTextarea placeholder="Additional testing notes or observations..." value={form.standardized_testing || ""} onChange={(e) => set("standardized_testing", e.target.value)} rows={2} /></div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-purple-400">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800">Evaluation Complexity Level</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {["low", "moderate", "high"].map((level) => {
              const colors = { low: "border-green-400 bg-green-50 text-green-800", moderate: "border-amber-400 bg-amber-50 text-amber-800", high: "border-red-400 bg-red-50 text-red-800" };
              const selected = (form.medical_complexity || {}).level === level;
              return (<button key={level} type="button" onClick={() => set("medical_complexity", { ...(form.medical_complexity || {}), level })} className={`px-4 py-3 rounded-lg border-2 text-sm font-semibold capitalize transition-all ${selected ? colors[level] : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>{level}</button>);
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
