"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getCalendarVisits, getTherapistsForSchedule } from "@/lib/api-client/calendar";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, FileText } from "lucide-react";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, eachDayOfInterval, isSameDay, parseISO } from "date-fns";

const therapyColors = {
  "Physical Therapy": "bg-teal-100 text-teal-700 border-teal-200",
  "Occupational Therapy": "bg-purple-100 text-purple-700 border-purple-200",
  "Speech Therapy": "bg-amber-100 text-amber-700 border-amber-200",
};

const statusColors = {
  draft: "bg-slate-100 text-slate-600",
  completed: "bg-green-100 text-green-700",
  signed: "bg-blue-100 text-blue-700",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MySchedule() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));

  const currentUser = useCurrentUser();

  const [allTherapists, setAllTherapists] = useState([]);
  const [visits, setVisits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [visitsData, therapistsData] = await Promise.all([
        getCalendarVisits(),
        getTherapistsForSchedule(),
      ]);
      setVisits(visitsData);
      setAllTherapists(therapistsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const myTherapistRecord = allTherapists.find(
    t => t.email === currentUser?.email || t.full_name?.toLowerCase() === currentUser?.full_name?.toLowerCase()
  );

  const weekEnd = endOfWeek(weekStart);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filter visits for this therapist (match by user id, therapist entity id, or either name)
  const myVisits = visits.filter(v =>
    v.therapist_id === currentUser?.id ||
    v.therapist_id === myTherapistRecord?.id ||
    v.therapist_name === currentUser?.full_name ||
    v.therapist_name === myTherapistRecord?.full_name
  );

  const getVisitsForDay = (day) =>
    myVisits.filter(v => v.visit_date && isSameDay(parseISO(v.visit_date), day));

  const totalThisWeek = weekDays.reduce((acc, day) => acc + getVisitsForDay(day).length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Schedule</h1>
        <p className="text-slate-500 text-sm mt-1">Your weekly visit schedule</p>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <p className="font-semibold text-slate-900">
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </p>
          <p className="text-xs text-slate-500">{totalThisWeek} visit{totalThisWeek !== 1 ? "s" : ""} this week</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekly Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading schedule…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayVisits = getVisitsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className="flex flex-col">
                <div className={`text-center py-2 rounded-t-lg border-b text-sm font-semibold mb-2 ${isToday ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <div>{DAYS[day.getDay()]}</div>
                  <div className={`text-lg font-bold ${isToday ? "text-white" : "text-slate-900"}`}>{format(day, "d")}</div>
                </div>
                <div className="flex-1 space-y-2 min-h-[80px]">
                  {dayVisits.length === 0 ? (
                    <div className="text-xs text-slate-300 text-center py-4">—</div>
                  ) : (
                    dayVisits.map((visit) => (
                      <Link key={visit.id} href={"/VisitNoteDetail?id=" + visit.id}>
                        <div className={`p-2 rounded-lg border text-xs cursor-pointer hover:opacity-80 transition-opacity ${therapyColors[visit.therapy_type] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                          <div className="font-semibold truncate">{visit.patient_name}</div>
                          <div className="opacity-75">{visit.therapy_type?.replace(" Therapy", "")}</div>
                          <div className="capitalize opacity-75">{visit.visit_type?.replace("_", " ")}</div>
                          <Badge className={`mt-1 text-[10px] px-1 py-0 ${statusColors[visit.status] || ""}`}>
                            {visit.status}
                          </Badge>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming visits list for mobile clarity */}
      <Card className="sm:hidden">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" /> This Week's Visits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {totalThisWeek === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No visits scheduled this week</p>
          ) : (
            weekDays.flatMap(day =>
              getVisitsForDay(day).map(visit => (
                <Link key={visit.id} href={"/VisitNoteDetail?id=" + visit.id}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50">
                    <div>
                      <div className="font-medium text-sm">{visit.patient_name}</div>
                      <div className="text-xs text-slate-500">{format(parseISO(visit.visit_date), "EEE, MMM d")} · {visit.therapy_type?.replace(" Therapy", "")}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${statusColors[visit.status] || ""}`}>{visit.status}</Badge>
                      <FileText className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                </Link>
              ))
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}