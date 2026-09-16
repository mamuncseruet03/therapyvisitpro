"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getCalendarVisits } from "@/lib/api-client/calendar";
import { getDeletionRequests } from "@/lib/api-client/deletion-requests";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardList, Eye, Trash2 } from "lucide-react";
import MedicalRecordDeletions from "@/components/orders/MedicalRecordDeletions";

const THERAPY_SHORT = {
  "Physical Therapy": "PT",
  "Occupational Therapy": "OT",
  "Speech Therapy": "ST",
};

const statusColors = {
  draft: "bg-slate-100 text-slate-600",
  completed: "bg-blue-50 text-blue-700",
  signed: "bg-green-50 text-green-700",
  scheduled: "bg-amber-50 text-amber-700",
};

function VisitTable({ visits, emptyMessage }) {
  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <ClipboardList className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {visits.map((v) => (
        <div key={v.id} className="flex items-center justify-between py-3 px-4 hover:bg-slate-50 transition-colors">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800">{v.patient_name}</p>
            <p className="text-xs text-slate-500">{v.therapist_name} · {v.visit_date}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-xs">{THERAPY_SHORT[v.therapy_type] || v.therapy_type}</Badge>
            <Badge className={`text-xs ${statusColors[v.status] || ""}`}>{v.status}</Badge>
            <Link href={`/VisitNoteDetail?id=${v.id}`}>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Orders() {
  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const defaultTab = urlParams.get("tab") || "deletions";

  const [visits, setVisits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [deletionRequests, setDeletionRequests] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [visitData, delData] = await Promise.all([
        getCalendarVisits(),
        getDeletionRequests(),
      ]);
      setVisits(visitData);
      setDeletionRequests(delData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const evalOrders = visits.filter((v) => v.visit_type === "evaluation" && (v.status === "completed" || v.status === "signed"));
  const recertOrders = visits.filter((v) => v.visit_type === "re_evaluation" && (v.status === "completed" || v.status === "signed"));
  const dischargeOrders = visits.filter((v) => v.visit_type === "discharge" && (v.status === "completed" || v.status === "signed"));

  const pendingDeletions = deletionRequests.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders</h1>
        <p className="text-slate-500 text-sm mt-1">Manage evaluation, recertification, and discharge orders</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="h-auto">
          <TabsTrigger value="deletions" className="gap-2 py-2.5 px-5">
            <Trash2 className="w-4 h-4" />
            Medical Record Deletions
            {pendingDeletions > 0 && <Badge className="bg-red-100 text-red-700 text-xs ml-1">{pendingDeletions}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="eval" className="gap-2 py-2.5 px-5">
            Eval Orders
            <Badge className="bg-teal-100 text-teal-700 text-xs ml-1">{evalOrders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="recert" className="gap-2 py-2.5 px-5">
            Recert Orders
            <Badge className="bg-blue-100 text-blue-700 text-xs ml-1">{recertOrders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="discharge" className="gap-2 py-2.5 px-5">
            Discharge Orders
            <Badge className="bg-amber-100 text-amber-700 text-xs ml-1">{dischargeOrders.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deletions">
          <Card>
            <CardContent className="p-6">
              <MedicalRecordDeletions />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eval">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="text-center py-10 text-slate-400 text-sm">Loading…</p>
              ) : (
                <VisitTable visits={evalOrders} emptyMessage="No evaluation orders found" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recert">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="text-center py-10 text-slate-400 text-sm">Loading…</p>
              ) : (
                <VisitTable visits={recertOrders} emptyMessage="No recertification orders found" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discharge">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="text-center py-10 text-slate-400 text-sm">Loading…</p>
              ) : (
                <VisitTable visits={dischargeOrders} emptyMessage="No discharge orders found" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}