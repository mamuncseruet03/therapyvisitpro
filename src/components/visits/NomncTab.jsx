"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DictationTextarea } from "./DictationButton";

export default function NomncTab({ form, set }) {
  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Notice of Medicare Non-Coverage (NOMNC)</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Document patient notification of Medicare coverage ending</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-blue-700 font-semibold">Coverage End Date <span className="text-red-500">&#9733;</span></Label>
            <Input type="date" value={form.nomnc_coverage_end_date || ""} onChange={(e) => set("nomnc_coverage_end_date", e.target.value)} className="max-w-xs" />
          </div>
          <div>
            <Label className="text-blue-700 font-semibold">Reason Medicare Coverage is Ending</Label>
            <DictationTextarea placeholder="Patient no longer meets Medicare criteria, goals achieved, plateaued, etc..." value={form.nomnc_reason || ""} onChange={(e) => set("nomnc_reason", e.target.value)} rows={3} />
          </div>
          <div>
            <Label className="text-blue-700 font-semibold">Patient / Representative Notified</Label>
            <div className="flex flex-col gap-2 mt-1">
              {["Patient", "Legal Guardian", "Responsible Party", "Family Member"].map((who) => {
                const checked = (form.nomnc_notified || []).includes(who);
                return (
                  <label key={who} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={(e) => {
                      const cur = form.nomnc_notified || [];
                      set("nomnc_notified", e.target.checked ? [...cur, who] : cur.filter(w => w !== who));
                    }} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" />
                    <span className="text-sm text-slate-700">{who}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <Label className="text-blue-700 font-semibold">Patient Response / Understanding</Label>
            <DictationTextarea placeholder="Patient verbalized understanding, requested appeal information, etc..." value={form.nomnc_patient_response || ""} onChange={(e) => set("nomnc_patient_response", e.target.value)} rows={3} />
          </div>
          <div>
            <Label className="text-blue-700 font-semibold">Appeal Rights Provided</Label>
            <div className="flex items-center gap-3 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="nomnc_appeal" checked={form.nomnc_appeal_rights === "yes"} onChange={() => set("nomnc_appeal_rights", "yes")} className="w-4 h-4 text-teal-600" />
                <span className="text-sm text-slate-700">Yes -- NOMNC form provided</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="nomnc_appeal" checked={form.nomnc_appeal_rights === "no"} onChange={() => set("nomnc_appeal_rights", "no")} className="w-4 h-4 text-teal-600" />
                <span className="text-sm text-slate-700">No</span>
              </label>
            </div>
          </div>
          <div>
            <Label className="text-blue-700 font-semibold">Additional Notes</Label>
            <DictationTextarea placeholder="Any additional documentation..." value={form.nomnc_notes || ""} onChange={(e) => set("nomnc_notes", e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
