"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SLPObjectiveSection from "./SLPObjectiveSection";
import ROMEvaluationSection from "./ROMEvaluationSection";
import StrengthEvaluationSection from "./StrengthEvaluationSection";

export default function ObjectiveTab({ form, set }) {
  return (
    <div className="space-y-6">
      {form.therapy_type === "Speech Therapy" ? (
        <SLPObjectiveSection slpObjective={form.slp_objective || {}} onChange={(v) => set("slp_objective", v)} />
      ) : (
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800">Objective</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div><Label className="text-blue-700 font-semibold mb-3 block">ROM Evaluation</Label><ROMEvaluationSection romEvaluation={form.rom_evaluation || {}} onChange={(v) => set("rom_evaluation", v)} /></div>
          <div className="border-t pt-4"><Label className="text-blue-700 font-semibold mb-3 block">Strength Evaluation</Label><StrengthEvaluationSection strengthEvaluation={form.strength_evaluation || {}} onChange={(v) => set("strength_evaluation", v)} /></div>
          <div className="border-t pt-4">
            <Label className="text-blue-700 font-semibold mb-3 block">Other</Label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-100 border-b"><th className="text-left px-4 py-2 font-semibold text-slate-700 w-40">Category</th><th className="text-left px-4 py-2 font-semibold text-slate-700 w-32">Status</th><th className="text-left px-4 py-2 font-semibold text-slate-700">Notes</th></tr></thead>
                <tbody>
                  {[{ label: "Neurological", key: "neurological" }, { label: "Sensation", key: "sensation" }, { label: "Skin Condition", key: "skin_condition" }, { label: "Edema", key: "edema" }].map(({ label, key }, i) => {
                    const otherData = form.other_findings || {};
                    const isWnl = otherData[key + "_wnl"] !== false;
                    const notes = otherData[key + "_notes"] || "";
                    return (
                      <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-4 py-3 font-medium text-teal-700">{label}</td>
                        <td className="px-4 py-3">
                          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isWnl} onChange={(e) => set("other_findings", { ...otherData, [key + "_wnl"]: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" /><span className="text-sm text-slate-700">WNL</span></label>
                        </td>
                        <td className="px-4 py-3"><input type="text" maxLength={100} value={notes} onChange={(e) => set("other_findings", { ...otherData, [key + "_notes"]: e.target.value })} className="w-full h-8 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
