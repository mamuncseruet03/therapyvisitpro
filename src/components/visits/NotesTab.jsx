"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DictationTextarea } from "./DictationButton";

export default function NotesTab({ form, set }) {
  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-orange-400">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800">{form.visit_type === "eval_refused" ? "Eval Refused" : "Missed Visit"} — Notes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label className="text-orange-700 font-semibold">{form.visit_type === "eval_refused" ? "Reason Refused" : "Reason Missed"} <span className="text-red-500">★</span></Label><DictationTextarea placeholder="Reason..." value={form.missed_visit_reason || ""} onChange={(e) => set("missed_visit_reason", e.target.value)} rows={4} /></div>
          <div><Label className="text-slate-700 font-semibold">Additional Notes</Label><DictationTextarea placeholder="Additional context..." value={form.assessment || ""} onChange={(e) => set("assessment", e.target.value)} rows={3} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
