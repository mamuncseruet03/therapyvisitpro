"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp } from "lucide-react";
import { format } from "date-fns";
import TreatmentRenderedSection from "./TreatmentRenderedSection";

export default function TreatmentRenderedTab({ form, set, patientVisits = [] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TreatmentRenderedSection treatmentRendered={form.treatment_rendered || {}} onChange={(v) => set("treatment_rendered", v)} therapyType={form.therapy_type} />

      <Card className="border-l-4 border-l-amber-400">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Recent Treatment Sessions</CardTitle>
          <p className="text-xs text-slate-500 mt-1">View past sessions or import data from the last visit</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {(() => {
            const recentTreatments = patientVisits
              .filter(v =>
                v.therapy_type === form.therapy_type &&
                (v.visit_type === 'treatment' || v.visit_type === 're_evaluation' || v.visit_type === 'recertification') &&
                v.id !== form.id
              )
              .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))
              .slice(0, 5);

            const lastNoteWithData = recentTreatments.find(v => v.treatment_rendered);

            return (
              <>
                <Button
                  type="button"
                  className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow"
                  disabled={!lastNoteWithData}
                  onClick={() => {
                    if (lastNoteWithData) set("treatment_rendered", { ...lastNoteWithData.treatment_rendered });
                  }}
                >
                  <FileUp className="w-4 h-4" />
                  Import Last Treatment Data
                </Button>
                {!lastNoteWithData && recentTreatments.length > 0 && (
                  <p className="text-xs text-slate-400 italic text-center">Prior sessions found but none have treatment data recorded yet.</p>
                )}
                {recentTreatments.length === 0 && (
                  <p className="text-sm text-slate-400 italic">No previous treatment sessions found.</p>
                )}

                {recentTreatments.length > 0 && (
                  <div className="space-y-2 mt-1">
                    {recentTreatments.map((visit) => {
                      const tr = visit.treatment_rendered || {};
                      const doneItems = Object.entries(tr.items || {})
                        .filter(([, val]) => val.done)
                        .map(([k]) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
                      const isLast = visit.id === lastNoteWithData?.id;
                      return (
                        <div key={visit.id} className={`rounded-lg border p-3 ${isLast ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              {isLast && <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">LAST</span>}
                              <span className="text-sm font-medium text-slate-700">
                                {format(new Date(visit.visit_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 capitalize">{(visit.visit_type || '').replace(/_/g, ' ')}</span>
                          </div>
                          {doneItems.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {doneItems.slice(0, 4).map((item, j) => (
                                <span key={j} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{item}</span>
                              ))}
                              {doneItems.length > 4 && <span className="text-[10px] text-slate-400">+{doneItems.length - 4} more</span>}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No treatment items recorded</p>
                          )}
                          {tr.notes && <p className="text-xs text-slate-500 mt-1.5 truncate">📝 {tr.notes}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
