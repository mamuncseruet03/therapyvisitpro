"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getTimeLogs } from "@/lib/api-client/time-logs";
import ClockInOut from "@/components/coordinator/ClockInOut";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, BarChart2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  addWeeks, subWeeks, addMonths, subMonths, isWithinInterval, parseJSON
} from "date-fns";

function formatDuration(mins) {
  if (!mins) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function ShiftRow({ log }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 text-sm">
      <div>
        <p className="font-medium text-slate-700">{format(parseISO(log.clock_in), "EEEE, MMM d")}</p>
        <p className="text-xs text-slate-400">
          {format(parseISO(log.clock_in), "h:mm a")} → {log.clock_out ? format(parseISO(log.clock_out), "h:mm a") : <span className="text-teal-600">In progress</span>}
        </p>
      </div>
      <Badge variant="outline" className="text-teal-700 border-teal-300 bg-teal-50 font-semibold">
        {log.clock_out ? formatDuration(log.duration_minutes) : "—"}
      </Badge>
    </div>
  );
}

export default function MyLabor() {
  const effectiveUser = useCurrentUser();
  const [view, setView] = useState("weekly");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [allLogs, setAllLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    if (!effectiveUser?.email) return;
    try {
      const data = await getTimeLogs(effectiveUser.email);
      setAllLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUser?.email]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const now = new Date();

  const weekStart = startOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 0 });

  const monthStart = startOfMonth(addMonths(now, monthOffset));
  const monthEnd = endOfMonth(addMonths(now, monthOffset));

  const filteredLogs = allLogs.filter(log => {
    const d = parseISO(log.clock_in);
    return view === "weekly"
      ? isWithinInterval(d, { start: weekStart, end: weekEnd })
      : isWithinInterval(d, { start: monthStart, end: monthEnd });
  });

  const completedLogs = filteredLogs.filter(l => l.clock_out);
  const totalMins = completedLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  const totalDays = new Set(completedLogs.map(l => l.date)).size;
  const avgMinsPerDay = totalDays > 0 ? Math.round(totalMins / totalDays) : 0;

  const periodLabel = view === "weekly"
    ? `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`
    : format(monthStart, "MMMM yyyy");

  const goBack = () => view === "weekly" ? setWeekOffset(o => o - 1) : setMonthOffset(o => o - 1);
  const goForward = () => view === "weekly" ? setWeekOffset(o => o + 1) : setMonthOffset(o => o + 1);
  const isCurrentPeriod = view === "weekly" ? weekOffset === 0 : monthOffset === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Labor</h1>
        <p className="text-slate-500 text-sm mt-1">Track your hours and view your labor history</p>
      </div>

      {/* Clock In/Out widget */}
      <ClockInOut />

      {/* View toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          <button
            onClick={() => { setView("weekly"); setWeekOffset(0); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${view === "weekly" ? "bg-teal-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            Weekly
          </button>
          <button
            onClick={() => { setView("monthly"); setMonthOffset(0); }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-slate-200 ${view === "monthly" ? "bg-teal-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            Monthly
          </button>
        </div>

        {/* Period navigation */}
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={goBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-slate-700 min-w-[200px] text-center">{periodLabel}</span>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={goForward} disabled={isCurrentPeriod}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          {!isCurrentPeriod && (
            <Button variant="ghost" size="sm" className="text-teal-600 text-xs"
              onClick={() => view === "weekly" ? setWeekOffset(0) : setMonthOffset(0)}>
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Hours</p>
              <p className="text-xl font-bold text-slate-800">{formatDuration(totalMins)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Days Worked</p>
              <p className="text-xl font-bold text-slate-800">{totalDays}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Avg Per Day</p>
              <p className="text-xl font-bold text-slate-800">{formatDuration(avgMinsPerDay)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shift log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-700">Shift Log</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No shifts recorded for this period</p>
            </div>
          ) : (
            filteredLogs.sort((a, b) => b.clock_in.localeCompare(a.clock_in)).map(log => (
              <ShiftRow key={log.id} log={log} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
