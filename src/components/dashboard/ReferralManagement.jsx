"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ClipboardCheck, UserCheck, Trash2 } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { createAssignment } from "@/lib/api-client/referrals";
import { toast } from "sonner";
import { canAssignTherapist } from "@/lib/assignments/eligibility";

const THERAPY_TYPE_DISPLAY = {
  pt: "Physical Therapy",
  physical: "Physical Therapy",
  physical_therapy: "Physical Therapy",
  "physical therapy": "Physical Therapy",
  ot: "Occupational Therapy",
  occupational: "Occupational Therapy",
  occupational_therapy: "Occupational Therapy",
  "occupational therapy": "Occupational Therapy",
  st: "Speech Therapy",
  slp: "Speech Therapy",
  speech: "Speech Therapy",
  speech_therapy: "Speech Therapy",
  "speech therapy": "Speech Therapy",
};

const normalizeTherapyType = (type) =>
  THERAPY_TYPE_DISPLAY[String(type || "").trim().toLowerCase()] || type;

export default function ReferralManagement({ patients, therapists, visits, assignments = [], agencies = [], onRefresh }) {
  const [assignDialog, setAssignDialog] = useState(null);
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [selectedTherapyType, setSelectedTherapyType] = useState("");

  // Create a flat list of pending referrals (one entry per therapy type)
  const pendingReferrals = patients.flatMap(p => {
    if (!p.therapy_types || p.therapy_types.length === 0) return [];
    if (p.status !== "active") return [];

    // Check if patient has no visits or has pending therapy types
    const patientVisits = visits.filter(v => v.patient_id === p.id);
    const patientAssignments = assignments.filter(a => a.patient_id === p.id);

    const therapyTypeVisits = [...new Set(p.therapy_types.map(normalizeTherapyType))].map(therapyType => {
      const visitsForType = patientVisits.filter(v => v.therapy_type === therapyType);
      const hasEval = visitsForType.some(v => v.visit_type === "evaluation");
      // Assignments arrive newest first. Only the latest evaluation assignment
      // represents the current workflow state; older assigned rows must not hide
      // a newly recalled/unassigned referral.
      const latestEvalAssignment = patientAssignments.find(a =>
        a.therapy_type === therapyType &&
        a.visit_type === "evaluation"
      );
      const pendingAssignment = latestEvalAssignment &&
        (latestEvalAssignment.status === "pending" || latestEvalAssignment.status === "accepted") &&
        !!latestEvalAssignment.therapist_id
        ? latestEvalAssignment
        : null;
      const recalledAssignment = latestEvalAssignment?.status === "pending" &&
        !latestEvalAssignment.therapist_id &&
        !!latestEvalAssignment.recalled_from
        ? latestEvalAssignment
        : null;
      return { therapyType, hasEval, pendingAssignment, recalledAssignment };
    });

    // Create entries for pending evaluations and treatment visits
    return therapyTypeVisits.flatMap(({ therapyType, hasEval, pendingAssignment, recalledAssignment }) => {
      const entries = [];

      // If no evaluation yet and no pending assignment, need evaluation
      // A recalled latest assignment must return to Pending Referrals even if an
      // older evaluation visit exists for the same patient/discipline.
      if ((!hasEval && !pendingAssignment) || recalledAssignment) {
        // Check if previously declined or recalled
        const declinedAssignment = patientAssignments.find(a =>
          a.therapy_type === therapyType &&
          a.visit_type === "evaluation" &&
          a.status === "declined"
        );

        entries.push({
          patient: p,
          therapyType: therapyType,
          visitType: "evaluation",
          declinedBy: declinedAssignment?.therapist_name,
          recalledFrom: recalledAssignment?.recalled_from,
        });
      }

      return entries;
    });
  });

  const [assigning, setAssigning] = useState(false);

  const openAssignDialog = (patient, therapyType, visitType) => {
    setSelectedTherapist("");
    setAssignDialog({
      patient,
      therapyType,
      visitType,
    });
    setSelectedTherapyType(therapyType);
  };

  const handleAssign = async () => {
    if (!selectedTherapist || !selectedTherapyType) return;
    setAssigning(true);
    try {
      const result = await createAssignment({
        patient_id: assignDialog.patient.id,
        patient_name: `${assignDialog.patient.first_name} ${assignDialog.patient.last_name}`,
        therapist_id: selectedTherapist,
        therapy_type: selectedTherapyType,
        visit_type: assignDialog.visitType,
        agency: assignDialog.patient.agency || null,
      });
      if (!result?.success) throw new Error(result?.error || "Assignment could not be saved");
      await onRefresh?.();
      toast.success(`${assignDialog.patient.first_name} ${assignDialog.patient.last_name} assigned successfully`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to assign therapist");
      return;
    } finally {
      setAssigning(false);
    }
    setAssignDialog(null);
    setSelectedTherapist("");
    setSelectedTherapyType("");
  };

  const getAvailableTherapists = (therapyType, visitType, patientAgency) => {
    const normalizedTherapyType = normalizeTherapyType(therapyType);
    const agencyRecord = agencies.find(a => a.name === patientAgency);
    // assistants_allowed defaults to true if not set
    const assistantsAllowed = agencyRecord ? agencyRecord.assistants_allowed !== false : true;

    return therapists.filter(t => canAssignTherapist(
      t,
      normalizedTherapyType,
      visitType,
      assistantsAllowed,
    ));
  };

  const therapyColors = {
    "Physical Therapy": "bg-teal-100 text-teal-700",
    "Occupational Therapy": "bg-purple-100 text-purple-700",
    "Speech Therapy": "bg-amber-100 text-amber-700",
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-teal-600" />
            Pending Referrals
            <Badge variant="secondary" className="ml-auto">{pendingReferrals.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingReferrals.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No pending referrals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReferrals.slice(0, 10).map((referral, index) => (
                <div key={`${referral.patient.id}-${referral.therapyType}-${referral.visitType}-${index}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-medium text-slate-900">
                        {referral.patient.first_name} {referral.patient.last_name}
                      </div>
                      <Badge className={therapyColors[referral.therapyType]}>
                        {referral.therapyType.replace(" Therapy", "")}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {referral.visitType === "evaluation" ? "Eval" : "Treatment"}
                      </Badge>
                      {referral.recalledFrom && (
                        <Badge variant="outline" className="text-xs gap-1 border-amber-300 text-amber-700 bg-amber-50">
                          ↩ Taken back from {referral.recalledFrom}
                        </Badge>
                      )}
                      {referral.declinedBy && (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Declined by {referral.declinedBy}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {referral.patient.agency && `${referral.patient.agency} • `}
                      {referral.patient.authorization_number && `Auth: ${referral.patient.authorization_number}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => openAssignDialog(referral.patient, referral.therapyType, referral.visitType)}
                      className="bg-teal-600 hover:bg-teal-700 gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      Assign
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { if (confirm(`Remove ${referral.therapyType} referral for ${referral.patient.first_name} ${referral.patient.last_name}?`)) {} }}
                      disabled={false}
                      className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {assignDialog && (
        <Dialog
          open={!!assignDialog}
          onOpenChange={() => {
            setAssignDialog(null);
            setSelectedTherapist("");
            setSelectedTherapyType("");
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Assign Therapist - {assignDialog.patient.first_name} {assignDialog.patient.last_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Therapy Type & Visit Type
                </label>
                <div className="px-3 py-2 rounded-md border bg-slate-50 flex items-center gap-2">
                  <Badge className={therapyColors[assignDialog.therapyType]}>
                    {assignDialog.therapyType}
                  </Badge>
                  <Badge variant="outline">
                    {assignDialog.visitType === "evaluation" ? "Evaluation" : "Treatment"}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Select Therapist
                </label>
                <Select value={selectedTherapist} onValueChange={setSelectedTherapist}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select therapist" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTherapists(assignDialog.therapyType, assignDialog.visitType, assignDialog.patient?.agency).map((therapist) => (
                      <SelectItem key={therapist.id} value={therapist.id}>
                        {therapist.full_name} {therapist.credentials && `(${therapist.credentials})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getAvailableTherapists(assignDialog.therapyType, assignDialog.visitType, assignDialog.patient?.agency).length === 0 && (
                  <p className="text-xs text-amber-600 mt-2">
                    No therapists available with {assignDialog.therapyType} credentials
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedTherapist || !selectedTherapyType || assigning}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {assigning ? "Assigning..." : "Assign to Therapist"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
