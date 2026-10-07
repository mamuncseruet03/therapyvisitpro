"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getPatients, createPatient, updatePatient } from "@/lib/api-client/patients";
import { getCalendarVisits } from "@/lib/api-client/calendar";
import { createReferral, updateReferral, getAssignments } from "@/lib/api-client/referrals";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Pencil, Trash2, List, UserPlus, ClipboardList, FileUp, BookOpen } from "lucide-react";
import DeletePatientDialog from "@/components/patients/DeletePatientDialog";
import PatientForm from "@/components/patients/PatientForm";
import ReferralIntakeForm from "@/components/patients/ReferralIntakeForm";
import EditReferralForm from "@/components/patients/EditReferralForm";
import ImportReferralPDF from "@/components/patients/ImportReferralPDF";
import ReferralListTab from "@/components/patients/ReferralListTab";
import { toast } from "sonner";

const statusBadge = {
  active: "bg-emerald-50 text-emerald-700",
  on_hold: "bg-amber-50 text-amber-700",
  discharged: "bg-slate-100 text-slate-500",
};

export default function Patients() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("active");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeTab, setActiveTab] = useState("list");
  const [editReferralPatientId, setEditReferralPatientId] = useState(null);

  const currentUser = useCurrentUser();
  const [allPatients, setAllPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = ["admin", "superuser", "coordinator"].includes(currentUser?.user_type) || ["admin", "superuser", "coordinator"].includes(currentUser?.role);
  const isTherapist = !isAdmin;

  const [visits, setVisits] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const loadPatients = useCallback(async () => {
    try {
      const [patientData, visitData, assignmentData] = await Promise.all([
        getPatients(),
        getCalendarVisits(),
        getAssignments(),
      ]);
      setAllPatients(patientData);
      setVisits(visitData);
      setAssignments(assignmentData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  const patients = React.useMemo(() => {
    if (isTherapist) {
      const myPatientIds = new Set([
        ...visits.filter(v => v.therapist_id === currentUser?.id || v.therapist_name === currentUser?.full_name).map(v => v.patient_id),
        ...assignments.filter(a => a.therapist_name === currentUser?.full_name).map(a => a.patient_id)
      ]);
      return allPatients.filter(p => myPatientIds.has(p.id));
    }
    return allPatients;
  }, [allPatients, visits, assignments, currentUser]);

  const handleCreate = async (d) => {
    try {
      const result = await createPatient(d);
      if (result?.success) {
        toast.success("Patient created");
        setFormOpen(false);
        setEditing(null);
        loadPatients();
        return result;
      }
    } catch (err) {
      toast.error("Failed to create patient");
    }
  };

  const handleUpdate = async ({ id, data }) => {
    try {
      const result = await updatePatient(id, data);
      if (result?.success) {
        toast.success("Patient updated");
        setEditing(null);
        loadPatients();
      }
    } catch (err) {
      toast.error("Failed to update patient");
    }
  };


  const filtered = patients.filter((p) => {
    const matchesSearch = `${p.first_name} ${p.last_name} ${p.diagnosis || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Build patient data object from referral/import data
  const buildPatientData = (data) => ({
    sex: data.sex,
    ssn: data.ssn,
    medicare_number: data.medicare_number,
    phone: data.phone,
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip,
    diagnosis: data.primary_diagnosis || data.diagnoses?.[0]?.diagnosis || "",
    diagnoses: data.diagnoses && data.diagnoses.length > 0
      ? data.diagnoses
      : (data.primary_diagnosis ? [{ diagnosis: data.primary_diagnosis, icd10_code: "" }] : []),
    insurance: data.insurance,
    agency: data.agency,
    referring_physician: data.referring_physician || data.physician_name,
    referring_physician_phone: data.referring_physician_phone || data.physician_phone,
    authorization_number: data.authorization_number,
    therapy_types: data.therapy_types || [],
    cert_period_start: data.cert_period_start,
    cert_period_end: data.cert_period_end,
    authorized_visits: data.authorized_visits ? parseInt(data.authorized_visits) : null,
    pt_eval_visits: data.pt_eval_visits ? parseInt(data.pt_eval_visits) : null,
    pt_treatment_visits: data.pt_treatment_visits ? parseInt(data.pt_treatment_visits) : null,
    ot_eval_visits: data.ot_eval_visits ? parseInt(data.ot_eval_visits) : null,
    ot_treatment_visits: data.ot_treatment_visits ? parseInt(data.ot_treatment_visits) : null,
    st_eval_visits: data.st_eval_visits ? parseInt(data.st_eval_visits) : null,
    st_treatment_visits: data.st_treatment_visits ? parseInt(data.st_treatment_visits) : null,
    responsible_party_name: data.responsible_party_name,
    responsible_party_phone: data.responsible_party_phone,
    responsible_party_relationship: data.responsible_party_relationship,
    evaluating_therapist_pt: data.evaluating_therapist_pt,
    evaluating_therapist_ot: data.evaluating_therapist_ot,
    evaluating_therapist_st: data.evaluating_therapist_st,
    treating_therapist_pt: data.treating_therapist_pt,
    treating_therapist_ot: data.treating_therapist_ot,
    treating_therapist_st: data.treating_therapist_st,
  });

  // Find duplicate patient by name (and optionally DOB)
  const findExisting = (data) =>
    allPatients.find(
      (p) =>
        p.first_name?.toLowerCase() === data.first_name?.toLowerCase() &&
        p.last_name?.toLowerCase() === data.last_name?.toLowerCase() &&
        (data.date_of_birth ? String(p.date_of_birth || "").slice(0, 10) === data.date_of_birth : true)
    );

  const logReferral = async (data, sourceType, patientAction, patientId) => {
    try {
      await createReferral({
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
        phone: data.phone,
        referral_date: data.referral_date || new Date().toISOString().split("T")[0],
        referral_source: data.referral_source,
        primary_diagnosis: data.primary_diagnosis,
        diagnoses: data.diagnoses,
        therapy_types: data.therapy_types,
        insurance: data.insurance,
        agency: data.agency,
        physician_name: data.physician_name,
        physician_phone: data.physician_phone,
        cert_period_start: data.cert_period_start,
        cert_period_end: data.cert_period_end,
        authorization_number: data.authorization_number,
        authorized_visits: data.authorized_visits ? parseInt(data.authorized_visits) : null,
        notes: data.notes,
        source_type: sourceType,
        patient_id: patientId,
        patient_action: patientAction,
      });
    } catch (err) {
      console.error("Failed to log referral:", err);
    }
  };

  // Match Base44: every manual referral is linked to a patient. Selecting an
  // existing patient updates it; otherwise a new patient is created.
  const handleReferralSave = async (data) => {
    try {
      const explicitlySelected = data.existing_patient_id
        ? allPatients.find((patient) => patient.id === data.existing_patient_id)
        : null;
      const existing = explicitlySelected || findExisting(data);
      const patientData = buildPatientData(data);
      let patientId;
      let patientAction;

      if (existing) {
        const result = await updatePatient(existing.id, {
          first_name: data.first_name,
          last_name: data.last_name,
          date_of_birth: data.date_of_birth || undefined,
          ...patientData,
          notes: existing.notes
            ? `${existing.notes}\n\n--- New Referral ---\nReferral Source: ${data.referral_source || "N/A"}\nReferral Date: ${data.referral_date}\nPhysician: ${data.physician_name || "N/A"}\n${data.notes || ""}`
            : `Referral Source: ${data.referral_source || "N/A"}\nReferral Date: ${data.referral_date}\nPhysician: ${data.physician_name || "N/A"}\n${data.notes || ""}`,
          status: "active",
        });
        if (!result?.success) throw new Error(result?.error || "Patient update failed");
        patientId = existing.id;
        patientAction = "updated";
      } else {
        const result = await createPatient({
          first_name: data.first_name,
          last_name: data.last_name,
          date_of_birth: data.date_of_birth,
          ...patientData,
          notes: `Referral Source: ${data.referral_source || "N/A"}\nReferral Date: ${data.referral_date}\nPhysician: ${data.physician_name || "N/A"}\n${data.notes || ""}`,
          status: "active",
        });
        if (!result?.success || !result.id) throw new Error(result?.error || "Patient creation failed");
        patientId = result.id;
        patientAction = "created";
      }

      const referral = await createReferral({
        ...data,
        source_type: "manual",
        patient_id: patientId,
        patient_action: patientAction,
      });
      if (!referral?.success) throw new Error(referral?.error || "Referral creation failed");

      await loadPatients();
      setActiveTab("referral-list");
      toast.success(
        patientAction === "created"
          ? `Patient ${data.first_name} ${data.last_name} created and referral saved.`
          : `${existing.first_name} ${existing.last_name} updated; no duplicate patient created.`,
      );
      return { success: true };
    } catch (err) {
      console.error("Failed to save referral:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save referral");
      return { success: false };
    }
  };

  // Handle PDF import — auto-creates patient, skips if already active
  const handlePDFImport = async (data) => {
    const existing = findExisting(data);
    const patientData = buildPatientData(data);

    if (existing) {
      if (existing.status === "active") {
        logReferral(data, "pdf_import", "skipped", existing.id);
        toast.info(`${existing.first_name} ${existing.last_name} is already an active patient. No duplicate created.`);
        return;
      }
      await handleUpdate({
        id: existing.id,
        data: { ...existing, ...patientData, status: "active" },
      });
      logReferral(data, "pdf_import", "updated", existing.id);
      toast.success(`${existing.first_name} ${existing.last_name} re-activated and updated from imported PDF.`);
    } else {
      const created = await handleCreate({
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
        ...patientData,
        notes: data.notes || "",
        status: "active",
      });
      logReferral(data, "pdf_import", "created", created?.id);
      toast.success(`Patient ${data.first_name} ${data.last_name} created from imported PDF.`);
    }
  };

  const handleReferralUpdate = async (id, data) => {
    try {
      const result = await updateReferral(id, data);
      if (!result?.success) throw new Error(result?.error || "Referral update failed");
      toast.success("Referral updated");
      setEditReferralPatientId(null);
      setActiveTab("referral-list");
      return { success: true };
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update referral");
      return { success: false };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patients</h1>
        <p className="text-slate-500 text-sm mt-1">{patients.length} total patients</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-4xl grid-cols-5 h-auto">
          <TabsTrigger value="list" className="gap-2 py-2.5">
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Patient List</span>
          </TabsTrigger>
          <TabsTrigger value="referral-list" className="gap-2 py-2.5">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Referral List</span>
          </TabsTrigger>
          <TabsTrigger value="referral" className="gap-2 py-2.5">
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">Add Referral</span>
          </TabsTrigger>
          <TabsTrigger value="edit-referral" className="gap-2 py-2.5">
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">Edit Referral</span>
          </TabsTrigger>
          <TabsTrigger value="add" className="gap-2 py-2.5">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Patient</span>
          </TabsTrigger>

        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search patients…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="flex gap-2">
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
                className={statusFilter === "active" ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                Active Patients
              </Button>
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className={statusFilter === "all" ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                All Patients
              </Button>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">City</TableHead>
                  <TableHead className="hidden lg:table-cell">Therapy</TableHead>
                  <TableHead className="hidden lg:table-cell">Auth #</TableHead>
                  <TableHead className="hidden xl:table-cell">Visits</TableHead>
                  <TableHead className="hidden md:table-cell">Agency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-400">Loading…</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-400">No patients found</TableCell></TableRow>
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
                          <Badge key={t} variant="outline" className="text-xs">
                            {{ physical_therapy: "Physical", occupational_therapy: "Occupational", speech_therapy: "Speech" }[t] || t.replace(" Therapy", "")}
                          </Badge>
                        ))}
                        {(!p.therapy_types || p.therapy_types.length === 0) && <span className="text-slate-500">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-slate-500">{p.authorization_number || "—"}</TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-slate-500">{p.authorized_visits || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-slate-500">{p.agency || "—"}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${statusBadge[p.status] || ""}`}>{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(p)}>
                          <Pencil className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(p)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="referral">
          <Tabs defaultValue="manual" className="space-y-4">
            <TabsList className="w-full max-w-xs">
              <TabsTrigger value="manual" className="gap-2 flex-1">
                <ClipboardList className="w-4 h-4" />
                Manual Entry
              </TabsTrigger>
              <TabsTrigger value="pdf" className="gap-2 flex-1">
                <FileUp className="w-4 h-4" />
                Import PDF
              </TabsTrigger>
            </TabsList>
            <TabsContent value="manual">
              <ReferralIntakeForm onSave={handleReferralSave} />
            </TabsContent>
            <TabsContent value="pdf">
              <ImportReferralPDF onImport={handlePDFImport} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="referral-list">
          <ReferralListTab onEdit={(referralId) => { setEditReferralPatientId(referralId); setActiveTab("edit-referral"); }} />
        </TabsContent>

        <TabsContent value="edit-referral">
          <EditReferralForm onUpdate={handleReferralUpdate} preselectedReferralId={editReferralPatientId} />
        </TabsContent>

        <TabsContent value="add">
          <div className="max-w-2xl">
            <Card>
              <CardContent className="p-6">
                <Button className="w-full bg-teal-600 hover:bg-teal-700 gap-2" onClick={() => setFormOpen(true)}>
                  <Plus className="w-4 h-4" /> Add New Patient
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


      </Tabs>

      {formOpen && !editing && <PatientForm open={formOpen} onClose={() => setFormOpen(false)} onSave={(d) => handleCreate(d)} />}
      {deleteTarget && (
        <DeletePatientDialog
          patient={deleteTarget}
          currentUser={currentUser}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
