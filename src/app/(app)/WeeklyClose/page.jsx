"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getWeeklyCloseData } from "@/lib/api-client/calendar";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  ClipboardList,
  DollarSign,
  ChevronRight,
} from "lucide-react";

const STATUS_COLORS = {
  draft: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  signed: "bg-teal-100 text-teal-700",
};

export default function WeeklyClose() {
  const [draftNotes, setDraftNotes] = useState([]);
  const [unsignedNotes, setUnsignedNotes] = useState([]);
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [acceptedNotScheduled, setAcceptedNotScheduled] = useState([]);
  const [myTasks, setMyTasks] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const data = await getWeeklyCloseData();
      setDraftNotes(data.draftNotes || []);
      setUnsignedNotes(data.unsignedNotes || []);
      setMyTasks(data.myTasks || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalOutstanding =
    draftNotes.length +
    unsignedNotes.length +
    myTasks.length +
    pendingAssignments.length +
    acceptedNotScheduled.length;

  const Section = ({ icon: Icon, title, count, children, emptyMsg }) => (
    <Card className={count > 0 ? "border-l-4 border-l-amber-400" : "border-l-4 border-l-green-400"}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`w-5 h-5 ${count > 0 ? "text-amber-500" : "text-green-500"}`} />
          {title}
          <Badge className={`ml-auto ${count > 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
            {count > 0 ? `${count} outstanding` : "All clear ✓"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <p className="text-sm text-slate-400 py-2">{emptyMsg}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-teal-600" />
            Weekly Close
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Complete all outstanding items below to ensure you get paid this week.
          </p>
        </div>
      </div>

      <div className={`rounded-xl px-5 py-4 flex items-center gap-4 ${totalOutstanding === 0 ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
        {totalOutstanding === 0 ? (
          <>
            <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">You&apos;re all set! 🎉</p>
              <p className="text-sm text-green-600">No outstanding items — you&apos;re ready to get paid.</p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">{totalOutstanding} item{totalOutstanding !== 1 ? "s" : ""} need your attention</p>
              <p className="text-sm text-amber-600">Complete everything below before the weekly cutoff to ensure payment.</p>
            </div>
          </>
        )}
      </div>

      <Section
        icon={FileText}
        title="Draft Visit Notes"
        count={draftNotes.length}
        emptyMsg="No draft notes — all visit notes are completed."
      >
        <div className="space-y-2">
          {draftNotes.map((v) => (
            <Link key={v.id} href={`/EditVisitNote?id=${v.id}`}>
              <div className="flex items-center justify-between p-3 rounded-lg border hover:border-teal-300 hover:bg-teal-50/40 transition-all group">
                <div>
                  <p className="font-medium text-sm text-slate-800">{v.patient_name || "Unknown Patient"}</p>
                  <p className="text-xs text-slate-500">{v.visit_date} · {v.visit_type?.replace(/_/g, " ")} · {v.therapy_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={STATUS_COLORS[v.status]}>{v.status}</Badge>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section
        icon={FileText}
        title="Notes Awaiting Signature"
        count={unsignedNotes.length}
        emptyMsg="No notes awaiting signature."
      >
        <div className="space-y-2">
          {unsignedNotes.map((v) => (
            <Link key={v.id} href={`/EditVisitNote?id=${v.id}`}>
              <div className="flex items-center justify-between p-3 rounded-lg border hover:border-teal-300 hover:bg-teal-50/40 transition-all group">
                <div>
                  <p className="font-medium text-sm text-slate-800">{v.patient_name || "Unknown Patient"}</p>
                  <p className="text-xs text-slate-500">{v.visit_date} · {v.visit_type?.replace(/_/g, " ")} · {v.therapy_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={STATUS_COLORS[v.status]}>{v.status}</Badge>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section
        icon={ClipboardList}
        title="Pending Assignments to Accept"
        count={pendingAssignments.length}
        emptyMsg="No pending assignments — nothing to accept."
      >
        <div className="space-y-2">
          {pendingAssignments.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
              <div>
                <p className="font-medium text-sm text-slate-800">{a.patient_name}</p>
                <p className="text-xs text-slate-500">{a.therapy_type} · {a.visit_type} · {a.agency}</p>
              </div>
              <Badge className="bg-amber-100 text-amber-700">pending</Badge>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">Go to your Dashboard to accept these assignments.</p>
      </Section>

      <Section
        icon={ClipboardList}
        title="Accepted Assignments — Visit Not Created"
        count={acceptedNotScheduled.length}
        emptyMsg="All accepted assignments have visits created."
      >
        <div className="space-y-2">
          {acceptedNotScheduled.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
              <div>
                <p className="font-medium text-sm text-slate-800">{a.patient_name}</p>
                <p className="text-xs text-slate-500">{a.therapy_type} · {a.visit_type} · {a.agency}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700">needs visit</Badge>
            </div>
          ))}
        </div>
        <Link href="/NewVisitNote">
          <Button size="sm" className="mt-3 bg-teal-600 hover:bg-teal-700">Create Visit Note</Button>
        </Link>
      </Section>

      <Section
        icon={ClipboardList}
        title="Open Tasks"
        count={myTasks.length}
        emptyMsg="No open tasks assigned to you."
      >
        <div className="space-y-2">
          {myTasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
              <div>
                <p className="font-medium text-sm text-slate-800">{t.title}</p>
                {t.due_date && <p className="text-xs text-slate-500">Due: {t.due_date}</p>}
              </div>
              <Badge className={t.priority === "high" ? "bg-red-100 text-red-700" : t.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}>
                {t.priority}
              </Badge>
            </div>
          ))}
        </div>
        <Link href="/MyTasks">
          <Button variant="outline" size="sm" className="mt-3">Go to My Tasks</Button>
        </Link>
      </Section>
    </div>
  );
}
