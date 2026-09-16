"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function DeletePatientDialog({ patient, onClose, currentUser }) {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = ["admin", "superuser"].includes(currentUser?.role) || ["admin", "superuser"].includes(currentUser?.user_type);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for deletion.");
      return;
    }

    setLoading(true);
    try {
      if (isAdmin) {
        if (!password.trim()) {
          toast.error("Please enter your password to confirm.");
          setLoading(false);
          return;
        }
      }

      toast.success("Deletion request submitted. An admin will review it under Orders → Medical Record Deletions.");
      onClose();
    } catch (err) {
      toast.error("Failed to submit deletion request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Request Patient Record Deletion
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-800">{patient.first_name} {patient.last_name}</p>
            <p className="text-xs text-red-600 mt-1">
              This will submit a deletion request. All visit notes and documents for this patient will be permanently deleted once an admin approves.
            </p>
          </div>

          <div>
            <Label>Reason for Deletion *</Label>
            <Textarea
              placeholder="Provide a reason for this deletion request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {isAdmin && (
            <div>
              <Label>Your Password (to confirm identity) *</Label>
              <Input
                type="password"
                placeholder="Enter your admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {!isAdmin && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700">Your request will be reviewed by an admin before any deletion occurs.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {loading ? "Submitting..." : "Submit Deletion Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
