"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getReportsData } from "@/lib/api-client/reports";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { BarChart2, Users, FileText, Activity, TrendingUp, Lock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import AccountsReceivableReport from "@/components/reports/AccountsReceivableReport";
import MissedVisitReport from "@/components/reports/MissedVisitReport";
import BilledVisitsReport from "@/components/reports/BilledVisitsReport";

const THERAPY_COLORS = {
  "Physical Therapy": "#0d9488",
  "Occupational Therapy": "#7c3aed",
  "Speech Therapy": "#d97706",
};

const STATUS_COLORS = {
  draft: "#94a3b8",
  completed: "#10b981",
  signed: "#0d9488",
};

const REPORT_MAP = {
  "Accounts Receivable Report": "ar",
  "Visit Allocation Report": "allocation",
  "Billed Visits": "billed",
  "Omits by Therapist": "omits",
  "Omits by Therapist - Trend": "omits_trend",
  "Omit Details": "omit_details",
  "Trended Referrals by Agency": "referrals",
  "Discharge List Report": "discharge",
  "Profitability Report": "profitability",
  "Missed Visit Report": "missed",
};

function ReportsContent() {
  const effectiveUser = useCurrentUser();
  const isAdmin = ["admin", "superuser"].includes(effectiveUser?.role) || ["admin", "superuser"].includes(effectiveUser?.user_type);

  const searchParams = useSearchParams();
  const reportParam = searchParams.get("report");
  const activeReport = reportParam ? REPORT_MAP[reportParam] || "overview" : "overview";
  const activeReportLabel = reportParam || "Overview";

  const [dateFrom, setDateFrom] = useState(format(subMonths(new Date(), 5), "yyyy-MM-01"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const data = await getReportsData();
      setVisits(data.visits);
      setPatients(data.patients);
      setTherapists(data.therapists);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { if (isAdmin) loadData(); }, [isAdmin, loadData]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Lock className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">You don't have access to this page.</p>
      </div>
    );
  }

  const from = new Date(dateFrom + "T00:00:00");
  const to = new Date(dateTo + "T23:59:59");

  const filteredVisits = visits.filter((v) => {
    if (!v.visit_date) return false;
    const d = new Date(v.visit_date + "T00:00:00");
    return d >= from && d <= to;
  });

  // Visits by month
  const months = eachMonthOfInterval({ start: from, end: to });
  const visitsByMonth = months.map((month) => {
    const label = format(month, "MMM yy");
    const mStart = startOfMonth(month);
    const mEnd = endOfMonth(month);
    const count = filteredVisits.filter((v) => {
      const d = new Date(v.visit_date + "T00:00:00");
      return d >= mStart && d <= mEnd;
    }).length;
    return { month: label, visits: count };
  });

  // Visits by therapy type
  const byTherapy = Object.entries(
    filteredVisits.reduce((acc, v) => {
      const t = v.therapy_type || "Unknown";
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.replace(" Therapy", ""), value, color: THERAPY_COLORS[name] || "#64748b" }));

  // Visits by status
  const byStatus = Object.entries(
    filteredVisits.reduce((acc, v) => {
      const s = v.status || "unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] || "#64748b" }));

  // Top therapists by visit count
  const therapistVisitCounts = Object.entries(
    filteredVisits.reduce((acc, v) => {
      const name = v.therapist_name || "Unknown";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const activePatients = patients.filter((p) => p.status === "active").length;
  const activeTherapists = therapists.filter((t) => t.status === "active").length;

  // Placeholder views for specific reports
  const isOverview = activeReport === "overview";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{activeReportLabel}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {isOverview ? "Analytics and insights across your practice" : `Showing data for: ${activeReportLabel}`}
        </p>
      </div>

      {!isOverview && activeReport === "ar" && <AccountsReceivableReport />}
      {!isOverview && activeReport === "missed" && <MissedVisitReport />}
      {!isOverview && activeReport === "billed" && <BilledVisitsReport />}

      {!isOverview && activeReport !== "ar" && activeReport !== "missed" && activeReport !== "billed" && (
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
            <BarChart2 className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-700 font-semibold text-lg mb-1">{activeReportLabel}</p>
            <p className="text-slate-400 text-sm">This report is coming soon. Data will be displayed here once implemented.</p>
          </CardContent>
        </Card>
      )}

      {isOverview && (<>
      {/* Date Range Filter */}
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
            <p className="text-sm text-slate-500 pb-1">{filteredVisits.length} visits in range</p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Visits in Range", value: filteredVisits.length, icon: FileText, color: "text-teal-600 bg-teal-50" },
          { label: "Active Patients", value: activePatients, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Active Therapists", value: activeTherapists, icon: Activity, color: "text-violet-600 bg-violet-50" },
          { label: "Signed Notes", value: filteredVisits.filter(v => v.status === "signed").length, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visits by Month */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="w-4 h-4 text-teal-600" /> Visits by Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={visitsByMonth}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="visits" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Visits by Therapy Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Visits by Discipline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byTherapy} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {byTherapy.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Visits by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Visits by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {byStatus.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Therapists */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Visits per Therapist</CardTitle>
        </CardHeader>
        <CardContent>
          {therapistVisitCounts.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No data for selected range</p>
          ) : (
            <div className="space-y-2">
              {therapistVisitCounts.map(({ name, count }) => {
                const max = therapistVisitCounts[0].count;
                return (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 w-40 truncate shrink-0">{name}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                      <div
                        className="bg-teal-500 h-2.5 rounded-full"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <Badge variant="secondary" className="shrink-0">{count}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </>)}
    </div>
  );
}

export default function Reports() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-slate-400">Loading...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
