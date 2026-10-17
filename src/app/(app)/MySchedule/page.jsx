"use client";

import React, { useState, useEffect } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getCalendarVisits, getTherapistsForSchedule } from "@/lib/api-client/calendar";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Calendar, FileText } from "lucide-react";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { getAssignments, updateAssignment } from "@/lib/api-client/referrals";
import { saveVisitNote } from "@/lib/api-client/visit-notes";
import { toast } from "sonner";

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
  const [scheduleAssignment, setScheduleAssignment] = useState(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getCalendarVisits(), getTherapistsForSchedule()])
      .then(([visitsData, therapistsData]) => {
        if (!active) return;
        setVisits(visitsData);
        setAllTherapists(therapistsData);
      })
      .catch(console.error)
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const assignmentId = new URLSearchParams(window.location.search).get("assignmentId");
    if (!assignmentId) return;
    getAssignments()
      .then((items) => {
        const assignment = items.find((item) => {
          if (item.id !== assignmentId) return false;
          if (currentUser?.user_type !== "therapist") return true;
          return item.therapist_id === currentUser?.therapist_id ||
            item.therapist_name === currentUser?.full_name;
        });
        if (!assignment) {
          toast.error("Assignment not found");
          return;
        }
        setScheduleAssignment(assignment);
        setScheduleDate(new Date().toISOString().slice(0, 10));
      })
      .catch(() => toast.error("Unable to open evaluation scheduler"));
  }, [currentUser?.full_name, currentUser?.therapist_id, currentUser?.user_type]);

  const closeScheduler = () => {
    setScheduleAssignment(null);
    window.history.replaceState({}, "", "/MySchedule");
  };

  const handleScheduleEvaluation = async () => {
    if (!scheduleAssignment || !scheduleDate) {
      toast.error("Please select an evaluation date");
      return;
    }
    setIsScheduling(true);
    try {
      const therapistId = scheduleAssignment.therapist_id || currentUser?.therapist_id || myTherapistRecord?.id;
      const therapistName = scheduleAssignment.therapist_name || myTherapistRecord?.full_name || currentUser?.full_name;
      await saveVisitNote({
        patient_id: scheduleAssignment.patient_id,
        patient_name: scheduleAssignment.patient_name,
        therapist_id: therapistId,
        therapist_name: therapistName,
        therapy_type: scheduleAssignment.therapy_type,
        visit_type: scheduleAssignment.visit_type || "evaluation",
        visit_date: scheduleDate,
        time_in: scheduleTime || null,
        status: "scheduled",
        agency: scheduleAssignment.agency,
      });
      await updateAssignment(scheduleAssignment.id, { status: "scheduled" });
      const refreshedVisits = await getCalendarVisits();
      setVisits(refreshedVisits);
      setWeekStart(startOfWeek(parseISO(scheduleDate)));
      toast.success("Evaluation scheduled and added to My Schedule");
      closeScheduler();
    } catch (error) {
      console.error(error);
      toast.error("Failed to schedule evaluation");
    } finally {
      setIsScheduling(false);
    }
  };

  const myTherapistRecord = allTherapists.find(
    t => t.id === currentUser?.therapist_id ||
      t.email === currentUser?.email ||
      t.full_name?.toLowerCase() === currentUser?.full_name?.toLowerCase()
  );

  const weekEnd = endOfWeek(weekStart);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filter visits for this therapist (match by user id, therapist entity id, or either name)
  const myVisits = visits.filter(v =>
    v.therapist_id === currentUser?.id ||
    v.therapist_id === currentUser?.therapist_id ||
    v.therapist_id === myTherapistRecord?.id ||
    v.therapist_name === currentUser?.full_name ||
    v.therapist_name === myTherapistRecord?.full_name
  );

  const getVisitsForDay = (day) =>
    myVisits.filter(v => v.visit_date && isSameDay(parseISO(v.visit_date), day));

  const totalThisWeek = weekDays.reduce((acc, day) => acc + getVisitsForDay(day).length, 0);

  return (
    <div className="space-y-6">
      <Dialog open={!!scheduleAssignment} onOpenChange={(open) => { if (!open) closeScheduler(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Evaluation — {scheduleAssignment?.patient_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-900">{scheduleAssignment?.patient_name}</p>
              <p className="text-slate-500">{scheduleAssignment?.therapy_type} · Evaluation</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="evaluation-date">Evaluation Date</Label>
              <Input id="evaluation-date" type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evaluation-time">Time (optional)</Label>
              <Input id="evaluation-time" type="time" value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeScheduler}>Cancel</Button>
            <Button onClick={handleScheduleEvaluation} disabled={isScheduling || !scheduleDate} className="bg-teal-600 hover:bg-teal-700">
              {isScheduling ? "Scheduling…" : "Schedule Evaluation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
            <Calendar className="w-4 h-4 text-teal-600" /> This Week&apos;s Visits
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
