"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, DollarSign } from "lucide-react";
import { getAgenciesForInvoice, getCompletedVisitsForInvoice, createInvoice } from "@/lib/api-client/invoices";

const VISIT_TYPE_LABELS = {
  evaluation: "Evaluation",
  treatment: "Treatment",
  re_evaluation: "Re-evaluation",
  discharge: "Discharge",
};

const THERAPY_SHORT = {
  "Physical Therapy": "PT",
  "Occupational Therapy": "OT",
  "Speech Therapy": "ST",
};

export default function CreateInvoiceForm({ onSaved, initialAgencyId = "", initialDateFrom = "", initialDateTo = "", invoiceType = "Visits" }) {
  const [agencyId, setAgencyId] = useState(initialAgencyId);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [notes, setNotes] = useState("");
  const [selectedVisitIds, setSelectedVisitIds] = useState(new Set());
  const [rateOverrides, setRateOverrides] = useState({});
  const [saving, setSaving] = useState(false);

  const [agencies, setAgencies] = useState([]);
  const [allVisits, setAllVisits] = useState([]);

  const loadFormData = useCallback(async () => {
    try {
      const [agencyData, visitData] = await Promise.all([
        getAgenciesForInvoice(),
        getCompletedVisitsForInvoice(),
      ]);
      setAgencies(agencyData);
      setAllVisits(visitData);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadFormData(); }, [loadFormData]);

  const selectedAgency = agencies.find((a) => a.id === agencyId);

  // Filter visits by agency and date range
  const filteredVisits = useMemo(() => {
    if (!agencyId || !dateFrom || !dateTo) return [];
    return allVisits.filter((v) => {
      const matchesAgency = v.agency_id === agencyId;
      const matchesDate = v.visit_date >= dateFrom && v.visit_date <= dateTo;
      const isCompleted = v.status === "completed" || v.status === "signed";
      return matchesAgency && matchesDate && isCompleted;
    });
  }, [allVisits, agencyId, dateFrom, dateTo, selectedAgency]);

  // Get rate for a visit from agency rates config
  const getAgencyRate = (visit) => {
    if (!selectedAgency?.rates) return 0;
    const rate = selectedAgency.rates.find(
      (r) => r.therapy_type === visit.therapy_type && r.visit_type === visit.visit_type
    );
    return rate?.rate || 0;
  };

  const getEffectiveRate = (visit) => {
    return rateOverrides[visit.id] !== undefined
      ? parseFloat(rateOverrides[visit.id]) || 0
      : getAgencyRate(visit);
  };

  // Select all / deselect all
  const toggleAll = () => {
    if (selectedVisitIds.size === filteredVisits.length) {
      setSelectedVisitIds(new Set());
    } else {
      setSelectedVisitIds(new Set(filteredVisits.map((v) => v.id)));
    }
  };

  const toggleVisit = (id) => {
    const next = new Set(selectedVisitIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedVisitIds(next);
  };

  const selectedVisits = filteredVisits.filter((v) => selectedVisitIds.has(v.id));
  const totalAmount = selectedVisits.reduce((sum, v) => sum + getEffectiveRate(v), 0);

  const handleSave = async () => {
    if (!agencyId || selectedVisits.length === 0) return;
    setSaving(true);

    const lineItems = selectedVisits.map((v) => ({
      visit_note_id: v.id,
      patient_name: v.patient_name,
      visit_date: v.visit_date,
      therapy_type: v.therapy_type,
      visit_type: v.visit_type || "treatment",
      therapist_name: v.therapist_name,
      rate: getEffectiveRate(v),
      quantity: 1,
      subtotal: getEffectiveRate(v),
    }));

    await createInvoice({
      agency_id: agencyId,
      date_from: dateFrom,
      date_to: dateTo,
      total_amount: totalAmount,
      notes: notes || null,
      line_items: lineItems,
    });

    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Step 1: Select Agency & Dates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">1. Select Agency & Date Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Agency *</Label>
              <Select value={agencyId} onValueChange={setAgencyId}>
                <SelectTrigger><SelectValue placeholder="Select agency" /></SelectTrigger>
                <SelectContent>
                  {agencies.filter((a) => a.status === "active").map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>From Date *</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label>To Date *</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          {selectedAgency?.rates && selectedAgency.rates.length > 0 && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-teal-700 mb-2">Agency Rates on File</p>
              <div className="flex flex-wrap gap-2">
                {selectedAgency.rates.map((r, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {THERAPY_SHORT[r.therapy_type] || r.therapy_type} {r.visit_type}: ${r.rate}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Select Visits */}
      {agencyId && dateFrom && dateTo && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-800">
                2. Select Completed Visits ({filteredVisits.length} found)
              </CardTitle>
              {filteredVisits.length > 0 && (
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {selectedVisitIds.size === filteredVisits.length ? "Deselect All" : "Select All"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredVisits.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>No completed visits found for this agency and date range</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Therapist</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Visit Type</TableHead>
                      <TableHead>Rate ($)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisits.map((v) => (
                      <TableRow key={v.id} className={selectedVisitIds.has(v.id) ? "bg-teal-50/50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedVisitIds.has(v.id)}
                            onCheckedChange={() => toggleVisit(v.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-sm">{v.patient_name}</TableCell>
                        <TableCell className="text-sm text-slate-500">{v.visit_date}</TableCell>
                        <TableCell className="text-sm text-slate-500">{v.therapist_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{THERAPY_SHORT[v.therapy_type] || v.therapy_type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{VISIT_TYPE_LABELS[v.visit_type] || v.visit_type}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-8 w-24 text-sm"
                            value={rateOverrides[v.id] !== undefined ? rateOverrides[v.id] : getAgencyRate(v)}
                            onChange={(e) => setRateOverrides((prev) => ({ ...prev, [v.id]: e.target.value }))}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Summary & Save */}
      {selectedVisits.length > 0 && (
        <Card className="border-teal-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">3. Review & Save</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-teal-600" />
              <div>
                <p className="text-sm text-slate-500">{selectedVisits.length} visit(s) selected</p>
                <p className="text-2xl font-bold text-teal-700">${totalAmount.toFixed(2)}</p>
              </div>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any additional notes for this invoice..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700"
              size="lg"
              onClick={handleSave}
              disabled={saving}
            >
              <FileText className="w-4 h-4 mr-2" />
              {saving ? "Creating Invoice..." : `Create Invoice — $${totalAmount.toFixed(2)}`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
