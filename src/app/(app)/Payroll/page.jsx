"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getPayrollData } from "@/lib/api-client/payroll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Calculator, ChevronDown, ChevronUp, Printer } from "lucide-react";
import { format } from "date-fns";

const VISIT_TYPE_RATE_KEY = {
  evaluation: "eval",
  treatment: "return_visit",
  re_evaluation: "recert",
  discharge: "discharge",
};

function getPatientType(patient) {
  if (!patient?.date_of_birth) return "geriatrics";
  const age = (new Date() - new Date(patient.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25);
  return age < 18 ? "peds" : "geriatrics";
}

function getRate(therapist, visitType, patientType) {
  const rateKey = VISIT_TYPE_RATE_KEY[visitType] || "return_visit";
  return parseFloat(therapist?.rates?.[patientType]?.[rateKey]) || 0;
}

export default function Payroll() {
  const effectiveUser = useCurrentUser();
  const isAdmin = ["admin", "superuser"].includes(effectiveUser?.role) || ["admin", "superuser"].includes(effectiveUser?.user_type);

  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = today.slice(0, 8) + "01";
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [selectedTherapistIds, setSelectedTherapistIds] = useState([]);
  const [results, setResults] = useState(null);
  const [expanded, setExpanded] = useState({});

  const toggleTherapist = (id) => {
    setSelectedTherapistIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedTherapistIds(therapists.map((t) => t.id));
  const clearAll = () => setSelectedTherapistIds([]);

  const [therapists, setTherapists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [allVisits, setAllVisits] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const data = await getPayrollData();
      setTherapists(data.therapists);
      setPatients(data.patients);
      setAllVisits(data.visits);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { if (isAdmin) loadData(); }, [isAdmin, loadData]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <DollarSign className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">You don't have access to this page.</p>
      </div>
    );
  }

  const runPayroll = () => {
    const from = new Date(dateFrom + "T00:00:00");
    const to = new Date(dateTo + "T23:59:59");

    const rangeVisits = allVisits.filter((v) => {
      if (!v.visit_date) return false;
      if (v.status === "draft") return false;
      const d = new Date(v.visit_date + "T00:00:00");
      if (d < from || d > to) return false;
      if (selectedTherapistIds.length > 0 && !selectedTherapistIds.includes(v.therapist_id)) return false;
      return true;
    });

    const patientMap = Object.fromEntries(patients.map((p) => [p.id, p]));
    const therapistMap = Object.fromEntries(therapists.map((t) => [t.id, t]));

    // Group visits by therapist
    const byTherapist = {};
    for (const visit of rangeVisits) {
      const tid = visit.therapist_id;
      if (!tid) continue;
      if (!byTherapist[tid]) byTherapist[tid] = [];
      byTherapist[tid].push(visit);
    }

    const payrollData = Object.entries(byTherapist).map(([tid, visits]) => {
      const therapist = therapistMap[tid] || { full_name: visits[0]?.therapist_name || "Unknown", rates: {} };
      const lineItems = visits.map((v) => {
        const patient = patientMap[v.patient_id];
        const patientType = getPatientType(patient);
        const rate = getRate(therapist, v.visit_type, patientType);
        return {
          visit_date: v.visit_date,
          patient_name: v.patient_name,
          therapy_type: v.therapy_type,
          visit_type: v.visit_type,
          patient_type: patientType,
          rate,
          visitId: v.id,
        };
      });

      const total = lineItems.reduce((s, li) => s + li.rate, 0);
      return { therapist_id: tid, therapist_name: therapist.full_name, lineItems, total };
    });

    payrollData.sort((a, b) => a.therapist_name.localeCompare(b.therapist_name));
    setResults(payrollData);
    setExpanded({});
  };

  const grandTotal = results?.reduce((s, r) => s + r.total, 0) || 0;

  const toggleExpand = (tid) => setExpanded((p) => ({ ...p, [tid]: !p[tid] }));

  const visitTypeLabel = (vt) => (vt || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll</h1>
          <p className="text-slate-500 text-sm mt-1">Calculate therapist pay by visit count and rates</p>
        </div>
        {results && (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print / Export
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label className="mb-1 block text-sm">Date From</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-44" />
              </div>
              <div>
                <Label className="mb-1 block text-sm">Date To</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-44" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm">Therapists <span className="text-slate-400 font-normal">(leave all unselected to include everyone)</span></Label>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs text-teal-600 hover:underline">Select All</button>
                  <span className="text-slate-300">|</span>
                  <button onClick={clearAll} className="text-xs text-slate-500 hover:underline">Clear</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {therapists.filter(t => t.status === "active").map((t) => {
                  const active = selectedTherapistIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTherapist(t.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? "bg-teal-600 text-white border-teal-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"
                      }`}
                    >
                      {t.full_name}{t.credentials ? ` (${t.credentials})` : ""}
                    </button>
                  );
                })}
              </div>
            </div>
            <Button onClick={runPayroll} className="bg-teal-600 hover:bg-teal-700 gap-2">
              <Calculator className="w-4 h-4" /> Run Payroll
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-teal-600 bg-teal-50 rounded-lg p-1.5" />
                <div>
                  <p className="text-xs text-slate-500">Total Payroll</p>
                  <p className="text-xl font-bold text-slate-900">${grandTotal.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 text-blue-600 bg-blue-50 rounded-lg flex items-center justify-center font-bold text-sm">#</div>
                <div>
                  <p className="text-xs text-slate-500">Therapists</p>
                  <p className="text-xl font-bold text-slate-900">{results.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 text-violet-600 bg-violet-50 rounded-lg flex items-center justify-center font-bold text-sm">V</div>
                <div>
                  <p className="text-xs text-slate-500">Total Visits</p>
                  <p className="text-xl font-bold text-slate-900">{results.reduce((s, r) => s + r.lineItems.length, 0)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {results.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-slate-400">
                No completed visits found for this date range.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {results.map((row) => (
                <Card key={row.therapist_id}>
                  <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleExpand(row.therapist_id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expanded[row.therapist_id] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        <CardTitle className="text-base font-semibold">{row.therapist_name}</CardTitle>
                        <Badge variant="secondary">{row.lineItems.length} visit{row.lineItems.length !== 1 ? "s" : ""}</Badge>
                      </div>
                      <span className="text-lg font-bold text-teal-700">${row.total.toFixed(2)}</span>
                    </div>
                  </CardHeader>
                  {expanded[row.therapist_id] && (
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead className="hidden sm:table-cell">Therapy</TableHead>
                            <TableHead>Visit Type</TableHead>
                            <TableHead className="hidden sm:table-cell">Patient Type</TableHead>
                            <TableHead className="text-right">Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {row.lineItems
                            .sort((a, b) => (a.visit_date > b.visit_date ? 1 : -1))
                            .map((li, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-sm">{li.visit_date ? format(new Date(li.visit_date), "MMM d, yyyy") : "—"}</TableCell>
                                <TableCell className="text-sm font-medium">{li.patient_name}</TableCell>
                                <TableCell className="hidden sm:table-cell text-sm text-slate-500">{li.therapy_type?.replace(" Therapy", "")}</TableCell>
                                <TableCell className="text-sm">{visitTypeLabel(li.visit_type)}</TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  <Badge variant="outline" className={`text-xs ${li.patient_type === "peds" ? "text-blue-700 border-blue-200" : "text-slate-600"}`}>
                                    {li.patient_type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {li.rate > 0 ? `$${li.rate.toFixed(2)}` : <span className="text-amber-600 text-xs">No rate set</span>}
                                </TableCell>
                              </TableRow>
                            ))}
                          <TableRow className="bg-slate-50 font-semibold">
                            <TableCell colSpan={5} className="text-right text-sm">Total</TableCell>
                            <TableCell className="text-right text-teal-700">${row.total.toFixed(2)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
