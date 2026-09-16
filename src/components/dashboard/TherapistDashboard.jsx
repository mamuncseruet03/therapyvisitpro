"use client";

import React, { useState, useEffect } from "react";
import { Users, FileText, Clock, CheckCircle, ChevronRight, DollarSign } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/dashboard/StatCard";
import RecentVisits from "@/components/dashboard/RecentVisits";
import AwaitingAcceptance from "@/components/dashboard/AwaitingAcceptance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getPatients } from "@/lib/api-client/patients";
import { getCalendarVisits } from "@/lib/api-client/calendar";
import { getTherapistsForSchedule } from "@/lib/api-client/calendar";
import { getAssignments } from "@/lib/api-client/referrals";

export default function TherapistDashboard({ user }) {
  const [therapists, setTherapists] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    Promise.all([getTherapistsForSchedule(), getPatients(), getCalendarVisits(), getAssignments()])
      .then(([t, p, v, a]) => { setTherapists(t); setAllPatients(p); setVisits(v); setAssignments(a); })
      .catch(console.error);
  }, []);

  const myTherapistRecord = therapists.find(
    t => t.email === user?.email || t.full_name === user?.full_name
  );

  // All assignment IDs relevant to this therapist
  const myTherapistId = myTherapistRecord?.id;

  // Filter visits for this therapist (match by user id, therapist entity id, or either name)
  const myVisits = visits.filter((v) =>
    v.therapist_id === user?.id ||
    v.therapist_id === myTherapistRecord?.id ||
    v.therapist_name === user?.full_name ||
    v.therapist_name === myTherapistRecord?.full_name
  );
  const myDrafts = myVisits.filter((v) => v.status === "draft");
  const myCompleted = myVisits.filter((v) => v.status === "completed" || v.status === "signed");

  // Filter patients assigned to this therapist (through visits or assignments)
  const myPatientIds = new Set([
    ...myVisits.map(v => v.patient_id),
    ...assignments.filter(a => a.therapist_name === user?.full_name).map(a => a.patient_id)
  ]);
  const patients = allPatients.filter(p => myPatientIds.has(p.id));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, {user?.full_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={patients.length} icon={Users} accent="bg-teal-50 text-teal-600" />
        <StatCard label="My Visits" value={myVisits.length} icon={FileText} accent="bg-violet-50 text-violet-600" />
        <StatCard label="Draft Notes" value={myDrafts.length} icon={Clock} accent="bg-amber-50 text-amber-600" />
        <StatCard label="Completed" value={myCompleted.length} icon={CheckCircle} accent="bg-green-50 text-green-600" />
      </div>

      <AwaitingAcceptance assignments={assignments} user={user} therapistId={myTherapistId} patients={allPatients} />

      {/* My Patients */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            My Patients
            <span className="ml-auto text-sm font-normal text-slate-400">{patients.length} patient{patients.length !== 1 ? "s" : ""}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No patients assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {patients.map((patient) => {
                const patientVisits = myVisits.filter(v => v.patient_id === patient.id);
                return (
                  <Link key={patient.id} href={"/PatientDetail" + "?id=" + patient.id}>
                    <div className="p-3 rounded-lg border hover:border-teal-300 hover:bg-teal-50/40 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{patient.agency || "—"}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(patient.therapy_types || []).map(t => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 font-medium">
                                {t.replace(" Therapy", "")}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1.5">{patientVisits.length} visit{patientVisits.length !== 1 ? "s" : ""}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 mt-0.5 shrink-0" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800">My Recent Visits</CardTitle>
            </CardHeader>
            <CardContent>
              {myVisits.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No visit notes yet</p>
                </div>
              ) : (
                <RecentVisits visits={myVisits.slice(0, 10)} />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/VisitNotes">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" /> View All Notes
              </Button>
            </Link>
            <Link href="/Patients">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" /> View Patients
              </Button>
            </Link>
            <Link href="/WeeklyClose">
              <Button variant="outline" className="w-full justify-start border-teal-300 text-teal-700 hover:bg-teal-50">
                <DollarSign className="w-4 h-4 mr-2" /> Weekly Close
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
