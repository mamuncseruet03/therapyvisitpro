"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { format, isWithinInterval, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Eye, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_COLORS = {
  scheduled: "text-sky-600",
  draft: "text-yellow-600",
  completed: "text-blue-600",
  signed: "text-teal-600",
  missed: "text-red-600",
  billed: "text-orange-600",
  paid: "text-emerald-600",
  "in process": "text-purple-600",
};

export default function PreviousCertsTab({ patient, visitNotes, selectedCertIdx, setSelectedCertIdx }) {
  const [rowsPerPage, setRowsPerPage] = useState("50");

  const certPeriods = useMemo(() => {
    const periods = [];
    if (patient?.cert_period_start) {
      periods.push({
        label: `${patient.cert_period_start} - ${patient.cert_period_end || "Present"}`,
        start: patient.cert_period_start,
        end: patient.cert_period_end || null,
        authorization_number: patient.authorization_number,
        authorized_visits: patient.authorized_visits,
        isCurrent: true,
      });
    }
    const evalVisits = (visitNotes || []).filter(
      (v) => v.visit_type === "evaluation" && v.therapy_orders?.weekly_visits?.length > 0
    );
    evalVisits.forEach((ev) => {
      const weeks = ev.therapy_orders.weekly_visits;
      const start = weeks[0]?.week_start;
      const end = weeks[weeks.length - 1]?.week_end;
      if (start && !periods.some((p) => p.start === start)) {
        periods.push({
          label: `${start} - ${end || "Present"}`,
          start,
          end: end || null,
          isCurrent: false,
        });
      }
    });
    return periods;
  }, [patient, visitNotes]);

  const selected = certPeriods[selectedCertIdx] || certPeriods[0];

  const periodVisits = useMemo(() => {
    if (!selected?.start) return visitNotes || [];
    return (visitNotes || []).filter((v) => {
      try {
        const visitDate = parseISO(v.visit_date);
        const start = parseISO(selected.start);
        const end = selected.end ? parseISO(selected.end) : new Date(9999, 11, 31);
        return isWithinInterval(visitDate, { start, end });
      } catch {
        return false;
      }
    });
  }, [visitNotes, selected]);

  const sortedVisits = useMemo(
    () => [...periodVisits].sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date)),
    [periodVisits]
  );

  const displayedVisits = sortedVisits.slice(0, parseInt(rowsPerPage));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={String(selectedCertIdx)}
          onValueChange={(v) => setSelectedCertIdx(Number(v))}
        >
          <SelectTrigger className="w-56 h-9 text-sm border-slate-300">
            <SelectValue placeholder="Select cert period" />
          </SelectTrigger>
          <SelectContent>
            {certPeriods.length === 0 && (
              <SelectItem value="0">No periods found</SelectItem>
            )}
            {certPeriods.map((p, i) => (
              <SelectItem key={i} value={String(i)}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="icon" className="h-9 w-9 bg-teal-600 hover:bg-teal-700">
          <ChevronRight className="w-4 h-4" />
        </Button>

        <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
          <SelectTrigger className="w-20 h-9 text-sm border-slate-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["10", "25", "50", "100"].map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {selected && (
          <div className="bg-slate-100 border-b px-4 py-2 text-sm text-center font-medium text-slate-600">
            Cert Period: {selected.start} - {selected.end || "Present"}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-3 py-3 font-semibold text-slate-600 w-10">#</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-600">
                  <span className="flex items-center gap-1">↕ Date</span>
                </th>
                <th className="text-left px-3 py-3 font-semibold text-slate-600">↕ Visit ID</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-600">Start</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-600">End</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-600">↕ Visit Type</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-600">↕ Status</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-600">↕ Therapist</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedVisits.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No visits found for this period
                  </td>
                </tr>
              ) : (
                displayedVisits.map((visit, idx) => {
                  const statusClass = STATUS_COLORS[visit.status?.toLowerCase()] || "text-slate-600";
                  return (
                    <tr key={visit.id} className={`border-b hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                      <td className="px-3 py-2.5 text-slate-500">{idx + 1}</td>
                      <td className="px-3 py-2.5 text-slate-700 font-medium whitespace-nowrap">
                        {format(parseISO(visit.visit_date), "M/d/yyyy")}
                      </td>
                      <td className="px-3 py-2.5 text-teal-600 font-mono text-xs">
                        {visit.id?.slice(0, 12) || "---"}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                        {visit.time_in || "---"}
                      </td>
                      <td className={`px-3 py-2.5 whitespace-nowrap font-medium ${visit.time_out ? "text-teal-600" : "text-slate-400"}`}>
                        {visit.time_out || "---"}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 capitalize">
                        {visit.visit_type?.replace(/_/g, " ") || "---"}
                      </td>
                      <td className={`px-3 py-2.5 font-medium capitalize ${statusClass}`}>
                        {visit.status || "---"}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {visit.therapist_name || "---"}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Link href={"/visit-note-detail?id=" + visit.id}>
                            <button className="p-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded transition-colors" title="View Note">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          <Link href={"/edit-visit-note?id=" + visit.id}>
                            <button className="p-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded transition-colors" title="Edit Note">
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {sortedVisits.length > parseInt(rowsPerPage) && (
          <div className="px-4 py-2 text-xs text-slate-400 border-t bg-slate-50">
            Showing {displayedVisits.length} of {sortedVisits.length} visits
          </div>
        )}
      </Card>
    </div>
  );
}
