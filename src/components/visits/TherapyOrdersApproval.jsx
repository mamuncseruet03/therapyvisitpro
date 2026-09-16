"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle, Clock } from "lucide-react";
import { getAssignments } from "@/lib/api-client/referrals";

export default function TherapyOrdersApproval({ visit }) {
  const weeklyVisits = visit?.therapy_orders?.weekly_visits || [];
  const frequency = visit?.therapy_orders?.frequency;

  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    if (visit?.patient_id) {
      getAssignments()
        .then(all => setAssignments(all.filter(a => a.patient_id === visit.patient_id)))
        .catch(console.error);
    }
  }, [visit?.patient_id]);

  const treatmentAssignment = assignments.find(a => a.visit_type === "treatment");
  const approvedWeekly = treatmentAssignment?.approved_weekly_visits || [];

  if (!visit?.therapy_orders || weeklyVisits.length === 0) return null;

  return (
    <Card className="sticky top-6 mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-teal-600" />
          Therapy Orders
        </CardTitle>
        {frequency && (
          <p className="text-xs text-slate-500">Frequency: {frequency}x/week</p>
        )}
        {visit.treatment_approved ? (
          <Badge className="bg-emerald-100 text-emerald-700 w-fit text-xs gap-1 mt-1">
            <CheckCircle className="w-3 h-3" /> Treatment Approved
          </Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-700 w-fit text-xs gap-1 mt-1">
            <Clock className="w-3 h-3" /> Awaiting Approval
          </Badge>
        )}
        {treatmentAssignment && (
          <div className="text-xs text-slate-500 mt-1 space-y-0.5">
            {treatmentAssignment.therapist_name && (
              <p>Treating: <span className="font-medium text-slate-700">{treatmentAssignment.therapist_name}</span></p>
            )}
            {treatmentAssignment.supervising_therapist_name && (
              <p>Supervising: <span className="font-medium text-slate-700">{treatmentAssignment.supervising_therapist_name}</span></p>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1 py-1 border-b mb-1">
          <span>Week</span>
          <span className="text-center">Requested</span>
          <span className="text-center">Approved</span>
        </div>
        <div className="space-y-1">
          {weeklyVisits.map((week, i) => {
            const approved = approvedWeekly[i]?.approved_visits;
            return (
              <div key={i} className="grid grid-cols-3 gap-1 items-center rounded px-2 py-1.5 text-xs hover:bg-slate-50">
                <div>
                  <div className="font-medium text-slate-700">{week.week_label || `Wk ${i + 1}`}</div>
                  {week.week_start && (
                    <div className="text-[10px] text-slate-400">{week.week_start}</div>
                  )}
                </div>
                <div className="text-center font-medium text-slate-700">{week.visits ?? "--"}</div>
                <div className="text-center">
                  {approved != null ? (
                    <span className="font-semibold text-teal-700">{approved}</span>
                  ) : (
                    <span className="text-slate-300">--</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {!visit.treatment_approved && (
          <p className="text-[11px] text-slate-400 mt-2 text-center italic">
            Pending admin approval
          </p>
        )}
      </CardContent>
    </Card>
  );
}
