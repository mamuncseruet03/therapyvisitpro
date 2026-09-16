"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Trash2, AlertTriangle, History } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { updateAssignment, deleteAssignment as deleteAssignmentAction } from "@/lib/api-client/referrals";

const therapyColors = {
  "Physical Therapy": "bg-teal-100 text-teal-700",
  "Occupational Therapy": "bg-purple-100 text-purple-700",
  "Speech Therapy": "bg-amber-100 text-amber-700",
};

export default function AwaitingAssignment({ assignments, therapists = [], onRefresh }) {
  const [assignDialog, setAssignDialog] = useState(null);
  const [selectedTherapistId, setSelectedTherapistId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const unassigned = assignments.filter(
    (a) => a.status === "pending" && !a.therapist_id && !a.therapist_name
  );

  const handleAssign = async () => {
    if (!selectedTherapistId || !assignDialog) return;
    const therapist = therapists.find((t) => t.id === selectedTherapistId);
    if (!therapist) return;
    setAssigning(true);
    try {
      await updateAssignment(assignDialog.id, {
        therapist_id: selectedTherapistId,
        therapist_name: therapist.full_name,
      });
      onRefresh?.();
      toast.success(`Assigned ${therapist.full_name} to ${assignDialog.patient_name}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign therapist");
    } finally {
      setAssigning(false);
      setAssignDialog(null);
      setSelectedTherapistId("");
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteAssignmentAction(id);
      onRefresh?.();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const openAssign = (assignment) => {
    setSelectedTherapistId("");
    setAssignDialog(assignment);
  };

  // Filter therapists by matching discipline
  const eligibleTherapists = assignDialog
    ? therapists.filter(
        (t) =>
          t.status !== "inactive" &&
          t.discipline === assignDialog.therapy_type
      )
    : [];

  const previouslyAssignedIds = assignDialog
    ? (assignDialog.assignment_history || []).map((h) => h.therapist_id).filter(Boolean)
    : [];

  const selectedTherapistWasPrevious =
    selectedTherapistId && previouslyAssignedIds.includes(selectedTherapistId);

  if (unassigned.length === 0) return null;

  return (
    <>
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-600" />
            Awaiting Assignment
            <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-700">
              {unassigned.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {unassigned.map((assignment) => (
              <div
                key={assignment.id}
                className="p-3 rounded-lg border border-orange-100 bg-orange-50/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-slate-900">{assignment.patient_name}</span>
                      <Badge className={therapyColors[assignment.therapy_type]}>
                        {assignment.therapy_type.replace(" Therapy", "")}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {assignment.visit_type === "evaluation" ? "Eval" : "Treatment"}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 space-y-0.5">
                      {assignment.agency && <span>{assignment.agency}</span>}
                    </div>
                    {/* Assignment History */}
                    {(assignment.assignment_history || []).length > 0 && (
                      <div className="mt-2 border border-amber-200 bg-amber-50 rounded-lg p-2 space-y-1">
                        <p className="text-[10px] font-semibold text-amber-700 flex items-center gap-1">
                          <History className="w-3 h-3" /> Previously Assigned
                        </p>
                        {assignment.assignment_history.map((h, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-700">{h.therapist_name}</span>
                            <div className="flex items-center gap-2">
                              {h.action === "declined" ? (
                                <Badge variant="outline" className="text-[10px] border-red-200 text-red-600 bg-red-50">Declined</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">Taken Back</Badge>
                              )}
                              {h.date && (
                                <span className="text-slate-400">{format(new Date(h.date), "MMM d")}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => openAssign(assignment)}
                      className="bg-orange-600 hover:bg-orange-700 gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Assign
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Delete this assignment?")) handleDelete(assignment.id);
                      }}
                      className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {assignDialog && (
        <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Therapist — {assignDialog.patient_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm font-medium text-slate-800">{assignDialog.patient_name}</p>
                <p className="text-xs text-slate-500">
                  {assignDialog.therapy_type} · {assignDialog.visit_type === "evaluation" ? "Evaluation" : "Treatment"}
                  {assignDialog.agency ? ` · ${assignDialog.agency}` : ""}
                </p>
              </div>
              {/* Assignment history in dialog */}
              {(assignDialog.assignment_history || []).length > 0 && (
                <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> Assignment History
                  </p>
                  {assignDialog.assignment_history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{h.therapist_name}</span>
                      <div className="flex items-center gap-2">
                        {h.action === "declined" ? (
                          <span className="text-red-600">Declined{h.reason ? `: "${h.reason}"` : ""}</span>
                        ) : (
                          <span className="text-amber-600">Taken back by admin</span>
                        )}
                        {h.date && <span className="text-slate-400">{format(new Date(h.date), "MMM d, yyyy")}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  Select Therapist <span className="text-red-500">*</span>
                </Label>
                {eligibleTherapists.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No active therapists found for {assignDialog.therapy_type}.</p>
                ) : (
                  <Select value={selectedTherapistId} onValueChange={setSelectedTherapistId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a therapist..." />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleTherapists.map((t) => {
                        const wasPrevious = previouslyAssignedIds.includes(t.id);
                        return (
                          <SelectItem key={t.id} value={t.id}>
                            {t.full_name} {t.credentials ? `(${t.credentials})` : ""}
                            {wasPrevious ? " ⚠ Previously assigned" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
                {selectedTherapistWasPrevious && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    This therapist was previously assigned to this patient and declined or was taken back. Consider selecting a different therapist.
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialog(null)}>Cancel</Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedTherapistId || assigning}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {assigning ? "Assigning..." : "Assign Therapist"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
