"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const YesNo = ({ value, onChange }) => (
  <Select value={value || "No"} onValueChange={onChange}>
    <SelectTrigger className="w-20 h-8 text-sm">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="Yes">Yes</SelectItem>
      <SelectItem value="No">No</SelectItem>
    </SelectContent>
  </Select>
);

const FieldRow = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b last:border-b-0">
    <span className="text-sm text-slate-700 flex-1">{label}</span>
    {children}
  </div>
);

export default function SLPObjectiveSection({ slpObjective = {}, onChange }) {
  const set = (key, value) => onChange({ ...slpObjective, [key]: value });

  return (
    <div className="space-y-6">
      {/* Hard of Hearing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Hard of Hearing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { value: "No", label: "No" },
            { value: "Yes, but does not impact communication", label: "Yes, but does not impact communication" },
            { value: "Yes, but it makes functional communication difficult", label: "Yes, but it makes functional communication difficult" },
            { value: "Wears hearing aides", label: "Wears hearing aides" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="hard_of_hearing"
                checked={(slpObjective.hard_of_hearing || "No") === opt.value}
                onChange={() => set("hard_of_hearing", opt.value)}
                className="w-4 h-4 text-teal-600 cursor-pointer"
              />
              <span className={`text-sm ${(slpObjective.hard_of_hearing || "No") === opt.value ? "text-blue-600 font-medium" : "text-slate-700"}`}>
                {opt.label}
              </span>
            </label>
          ))}
          <div className="pt-2">
            <Label className="text-sm font-semibold text-slate-700 mb-1 block">Current Functional Deficit</Label>
            <div className="relative">
              <Textarea
                maxLength={600}
                rows={4}
                value={slpObjective.hard_of_hearing_deficit || ""}
                onChange={(e) => set("hard_of_hearing_deficit", e.target.value)}
              />
              <span className="absolute right-2 bottom-2 text-xs text-slate-400">
                {(slpObjective.hard_of_hearing_deficit || "").length} of 600
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Swallow Screen */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Swallow Screen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-1 block">Current Diet</Label>
            <div className="relative">
              <Textarea
                maxLength={600}
                rows={4}
                value={slpObjective.swallow_current_diet || ""}
                onChange={(e) => set("swallow_current_diet", e.target.value)}
              />
              <span className="absolute right-2 bottom-2 text-xs text-slate-400">
                {(slpObjective.swallow_current_diet || "").length} of 600
              </span>
            </div>
          </div>
          <div className="border rounded-lg p-3 space-y-1">
            <FieldRow label="Overt signs/symptoms of swallowing difficulty?">
              <YesNo value={slpObjective.swallow_overt_signs} onChange={(v) => set("swallow_overt_signs", v)} />
            </FieldRow>
            <FieldRow label="Are swallowing deficites of new onset?">
              <YesNo value={slpObjective.swallow_new_onset} onChange={(v) => set("swallow_new_onset", v)} />
            </FieldRow>
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-1 block">Diagnosis that places patient at risk for swallowing difficulties</Label>
            <div className="relative">
              <Textarea
                maxLength={600}
                rows={4}
                value={slpObjective.swallow_risk_diagnosis || ""}
                onChange={(e) => set("swallow_risk_diagnosis", e.target.value)}
              />
              <span className="absolute right-2 bottom-2 text-xs text-slate-400">
                {(slpObjective.swallow_risk_diagnosis || "").length} of 600
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speech/Language/Cognitive Screen */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Speech/Language/Cognitive Screen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-3 space-y-1">
            <FieldRow label="Is the patient reported to have S/L/Cog Deficits?">
              <YesNo value={slpObjective.slc_has_deficits} onChange={(v) => set("slc_has_deficits", v)} />
            </FieldRow>
            <FieldRow label="Dementia?">
              <YesNo value={slpObjective.slc_dementia} onChange={(v) => set("slc_dementia", v)} />
            </FieldRow>
            <FieldRow label="Does patient exhibit S/S of any Speech/Language/Cognitive?">
              <YesNo value={slpObjective.slc_exhibits_signs} onChange={(v) => set("slc_exhibits_signs", v)} />
            </FieldRow>
            <FieldRow label="Are deficits of new onset?">
              <YesNo value={slpObjective.slc_new_onset} onChange={(v) => set("slc_new_onset", v)} />
            </FieldRow>
            <FieldRow label="Has patient recently received skilled speech therapy services in another setting?">
              <YesNo value={slpObjective.slc_prior_services} onChange={(v) => set("slc_prior_services", v)} />
            </FieldRow>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
