"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SUPERVISION_QUESTIONS = [
  { key: "following_poc", label: "Is the treating therapist following the POC?" },
  { key: "patient_satisfied", label: "Is the patient satisfied with care?" },
  { key: "notify_changes", label: "Does the PTA notify patient or caregiver of changes in schedule/plan of care in a timely fashion?" },
  { key: "privacy_rights", label: "Does the PTA recognize the patients rights to privacy and confidentiality as wells as treating the patient and his/her belongings with respect?" },
  { key: "report_information", label: "Does the PTA report releveant information to the supervising therapist?" },
  { key: "record_accurately", label: "Does the PTA record patient data accurately?" },
  { key: "allowable_tasks", label: "Does the patient/caregiver have questions regarding PTA allowable tasks under Medicare guidelines?" },
  { key: "continued_services", label: "Does the patient have then need for continued PTA services?" },
  { key: "neat_wellkept", label: "Does the patient appear neat and well-kept?" },
];

export default function PTASupervisionSection({ supervision, onChange }) {
  const data = supervision || {};

  const update = (key, value) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800">Supervision</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm text-slate-600">Applies to</Label>
          <Input
            className="mt-1 max-w-xs"
            placeholder="PTA name"
            value={data.applies_to || ""}
            onChange={(e) => update("applies_to", e.target.value)}
          />
        </div>

        <div className="space-y-4 pt-2">
          {SUPERVISION_QUESTIONS.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <p className="text-sm text-slate-700">{label}</p>
              <div className="flex gap-6">
                {["Yes", "No"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`supervision_${key}`}
                      checked={data[key] === opt}
                      onChange={() => update(key, opt)}
                      className="w-4 h-4 text-teal-600 cursor-pointer"
                    />
                    <span className="text-sm text-slate-700">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
