"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, FileText, Clock, CheckCircle2 } from "lucide-react";
import { format, subMonths, differenceInDays } from "date-fns";
import { getInvoices } from "@/lib/api-client/invoices";

const STATUS_COLORS = {
  draft:        "bg-slate-100 text-slate-600",
  sent:         "bg-blue-50 text-blue-700",
  partial_paid: "bg-amber-50 text-amber-700",
  paid:         "bg-green-50 text-green-700",
  void:         "bg-red-50 text-red-600",
};

const AGING_BUCKETS = [
  { label: "Current (0–30 days)",  min: 0,   max: 30  },
  { label: "31–60 days",           min: 31,  max: 60  },
  { label: "61–90 days",           min: 61,  max: 90  },
  { label: "90+ days",             min: 91,  max: Infinity },
];

export default function AccountsReceivableReport() {
  const [dateFrom, setDateFrom] = useState(format(subMonths(new Date(), 6), "yyyy-MM-01"));
  const [dateTo, setDateTo]     = useState(format(new Date(), "yyyy-MM-dd"));

  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getInvoices()
      .then(setInvoices)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const today = new Date();
  const from  = new Date(dateFrom + "T00:00:00");
  const to    = new Date(dateTo   + "T23:59:59");

  // Only unpaid/partially-paid invoices within range
  const filtered = invoices.filter((inv) => {
    if (!inv.date_from) return false;
    const d = new Date(inv.date_from + "T00:00:00");
    return d >= from && d <= to && inv.status !== "void" && inv.status !== "paid";
  });

  const allUnpaid = invoices.filter(inv => inv.status !== "void" && inv.status !== "paid");

  const totalOutstanding = allUnpaid.reduce((s, inv) => s + (inv.total_amount || 0), 0);
  const totalDraft       = allUnpaid.filter(i => i.status === "draft").reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalSent        = allUnpaid.filter(i => i.status === "sent").reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalPartial     = allUnpaid.filter(i => i.status === "partial_paid").reduce((s, i) => s + (i.total_amount || 0), 0);

  // Aging summary
  const agingData = AGING_BUCKETS.map((bucket) => {
    const bucketInvoices = allUnpaid.filter((inv) => {
      if (!inv.date_from) return false;
      const age = differenceInDays(today, new Date(inv.date_from + "T00:00:00"));
      return age >= bucket.min && age <= bucket.max;
    });
    const amount = bucketInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);
    return { ...bucket, amount, count: bucketInvoices.length };
  });

  // Group by agency
  const byAgency = Object.values(
    filtered.reduce((acc, inv) => {
      const key = inv.agency_name || "Unknown";
      if (!acc[key]) acc[key] = { agency: key, total: 0, invoices: [] };
      acc[key].total += inv.total_amount || 0;
      acc[key].invoices.push(inv);
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="mb-1 block text-sm">Date From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-44" />
            </div>
            <div>
              <Label className="mb-1 block text-sm">Date To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-44" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Outstanding", value: `$${totalOutstanding.toFixed(2)}`, icon: DollarSign, color: "text-teal-600 bg-teal-50" },
          { label: "Sent / Awaiting",   value: `$${totalSent.toFixed(2)}`,        icon: Clock,       color: "text-blue-600 bg-blue-50" },
          { label: "Partial Paid",      value: `$${totalPartial.toFixed(2)}`,     icon: CheckCircle2,color: "text-amber-600 bg-amber-50" },
          { label: "Draft",             value: `$${totalDraft.toFixed(2)}`,       icon: FileText,    color: "text-slate-600 bg-slate-100" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-lg font-bold text-slate-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aging Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">AR Aging Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aging Bucket</TableHead>
                <TableHead className="text-center">Invoices</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agingData.map((b) => (
                <TableRow key={b.label}>
                  <TableCell className="font-medium text-sm">{b.label}</TableCell>
                  <TableCell className="text-center text-sm">{b.count}</TableCell>
                  <TableCell className={`text-right font-semibold text-sm ${b.min > 60 && b.amount > 0 ? "text-red-600" : "text-slate-900"}`}>
                    ${b.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 border-slate-200 font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-center">{allUnpaid.length}</TableCell>
                <TableCell className="text-right text-teal-700">${totalOutstanding.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Outstanding Invoices by Agency */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Outstanding Invoices by Agency</CardTitle>
          <p className="text-xs text-slate-400">Filtered by selected date range · excludes paid & void</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-slate-400 text-center py-6">Loading…</p>
          ) : byAgency.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No outstanding invoices in this range.</p>
          ) : (
            <div className="space-y-6">
              {byAgency.map(({ agency, total, invoices: agencyInvoices }) => (
                <div key={agency}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-800 text-sm">{agency}</h3>
                    <span className="font-bold text-teal-700">${total.toFixed(2)}</span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Age (days)</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agencyInvoices.map((inv) => {
                        const age = inv.date_from ? differenceInDays(today, new Date(inv.date_from + "T00:00:00")) : "—";
                        const invNum = inv.invoice_number || `INV-${inv.id.slice(-6).toUpperCase()}`;
                        return (
                          <TableRow key={inv.id}>
                            <TableCell className="font-medium text-sm">{invNum}</TableCell>
                            <TableCell className="text-sm text-slate-500">{inv.date_from} – {inv.date_to}</TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${STATUS_COLORS[inv.status] || ""}`}>{inv.status}</Badge>
                            </TableCell>
                            <TableCell className={`text-sm ${typeof age === "number" && age > 60 ? "text-red-600 font-semibold" : "text-slate-500"}`}>
                              {age}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-sm">${(inv.total_amount || 0).toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
