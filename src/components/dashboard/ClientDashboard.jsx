"use client";

import React, { useState, useEffect } from "react";
import { FileText, Calendar, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getPatients } from "@/lib/api-client/patients";
import { getCalendarVisits } from "@/lib/api-client/calendar";

const therapyColors = {
  "Physical Therapy": "bg-blue-100 text-blue-800 border-blue-200",
  "Occupational Therapy": "bg-purple-100 text-purple-800 border-purple-200",
  "Speech Therapy": "bg-amber-100 text-amber-800 border-amber-200",
};

export default function ClientDashboard({ user }) {
  const [visits, setVisits] = useState([]);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    Promise.all([getCalendarVisits(), getPatients()])
      .then(([v, p]) => { setVisits(v); setPatients(p); })
      .catch(console.error);
  }, []);

  // Find patient record by matching email
  const myPatient = patients.find(p => p.email === user?.email);
  const myVisits = myPatient ? visits.filter(v => v.patient_id === myPatient.id) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Therapy Portal</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome, {user?.full_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Visits</p>
                <p className="text-2xl font-bold text-slate-900">{myVisits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Last Visit</p>
                <p className="text-lg font-semibold text-slate-900">
                  {myVisits.length > 0 ? format(new Date(myVisits[0].visit_date), "MMM d, yyyy") : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-violet-50 flex items-center justify-center">
                <Activity className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className="text-lg font-semibold text-slate-900">{myPatient?.status || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">My Visit History</CardTitle>
        </CardHeader>
        <CardContent>
          {myVisits.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No visit records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myVisits.map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge className={therapyColors[visit.therapy_type] || "bg-slate-100 text-slate-800"}>
                        {visit.therapy_type?.replace(" Therapy", "") || "Therapy"}
                      </Badge>
                      <span className="text-sm font-medium text-slate-900">
                        {format(new Date(visit.visit_date), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Therapist: {visit.therapist_name || "—"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {visit.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
