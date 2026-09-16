"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";
import { getAgenciesForSelect } from "@/lib/api-client/patients";

const THERAPY_TYPES = ["Physical Therapy", "Occupational Therapy", "Speech Therapy"];

export default function PatientForm({ open, onClose, onSave, initial }) {
  const [agencies, setAgencies] = useState([]);

  const [form, setForm] = useState(initial || {
    first_name: "", last_name: "", date_of_birth: "",
    address: "", city: "", state: "", zip: "", phone: "", email: "",
    responsible_party_name: "", responsible_party_phone: "", responsible_party_relationship: "",
    primary_physician: "", primary_physician_phone: "",
    referring_physician: "", referring_physician_phone: "",
    diagnoses: [],
    therapy_types: [], agency: "", insurance: "",
    cert_period_start: "", cert_period_end: "", authorization_number: "", authorized_visits: "",
    notes: "", status: "active",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      getAgenciesForSelect().then(setAgencies).catch(console.error);
    }
  }, [open]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleTherapy = (t) => {
    const arr = form.therapy_types || [];
    set("therapy_types", arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]);
  };

  const addDiagnosis = () => {
    const arr = form.diagnoses || [];
    set("diagnoses", [...arr, { diagnosis: "", icd10_code: "" }]);
  };

  const removeDiagnosis = (idx) => {
    const arr = form.diagnoses || [];
    set("diagnoses", arr.filter((_, i) => i !== idx));
  };

  const updateDiagnosis = (idx, field, value) => {
    const arr = [...(form.diagnoses || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    set("diagnoses", arr);
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || !form.cert_period_start || !form.cert_period_end) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Patient" : "New Patient"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name *</Label>
              <Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Date of Birth</Label>
            <Input type="date" value={form.date_of_birth || ""} onChange={(e) => set("date_of_birth", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Sex</Label>
              <Select value={form.sex || ""} onValueChange={(v) => set("sex", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>SSN</Label>
              <Input placeholder="XXX-XX-XXXX" value={form.ssn || ""} onChange={(e) => set("ssn", e.target.value)} />
            </div>
            <div>
              <Label>Medicare Number</Label>
              <Input value={form.medicare_number || ""} onChange={(e) => set("medicare_number", e.target.value)} />
            </div>
          </div>

          <div className="border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Patient Address</h3>
            <div className="space-y-3">
              <div>
                <Label>Street Address</Label>
                <Input value={form.address || ""} onChange={(e) => set("address", e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>City</Label>
                  <Input value={form.city || ""} onChange={(e) => set("city", e.target.value)} />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={form.state || ""} onChange={(e) => set("state", e.target.value)} />
                </div>
                <div>
                  <Label>ZIP</Label>
                  <Input value={form.zip || ""} onChange={(e) => set("zip", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Contact Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Responsible Party</h3>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={form.responsible_party_name || ""} onChange={(e) => set("responsible_party_name", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Phone</Label>
                  <Input value={form.responsible_party_phone || ""} onChange={(e) => set("responsible_party_phone", e.target.value)} />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <Input value={form.responsible_party_relationship || ""} onChange={(e) => set("responsible_party_relationship", e.target.value)} placeholder="e.g., Spouse, Child, Parent" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Primary Physician</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={form.primary_physician || ""} onChange={(e) => set("primary_physician", e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.primary_physician_phone || ""} onChange={(e) => set("primary_physician_phone", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Referring Physician</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={form.referring_physician || ""} onChange={(e) => set("referring_physician", e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.referring_physician_phone || ""} onChange={(e) => set("referring_physician_phone", e.target.value)} />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Diagnoses & ICD-10 Codes</Label>
              <Button type="button" variant="outline" size="sm" onClick={addDiagnosis} className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Diagnosis
              </Button>
            </div>
            <div className="space-y-2">
              {(form.diagnoses || []).length === 0 ? (
                <div className="text-sm text-slate-400 py-2">No diagnoses added</div>
              ) : (
                (form.diagnoses || []).map((d, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Diagnosis"
                        value={d.diagnosis || ""}
                        onChange={(e) => updateDiagnosis(idx, "diagnosis", e.target.value)}
                      />
                      <Input
                        placeholder="ICD-10 Code"
                        value={d.icd10_code || ""}
                        onChange={(e) => updateDiagnosis(idx, "icd10_code", e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-slate-400 hover:text-red-600"
                      onClick={() => removeDiagnosis(idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <Label>Therapy Types</Label>
            <div className="flex flex-wrap gap-4 mt-1">
              {THERAPY_TYPES.map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <Checkbox checked={(form.therapy_types || []).includes(t)} onCheckedChange={() => toggleTherapy(t)} />
                  <span className="text-sm">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Agency</Label>
              <Select value={form.agency || ""} onValueChange={(v) => set("agency", v)}>
                <SelectTrigger><SelectValue placeholder="Select agency" /></SelectTrigger>
                <SelectContent>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Insurance</Label>
              <Input value={form.insurance || ""} onChange={(e) => set("insurance", e.target.value)} />
            </div>
          </div>
          <div className="border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Episode Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Episode Start Date *</Label>
                <Input type="date" value={form.cert_period_start || ""} onChange={(e) => set("cert_period_start", e.target.value)} className={!form.cert_period_start ? "border-red-400" : ""} />
                {!form.cert_period_start && <p className="text-xs text-red-500 mt-1">Required</p>}
              </div>
              <div>
                <Label>Episode End Date *</Label>
                <Input type="date" value={form.cert_period_end || ""} onChange={(e) => set("cert_period_end", e.target.value)} className={!form.cert_period_end ? "border-red-400" : ""} />
                {!form.cert_period_end && <p className="text-xs text-red-500 mt-1">Required</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <Label>Authorization Number</Label>
                <Input value={form.authorization_number || ""} onChange={(e) => set("authorization_number", e.target.value)} />
              </div>
              <div>
                <Label>Authorized Visits</Label>
                <Input type="number" value={form.authorized_visits || ""} onChange={(e) => set("authorized_visits", e.target.value)} />
              </div>
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="discharged">Discharged</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.first_name || !form.last_name || !form.cert_period_start || !form.cert_period_end}
            className="bg-teal-600 hover:bg-teal-700">
            {saving ? "Saving..." : "Save Patient"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
