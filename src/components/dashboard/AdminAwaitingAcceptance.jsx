"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Undo2, Trash2 } from "lucide-react";
import { updateAssignment, deleteAssignment as deleteAssignmentAction } from "@/lib/api-client/referrals";
import { toast } from "sonner";

export default function AdminAwaitingAcceptance({ assignments, onRefresh, onTakeBack }) {
  const [recallingId, setRecallingId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [takenBackIds, setTakenBackIds] = useState(() => new Set());
  const pendingAssignments = assignments.filter(a =>
    a.status === "pending" &&
    !!(a.therapist_id || a.therapist_name) &&
    !takenBackIds.has(a.id)
  );

  const therapyColors = {
    "Physical Therapy": "bg-teal-100 text-teal-700",
    "Occupational Therapy": "bg-purple-100 text-purple-700",
    "Speech Therapy": "bg-amber-100 text-amber-700",
  };

  const recallAssignment = async (assignment) => {
    setRecallingId(assignment.id);
    setTakenBackIds((current) => new Set(current).add(assignment.id));
    const history = [...(assignment.assignment_history || []), {
      therapist_id: assignment.therapist_id,
      therapist_name: assignment.therapist_name,
      action: "recalled",
      date: new Date().toISOString(),
    }];
    onTakeBack?.(assignment.id, {
      history,
      recalledFrom: assignment.therapist_name,
    });
    try {
      await updateAssignment(assignment.id, {
        therapist_id: null,
        therapist_name: null,
        recalled_from: assignment.therapist_name,
        assignment_history: history,
      });
      toast.success(`${assignment.patient_name} moved to Awaiting Assignment`);
      await onRefresh?.();
    } catch (err) {
      setTakenBackIds((current) => {
        const next = new Set(current);
        next.delete(assignment.id);
        return next;
      });
      toast.error(err?.message || "Unable to take back assignment");
      console.error(err);
      await onRefresh?.();
    } finally {
      setRecallingId(null);
    }
  };

  const handleDelete = async (assignmentId) => {
    setDeleting(true);
    try {
      await deleteAssignmentAction(assignmentId);
      onRefresh?.();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          Awaiting Acceptance
          <Badge variant="secondary" className="ml-auto">{pendingAssignments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingAssignments.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No pending assignments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingAssignments.slice(0, 10).map((assignment) => (
              <div key={assignment.id} className="p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <div className="font-medium text-slate-900">
                        {assignment.patient_name}
                      </div>
                      <Badge className={therapyColors[assignment.therapy_type]}>
                        {assignment.therapy_type.replace(" Therapy", "")}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {assignment.visit_type === "evaluation" ? "Eval" : "Treatment"}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500">
                      {assignment.therapist_name
                        ? <>Assigned to: <span className="font-medium text-slate-700">{assignment.therapist_name}</span></>
                        : <span className="text-amber-600 font-medium">Unassigned — needs reassignment</span>
                      }
                      {assignment.agency && ` • ${assignment.agency}`}
                    </div>
                    {assignment.declined_reason && (
                      <div className="text-xs text-red-500 mt-1">
                        Declined: &quot;{assignment.declined_reason}&quot;
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Pending
                    </Badge>
                    {assignment.therapist_name && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => recallAssignment(assignment)}
                        disabled={recallingId === assignment.id}
                        className="h-8 gap-1 text-slate-600 hover:text-slate-900"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        Take Back
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { if (confirm("Delete this assignment?")) handleDelete(assignment.id); }}
                      disabled={deleting}
                      className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
