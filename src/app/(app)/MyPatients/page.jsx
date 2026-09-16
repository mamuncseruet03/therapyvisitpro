"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getPatients } from "@/lib/api-client/patients";
import { getCalendarVisits, getTherapistsForSchedule } from "@/lib/api-client/calendar";
import { getAssignments } from "@/lib/api-client/referrals";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users } from "lucide-react";

const statusBadge = {
  active: "bg-emerald-50 text-emerald-700",
  on_hold: "bg-amber-50 text-amber-700",
  discharged: "bg-slate-100 text-slate-500",
};

export default function MyPatients() {
  const [search, setSearch] = useState("");
  const [allPatients, setAllPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const effectiveUser = useCurrentUser();

  const [allTherapists, setAllTherapists] = useState([]);
  const [visits, setVisits] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const loadPatients = useCallback(async () => {
    try {
      const [patientData, visitData, therapistData, assignmentData] = await Promise.all([
        getPatients(),
        getCalendarVisits(),
        getTherapistsForSchedule(),
        getAssignments(),
      ]);
      setAllPatients(patientData);
      setVisits(visitData);
      setAllTherapists(therapistData);
      setAssignments(assignmentData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  const name = effectiveUser?.full_name;
  const uid = effectiveUser?.id;
  const userEmail = effectiveUser?.email;

  // Find the matching Therapist entity by email or name
  const myTherapistRecord = allTherapists.find(
    t => t.email === userEmail || t.full_name?.toLowerCase() === name?.toLowerCase()
  );
  const therapistEntityName = myTherapistRecord?.full_name;
  const therapistEntityId = myTherapistRecord?.id;

  // Build set of patient IDs assigned to this therapist via visits or assignments
  const myPatientIds = new Set([
    ...visits
      .filter(v => v.therapist_id === uid || v.therapist_id === therapistEntityId ||
        v.therapist_name === name || v.therapist_name === therapistEntityName)
      .map(v => v.patient_id),
    ...assignments
      .filter(a => a.therapist_name === name || a.therapist_name === therapistEntityName ||
        a.therapist_id === uid || a.therapist_id === therapistEntityId)
      .map(a => a.patient_id),
  ]);

  // Also include patients where therapist fields directly reference this user
  const matchNames = [name, therapistEntityName].filter(Boolean);
  const myPatients = allPatients.filter(p =>
    myPatientIds.has(p.id) ||
    matchNames.some(n =>
      p.treating_therapist_pt === n ||
      p.treating_therapist_ot === n ||
      p.treating_therapist_st === n ||
      p.evaluating_therapist_pt === n ||
      p.evaluating_therapist_ot === n ||
      p.evaluating_therapist_st === n
    )
  );

  const filtered = myPatients.filter(p =>
    `${p.first_name} ${p.last_name} ${p.agency || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Patients</h1>
        <p className="text-slate-500 text-sm mt-1">{myPatients.length} patient{myPatients.length !== 1 ? "s" : ""} assigned to you</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search patients..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">City</TableHead>
              <TableHead className="hidden lg:table-cell">Therapy</TableHead>
              <TableHead className="hidden lg:table-cell">Auth #</TableHead>
              <TableHead className="hidden md:table-cell">Agency</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingPatients ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No patients found</p>
                </TableCell>
              </TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.id} className="hover:bg-slate-50/60">
                <TableCell className="font-medium">
                  <Link
                    href={"/PatientDetail" + "?id=" + p.id}
                    className="text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    {p.first_name} {p.last_name}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-slate-500">{p.city || "—"}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex gap-1 flex-wrap">
                    {(p.therapy_types || []).map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">{t.replace(" Therapy", "")}</Badge>
                    ))}
                    {(!p.therapy_types || p.therapy_types.length === 0) && <span className="text-slate-400">—</span>}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-slate-500">{p.authorization_number || "—"}</TableCell>
                <TableCell className="hidden md:table-cell text-sm text-slate-500">{p.agency || "—"}</TableCell>
                <TableCell>
                  <Badge className={`text-xs ${statusBadge[p.status] || ""}`}>{p.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
