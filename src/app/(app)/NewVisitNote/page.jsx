"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import VisitNoteForm from "@/components/visits/VisitNoteForm";
import { getVisitFormData, getLatestDraftVisitNote, saveVisitNote } from "@/lib/api-client/visit-notes";
import { toast } from "sonner";
import { updateAssignment } from "@/lib/api-client/referrals";

export default function NewVisitNote() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId") || "";
  const preselectedTherapyType = searchParams.get("therapyType") || "";
  const preselectedVisitType = searchParams.get("visitType") || "";
  const preselectedTherapistId = searchParams.get("therapistId") || "";
  const assignmentId = searchParams.get("assignmentId") || "";
  const draftIdRef = useRef(null);
  const autoSaveQueueRef = useRef(Promise.resolve());
  const [initialDraft, setInitialDraft] = useState(null);
  const [draftChecked, setDraftChecked] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle");
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

  useEffect(() => {
    let active = true;
    if (!preselectedPatientId || !preselectedTherapistId) {
      setDraftChecked(true);
      return () => { active = false; };
    }

    setDraftChecked(false);
    getLatestDraftVisitNote({
      patientId: preselectedPatientId,
      therapistId: preselectedTherapistId,
      visitType: preselectedVisitType || undefined,
    })
      .then((draft) => {
        if (!active || !draft) return;
        draftIdRef.current = draft.id;
        setInitialDraft(draft);
        setAutoSaveStatus("restored");
      })
      .catch((error) => console.error("Failed to restore visit note draft", error))
      .finally(() => { if (active) setDraftChecked(true); });

    return () => { active = false; };
  }, [preselectedPatientId, preselectedTherapistId, preselectedVisitType]);

  const handleSave = async (data) => {
    try {
      // Finish the same record created by autosave instead of creating a duplicate.
      await autoSaveQueueRef.current.catch(() => {});
      const result = await saveVisitNote({ ...data, id: draftIdRef.current || data.id });
      if (result?.success) {
        if (assignmentId) await updateAssignment(assignmentId, { status: "scheduled" });
        toast.success("Visit note created");
        router.push("/VisitNotes");
      }
    } catch (err) {
      toast.error("Failed to save visit note");
    }
  };

  const handleAutoSave = async (data) => {
    setAutoSaveStatus("saving");
    // Serialize saves so two quick Next/tab actions cannot create separate drafts.
    autoSaveQueueRef.current = autoSaveQueueRef.current.catch(() => {}).then(async () => {
      const result = await saveVisitNote({
        ...data,
        id: draftIdRef.current || data.id,
        status: "draft",
      });
      if (result?.success && !draftIdRef.current) {
        draftIdRef.current = result.id;
      }
      return result;
    });

    try {
      const result = await autoSaveQueueRef.current;
      setAutoSaveStatus("saved");
      return result;
    } catch (err) {
      setAutoSaveStatus("error");
      console.error("Visit note autosave failed", err);
      throw err;
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
      {draftChecked && <VisitNoteForm
        key={initialDraft?.id || "new-visit-note"}
        patients={patients}
        therapists={therapists}
        agencies={agencies}
        preselectedPatientId={preselectedPatientId}
        preselectedTherapyType={preselectedTherapyType}
        preselectedVisitType={preselectedVisitType}
        preselectedTherapistId={preselectedTherapistId}
        initial={initialDraft}
        autoSaveStatus={autoSaveStatus}
        onSave={handleSave}
        onAutoSave={handleAutoSave}
      />}
    </div>
  );
}
