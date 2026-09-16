"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPatientById } from "@/lib/api-client/patients";
import { getPatientVisits } from "@/lib/api-client/visit-notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, FileText, Activity, Plus } from "lucide-react";
import PreviousCertsTab from "@/components/patients/PreviousCertsTab";
import NewOrdersTab from "@/components/patients/NewOrdersTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function PatientTherapyDetailPage() {
  return <Suspense fallback={<div className="py-12 text-center text-slate-400">Loading...</div>}><PatientTherapyDetail /></Suspense>;
}

function PatientTherapyDetail() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  const therapyType = searchParams.get("therapyType");

  const [patient, setPatient] = useState(null);
  const [visitNotes, setVisitNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!patientId) { setIsLoading(false); return; }
    try {
      const [patientData, visitsData] = await Promise.all([
        getPatientById(patientId),
        getPatientVisits(patientId),
      ]);
      setPatient(patientData);
      setVisitNotes(visitsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => { loadData(); }, [loadData]);

  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCertIdx, setSelectedCertIdx] = useState(0);

  const therapyColors = {
    "Physical Therapy": "bg-blue-50 border-blue-200 text-blue-700",
    "Occupational Therapy": "bg-purple-50 border-purple-200 text-purple-700",
    "Speech Therapy": "bg-orange-50 border-orange-200 text-orange-700",
  };

  const therapyIcons = {
    "Physical Therapy": "💪",
    "Occupational Therapy": "🖐️",
    "Speech Therapy": "💬",
  };

  const visitStatusColors = {
    draft: "bg-yellow-100 text-yellow-800",
    completed: "bg-blue-100 text-blue-800",
    signed: "bg-green-100 text-green-800",
    scheduled: "bg-sky-100 text-sky-800",
    missed: "bg-red-100 text-red-800",
    billed: "bg-purple-100 text-purple-800",
    paid: "bg-emerald-100 text-emerald-800",
  };

  const calendarStatusConfig = {
    scheduled: { bg: "bg-sky-400", label: "Scheduled" },
    draft: { bg: "bg-yellow-400", label: "Draft" },
    completed: { bg: "bg-blue-500", label: "Completed" },
    signed: { bg: "bg-teal-500", label: "Signed" },
    missed: { bg: "bg-red-500", label: "Missed" },
    billed: { bg: "bg-purple-500", label: "Billed" },
    paid: { bg: "bg-emerald-500", label: "Paid" },
  };

  const totalVisits = visitNotes.length;
  const completedVisits = visitNotes.filter(
    (v) => v.status === "completed" || v.status === "signed"
  ).length;
  const draftVisits = visitNotes.filter((v) => v.status === "draft").length;

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calDays = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))
  );
  const visitsByDate = visitNotes.reduce((acc, v) => {
    const key = v.visit_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/PatientDetail?id=${patientId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{therapyIcons[therapyType]}</span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{therapyType}</h1>
              <p className="text-sm text-slate-500">
                {patient?.first_name} {patient?.last_name}
              </p>
            </div>
          </div>
        </div>
        <Link href={`/NewVisitNote?patientId=${patientId}&therapyType=${encodeURIComponent(therapyType || "")}`}>
          <Button className="bg-teal-600 hover:bg-teal-700 gap-2"><Plus className="w-4 h-4" /> New Visit Note</Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <FileText className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{totalVisits}</div>
                <div className="text-xs text-slate-500">Total Visits</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{completedVisits}</div>
                <div className="text-xs text-slate-500">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FileText className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{draftVisits}</div>
                <div className="text-xs text-slate-500">Draft Notes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="visit-list">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="visit-list">Visit List</TabsTrigger>
          <TabsTrigger value="previous-certs">Previous Certs</TabsTrigger>
          <TabsTrigger value="new-orders">New Orders</TabsTrigger>
        </TabsList>

        {/* CALENDAR TAB */}
        <TabsContent value="calendar">
          <Card>
            <CardContent className="pt-6">
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mb-5 pb-4 border-b">
                {Object.entries(calendarStatusConfig).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className={`w-3 h-3 rounded-full ${cfg.bg}`} />
                    {cfg.label}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCalendarMonth(new Date(year, month - 1, 1))} className="px-3 py-1 rounded border text-sm hover:bg-slate-50">‹</button>
                <span className="font-semibold text-slate-700">{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <button onClick={() => setCalendarMonth(new Date(year, month + 1, 1))} className="px-3 py-1 rounded border text-sm hover:bg-slate-50">›</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="text-xs font-semibold text-slate-400 py-1">{d}</div>
                ))}
                {calDays.map((day, idx) => {
                  if (!day) return <div key={idx} />;
                  const key = format(day, 'yyyy-MM-dd');
                  const dayVisits = visitsByDate[key] || [];
                  const todayKey = format(new Date(), 'yyyy-MM-dd');
                  const isToday = todayKey === key;
                  return (
                    <div key={idx} className={`min-h-[64px] rounded-lg p-1.5 border text-xs transition-colors ${
                      dayVisits.length > 0 ? 'bg-slate-50 border-slate-200' : 'border-slate-100'
                    } ${isToday ? 'ring-2 ring-teal-400' : ''}`}>
                      <div className={`font-medium mb-1 text-center ${
                        isToday ? 'text-teal-600 font-bold' : 'text-slate-500'
                      }`}>{day.getDate()}</div>
                      <div className="space-y-0.5">
                        {dayVisits.map((v, i) => {
                          const cfg = calendarStatusConfig[v.status] || { bg: 'bg-slate-400', label: v.status };
                          return (
                            <Link key={i} href={`/VisitNoteDetail?id=${v.id}`}
                              title={`${v.visit_type?.replace(/_/g,' ')} — ${cfg.label}`}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-[10px] truncate hover:opacity-80 ${cfg.bg}`}>
                              <span className="truncate capitalize">{v.visit_type?.replace(/_/g,' ')}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VISIT LIST TAB */}
        <TabsContent value="visit-list">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visit Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-slate-400 py-8 text-center">Loading visits...</div>
              ) : visitNotes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">{therapyIcons[therapyType]}</div>
                  <div className="text-slate-400 mb-2">No visits yet</div>
                  <p className="text-sm text-slate-400">Visit notes for {therapyType} will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visitNotes.map((visit) => (
                    <Link key={visit.id} href={`/VisitNoteDetail?id=${visit.id}`}
                      className={`block border-2 rounded-lg p-4 hover:shadow-md transition-all ${therapyColors[therapyType]}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={visitStatusColors[visit.status]}>{visit.status}</Badge>
                          <Badge variant="outline">{visit.visit_type?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-600 font-medium">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(visit.visit_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 mb-2">Therapist: <span className="font-medium">{visit.therapist_name || '—'}</span></div>
                      {visit.duration_minutes && (
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="w-4 h-4" />{visit.duration_minutes} minutes
                        </div>
                      )}
                      {visit.assessment && (
                        <div className="mt-3 pt-3 border-t text-sm text-slate-600 line-clamp-2">{visit.assessment}</div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREVIOUS CERTS TAB */}
        <TabsContent value="previous-certs">
          <PreviousCertsTab
            patient={patient}
            visitNotes={visitNotes}
            visitStatusColors={visitStatusColors}
            selectedCertIdx={selectedCertIdx}
            setSelectedCertIdx={setSelectedCertIdx}
          />
        </TabsContent>

        {/* NEW ORDERS TAB */}
        <TabsContent value="new-orders">
          <NewOrdersTab patient={patient} patientId={patientId} therapyType={therapyType} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
