"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit, X } from "lucide-react";
import { getAgenciesForSelect } from "@/lib/api-client/patients";
import { getReferrals } from "@/lib/api-client/referrals";

const therapyTypeNames = {
  pt: "Physical Therapy",
  physical: "Physical Therapy",
  physical_therapy: "Physical Therapy",
  "physical therapy": "Physical Therapy",
  ot: "Occupational Therapy",
  occupational: "Occupational Therapy",
  occupational_therapy: "Occupational Therapy",
  "occupational therapy": "Occupational Therapy",
  st: "Speech Therapy",
  slp: "Speech Therapy",
  speech: "Speech Therapy",
  speech_therapy: "Speech Therapy",
  "speech therapy": "Speech Therapy",
};

function normalizeTherapyTypes(types) {
  if (!Array.isArray(types)) return [];
  return [...new Set(types.map((type) => therapyTypeNames[String(type).trim().toLowerCase()] || type))];
}

export default function EditReferralForm({ onUpdate, preselectedReferralId }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const [agencies, setAgencies] = useState([]);
  const [referrals, setReferrals] = useState([]);

  useEffect(() => {
    Promise.all([getAgenciesForSelect(), getReferrals()])
      .then(([a, r]) => { setAgencies(a); setReferrals(r); })
      .catch(console.error);
  }, []);

  const selectReferral = useCallback((referral) => {
    setSelectedReferral(referral);
    setForm({
      ...referral,
      date_of_birth: referral.date_of_birth ? String(referral.date_of_birth).slice(0, 10) : "",
      referral_date: referral.referral_date ? String(referral.referral_date).slice(0, 10) : "",
      diagnosis: referral.primary_diagnosis || "",
      therapy_types: normalizeTherapyTypes(referral.therapy_types),
      cert_period_start: referral.cert_period_start ? String(referral.cert_period_start).slice(0, 10) : "",
      cert_period_end: referral.cert_period_end ? String(referral.cert_period_end).slice(0, 10) : "",
    });
    setSearchQuery("");
  }, []);

  useEffect(() => {
    if (preselectedReferralId && referrals.length > 0 && !selectedReferral) {
      const referral = referrals.find(item => item.id === preselectedReferralId);
      // Synchronize the asynchronously loaded referral with the selected ID.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (referral) selectReferral(referral);
    }
  }, [preselectedReferralId, referrals, selectedReferral, selectReferral]);

  const filteredReferrals = searchQuery
    ? referrals.filter((r) =>
        `${r.first_name} ${r.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleTherapyType = (type) => {
    setForm((p) => ({
      ...p,
      therapy_types: p.therapy_types.includes(type)
        ? p.therapy_types.filter((t) => t !== type)
        : [...p.therapy_types, type],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await onUpdate(selectedReferral.id, form);
    setSaving(false);
    if (result?.success) {
      setSelectedReferral(null);
      setForm(null);
    }
  };

  const handleCancel = () => {
    setSelectedReferral(null);
    setForm(null);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {!selectedReferral ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-teal-600" />
              Search Referral to Edit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Search Referral</Label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type patient name..."
                className="mt-2"
              />
            </div>
            {searchQuery && filteredReferrals.length > 0 && (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredReferrals.map((referral) => (
                  <button
                    key={referral.id}
                    onClick={() => selectReferral(referral)}
                    className="w-full text-left px-4 py-3 rounded-lg border hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900">
                          {referral.first_name} {referral.last_name}
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                          {referral.date_of_birth && `DOB: ${referral.date_of_birth}`}
                          {referral.agency && ` • ${referral.agency}`}
                          {referral.authorization_number && ` • Auth: ${referral.authorization_number}`}
                        </div>
                      </div>
                      <Edit className="w-4 h-4 text-teal-600" />
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchQuery && filteredReferrals.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-8">No referrals found</div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-teal-600" />
                Edit Referral - {form.first_name} {form.last_name}
              </div>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Primary Diagnosis</Label>
                <Input value={form.diagnosis} onChange={(e) => set("diagnosis", e.target.value)} />
              </div>
              <div>
                <Label>Insurance</Label>
                <Input value={form.insurance} onChange={(e) => set("insurance", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Therapy Types *</Label>
              <div className="flex gap-6 mt-2">
                {["Physical Therapy", "Occupational Therapy", "Speech Therapy"].map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <Checkbox
                      id={type}
                      checked={form.therapy_types.includes(type)}
                      onCheckedChange={() => toggleTherapyType(type)}
                    />
                    <label htmlFor={type} className="text-sm cursor-pointer">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4 bg-slate-50">
              <Label className="text-base font-semibold">Therapy Orders</Label>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-teal-700">Physical Therapy</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-600">Eval Visits</Label>
                    <Input
                      type="number"
                      value={form.pt_eval_visits}
                      onChange={(e) => set("pt_eval_visits", e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Treatment Visits</Label>
                    <Input
                      type="number"
                      value={form.pt_treatment_visits}
                      onChange={(e) => set("pt_treatment_visits", e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-purple-700">Occupational Therapy</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-600">Eval Visits</Label>
                    <Input
                      type="number"
                      value={form.ot_eval_visits}
                      onChange={(e) => set("ot_eval_visits", e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Treatment Visits</Label>
                    <Input
                      type="number"
                      value={form.ot_treatment_visits}
                      onChange={(e) => set("ot_treatment_visits", e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-amber-700">Speech Therapy</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-600">Eval Visits</Label>
                    <Input
                      type="number"
                      value={form.st_eval_visits}
                      onChange={(e) => set("st_eval_visits", e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Treatment Visits</Label>
                    <Input
                      type="number"
                      value={form.st_treatment_visits}
                      onChange={(e) => set("st_treatment_visits", e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label>Agency</Label>
              <Select value={form.agency} onValueChange={(v) => set("agency", v)}>
                <SelectTrigger><SelectValue placeholder="Select agency" /></SelectTrigger>
                <SelectContent>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Certification Period Start</Label>
                <Input type="date" value={form.cert_period_start} onChange={(e) => set("cert_period_start", e.target.value)} />
              </div>
              <div>
                <Label>Certification Period End</Label>
                <Input type="date" value={form.cert_period_end} onChange={(e) => set("cert_period_end", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Authorization Number</Label>
                <Input value={form.authorization_number} onChange={(e) => set("authorization_number", e.target.value)} placeholder="Auth #" />
              </div>
              <div>
                <Label>Authorized Visits</Label>
                <Input type="number" value={form.authorized_visits} onChange={(e) => set("authorized_visits", e.target.value)} placeholder="Number of visits" />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={4} placeholder="Additional referral information..." />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.first_name || !form.last_name || form.therapy_types.length === 0}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {saving ? "Saving..." : "Update Referral"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
