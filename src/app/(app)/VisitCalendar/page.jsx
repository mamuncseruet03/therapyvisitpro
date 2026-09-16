"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { getCalendarVisits } from "@/lib/api-client/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X as XIcon, Download, Calendar, CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, isSameDay, addMonths, subMonths,
  addWeeks, subWeeks,
} from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const THERAPY_COLORS = {
  "Physical Therapy": "bg-blue-500",
  "Occupational Therapy": "bg-amber-500",
  "Speech Therapy": "bg-violet-500",
};

const THERAPY_BADGE = {
  "Physical Therapy": "bg-blue-100 text-blue-700",
  "Occupational Therapy": "bg-amber-100 text-amber-700",
  "Speech Therapy": "bg-violet-100 text-violet-700",
};

function downloadCSV(visits, label) {
  const headers = ["Date", "Patient", "Therapist", "Therapy Type", "Visit Type", "Status", "Agency", "Duration (min)"];
  const rows = visits.map(v => [
    v.visit_date || "",
    v.patient_name || "",
    v.therapist_name || "",
    v.therapy_type || "",
    (v.visit_type || "").replace(/_/g, " "),
    v.status || "",
    v.agency || "",
    v.duration_minutes || "",
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `visit-schedule-${label}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function VisitCalendar() {
  const [viewMode, setViewMode] = useState("monthly");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));
  const [currentDay, setCurrentDay] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState([]);
  const [filterTherapist, setFilterTherapist] = useState("all");
  const [filterDiscipline, setFilterDiscipline] = useState("all");
  const [filterAgency, setFilterAgency] = useState("all");

  const toggleDay = (d) => {
    setSelectedDays((prev) => {
      const exists = prev.some((s) => isSameDay(s, d));
      return exists ? prev.filter((s) => !isSameDay(s, d)) : [...prev, d];
    });
  };
  const clearSelection = () => setSelectedDays([]);

  const [visits, setVisits] = useState([]);

  const loadVisits = useCallback(async () => {
    try {
      const data = await getCalendarVisits();
      setVisits(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadVisits(); }, [loadVisits]);

  const filteredVisits = useMemo(() => visits.filter((v) => {
    if (filterTherapist !== "all" && v.therapist_name !== filterTherapist) return false;
    if (filterDiscipline !== "all" && v.therapy_type !== filterDiscipline) return false;
    if (filterAgency !== "all" && v.agency !== filterAgency) return false;
    return true;
  }), [visits, filterTherapist, filterDiscipline, filterAgency]);

  const therapistOptions = useMemo(() => [...new Set(visits.map(v => v.therapist_name).filter(Boolean))].sort(), [visits]);
  const agencyOptions = useMemo(() => [...new Set(visits.map(v => v.agency).filter(Boolean))].sort(), [visits]);
  const DISCIPLINES = ["Physical Therapy", "Occupational Therapy", "Speech Therapy"];
  const hasFilters = filterTherapist !== "all" || filterDiscipline !== "all" || filterAgency !== "all";

  const getVisitsForDay = (d) =>
    filteredVisits.filter((v) => v.visit_date && isSameDay(new Date(v.visit_date + "T00:00:00"), d));

  const selectedVisits = selectedDays.length > 0
    ? filteredVisits
        .filter((v) => v.visit_date && selectedDays.some((s) => isSameDay(new Date(v.visit_date + "T00:00:00"), s)))
        .sort((a, b) => (a.visit_date > b.visit_date ? 1 : -1))
    : [];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const weeks = [];
  let day = calStart;
  while (day <= calEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) { week.push(new Date(day)); day = addDays(day, 1); }
    weeks.push(week);
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const handleDownload = () => {
    if (viewMode === "monthly") {
      const monthVisits = filteredVisits.filter(v => {
        if (!v.visit_date) return false;
        const d = new Date(v.visit_date + "T00:00:00");
        return isSameMonth(d, currentMonth);
      });
      downloadCSV(monthVisits, format(currentMonth, "yyyy-MM"));
    } else if (viewMode === "weekly") {
      const weekEnd = endOfWeek(currentWeek);
      const weekVisits = filteredVisits.filter(v => {
        if (!v.visit_date) return false;
        const d = new Date(v.visit_date + "T00:00:00");
        return d >= currentWeek && d <= weekEnd;
      });
      downloadCSV(weekVisits, `week-${format(currentWeek, "yyyy-MM-dd")}`);
    } else {
      const dayVisits = getVisitsForDay(currentDay);
      downloadCSV(dayVisits, format(currentDay, "yyyy-MM-dd"));
    }
  };

  const VisitCard = ({ v, showDate = false }) => (
    <Link href={`/VisitNoteDetail?id=${v.id}`}
      className="block px-4 py-3 hover:bg-slate-50 transition-colors border-b last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{v.patient_name}</p>
          <p className="text-xs text-slate-500 truncate">{v.therapist_name}</p>
          {showDate && <p className="text-[10px] text-slate-400">{format(new Date(v.visit_date + "T00:00:00"), "MMM d")}</p>}
          <Badge variant="outline" className={`text-[10px] mt-1 ${THERAPY_BADGE[v.therapy_type] || ""}`}>
            {(v.therapy_type || "").replace(" Therapy", "")}
          </Badge>
        </div>
        <div className="text-right shrink-0">
          <Badge variant="outline" className="text-[10px] capitalize">{(v.visit_type || "").replace(/_/g, " ")}</Badge>
          <p className={`text-[10px] mt-1 font-medium capitalize ${
            v.status === "signed" ? "text-teal-600" :
            v.status === "completed" ? "text-emerald-600" :
            v.status === "scheduled" ? "text-blue-600" : "text-slate-400"
          }`}>{v.status}</p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Visit Calendar</h1>
          <p className="text-slate-500 text-sm mt-1">Click days to view visits — select multiple days at once</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
          <Download className="w-4 h-4" /> Download Schedule
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Filter className="w-4 h-4" /> Filters
        </div>
        <Select value={filterTherapist} onValueChange={setFilterTherapist}>
          <SelectTrigger className="w-48 h-8 text-sm"><SelectValue placeholder="All Therapists" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Therapists</SelectItem>
            {therapistOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDiscipline} onValueChange={setFilterDiscipline}>
          <SelectTrigger className="w-48 h-8 text-sm"><SelectValue placeholder="All Disciplines" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Disciplines</SelectItem>
            {DISCIPLINES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterAgency} onValueChange={setFilterAgency}>
          <SelectTrigger className="w-48 h-8 text-sm"><SelectValue placeholder="All Agencies" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agencies</SelectItem>
            {agencyOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 gap-1"
            onClick={() => { setFilterTherapist("all"); setFilterDiscipline("all"); setFilterAgency("all"); }}>
            <XIcon className="w-3 h-3" /> Clear filters
          </Button>
        )}

        {/* View Mode Toggle */}
        <div className="ml-auto flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {[
            { key: "monthly", label: "Monthly" },
            { key: "weekly", label: "Weekly" },
            { key: "daily", label: "Daily" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setViewMode(key)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* MONTHLY VIEW */}
      {viewMode === "monthly" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">{format(currentMonth, "MMMM yyyy")}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
                ))}
              </div>
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
                  {week.map((d, di) => {
                    const dayVisits = getVisitsForDay(d);
                    const isSelected = selectedDays.some(s => isSameDay(s, d));
                    const isToday = isSameDay(d, new Date());
                    const inMonth = isSameMonth(d, currentMonth);
                    return (
                      <button key={di} onClick={() => toggleDay(d)}
                        className={`min-h-[80px] p-1.5 text-left border-r last:border-r-0 transition-colors
                          ${!inMonth ? "bg-slate-50/50" : "bg-white hover:bg-teal-50"}
                          ${isSelected ? "bg-teal-50 ring-2 ring-inset ring-teal-400" : ""}`}>
                        <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full
                          ${isToday ? "bg-teal-600 text-white" : inMonth ? "text-slate-700" : "text-slate-300"}`}>
                          {format(d, "d")}
                        </span>
                        {dayVisits.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {dayVisits.slice(0, 2).map((v, i) => (
                              <div key={i} className={`text-[10px] truncate px-1 py-0.5 rounded text-white ${THERAPY_COLORS[v.therapy_type] || "bg-slate-400"}`}>
                                {v.patient_name?.split(" ")[0] || "Visit"}
                              </div>
                            ))}
                            {dayVisits.length > 2 && <div className="text-[10px] text-slate-400 px-1">+{dayVisits.length - 2} more</div>}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </CardContent>
          </Card>
          {/* Detail panel */}
          <div>
            {selectedDays.length > 0 ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      {selectedDays.length === 1 ? format(selectedDays[0], "EEEE, MMM d") : `${selectedDays.length} days selected`}
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearSelection}><X className="w-4 h-4" /></Button>
                  </div>
                  {selectedDays.length > 1 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {[...selectedDays].sort((a,b)=>a-b).map((d,i) => (
                        <button key={i} onClick={() => toggleDay(d)}
                          className="text-[10px] bg-teal-100 text-teal-700 rounded px-1.5 py-0.5 hover:bg-red-100 hover:text-red-600 transition-colors">
                          {format(d, "MMM d")} ×
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-400">{selectedVisits.length} visit{selectedVisits.length !== 1 ? "s" : ""}</p>
                </CardHeader>
                <CardContent className="p-0">
                  {selectedVisits.length === 0
                    ? <p className="text-sm text-slate-400 text-center py-8 px-4">No visits on selected days</p>
                    : selectedVisits.map(v => <VisitCard key={v.id} v={v} showDate={selectedDays.length > 1} />)
                  }
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                  <CalendarDays className="w-10 h-10 opacity-30" />
                  <p className="text-sm">Select one or more days to view visits</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* WEEKLY VIEW */}
      {viewMode === "weekly" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Week of {format(currentWeek, "MMM d")} – {format(endOfWeek(currentWeek), "MMM d, yyyy")}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => setCurrentWeek(startOfWeek(new Date()))}>This Week</Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b">
              {weekDays.map((d, i) => (
                <div key={i} className={`text-center py-3 border-r last:border-r-0 ${isSameDay(d, new Date()) ? "bg-teal-50" : ""}`}>
                  <p className="text-xs font-semibold text-slate-400">{format(d, "EEE")}</p>
                  <p className={`text-lg font-bold mt-0.5 ${isSameDay(d, new Date()) ? "text-teal-600" : "text-slate-700"}`}>{format(d, "d")}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 min-h-[300px]">
              {weekDays.map((d, i) => {
                const dayVisits = getVisitsForDay(d);
                return (
                  <div key={i} className={`border-r last:border-r-0 p-1.5 space-y-1 ${isSameDay(d, new Date()) ? "bg-teal-50/30" : ""}`}>
                    {dayVisits.length === 0
                      ? <p className="text-[10px] text-slate-300 text-center mt-4">—</p>
                      : dayVisits.map((v, vi) => (
                        <Link key={vi} href={`/VisitNoteDetail?id=${v.id}`}
                          className={`block text-[10px] text-white rounded px-1.5 py-1 truncate hover:opacity-80 ${THERAPY_COLORS[v.therapy_type] || "bg-slate-400"}`}
                          title={`${v.patient_name} — ${v.visit_type}`}>
                          {v.patient_name?.split(" ")[0] || "Visit"}
                        </Link>
                      ))
                    }
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* DAILY VIEW */}
      {viewMode === "daily" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{format(currentDay, "EEEE, MMMM d, yyyy")}</CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDay(d => addDays(d, -1))}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => setCurrentDay(new Date())}>Today</Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDay(d => addDays(d, 1))}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {getVisitsForDay(currentDay).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                <Calendar className="w-10 h-10 opacity-30" />
                <p className="text-sm">No visits scheduled for this day</p>
              </div>
            ) : (
              <div>
                <p className="px-4 py-2 text-xs text-slate-400 border-b">{getVisitsForDay(currentDay).length} visits</p>
                {getVisitsForDay(currentDay).map(v => <VisitCard key={v.id} v={v} />)}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
