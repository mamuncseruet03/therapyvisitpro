"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import VisitNoteForm from "@/components/visits/VisitNoteForm";
import { getVisitFormData, saveVisitNote } from "@/lib/api-client/visit-notes";
import { toast } from "sonner";

export default function NewVisitNote() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId") || "";
  const preselectedTherapyType = searchParams.get("therapyType") || "";
  const [draftId, setDraftId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [agencies, setAgencies] = useState([]);

  const loadFormData = useCallback(async () => {
    try {
      const data = await getVisitFormData();
      setPatients(data.patients);
      setTherapists(data.therapists);
      setAgencies(data.agencies || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadFormData(); }, [loadFormData]);

  const handleSave = async (data) => {
    try {
      const result = await saveVisitNote(data);
      if (result?.success) {
        toast.success("Visit note created");
        router.push("/VisitNotes");
      }
    } catch (err) {
      toast.error("Failed to save visit note");
    }
  };

  const handleAutoSave = async (data) => {
    try {
      const result = await saveVisitNote({ ...data, id: draftId || data.id, status: "draft" });
      if (result?.success && !draftId) {
        setDraftId(result.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/VisitNotes">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New Visit Note</h1>
          <p className="text-slate-500 text-sm mt-0.5">Document a therapy visit</p>
        </div>
      </div>
      <VisitNoteForm
        patients={patients}
        therapists={therapists}
        agencies={agencies}
        preselectedPatientId={preselectedPatientId}
        preselectedTherapyType={preselectedTherapyType}
        onSave={handleSave}
        onAutoSave={handleAutoSave}
      />
    </div>
  );
}
