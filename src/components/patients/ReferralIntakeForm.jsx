"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Calendar, Search, X } from "lucide-react";
import { getAgenciesForSelect, getPatients } from "@/lib/api-client/patients";
import { getTherapists } from "@/lib/api-client/therapists";

export default function ReferralIntakeForm({ onSave }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    sex: "",
    ssn: "",
    medicare_number: "",
    phone: "",
    referral_source: "",
    referral_date: new Date().toISOString().split("T")[0],
    primary_diagnosis: "",
    therapy_types: [],
    insurance: "",
    agency: "",
    rate_type: "standard",
    special_rates: {},
    physician_name: "",
    physician_phone: "",
    cert_period_start: "",
    cert_period_end: "",
    authorization_number: "",
    authorized_visits: "",
    pt_eval_visits: "",
    pt_treatment_visits: "",
    ot_eval_visits: "",
    ot_treatment_visits: "",
    st_eval_visits: "",
    st_treatment_visits: "",
    evaluating_therapist_pt: "",
    evaluating_therapist_ot: "",
    evaluating_therapist_st: "",
    treating_therapist_pt: "",
    treating_therapist_ot: "",
    treating_therapist_st: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [agencies, setAgencies] = useState([]);

  useEffect(() => {
    Promise.all([getPatients(), getTherapists(), getAgenciesForSelect()])
      .then(([p, t, a]) => { setPatients(p); setTherapists(t); setAgencies(a); })
      .catch(console.error);
  }, []);

  const ptTherapists = therapists.filter(t => t.discipline === "Physical Therapy");
  const otTherapists = therapists.filter(t => t.discipline === "Occupational Therapy");
  const stTherapists = therapists.filter(t => t.discipline === "Speech Therapy");

  const filteredPatients = searchQuery
    ? patients.filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
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
    await onSave(form);
    setSaving(false);
  };

  const selectPatient = (patient) => {
    setForm({
      first_name: patient.first_name || "",
      last_name: patient.last_name || "",
      date_of_birth: patient.date_of_birth || "",
      phone: patient.phone || "",
      referral_source: form.referral_source,
      referral_date: form.referral_date,
      primary_diagnosis: patient.diagnoses?.[0]?.diagnosis || "",
      therapy_types: patient.therapy_types || [],
      insurance: patient.insurance || "",
      agency: patient.agency || "",
      rate_type: form.rate_type,
      special_rates: form.special_rates,
      physician_name: form.physician_name,
      physician_phone: form.physician_phone,
      cert_period_start: patient.cert_period_start || "",
      cert_period_end: patient.cert_period_end || "",
      authorization_number: patient.authorization_number || "",
      authorized_visits: patient.authorized_visits || "",
      notes: patient.notes || "",
    });
    setSearchQuery("");
    setShowSearch(false);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Referral & Intake Information
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-4 h-4 mr-2" />
              Search Patient
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSearch && (
            <div className="relative border-2 border-teal-100 rounded-lg p-4 bg-teal-50/50">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
              <Label className="text-teal-700">Search Existing Patient</Label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type patient name..."
                className="mt-2 mb-3"
              />
              {searchQuery && filteredPatients.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1 bg-white rounded-lg border p-2">
                  {filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => selectPatient(patient)}
                      className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 transition-colors text-sm"
                    >
                      <div className="font-medium">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {patient.date_of_birth && `DOB: ${patient.date_of_birth}`}
                        {patient.agency && ` • ${patient.agency}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery && filteredPatients.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-2">No patients found</div>
              )}
            </div>
          )}

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
              <Label>Referral Date</Label>
              <Input type="date" value={form.referral_date} onChange={(e) => set("referral_date", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Referral Source</Label>
              <Input placeholder="Hospital, physician, self-referral..." value={form.referral_source} onChange={(e) => set("referral_source", e.target.value)} />
            </div>
            <div>
              <Label>Primary Diagnosis</Label>
              <Input value={form.primary_diagnosis} onChange={(e) => set("primary_diagnosis", e.target.value)} />
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

            {/* Physical Therapy */}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-600">Evaluating Therapist</Label>
                  <Select value={form.evaluating_therapist_pt} onValueChange={(v) => set("evaluating_therapist_pt", v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select PT" />
                    </SelectTrigger>
                    <SelectContent>
                      {ptTherapists.map((t) => (
                        <SelectItem key={t.id} value={t.full_name}>
                          {t.full_name} {t.credentials && `(${t.credentials})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Treating Therapist</Label>
                  <Select value={form.treating_therapist_pt} onValueChange={(v) => set("treating_therapist_pt", v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select PT" />
                    </SelectTrigger>
                    <SelectContent>
                      {ptTherapists.map((t) => (
                        <SelectItem key={t.id} value={t.full_name}>
                          {t.full_name} {t.credentials && `(${t.credentials})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Occupational Therapy */}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-600">Evaluating Therapist</Label>
                  <Select value={form.evaluating_therapist_ot} onValueChange={(v) => set("evaluating_therapist_ot", v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select OT" />
                    </SelectTrigger>
                    <SelectContent>
                      {otTherapists.map((t) => (
                        <SelectItem key={t.id} value={t.full_name}>
                          {t.full_name} {t.credentials && `(${t.credentials})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Treating Therapist</Label>
                  <Select value={form.treating_therapist_ot} onValueChange={(v) => set("treating_therapist_ot", v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select OT" />
                    </SelectTrigger>
                    <SelectContent>
                      {otTherapists.map((t) => (
                        <SelectItem key={t.id} value={t.full_name}>
                          {t.full_name} {t.credentials && `(${t.credentials})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Speech Therapy */}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-600">Evaluating Therapist</Label>
                  <Select value={form.evaluating_therapist_st} onValueChange={(v) => set("evaluating_therapist_st", v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select ST" />
                    </SelectTrigger>
                    <SelectContent>
                      {stTherapists.map((t) => (
                        <SelectItem key={t.id} value={t.full_name}>
                          {t.full_name} {t.credentials && `(${t.credentials})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Treating Therapist</Label>
                  <Select value={form.treating_therapist_st} onValueChange={(v) => set("treating_therapist_st", v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select ST" />
                    </SelectTrigger>
                    <SelectContent>
                      {stTherapists.map((t) => (
                        <SelectItem key={t.id} value={t.full_name}>
                          {t.full_name} {t.credentials && `(${t.credentials})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label>Insurance</Label>
              <Input value={form.insurance} onChange={(e) => set("insurance", e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg border bg-slate-50 p-4 space-y-4">
            <div>
              <Label className="text-base font-semibold">Visit Rate</Label>
              <p className="text-xs text-slate-500 mt-1">Use agency standard pricing or set patient-specific rates.</p>
            </div>
            <Select value={form.rate_type} onValueChange={(value) => set("rate_type", value)}>
              <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Rate</SelectItem>
                <SelectItem value="special">Special Rate</SelectItem>
              </SelectContent>
            </Select>
            {form.rate_type === "special" && (
              <div className="space-y-4">
                {form.therapy_types.map((therapyType) => (
                  <div key={therapyType} className="rounded-lg border bg-white p-4">
                    <p className="mb-3 text-sm font-semibold text-slate-700">{therapyType}</p>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {["Evaluation", "Treatment", "Re-Evaluation", "Discharge"].map((visitType) => {
                        const key = `${therapyType}:${visitType}`;
                        return (
                          <div key={key}>
                            <Label className="text-xs text-slate-600">{visitType}</Label>
                            <Input type="number" min="0" step="0.01" placeholder="$0.00"
                              value={form.special_rates[key] || ""}
                              onChange={(event) => set("special_rates", { ...form.special_rates, [key]: event.target.value })} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Referring Physician</Label>
              <Input value={form.physician_name} onChange={(e) => set("physician_name", e.target.value)} />
            </div>
            <div>
              <Label>Physician Phone</Label>
              <Input value={form.physician_phone} onChange={(e) => set("physician_phone", e.target.value)} />
            </div>
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
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={4} placeholder="Additional referral information, special considerations..." />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || !form.first_name || !form.last_name || form.therapy_types.length === 0}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Referral"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
