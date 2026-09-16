"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import { getAgenciesForInvoice } from "@/lib/api-client/invoices";

export default function CreateInvoiceDialog({ open, onOpenChange, onContinue }) {
  const [agencyId, setAgencyId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [invoiceType, setInvoiceType] = useState("Visits");
  const [agencies, setAgencies] = useState([]);

  const loadAgencies = useCallback(async () => {
    try {
      const data = await getAgenciesForInvoice();
      setAgencies(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { if (open) loadAgencies(); }, [open, loadAgencies]);

  const handleContinue = () => {
    if (!agencyId || !startDate || !endDate) return;
    onContinue({ agencyId, startDate, endDate, invoiceType });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Create Invoices</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div>
            <Label className="text-sm text-slate-600 mb-1.5 block">Agency *</Label>
            <Select value={agencyId} onValueChange={setAgencyId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select agency" /></SelectTrigger>
              <SelectContent>
                {agencies.filter((a) => a.status === "active").map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-slate-500 font-medium pt-2">Choose Dates Range</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-600">Starting Date:</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-600">Ending Date:</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full" />
            </div>
          </div>
          <div className="flex items-center gap-6 pt-1">
            <span className="text-sm text-slate-600 font-medium">Invoice Type:</span>
            {["Visits", "Hourly", "Unit"].map((type) => (
              <label key={type} className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-700">
                <input type="radio" name="invoiceType" value={type} checked={invoiceType === type} onChange={() => setInvoiceType(type)} className="accent-teal-600" />
                {type}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-center pt-2 border-t">
          <Button onClick={handleContinue} disabled={!agencyId || !startDate || !endDate} className="bg-green-600 hover:bg-green-700 text-white gap-2 px-8">
            <ArrowRight className="w-4 h-4" /> Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
