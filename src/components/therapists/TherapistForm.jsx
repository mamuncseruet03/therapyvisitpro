"use client";

import React, { useState } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, CheckCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import { inviteUser } from "@/lib/api-client/users";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import TherapistFilesSection from "./TherapistFilesSection";
import DisciplinaryActionsSection from "./DisciplinaryActionsSection";
import HRPasswordGate from "./HRPasswordGate";

const RATE_COLS = [
  { key: "eval", label: "Eval Visit" },
  { key: "return_visit", label: "Return Visit" },
  { key: "supervisory", label: "Supervisory" },
  { key: "recert", label: "Recert" },
  { key: "discharge", label: "DC Visit" },
];

const RATE_ROWS = [
  { key: "peds", label: "Peds" },
  { key: "geriatrics", label: "Geriatrics" },
];

export default function TherapistForm({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || {
    full_name: "", discipline: "", credentials: "", license_number: "",
    email: "", phone: "", status: "active", rates: {}, personal_files: {},
    hire_date: "", annual_review_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [createUser, setCreateUser] = useState(false);
  const [inviteStatus, setInviteStatus] = useState(null); // null | 'success' | 'error'

  const currentUser = useCurrentUser();
  const isHRorAdmin = ["hr", "admin", "superuser"].includes(currentUser?.user_type) || ["admin", "superuser"].includes(currentUser?.role);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const credentialOptions = {
    "Physical Therapy": ["PT", "PTA"],
    "Occupational Therapy": ["OT", "COTA"],
    "Speech Therapy": ["SLP"],
  };

  const setRate = (rowKey, colKey, value) => {
    setForm((p) => ({
      ...p,
      rates: {
        ...p.rates,
        [rowKey]: {
          ...(p.rates?.[rowKey] || {}),
          [colKey]: value === "" ? "" : parseFloat(value) || "",
        },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      if (!initial && createUser && form.email) {
        const result = await inviteUser({ email: form.email, userType: "therapist" });
        if (result?.error) {
          setInviteStatus("error");
          toast.error(result.error);
        } else {
          setInviteStatus("success");
          toast.success(`User account created for ${form.email}`);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Therapist" : "New Therapist"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Full Name *</Label>
            <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </div>
          <div>
            <Label>Discipline *</Label>
            <Select value={form.discipline} onValueChange={(v) => { set("discipline", v); set("credentials", ""); }}>
              <SelectTrigger><SelectValue placeholder="Select discipline" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
                <SelectItem value="Occupational Therapy">Occupational Therapy</SelectItem>
                <SelectItem value="Speech Therapy">Speech Therapy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Credentials</Label>
              <Select value={form.credentials || ""} onValueChange={(v) => set("credentials", v)} disabled={!form.discipline}>
                <SelectTrigger><SelectValue placeholder="Select credentials" /></SelectTrigger>
                <SelectContent>
                  {(credentialOptions[form.discipline] || []).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>License #</Label>
              <Input value={form.license_number || ""} onChange={(e) => set("license_number", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          {/* HR Section */}
          <div className="border rounded-lg p-4 bg-indigo-50/40 space-y-3">
            <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">HR Information</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hire Date</Label>
                <Input type="date" value={form.hire_date || ""} onChange={(e) => set("hire_date", e.target.value)} />
              </div>
              <div>
                <Label>Annual Review Date</Label>
                <Input type="date" value={form.annual_review_date || ""} onChange={(e) => set("annual_review_date", e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invite to app - only for new therapists */}
          {!initial && (
            <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="create-user"
                  checked={createUser}
                  onCheckedChange={setCreateUser}
                />
                <label htmlFor="create-user" className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-teal-600" />
                  Create user account & invite to app
                </label>
              </div>
              {createUser && (
                <p className="text-xs text-slate-500 ml-7">
                  An invitation email will be sent to <strong>{form.email || "(enter email above)"}</strong> after saving.
                </p>
              )}
              {inviteStatus === "success" && (
                <div className="flex items-center gap-2 text-green-700 text-sm ml-7">
                  <CheckCircle className="w-4 h-4" /> Invite sent successfully!
                </div>
              )}
              {inviteStatus === "error" && (
                <p className="text-xs text-red-600 ml-7">Failed to send invite. Make sure the email is valid and not already registered.</p>
              )}
            </div>
          )}

          {/* Personal Files - HR/Admin only, password-gated */}
          {isHRorAdmin ? (
            <HRPasswordGate label="Personal Files">
              <Label className="text-sm font-semibold text-slate-700 mb-2 block">Personal Files</Label>
              <TherapistFilesSection
                files={form.personal_files || {}}
                onChange={(files) => set("personal_files", files)}
              />
            </HRPasswordGate>
          ) : (
            <div className="border rounded-lg p-3 bg-slate-50 flex items-center gap-2 text-slate-400 text-sm">
              <Lock className="w-4 h-4" />
              Personal Files are restricted to HR and Admin users
            </div>
          )}

          {/* Disciplinary Actions - HR/Admin only, password-gated */}
          {isHRorAdmin ? (
            <HRPasswordGate label="Disciplinary Records">
              <div className="border rounded-xl p-4 bg-orange-50/30 border-orange-200">
                <DisciplinaryActionsSection
                  actions={form.disciplinary_actions || []}
                  onChange={(actions) => set("disciplinary_actions", actions)}
                  currentUserName={currentUser?.full_name}
                />
              </div>
            </HRPasswordGate>
          ) : (
            <div className="border rounded-lg p-3 bg-slate-50 flex items-center gap-2 text-slate-400 text-sm">
              <Lock className="w-4 h-4" />
              Disciplinary Records are restricted to HR and Admin users
            </div>
          )}

          {/* Rates Table */}
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">Rates ($)</Label>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-slate-600 w-28">Type</th>
                    {RATE_COLS.map((col) => (
                      <th key={col.key} className="text-center px-2 py-2 font-medium text-slate-600 whitespace-nowrap">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RATE_ROWS.map((row) => (
                    <tr key={row.key} className="border-t">
                      <td className="px-3 py-2 font-medium text-slate-700">{row.label}</td>
                      {RATE_COLS.map((col) => (
                        <td key={col.key} className="px-2 py-1.5">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-5 h-8 text-sm w-24"
                              value={form.rates?.[row.key]?.[col.key] ?? ""}
                              onChange={(e) => setRate(row.key, col.key, e.target.value)}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.full_name || !form.discipline}
            className="bg-teal-600 hover:bg-teal-700">
            {saving ? "Saving…" : "Save Therapist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
