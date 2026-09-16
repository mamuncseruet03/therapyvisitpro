"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import VisitNoteForm from "@/components/visits/VisitNoteForm";
import { getVisitNoteById, getVisitFormData, saveVisitNote } from "@/lib/api-client/visit-notes";
import { toast } from "sonner";

function EditVisitNoteContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const effectiveUser = useCurrentUser();
  const isAdmin = ["admin", "superuser"].includes(effectiveUser?.role) || ["admin", "superuser"].includes(effectiveUser?.user_type);

  const [visit, setVisit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [agencies, setAgencies] = useState([]);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [noteData, formData] = await Promise.all([
        getVisitNoteById(id),
        getVisitFormData(),
      ]);
      setVisit(noteData);
      setPatients(formData.patients);
      setTherapists(formData.therapists);
      setAgencies(formData.agencies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (data) => {
    try {
      const result = await saveVisitNote({ ...data, id });
      if (result?.success) {
        toast.success("Visit note updated successfully");
        router.push(`/VisitNoteDetail?id=${id}`);
      }
    } catch (err) {
      toast.error("Failed to update visit note");
    }
  };

  const handleAutoSave = async (data) => {
    try {
      await saveVisitNote({ ...data, id, status: "draft" });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20 text-slate-400">Loading…</div>;
  }

  if (!visit) {
    return <div className="flex justify-center py-20 text-slate-400">Visit note not found</div>;
  }

  const isCompleted = visit.status === "completed" || visit.status === "signed";
  const canEdit = !isCompleted || isAdmin;

  if (isCompleted && !isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => router.push(`/VisitNoteDetail?id=${id}`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Visit Note</h1>
            <p className="text-slate-500 text-sm mt-0.5">{visit.patient_name}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
          <Lock className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Visit Note Locked</p>
            <p className="text-sm mt-1">This visit note has been completed and is locked. Contact an administrator to unlock it for editing.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => router.push(`/VisitNoteDetail?id=${id}`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Visit Note</h1>
          <p className="text-slate-500 text-sm mt-0.5">{visit.patient_name}</p>
        </div>
      </div>

      <VisitNoteForm
        patients={patients}
        therapists={therapists}
        agencies={agencies}
        onSave={handleSave}
        onAutoSave={handleAutoSave}
        initial={visit}
      />
    </div>
  );
}

export default function EditVisitNote() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20 text-slate-400">Loading…</div>}>
      <EditVisitNoteContent />
    </Suspense>
  );
}