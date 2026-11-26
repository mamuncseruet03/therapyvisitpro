"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Search, Trash2 } from "lucide-react";
import { getPayers, createPayer, updatePayer, deletePayer } from "@/lib/api-client/payers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const empty = { name: "", payer_code: "", phone: "", fax: "", email: "", address: "", city: "", state: "", zip: "", authorization_required: false, notes: "", status: "active" };

function PayerForm({ payer, onClose, onSaved }) {
  const [form, setForm] = useState(payer || empty);
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
  const save = async () => {
    if (!form.name.trim()) return toast.error("Payer name is required");
    setSaving(true);
    try {
      if (payer?.id) await updatePayer(payer.id, form); else await createPayer(form);
      toast.success(payer?.id ? "Payer updated" : "Payer created");
      onSaved();
      onClose();
    } catch (error) { toast.error(error.message || "Unable to save payer"); }
    finally { setSaving(false); }
  };
  return <Dialog open onOpenChange={onClose}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{payer?.id ? "Edit Payer" : "Add Payer"}</DialogTitle></DialogHeader><div className="grid gap-4 py-3 sm:grid-cols-2">
    <div className="sm:col-span-2"><Label>Payer Name *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
    <div><Label>Payer Code / ID</Label><Input value={form.payer_code} onChange={(e) => set("payer_code", e.target.value)} /></div>
    <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
    <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
    <div><Label>Fax</Label><Input value={form.fax} onChange={(e) => set("fax", e.target.value)} /></div>
    <div className="sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
    <div><Label>City</Label><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
    <div className="grid grid-cols-2 gap-2"><div><Label>State</Label><Input value={form.state} onChange={(e) => set("state", e.target.value)} /></div><div><Label>ZIP</Label><Input value={form.zip} onChange={(e) => set("zip", e.target.value)} /></div></div>
    <label className="sm:col-span-2 flex items-center gap-2 rounded-lg border p-3 text-sm"><input type="checkbox" checked={form.authorization_required} onChange={(e) => set("authorization_required", e.target.checked)} /> Prior authorization required</label>
    <fieldset className="space-y-3 rounded-lg border p-3 sm:col-span-2">
      <legend className="px-1 font-semibold">Treatment Rules</legend>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.treatment_rules?.assistantsNotAllowed ?? false}
          onChange={(event) => set("treatment_rules", { ...form.treatment_rules, assistantsNotAllowed: event.target.checked })} />
        Assistants not allowed
      </label>
      <label className="block text-sm">
        Supervisory visits needed after
        <select className="ml-2 rounded border p-1" value={form.treatment_rules?.supervisoryFrequency ?? ""}
          onChange={(event) => set("treatment_rules", { ...form.treatment_rules, supervisoryFrequency: event.target.value })}>
          <option value="">Not required</option>
          {Array.from({ length: 10 }, (_, index) => <option key={index + 1}>{index + 1}</option>)}
        </select>
      </label>
      <Label htmlFor="payer-notes">Treatment Rules / Notes</Label>
      <Textarea id="payer-notes" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
    </fieldset>
    <fieldset className="rounded-lg border p-3 sm:col-span-2">
      <legend className="px-1 font-semibold">Special Rates</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {["PT", "OT", "ST"].map((discipline) => (
          <div key={discipline} className="space-y-2">
            <strong>{discipline}</strong>
            {["evaluation", "treatment", "re_evaluation", "recertification", "discharge"].map((visit) => {
              const key = `${discipline}:${visit}`;
              return <label key={key} className="block text-sm capitalize">{visit.replaceAll("_", " ")}
                <Input type="number" min="0" step="0.01" value={form.treatment_rules?.specialRates?.[key] ?? ""}
                  onChange={(event) => set("treatment_rules", {
                    ...form.treatment_rules,
                    specialRates: { ...form.treatment_rules?.specialRates, [key]: event.target.value },
                  })} />
              </label>;
            })}
          </div>
        ))}
      </div>
    </fieldset>
  </div><div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Payer"}</Button></div></DialogContent></Dialog>;
}

export default function PayersPage() {
  const [payers, setPayers] = useState([]); const [search, setSearch] = useState(""); const [editing, setEditing] = useState(null); const [formOpen, setFormOpen] = useState(false);
  const load = useCallback(() => getPayers().then(setPayers).catch((error) => toast.error(error.message || "Unable to load payers")), []);
  useEffect(() => { load(); }, [load]);
  const filtered = payers.filter((payer) => `${payer.name} ${payer.payer_code} ${payer.email}`.toLowerCase().includes(search.toLowerCase()));
  const remove = async (payer) => { if (!window.confirm(`Delete ${payer.name}?`)) return; try { await deletePayer(payer.id); toast.success("Payer deleted"); load(); } catch (error) { toast.error(error.message || "Unable to delete payer"); } };
  return <div className="space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900">Payers Management</h1><p className="mt-1 text-sm text-slate-500">Manage insurance and payer records</p></div><Button onClick={() => setFormOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Payer</Button></div>
    <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" placeholder="Search payers..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
    <Card><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Payer Code</TableHead><TableHead>Contact</TableHead><TableHead>Authorization</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.map((payer) => <TableRow key={payer.id}><TableCell className="font-medium">{payer.name}</TableCell><TableCell>{payer.payer_code || "—"}</TableCell><TableCell><div>{payer.phone || "—"}</div><div className="text-xs text-slate-500">{payer.email}</div></TableCell><TableCell>{payer.authorization_required ? "Required" : "Not required"}</TableCell><TableCell><Badge variant="outline">{payer.status}</Badge></TableCell><TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => setEditing(payer)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-red-500" onClick={() => remove(payer)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>)}{filtered.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-slate-400">No payers found</TableCell></TableRow>}</TableBody></Table></Card>
    {(formOpen || editing) && <PayerForm payer={editing} onClose={() => { setFormOpen(false); setEditing(null); }} onSaved={load} />}
  </div>;
}
