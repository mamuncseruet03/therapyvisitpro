"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { agencyContactFields, agencyPreferenceChoices, agencyPreferenceFlags } from "@/lib/agency-preferences";
import { saveAgencyPreferences } from "@/app/(app)/Agencies/actions";

const labels = {
  invoice_sort_order: "Invoice Sort Order",
  invoice_terms: "Invoice Terms",
  invoice_footer: "Invoice Footer",
  billing_schedule: "Billing Schedule",
  agency_software: "Agency Software",
  work_week_start: "Start of Week",
  co_signature: "Co-Signature",
  inactive: "Inactive",
  no_thera_docs: "No Thera Docs",
  document_in_agency_software: "Document in Agency Software",
  allow_alt_patient_signature: "Allow Patient Signature Collection (Alt)",
  emergency_contact_number: "Emergency Contact Number",
  nurse_on_call_number: "Nurse On Call Number",
};

export default function AgencyPreferencesDialog({ agency, onClose, onSaved }) {
  const [values, setValues] = useState(() => ({
    ...Object.fromEntries(Object.entries(agencyPreferenceChoices).map(([key, choices]) => [key, choices[0]])),
    ...agency.preferences,
    inactive: agency.status === "inactive",
    work_week_start: agencyPreferenceChoices.work_week_start[agency.work_week_start_day] || "Sunday",
  }));
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await saveAgencyPreferences(agency.id, values);
      toast.success("Agency preferences saved");
      onSaved();
    } catch {
      toast.error("Could not save agency preferences.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Other Agency Preferences</DialogTitle></DialogHeader>
        <p className="text-sm text-slate-600">{agency.name}</p>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(agencyPreferenceChoices).map(([key, choices]) => (
              <label key={key} className="grid gap-1 text-sm">
                {labels[key]}
                <select className="rounded border bg-white p-2" value={values[key]} onChange={(e) => update(key, e.target.value)}>
                  {choices.map((choice) => <option key={choice}>{choice}</option>)}
                </select>
              </label>
            ))}
            {agencyContactFields.map((key) => (
              <label key={key} className="grid gap-1 text-sm">
                {labels[key]}
                <input type="tel" maxLength={60} className="rounded border p-2" value={values[key] || ""} onChange={(e) => update(key, e.target.value)} />
              </label>
            ))}
          </div>
          {agencyPreferenceFlags.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(values[key])} onChange={(e) => update(key, e.target.checked)} />
              {labels[key]}
            </label>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
