"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, FileUp, MapPin } from "lucide-react";
import DoorPhotoCapture from "./DoorPhotoCapture";

export default function IntakeTab({ form, set, patients = [], therapists = [], isAdmin, isAssistant, agencyDocsOnly, patientAgencyName }) {
  const [punchingIn, setPunchingIn] = useState(false);
  const [unableToPunchIn, setUnableToPunchIn] = useState(false);
  const [manualTimeIn, setManualTimeIn] = useState("");
  const [diagnosisInput, setDiagnosisInput] = useState("");
  const [icd10Input, setIcd10Input] = useState("");
  const [treatmentDiagnosisInput, setTreatmentDiagnosisInput] = useState("");
  const [treatmentIcd10Input, setTreatmentIcd10Input] = useState("");

  const addDiagnosis = () => {
    if (!diagnosisInput.trim()) return;
    set("medical_diagnoses", [...(form.medical_diagnoses || []), { diagnosis: diagnosisInput.trim(), icd10_code: icd10Input.trim() }]);
    setDiagnosisInput(""); setIcd10Input("");
  };
  const addTreatmentDiagnosis = () => {
    if (!treatmentDiagnosisInput.trim()) return;
    set("treatment_diagnoses", [...(form.treatment_diagnoses || []), { diagnosis: treatmentDiagnosisInput.trim(), icd10_code: treatmentIcd10Input.trim() }]);
    setTreatmentDiagnosisInput(""); setTreatmentIcd10Input("");
  };

  return (
    <div className="space-y-6">
      {agencyDocsOnly && (
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <FileUp className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
          <div>
            <p className="font-semibold">Agency Docs Mode — {patientAgencyName}</p>
            <p className="text-xs text-blue-600 mt-0.5">This agency uses their own documentation. Only Intake and Signature tabs are shown.</p>
          </div>
        </div>
      )}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Visit Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Patient <span className="text-red-500">★</span></Label>
              <Select value={form.patient_id} onValueChange={(v) => { set("patient_id", v); const p = patients.find((x) => x.id === v); if (p?.agency) set("agency", p.agency); }}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Therapist <span className="text-red-500">★</span></Label>
              <Select value={form.therapist_id} onValueChange={(v) => { set("therapist_id", v); const t = therapists.find((x) => x.id === v); if (t?.discipline) set("therapy_type", t.discipline); }}>
                <SelectTrigger><SelectValue placeholder="Select therapist" /></SelectTrigger>
                <SelectContent>{therapists.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name} ({t.credentials || t.discipline})</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label>Visit Date <span className="text-red-500">★</span></Label>
              <Input type="date" value={form.visit_date} onChange={(e) => set("visit_date", e.target.value)} />
            </div>
            <div>
              <Label>Therapy Type <span className="text-red-500">★</span></Label>
              <Select value={form.therapy_type} onValueChange={(v) => set("therapy_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
                  <SelectItem value="Occupational Therapy">Occupational Therapy</SelectItem>
                  <SelectItem value="Speech Therapy">Speech Therapy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Visit Type</Label>
              {isAssistant ? (
                <div className="space-y-1">
                  <div className="flex h-9 w-full items-center rounded-md border border-input bg-slate-50 px-3 py-1 text-sm text-slate-600">Treatment</div>
                  <p className="text-[11px] text-amber-600">PTA/COTA can only document treatment visits.</p>
                </div>
              ) : isAdmin ? (
                <Select value={form.visit_type} onValueChange={(v) => set("visit_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="evaluation">Evaluation</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="re_evaluation">Re-evaluation</SelectItem>
                    <SelectItem value="recertification">Recertification</SelectItem>
                    <SelectItem value="discharge_with_visit">Discharge with Visit</SelectItem>
                    <SelectItem value="discharge_without_visit">Discharge without Visit</SelectItem>
                    <SelectItem value="eval_refused">Eval Refused</SelectItem>
                    <SelectItem value="missed_visit">Missed Visit</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-9 w-full items-center rounded-md border border-input bg-slate-50 px-3 py-1 text-sm text-slate-600 capitalize">
                  {(form.visit_type || "treatment").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </div>
              )}
            </div>
          </div>

          {!agencyDocsOnly && !isAssistant && (
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <p className="text-xs font-semibold text-slate-600 mb-2">Additional Documentation</p>
              <div className="flex flex-wrap gap-3">
                {form.visit_type === "evaluation" && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!form.include_soc_oasis} onChange={(e) => set("include_soc_oasis", e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" />
                    <span className="text-sm text-slate-700">SOC OASIS</span>
                  </label>
                )}
                {form.visit_type === "recertification" && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!form.include_roc_oasis} onChange={(e) => set("include_roc_oasis", e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" />
                    <span className="text-sm text-slate-700">ROC OASIS</span>
                  </label>
                )}
                {(form.visit_type === "discharge_with_visit" || form.visit_type === "discharge_without_visit") && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!form.require_discharge_oasis} onChange={(e) => set("require_discharge_oasis", e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" />
                    <span className="text-sm text-slate-700">Discharge OASIS</span>
                  </label>
                )}
                {form.visit_type !== "eval_refused" && form.visit_type !== "missed_visit" && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!form.include_nomnc} onChange={(e) => set("include_nomnc", e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" />
                    <span className="text-sm text-slate-700">NOMNC</span>
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-3">
              <Label>Time In <span className="text-red-500">★</span></Label>
              {form.time_in ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-md">
                  <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-teal-800">{form.time_in}</p>
                    {form.punch_in_location && (<p className="text-xs text-teal-600 truncate">{form.punch_in_location.lat.toFixed(5)}, {form.punch_in_location.lng.toFixed(5)}</p>)}
                    {form.punch_in_reason && (<p className="text-xs text-amber-600 mt-0.5">⚠ Unable to punch in: {form.punch_in_reason}</p>)}
                  </div>
                  <button type="button" onClick={() => { set("time_in", ""); set("punch_in_location", null); set("punch_in_reason", ""); setUnableToPunchIn(false); setManualTimeIn(""); }} className="text-teal-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" disabled={punchingIn} className="flex-1 gap-2 border-teal-300 text-teal-700 hover:bg-teal-50"
                      onClick={async () => {
                        setPunchingIn(true); setUnableToPunchIn(false);
                        const now = new Date(); const timeIn = now.toTimeString().slice(0, 5);
                        set("time_in", timeIn);
                        if (form.status === "scheduled") set("status", "draft");
                        if (timeIn && form.time_out) {
                          const [inH, inM] = timeIn.split(":").map(Number);
                          const [outH, outM] = form.time_out.split(":").map(Number);
                          const dur = (outH * 60 + outM) - (inH * 60 + inM);
                          if (dur > 0) set("duration_minutes", dur);
                        }
                        if (typeof navigator !== "undefined" && navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => { set("punch_in_location", { lat: pos.coords.latitude, lng: pos.coords.longitude }); setPunchingIn(false); },
                            () => { setPunchingIn(false); }
                          );
                        } else { setPunchingIn(false); }
                      }}>
                      <MapPin className="w-4 h-4" />{punchingIn ? "Getting location…" : "Punch In"}
                    </Button>
                    <Button type="button" variant="outline"
                      className={`flex-1 gap-2 ${unableToPunchIn ? "bg-amber-50 border-amber-400 text-amber-800" : "border-amber-300 text-amber-700 hover:bg-amber-50"}`}
                      onClick={() => setUnableToPunchIn(!unableToPunchIn)}>
                      Unable to Punch In
                    </Button>
                  </div>
                  {unableToPunchIn && (
                    <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-3">
                      <p className="text-xs font-semibold text-amber-800">Reason <span className="text-red-500">★</span></p>
                      <Textarea placeholder="Describe why you were unable to punch in..." value={form.punch_in_reason || ""} onChange={(e) => set("punch_in_reason", e.target.value)} rows={2} className="text-sm bg-white" />
                      <div className="flex items-center gap-2">
                        <Input type="time" value={manualTimeIn} onChange={(e) => setManualTimeIn(e.target.value)} className="max-w-[140px] bg-white" />
                        <Button type="button" size="sm" disabled={!manualTimeIn || !(form.punch_in_reason || "").trim()} className="bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={() => {
                            set("time_in", manualTimeIn);
                            if (form.status === "scheduled") set("status", "draft");
                            if (manualTimeIn && form.time_out) {
                              const [inH, inM] = manualTimeIn.split(":").map(Number);
                              const [outH, outM] = form.time_out.split(":").map(Number);
                              const dur = (outH * 60 + outM) - (inH * 60 + inM);
                              if (dur > 0) set("duration_minutes", dur);
                            }
                            setUnableToPunchIn(false);
                          }}>
                          Confirm Time
                        </Button>
                        {!!(manualTimeIn && !(form.punch_in_reason || "").trim()) && <span className="text-xs text-red-500">Enter a reason first</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {form.time_in && (
            <DoorPhotoCapture photoUrl={form.door_photo_url}
              onPhotoSaved={(url) => { set("door_photo_url", url); }}
              onRemove={() => set("door_photo_url", null)} />
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label>Time Out</Label>
              {form.time_out ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{form.time_out}</p>
                    {form.punch_out_location && (<p className="text-xs text-slate-500 truncate">{form.punch_out_location.lat.toFixed(5)}, {form.punch_out_location.lng.toFixed(5)}</p>)}
                  </div>
                  <button type="button" onClick={() => { set("time_out", ""); set("punch_out_location", null); set("duration_minutes", ""); }} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="flex h-9 w-full items-center rounded-md border border-dashed border-slate-200 px-3 text-xs text-slate-400">Punch out after signature</div>
              )}
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input type="number" value={form.duration_minutes || ""} readOnly className="bg-slate-50 text-slate-600" placeholder="Auto-calculated" />
            </div>
          </div>
          <div>
            <Label>Agency</Label>
            <div className="flex h-9 w-full items-center rounded-md border border-input bg-slate-50 px-3 py-1 text-sm text-slate-700">
              {form.agency || <span className="text-slate-400">Auto-populated from patient record</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg">
              <button type="button" onClick={() => set("non_billable", !form.non_billable)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${form.non_billable ? "bg-red-500" : "bg-slate-300"}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.non_billable ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <div>
                <p className="text-sm font-medium text-slate-800">Non-Billable</p>
                <p className="text-xs text-slate-500">Mark this visit as not billable</p>
              </div>
              {form.non_billable && <Badge className="ml-auto bg-red-100 text-red-700 border-red-200 text-xs">Non-Billable</Badge>}
            </div>
            <div>
              <Label>Special Pricing Override</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500 text-sm">$</span>
                <Input type="number" min="0" step="0.01" placeholder="Leave blank for standard rate"
                  value={form.special_price ?? ""} onChange={(e) => set("special_price", e.target.value === "" ? null : parseFloat(e.target.value))} className="flex-1" />
              </div>
              {form.special_price != null && (<p className="text-xs text-amber-600 mt-1">⚠ Custom rate: ${parseFloat(form.special_price).toFixed(2)} — overrides standard billing</p>)}
            </div>
          </div>

          <div>
            <Label>Medical Diagnosis</Label>
            <div className="space-y-2">
              <div className="grid grid-cols-[2fr_1fr_auto] gap-2">
                <Input placeholder="Enter diagnosis..." value={diagnosisInput} onChange={(e) => setDiagnosisInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDiagnosis())} />
                <Input placeholder="ICD-10 code" value={icd10Input} onChange={(e) => setIcd10Input(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDiagnosis())} />
                <Button type="button" size="icon" variant="outline" onClick={addDiagnosis}><Plus className="w-4 h-4" /></Button>
              </div>
              {form.medical_diagnoses?.length > 0 && (
                <div className="space-y-1 mt-2">
                  {form.medical_diagnoses.map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md border bg-slate-50">
                      <span className="text-sm text-slate-700">{d.diagnosis} {d.icd10_code && <span className="text-slate-500">({d.icd10_code})</span>}</span>
                      <button type="button" onClick={() => set("medical_diagnoses", form.medical_diagnoses.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>Treatment Diagnosis</Label>
            <div className="space-y-2">
              <div className="grid grid-cols-[2fr_1fr_auto] gap-2">
                <Input placeholder="Enter treatment diagnosis..." value={treatmentDiagnosisInput} onChange={(e) => setTreatmentDiagnosisInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTreatmentDiagnosis())} />
                <Input placeholder="ICD-10 code" value={treatmentIcd10Input} onChange={(e) => setTreatmentIcd10Input(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTreatmentDiagnosis())} />
                <Button type="button" size="icon" variant="outline" onClick={addTreatmentDiagnosis}><Plus className="w-4 h-4" /></Button>
              </div>
              {form.treatment_diagnoses?.length > 0 && (
                <div className="space-y-1 mt-2">
                  {form.treatment_diagnoses.map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-md border bg-teal-50">
                      <span className="text-sm text-slate-700">{d.diagnosis} {d.icd10_code && <span className="text-slate-500">({d.icd10_code})</span>}</span>
                      <button type="button" onClick={() => set("treatment_diagnoses", form.treatment_diagnoses.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Patient Identification <span className="text-red-500 text-sm">★</span></CardTitle>
        </CardHeader>
        <CardContent>
          {!Object.values(form.patient_identification || {}).some(Boolean) && (<p className="text-xs text-red-500 mb-2">Select at least one identification method</p>)}
          <div className="space-y-2">
            {[
              { key: "date_of_birth", label: "Date of Birth" }, { key: "address", label: "Address" },
              { key: "facial_recognition", label: "Facial Recognition" }, { key: "family_member_verify", label: "Family Member Verify" },
              { key: "ssn", label: "SSN#" },
            ].map(({ key, label }) => {
              const checked = (form.patient_identification || {})[key] || false;
              return (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={checked} onChange={(e) => set("patient_identification", { ...(form.patient_identification || {}), [key]: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
