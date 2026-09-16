"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, subMonths } from "date-fns";
import { AlertCircle } from "lucide-react";
import { getCalendarVisits } from "@/lib/api-client/calendar";

export default function MissedVisitReport() {
  const [dateFrom, setDateFrom] = useState(format(subMonths(new Date(), 1), "yyyy-MM-01"));
  const [dateTo, setDateTo]     = useState(format(new Date(), "yyyy-MM-dd"));
  const [groupBy, setGroupBy]   = useState("agency");

  const [visits, setVisits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCalendarVisits()
      .then(setVisits)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const from = new Date(dateFrom + "T00:00:00");
  const to   = new Date(dateTo   + "T23:59:59");

  const missed = visits.filter((v) => {
    if (v.visit_type !== "missed_visit" && v.visit_type !== "eval_refused") return false;
    if (!v.visit_date) return false;
    const d = new Date(v.visit_date + "T00:00:00");
    return d >= from && d <= to;
  });

  // Group the missed visits
  const grouped = missed.reduce((acc, v) => {
    const key = groupBy === "agency"
      ? (v.agency || "Unknown Agency")
      : (v.therapist_name || "Unknown Therapist");
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

  const sortedKeys = Object.keys(grouped).sort((a, b) => grouped[b].length - grouped[a].length);

  const VISIT_TYPE_LABELS = {
    missed_visit: "Missed Visit",
    eval_refused: "Eval Refused",
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
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
            <div>
              <Label className="mb-1 block text-sm">Group By</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={groupBy === "agency" ? "default" : "outline"}
                  onClick={() => setGroupBy("agency")}
                >
                  Agency
                </Button>
                <Button
                  size="sm"
                  variant={groupBy === "therapist" ? "default" : "outline"}
                  onClick={() => setGroupBy("therapist")}
                >
                  Therapist
                </Button>
              </div>
            </div>
            <div className="pb-1">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {missed.length} missed visit{missed.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-10">Loading…</p>
      ) : missed.length === 0 ? (
        <Card>
          <CardContent className="p-10 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No missed visits found in this date range.</p>
          </CardContent>
        </Card>
      ) : (
        sortedKeys.map((key) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{key}</span>
                <Badge variant="secondary">{grouped[key].length} missed</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visit Date</TableHead>
                    <TableHead>Patient</TableHead>
                    {groupBy === "agency" && <TableHead>Therapist</TableHead>}
                    {groupBy === "therapist" && <TableHead>Agency</TableHead>}
                    <TableHead>Discipline</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grouped[key]
                    .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))
                    .map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="text-sm font-medium">{v.visit_date}</TableCell>
                        <TableCell className="text-sm">{v.patient_name || "—"}</TableCell>
                        {groupBy === "agency" && <TableCell className="text-sm">{v.therapist_name || "—"}</TableCell>}
                        {groupBy === "therapist" && <TableCell className="text-sm">{v.agency || "—"}</TableCell>}
                        <TableCell className="text-sm">{v.therapy_type ? v.therapy_type.replace(" Therapy", "") : "—"}</TableCell>
                        <TableCell>
                          <Badge className="text-xs bg-red-50 text-red-700">
                            {VISIT_TYPE_LABELS[v.visit_type] || v.visit_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 max-w-xs truncate">
                          {v.missed_visit_reason || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
