"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { format, addDays } from "date-fns";

export default function EscalateTaskDialog({ open, onClose, task, users, onEscalate, isPending }) {
  const [escalatedTo, setEscalatedTo] = useState("");
  const [escalatedToName, setEscalatedToName] = useState("");
  const [reason, setReason] = useState("");
  const [followUpDate, setFollowUpDate] = useState(format(addDays(new Date(), 3), "yyyy-MM-dd"));

  const handleUserSelect = (userId) => {
    const user = users.find(u => u.id === userId);
    setEscalatedTo(user?.email || "");
    setEscalatedToName(user?.full_name || "");
  };

  const handleSubmit = () => {
    if (!escalatedTo || !reason.trim()) return;
    onEscalate({ escalatedTo, escalatedToName, reason, followUpDate });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            Escalate Task
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <p className="font-medium">{task?.title}</p>
            {task?.description && <p className="text-xs mt-1 text-amber-700">{task.description}</p>}
          </div>

          <div>
            <Label className="mb-1 block text-sm">Escalate To *</Label>
            <Select onValueChange={handleUserSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select person to escalate to" />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.full_name} — {u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1 block text-sm">Reason for Escalation *</Label>
            <Textarea
              placeholder="Describe why this task cannot be resolved and needs escalation…"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label className="mb-1 block text-sm">Follow-Up Reminder Date</Label>
            <Input
              type="date"
              value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">A reminder will be created on this date to follow up.</p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              className="bg-amber-600 hover:bg-amber-700 flex-1"
              disabled={!escalatedTo || !reason.trim() || isPending}
              onClick={handleSubmit}
            >
              {isPending ? "Escalating…" : "Escalate Task"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
