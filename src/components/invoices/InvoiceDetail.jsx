"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Printer, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CheckDetailsDialog from "./CheckDetailsDialog";
import SendPdfDialog from "@/components/shared/SendPdfDialog";

const statusColors = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-50 text-blue-700",
  paid: "bg-green-50 text-green-700",
  partial_paid: "bg-amber-50 text-amber-700",
  void: "bg-red-50 text-red-600",
};

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

export default function InvoiceDetail({ invoice, onBack, onStatusChange }) {
  const invNum = invoice.invoice_number || `INV-${invoice.id.slice(-6).toUpperCase()}`;
  const [downloading, setDownloading] = useState(null);
  const [showCheckDialog, setShowCheckDialog] = useState(false);
  const [showPartialDialog, setShowPartialDialog] = useState(false);
  const [selectedLineItems, setSelectedLineItems] = useState(new Set());

  const handlePrint = () => window.print();

  const download = (dataUri, filename) => {
    const a = document.createElement('a');
    a.href = dataUri;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadPDF = async () => {
    setDownloading('pdf');
    const anchor = document.createElement('a');
    anchor.href = `/api/v1/documents/pdf?type=invoice&id=${encodeURIComponent(invoice.id)}`;
    anchor.download = `${invNum}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setDownloading(null);
  };

  const handleDownloadExcel = async () => {
    setDownloading('excel');
    const XLSX = await import('xlsx');
    const rows = (invoice.line_items || []).map((item) => ({
      Patient: item.patient_name,
      Date: item.visit_date,
      Therapist: item.therapist_name,
      Discipline: item.therapy_type,
      'Visit Type': item.visit_type,
      Rate: item.rate,
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Invoice');
    XLSX.writeFile(workbook, `${invNum}.xlsx`);
    setDownloading(null);
  };

  const handleDownloadVisitNotes = async () => {
    setDownloading('notes');
    const anchor = document.createElement('a');
    anchor.href = `/api/v1/documents/pdf?type=invoice-notes&id=${encodeURIComponent(invoice.id)}`;
    anchor.download = `visit-notes-${invNum}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setDownloading(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Button>
        <div className="flex items-center gap-3">
          <Select value={invoice.status} onValueChange={(v) => {
            if (v === "paid") {
              setShowCheckDialog(true);
            } else if (v === "partial_paid") {
              setShowPartialDialog(true);
            } else {
              onStatusChange(invoice.id, v);
            }
          }}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="partial_paid">Partial Paid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={!!downloading} className="gap-2">
            <FileDown className="w-4 h-4" />{downloading === 'pdf' ? 'Generating...' : 'PDF'}
          </Button>
          <SendPdfDialog documentName={`invoice ${invNum}`} defaultSubject={`Invoice ${invNum}`} documentType="invoice" documentId={invoice.id} />
          <Button variant="outline" size="sm" onClick={handleDownloadExcel} disabled={!!downloading} className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />{downloading === 'excel' ? 'Generating...' : 'Excel'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadVisitNotes} disabled={!!downloading} className="gap-2 text-teal-700 border-teal-300 hover:bg-teal-50">
            <FileText className="w-4 h-4" />{downloading === 'notes' ? 'Generating...' : 'Visit Notes PDF'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl font-bold">{invNum}</CardTitle>
              <p className="text-slate-500 text-sm mt-1">Period: {invoice.date_from} – {invoice.date_to}</p>
            </div>
            <Badge className={`text-sm px-3 py-1 ${statusColors[invoice.status] || ""}`}>{invoice.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Billed To</p>
              <p className="font-semibold text-slate-900">{invoice.agency_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Invoice Total</p>
              <p className="text-2xl font-bold text-teal-700">${(invoice.total_amount || 0).toFixed(2)}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Therapist</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Visit</TableHead>
                <TableHead className="text-right">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoice.line_items || []).map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-sm">{item.patient_name}</TableCell>
                  <TableCell className="text-sm text-slate-500">{item.visit_date}</TableCell>
                  <TableCell className="text-sm text-slate-500">{item.therapist_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{THERAPY_SHORT[item.therapy_type] || item.therapy_type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{VISIT_TYPE_LABELS[item.visit_type] || item.visit_type}</TableCell>
                  <TableCell className="text-right font-semibold">${(item.rate || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 border-slate-200">
                <TableCell colSpan={5} className="text-right font-bold text-slate-700">Total</TableCell>
                <TableCell className="text-right font-bold text-teal-700 text-lg">
                  ${(invoice.total_amount || 0).toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {invoice.notes && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-400 font-semibold mb-1">NOTES</p>
              <p className="text-sm text-slate-600">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CheckDetailsDialog
        open={showCheckDialog}
        onOpenChange={setShowCheckDialog}
        invoiceNumber={invNum}
        onSave={async (checkDetails) => {
          onStatusChange(invoice.id, "paid");
        }}
      />

      {showPartialDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4">
            <CardHeader>
              <CardTitle>Select Visits for Partial Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={selectedLineItems.size === (invoice.line_items || []).length && (invoice.line_items || []).length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLineItems(new Set((invoice.line_items || []).map((_, i) => i)));
                            } else {
                              setSelectedLineItems(new Set());
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Therapist</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(invoice.line_items || []).map((item, i) => (
                      <TableRow key={i} className={selectedLineItems.has(i) ? "bg-amber-50" : ""}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedLineItems.has(i)}
                            onChange={(e) => {
                              const next = new Set(selectedLineItems);
                              if (e.target.checked) {
                                next.add(i);
                              } else {
                                next.delete(i);
                              }
                              setSelectedLineItems(next);
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-sm">{item.patient_name}</TableCell>
                        <TableCell className="text-sm text-slate-500">{item.visit_date}</TableCell>
                        <TableCell className="text-sm text-slate-500">{item.therapist_name}</TableCell>
                        <TableCell className="text-right font-semibold">${(item.rate || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setShowPartialDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onStatusChange(invoice.id, "partial_paid", selectedLineItems);
                    setShowPartialDialog(false);
                  }}
                  disabled={selectedLineItems.size === 0}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Mark as Partially Paid
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
