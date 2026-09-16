"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CheckDetailsDialog({ open, onOpenChange, onSave, invoiceNumber }) {
  const [checkNumber, setCheckNumber] = useState("");
  const [checkDate, setCheckDate] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!checkNumber || !checkDate || !amount) return;
    setSaving(true);
    await onSave({ checkNumber, checkDate, amount, notes });
    setSaving(false);
    setCheckNumber("");
    setCheckDate("");
    setAmount("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Check Details for {invoiceNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Check Number *</Label>
            <Input placeholder="e.g., CHK-12345" value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Check Date *</Label>
            <Input type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Amount *</Label>
            <Input type="number" placeholder="0.00" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Notes (optional)</Label>
            <Textarea placeholder="Any additional notes about this check..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!checkNumber || !checkDate || !amount || saving} className="bg-teal-600 hover:bg-teal-700">
            {saving ? "Saving..." : "Save Check Details"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
