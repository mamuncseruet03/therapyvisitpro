"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format, subMonths } from "date-fns";
import { FileText, Building2 } from "lucide-react";
import { getCalendarVisits } from "@/lib/api-client/calendar";

export default function BilledVisitsReport() {
  const [dateFrom, setDateFrom] = useState(format(subMonths(new Date(), 1), "yyyy-MM-01"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const [visits, setVisits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCalendarVisits()
      .then(setVisits)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const from = new Date(dateFrom + "T00:00:00");
  const to = new Date(dateTo + "T23:59:59");

  const billedVisits = visits.filter((v) => {
    if (!v.visit_date) return false;
    if (v.non_billable) return false;
    if (!["completed", "signed"].includes(v.status)) return false;
    const d = new Date(v.visit_date + "T00:00:00");
    return d >= from && d <= to;
  });

  // Group by agency
  const byAgency = billedVisits.reduce((acc, v) => {
    const agency = v.agency || "Unspecified";
    if (!acc[agency]) acc[agency] = [];
    acc[agency].push(v);
    return acc;
  }, {});

  const agencyEntries = Object.entries(byAgency).sort((a, b) => b[1].length - a[1].length);

  const VISIT_TYPE_LABELS = {
    evaluation: "Evaluation",
    treatment: "Treatment",
    re_evaluation: "Re-Evaluation",
    recertification: "Recertification",
    discharge_with_visit: "Discharge w/ Visit",
    discharge_without_visit: "Discharge w/o Visit",
    eval_refused: "Eval Refused",
    missed_visit: "Missed Visit",
  };

  const THERAPY_COLORS = {
    "Physical Therapy": "bg-teal-100 text-teal-700",
    "Occupational Therapy": "bg-violet-100 text-violet-700",
    "Speech Therapy": "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="mb-1 block text-sm">Date From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-44" />
            </div>
            <div>
              <Label className="mb-1 block text-sm">Date To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-44" />
            </div>
            <div className="flex items-center gap-2 pb-1">
              <FileText className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-slate-700">
                {billedVisits.length} total billed visit{billedVisits.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm">Loading...</div>
      ) : agencyEntries.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-slate-400 text-sm">
            No billed visits found for the selected period.
          </CardContent>
        </Card>
      ) : (
        agencyEntries.map(([agency, agVisits]) => {
          // breakdown by therapy type
          const byTherapy = agVisits.reduce((acc, v) => {
            const t = v.therapy_type || "Unknown";
            acc[t] = (acc[t] || 0) + 1;
            return acc;
          }, {});

          return (
            <Card key={agency}>
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    {agency}
                  </CardTitle>
                  <Badge className="bg-teal-50 text-teal-700 border border-teal-200 text-sm font-semibold">
                    {agVisits.length} visit{agVisits.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                {/* Discipline breakdown pills */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(byTherapy).map(([therapy, count]) => (
                    <span
                      key={therapy}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${THERAPY_COLORS[therapy] || "bg-slate-100 text-slate-600"}`}
                    >
                      {therapy.replace(" Therapy", "")} — {count}
                    </span>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs">Date</th>
                        <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs">Patient</th>
                        <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs">Therapist</th>
                        <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs">Discipline</th>
                        <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs">Visit Type</th>
                        <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agVisits
                        .sort((a, b) => (a.visit_date < b.visit_date ? 1 : -1))
                        .map((v) => (
                          <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                              {v.visit_date ? format(new Date(v.visit_date + "T00:00:00"), "MM/dd/yyyy") : "—"}
                            </td>
                            <td className="px-4 py-2.5 text-slate-700">{v.patient_name || "—"}</td>
                            <td className="px-4 py-2.5 text-slate-500">{v.therapist_name || "—"}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${THERAPY_COLORS[v.therapy_type] || "bg-slate-100 text-slate-600"}`}>
                                {(v.therapy_type || "").replace(" Therapy", "") || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">
                              {VISIT_TYPE_LABELS[v.visit_type] || v.visit_type || "—"}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                v.status === "signed" ? "bg-emerald-100 text-emerald-700" :
                                v.status === "completed" ? "bg-blue-100 text-blue-700" :
                                "bg-slate-100 text-slate-600"
                              }`}>
                                {v.status || "draft"}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
