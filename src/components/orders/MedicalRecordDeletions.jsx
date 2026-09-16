"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getDeletionRequests, approveDeletionRequest, rejectDeletionRequest } from "@/lib/api-client/deletion-requests";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, XCircle, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusColor = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-red-50 text-red-700 border-red-200",
  rejected: "bg-slate-100 text-slate-500",
};

export default function MedicalRecordDeletions() {
  const currentUser = useCurrentUser();
  const [approveDialog, setApproveDialog] = useState(null);
  const [rejectDialog, setRejectDialog] = useState(null);
  const [password, setPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    try {
      const data = await getDeletionRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleApprove = async () => {
    if (!approveDialog) return;
    setActionLoading(true);
    try {
      const result = await approveDeletionRequest(approveDialog.id);
      if (result?.success) {
        toast.success("Medical record deleted permanently");
        loadRequests();
      }
    } catch (err) {
      toast.error(err.message || "Failed to approve deletion");
    } finally {
      setActionLoading(false);
      setApproveDialog(null);
      setPassword("");
    }
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    try {
      const result = await rejectDeletionRequest(rejectDialog.id);
      if (result?.success) {
        toast.success("Deletion request rejected");
        loadRequests();
      }
    } catch (err) {
      toast.error("Failed to reject deletion request");
    } finally {
      setRejectDialog(null);
    }
  };

  const pending = requests.filter(r => r.status === "pending");
  const resolved = requests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Medical Record Deletion Requests</h2>
        <p className="text-xs text-slate-500 mt-0.5">A second admin (not the requester) must approve each deletion.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400 py-8 text-center">Loading...</p>
      ) : (
        <>
          {pending.length === 0 && resolved.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Trash2 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No deletion requests</p>
            </div>
          )}

          {pending.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending Approval ({pending.length})</p>
              {pending.map(req => (
                <Card key={req.id} className="border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <p className="font-semibold text-slate-900">{req.patient_name}</p>
                          <Badge className={`text-xs ${statusColor[req.status]}`}>{req.status}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">Requested by: <span className="font-medium text-slate-700">{req.requested_by_name}</span> ({req.requested_by})</p>
                        <p className="text-xs text-slate-500">Date: {req.created_date ? format(new Date(req.created_date), "MMM d, yyyy h:mm a") : "—"}</p>
                        <p className="text-xs text-slate-500">Reason: <span className="text-slate-700">{req.reason}</span></p>
                        <p className="text-xs text-slate-500">Visit notes to delete: <span className="font-semibold text-red-600">{req.visit_notes_count ?? "?"}</span></p>
                      </div>
                      {req.requested_by !== currentUser?.email ? (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setRejectDialog(req); }}
                            className="border-slate-300 text-slate-600 gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => { setApproveDialog(req); setPassword(""); }}
                            className="bg-red-600 hover:bg-red-700 text-white gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve & Delete
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Awaiting another admin</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">History</p>
              {resolved.map(req => (
                <Card key={req.id} className="opacity-70">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm text-slate-800">{req.patient_name}</p>
                        <p className="text-xs text-slate-400">Requested by {req.requested_by_name} · {req.status === "approved" ? `Approved by ${req.approved_by_name}` : "Rejected"}</p>
                      </div>
                      <Badge className={`text-xs ${statusColor[req.status]}`}>{req.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Approve Dialog */}
      {approveDialog && (
        <Dialog open onOpenChange={() => { setApproveDialog(null); setPassword(""); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Confirm Permanent Deletion
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-800">{approveDialog.patient_name}</p>
                <p className="text-xs text-red-600 mt-1">
                  This will permanently delete the patient record and all {approveDialog.visit_notes_count} visit notes. This action cannot be undone.
                </p>
              </div>
              <div>
                <Label>Your Admin Password *</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password to confirm" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setApproveDialog(null); setPassword(""); }}>Cancel</Button>
              <Button onClick={handleApprove} disabled={actionLoading} className="bg-red-600 hover:bg-red-700 text-white">
                {actionLoading ? "Deleting..." : "Permanently Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Dialog */}
      {rejectDialog && (
        <Dialog open onOpenChange={() => setRejectDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Reject Deletion Request?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-600 py-2">This will reject the deletion request for <strong>{rejectDialog.patient_name}</strong>. The patient record will remain intact.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
              <Button onClick={handleReject} className="bg-slate-700 hover:bg-slate-800 text-white">Reject Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
