"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from "@/lib/api-client/invoices";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, List, FileText, Trash2, Eye } from "lucide-react";
import CreateInvoiceForm from "@/components/invoices/CreateInvoiceForm";
import InvoiceDetail from "@/components/invoices/InvoiceDetail";
import CreateInvoiceDialog from "@/components/invoices/CreateInvoiceDialog";

const statusColors = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-50 text-blue-700",
  paid: "bg-green-50 text-green-700",
  partial_paid: "bg-amber-50 text-amber-700",
  void: "bg-red-50 text-red-600",
};

const BILLING_TAB_MAP = {
  "Invoice Manager": "create",
  "Receive Checks": "receive_checks",
  "Find a Check": "find_check",
  "Edit Special Pricing": "special_pricing",
  "Edit Rate Level Pricing": "rate_level",
  "Edit Visit Add-Ons": "addons",
  "Edit Invoice": "edit_invoice",
  "Medicare Part B Billing": "medicare",
};

function InvoicesContent() {
  const searchParams = useSearchParams();
  const reportParam = searchParams.get("report");
  const defaultTab = reportParam && BILLING_TAB_MAP[reportParam] ? BILLING_TAB_MAP[reportParam] : "list";

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createParams, setCreateParams] = useState(null);

  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInvoices = useCallback(async () => {
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const handleDelete = async (id) => {
    try {
      const result = await deleteInvoice(id);
      if (result?.success) {
        toast.success("Invoice deleted");
        loadInvoices();
      }
    } catch (err) {
      toast.error("Failed to delete invoice");
    }
  };

  const handleUpdate = async ({ id, data }) => {
    try {
      const result = await updateInvoice(id, data);
      if (result?.success) {
        loadInvoices();
      }
    } catch (err) {
      toast.error("Failed to update invoice");
    }
  };

  const handleStatusChange = async (invoiceId, status, selectedLineItems) => {
    if (status === "partial_paid" && selectedLineItems && selectedLineItems.size > 0) {
      const originalInvoice = invoices.find(inv => inv.id === invoiceId);
      if (!originalInvoice) return;

      const selectedIndices = Array.from(selectedLineItems);
      const paidItems = selectedIndices.map(i => originalInvoice.line_items[i]);
      const remainingItems = originalInvoice.line_items.filter((_, i) => !selectedIndices.includes(i));

      // Get next letter suffix (a, b, c, etc.)
      const baseNumber = originalInvoice.invoice_number || `INV-${invoiceId.slice(-6).toUpperCase()}`;
      const existingWithSuffix = invoices.filter(inv => inv.invoice_number?.startsWith(baseNumber));
      const nextLetter = String.fromCharCode(97 + existingWithSuffix.length); // a, b, c...
      const newInvoiceNumber = baseNumber + nextLetter;

      const paidTotal = paidItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
      const remainingTotal = remainingItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);

      try {
        await createInvoice({
          invoice_number: newInvoiceNumber,
          agency_id: originalInvoice.agency_id,
          date_from: originalInvoice.date_from,
          date_to: originalInvoice.date_to,
          line_items: paidItems,
          total_amount: paidTotal,
          status: "paid",
          notes: originalInvoice.notes,
        });
      } catch (err) {
        toast.error("Failed to create split invoice");
        return;
      }

      // Update original invoice with remaining items
      handleUpdate({
        id: invoiceId,
        data: {
          line_items: remainingItems,
          total_amount: remainingTotal,
          status: "partial_paid",
        },
      });
    } else {
      handleUpdate({ id: invoiceId, data: { status } });
    }
  };

  if (viewingInvoice) {
    return (
      <InvoiceDetail
        invoice={viewingInvoice}
        onBack={() => setViewingInvoice(null)}
        onStatusChange={(id, status, selectedLineItems) => {
          handleStatusChange(id, status, selectedLineItems);
          setViewingInvoice((prev) => ({ ...prev, status }));
        }}
      />
    );
  }

  const placeholderTabs = ["receive_checks","find_check","special_pricing","rate_level","addons","edit_invoice","medicare"];
  const isPlaceholder = placeholderTabs.includes(activeTab);
  const activeLabel = reportParam && BILLING_TAB_MAP[reportParam] ? reportParam : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing</h1>
        <p className="text-slate-500 text-sm mt-1">{invoices.length} total invoices</p>
      </div>

      {isPlaceholder ? (
        <div className="rounded-xl border bg-white p-12 flex flex-col items-center justify-center text-center">
          <FileText className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-700 font-semibold text-lg mb-1">{activeLabel}</p>
          <p className="text-slate-400 text-sm">This feature is coming soon. It will be available here once implemented.</p>
        </div>
      ) : (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3 h-auto">
          <TabsTrigger value="create" className="gap-2 py-2.5" onClick={(e) => { e.preventDefault(); setShowCreateDialog(true); }}>
            <Plus className="w-4 h-4" />
            Create Invoice
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2 py-2.5">
            <List className="w-4 h-4" />
            Invoice List
          </TabsTrigger>
          <TabsTrigger value="paid" className="gap-2 py-2.5">
            <FileText className="w-4 h-4" />
            Paid Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Visits</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No invoices yet</TableCell></TableRow>
                ) : invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-slate-50/60">
                    <TableCell className="font-mono text-sm font-medium">{inv.invoice_number || `INV-${inv.id.slice(-6).toUpperCase()}`}</TableCell>
                    <TableCell className="font-medium">{inv.agency_name}</TableCell>
                    <TableCell className="text-sm text-slate-500">{inv.date_from} – {inv.date_to}</TableCell>
                    <TableCell className="text-sm text-slate-500">{inv.line_items?.length || 0}</TableCell>
                    <TableCell className="font-semibold">${(inv.total_amount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${statusColors[inv.status] || ""}`}>{inv.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingInvoice(inv)}>
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(inv.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          {createParams ? (
            <CreateInvoiceForm
              initialAgencyId={createParams.agencyId}
              initialDateFrom={createParams.startDate}
              initialDateTo={createParams.endDate}
              invoiceType={createParams.invoiceType}
              onSaved={() => {
                loadInvoices();
                setActiveTab("list");
                setCreateParams(null);
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <FileText className="w-10 h-10 mb-3" />
              <p className="text-sm">Click "Create Invoice" to get started</p>
              <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> Create Invoice
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="paid">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Visits</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
                ) : invoices.filter(inv => inv.status === "paid" || inv.status === "partial_paid").length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No paid invoices</TableCell></TableRow>
                ) : invoices.filter(inv => inv.status === "paid" || inv.status === "partial_paid").map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-slate-50/60">
                    <TableCell className="font-mono text-sm font-medium">{inv.invoice_number || `INV-${inv.id.slice(-6).toUpperCase()}`}</TableCell>
                    <TableCell className="font-medium">{inv.agency_name}</TableCell>
                    <TableCell className="text-sm text-slate-500">{inv.date_from} – {inv.date_to}</TableCell>
                    <TableCell className="text-sm text-slate-500">{inv.line_items?.length || 0}</TableCell>
                    <TableCell className="font-semibold">${(inv.total_amount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${statusColors[inv.status] || ""}`}>{inv.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingInvoice(inv)}>
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
      )}

      <CreateInvoiceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onContinue={(params) => {
          setCreateParams(params);
          setActiveTab("create");
        }}
      />
    </div>
  );
}

export default function Invoices() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-slate-400">Loading...</div>}>
      <InvoicesContent />
    </Suspense>
  );
}
