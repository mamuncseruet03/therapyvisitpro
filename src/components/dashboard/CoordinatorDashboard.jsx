"use client";

import React, { useState, useEffect } from "react";
import { Users, FileText, CalendarCheck, Clock, ChevronDown, ChevronUp, AlertCircle, XCircle, UserPlus, CalendarPlus, ClipboardList, Building2, Receipt, DollarSign, BarChart2, UserCog } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import RecentVisits from "@/components/dashboard/RecentVisits";
import TherapyBreakdown from "@/components/dashboard/TherapyBreakdown";
import ReferralManagement from "@/components/dashboard/ReferralManagement";
import AdminAwaitingAcceptance from "@/components/dashboard/AdminAwaitingAcceptance";
import OrdersAwaitingApproval from "@/components/dashboard/OrdersAwaitingApproval";
import AwaitingAssignment from "@/components/dashboard/AwaitingAssignment";
import { getPatients } from "@/lib/api-client/patients";
import { getTherapists } from "@/lib/api-client/therapists";
import { getCalendarVisits } from "@/lib/api-client/calendar";
import { getAgencies } from "@/lib/api-client/agencies";
import { getAssignments } from "@/lib/api-client/referrals";

export default function CoordinatorDashboard({ user }) {
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [visits, setVisits] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    Promise.all([getPatients(), getTherapists(), getCalendarVisits(), getAgencies(), getAssignments()])
      .then(([p, t, v, a, asgn]) => { setPatients(p); setTherapists(t); setVisits(v); setAgencies(a); setAssignments(asgn); })
      .catch(console.error);
  }, []);

  const activePatients = patients.filter((p) => p.status === "active").length;
  const drafts = visits.filter((v) => v.status === "draft").length;

  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weeklyScheduled = visits.filter((v) => {
    if (v.status !== "scheduled") return false;
    const d = new Date(v.visit_date + "T00:00:00");
    return d >= weekStart && d <= weekEnd;
  }).length;

  const delayedVisits = visits.filter((v) => {
    if (v.status !== "scheduled") return false;
    const d = new Date(v.visit_date + "T00:00:00");
    if (d < weekStart || d > weekEnd) return false;
    return !v.therapist_signature_timestamp;
  });

  const missedVisitsData = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const assignment of assignments) {
    if (!assignment.approved_weekly_visits?.length) continue;
    for (const week of assignment.approved_weekly_visits) {
      if (!week.week_end || !week.approved_visits) continue;
      const wEnd = new Date(week.week_end + "T23:59:59");
      if (wEnd >= today) continue;
      const wStart = new Date(week.week_start + "T00:00:00");
      const completed = visits.filter((v) => {
        if (v.patient_id !== assignment.patient_id) return false;
        if (v.therapy_type !== assignment.therapy_type) return false;
        if (v.status === "draft") return false;
        const d = new Date(v.visit_date + "T00:00:00");
        return d >= wStart && d <= wEnd;
      }).length;
      const missed = week.approved_visits - completed;
      if (missed > 0) {
        missedVisitsData.push({
          patient_name: assignment.patient_name,
          therapist_name: assignment.therapist_name,
          therapy_type: assignment.therapy_type,
          week_label: week.week_label,
          week_start: week.week_start,
          week_end: week.week_end,
          approved: week.approved_visits,
          completed,
          missed,
        });
      }
    }
  }
  const totalMissed = missedVisitsData.reduce((s, r) => s + r.missed, 0);

  const [weeklyExpanded, setWeeklyExpanded] = useState(false);
  const [missedExpanded, setMissedExpanded] = useState(false);

  const weeklyVisits = visits.filter((v) => {
    if (v.status !== "scheduled") return false;
    const d = new Date(v.visit_date + "T00:00:00");
    return d >= weekStart && d <= weekEnd;
  });

  const quickActions = [
    { label: "New Orders", icon: ClipboardList, to: "/Orders", color: "text-teal-600 bg-teal-50 hover:bg-teal-100" },
    { label: "New Patient", icon: UserPlus, to: "/Patients", color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
    { label: "Agencies", icon: Building2, to: "/Agencies", color: "text-orange-600 bg-orange-50 hover:bg-orange-100" },
    { label: "Reports", icon: BarChart2, to: "/Reports", color: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Coordinator Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage operations and documentation</p>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Link key={action.label} href={action.to}>
            <div className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border border-transparent transition-all shadow-sm cursor-pointer ${action.color}`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center">
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium whitespace-nowrap">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Active Patients" value={activePatients} icon={Users} accent="bg-teal-50 text-teal-600" />
        <StatCard label="Delayed Visits" value={delayedVisits.length} icon={AlertCircle} accent="bg-red-50 text-red-600" />
        <div className="col-span-2 lg:col-span-1">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setMissedExpanded((p) => !p)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">Missed Visits</p>
                  <p className="text-2xl font-bold text-slate-900">{totalMissed}</p>
                </div>
                {missedExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </CardContent>
          </Card>
        </div>
        <StatCard label="Drafts" value={drafts} icon={Clock} accent="bg-amber-50 text-amber-600" />
        <div className="col-span-2 lg:col-span-1">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setWeeklyExpanded((p) => !p)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">Weekly Scheduled</p>
                  <p className="text-2xl font-bold text-slate-900">{weeklyScheduled}</p>
                </div>
                {weeklyExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {missedExpanded && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Missed Visits — Past Weeks Below Expected Frequency</h3>
            {missedVisitsData.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No missed visits found</p>
            ) : (
              <div className="divide-y">
                {missedVisitsData.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{r.patient_name}</p>
                      <p className="text-xs text-slate-500">{r.therapist_name} · {(r.therapy_type || "").replace(" Therapy", "")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-orange-700">{r.week_label || (r.week_start ? format(new Date(r.week_start + "T00:00:00"), "MMM d") + " – " + format(new Date(r.week_end + "T00:00:00"), "MMM d") : "—")}</p>
                      <Badge variant="outline" className="text-[10px] mt-0.5 border-orange-200 bg-orange-50 text-orange-700">{r.completed}/{r.approved} done · {r.missed} missed</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {weeklyExpanded && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Delayed Visits (Not Initiated) — {format(weekStart, "MMM d")} to {format(weekEnd, "MMM d, yyyy")}
            </h3>
            {delayedVisits.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No delayed visits this week</p>
            ) : (
              <div className="divide-y">
                {delayedVisits
                  .sort((a, b) => (a.visit_date > b.visit_date ? 1 : -1))
                  .map((v) => (
                    <Link
                      key={v.id}
                      href={"/VisitNoteDetail" + `?id=${v.id}`}
                      className="flex items-center justify-between py-2.5 gap-3 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{v.patient_name}</p>
                        <p className="text-xs text-slate-500">{v.therapist_name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-red-700">{v.visit_date ? format(new Date(v.visit_date + "T00:00:00"), "EEE, MMM d") : "—"}</p>
                        <Badge variant="outline" className="text-[10px] mt-0.5 border-red-200 bg-red-50 text-red-700">{(v.therapy_type || "").replace(" Therapy", "")}</Badge>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ReferralManagement patients={patients} therapists={therapists} visits={visits} agencies={agencies} />

      <AdminAwaitingAcceptance assignments={assignments} />

      <AwaitingAssignment assignments={assignments} therapists={therapists} />

      <OrdersAwaitingApproval visits={visits} therapists={therapists} agencies={agencies} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentVisits visits={visits.slice(0, 10)} />
        </div>
        <TherapyBreakdown visits={visits} />
      </div>
    </div>
  );
}
