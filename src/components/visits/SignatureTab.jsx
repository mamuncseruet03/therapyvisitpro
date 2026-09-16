"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DictationTextarea } from "@/components/visits/DictationButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, PenLine, MapPin, CheckCircle2 } from "lucide-react";
import SignatureCapture from "./SignatureCapture";
import AgencyDocumentsSection from "./AgencyDocumentsSection";
import AdditionalUploads from "./AdditionalUploads";
import LibraryDocumentsPicker from "./LibraryDocumentsPicker";
import { format, parseISO } from "date-fns";

const COMMON_CPT = ["97110", "97112", "97116", "97140", "97530", "97535", "97542", "97150", "97161", "97162", "97163", "92507", "92508", "92526"];

function SignatureSlot({ label, signature, timestamp, location, onSave, required, children }) {
  return (
    <div className="space-y-3">
      {signature ? (
        <Card className="border-teal-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <img src={signature} alt={label} className="w-full border rounded-lg" />
            <div className="text-xs text-slate-500 space-y-0.5">
              {timestamp && <p>Signed: {format(parseISO(timestamp), "MMM d, yyyy h:mm a")}</p>}
              {location && <p>Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>}
            </div>
            <SignatureCapture
              label={label}
              existingSignature={signature}
              onSave={onSave}
              triggerLabel="Re-sign"
              triggerVariant="outline"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {children}
          <SignatureCapture
            label={`${label}${required ? " ★" : ""}`}
            onSave={onSave}
            triggerLabel={`Capture ${label}`}
          />
        </div>
      )}
    </div>
  );
}

export default function SignatureTab({ form, set, patientAgencyName, patientAgencyRecord, agencyDocsOnly, onAutoSave }) {
  const [punchingOut, setPunchingOut] = useState(false);
  const [unableToPunchOut, setUnableToPunchOut] = useState(false);
  const [manualTimeOut, setManualTimeOut] = useState("");

  const toggleCpt = (code) => {
    const arr = form.cpt_codes || [];
    set("cpt_codes", arr.includes(code) ? arr.filter((c) => c !== code) : [...arr, code]);
  };

  return (
    <div className="space-y-6">
      <LibraryDocumentsPicker
        selected={form.library_documents || []}
        onChange={(docs) => set("library_documents", docs)}
      />

      {(() => {
        const requiredDocs = patientAgencyRecord?.required_visit_documents || [];
        const agencyOwnedDocs = (patientAgencyRecord?.documents || []).map(d => d.name).filter(Boolean);
        const docsToShow = agencyDocsOnly ? agencyOwnedDocs : requiredDocs;
        if (!patientAgencyName || docsToShow.length === 0) return null;
        return (
          <AgencyDocumentsSection
            agencyName={patientAgencyName}
            agencyDocs={form.agency_documents || []}
            requiredDocNames={docsToShow}
            agencySourceDocs={agencyDocsOnly ? (patientAgencyRecord?.documents || []) : []}
            onChange={(docs) => set("agency_documents", docs)}
          />
        );
      })()}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">CPT Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {COMMON_CPT.map((code) => (
              <button key={code} type="button" onClick={() => toggleCpt(code)}
                className={`px-3 py-1.5 rounded-lg text-sm font-mono border transition-all ${(form.cpt_codes || []).includes(code) ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"}`}>
                {code}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <AdditionalUploads
        uploads={form.additional_uploads || []}
        onChange={(docs) => set("additional_uploads", docs)}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <SignatureSlot
          label="Therapist Signature"
          signature={form.therapist_signature}
          timestamp={form.therapist_signature_timestamp}
          location={form.therapist_signature_location}
          required
          onSave={(data) => {
            set("therapist_signature", data.signature);
            set("therapist_signature_timestamp", data.timestamp);
            set("therapist_signature_location", data.location);
            onAutoSave?.({ ...form, therapist_signature: data.signature, therapist_signature_timestamp: data.timestamp, therapist_signature_location: data.location });
          }}
        />

        <SignatureSlot
          label="Patient Signature"
          signature={form.patient_signature}
          timestamp={form.patient_signature_timestamp}
          location={form.patient_signature_location}
          required
          onSave={(data) => {
            set("patient_signature", data.signature);
            set("patient_signature_timestamp", data.timestamp);
            set("patient_signature_location", data.location);
            onAutoSave?.({ ...form, patient_signature: data.signature, patient_signature_timestamp: data.timestamp, patient_signature_location: data.location });
          }}
        >
          {!form.patient_signature && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  set("patient_signature_unable", !form.patient_signature_unable);
                  set("patient_signature_unable_reason", "");
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${form.patient_signature_unable ? "bg-amber-50 border-amber-400 text-amber-800" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}
              >
                Unable to Capture
              </button>
            </div>
          )}
          {form.patient_signature_unable && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4 space-y-2">
                <p className="text-xs font-semibold text-amber-700">Reason <span className="text-red-500">&#9733;</span></p>
                <DictationTextarea
                 placeholder="e.g. Patient refused, patient incapacitated, caregiver not present..."
                 value={form.patient_signature_unable_reason || ""}
                 onChange={(e) => set("patient_signature_unable_reason", e.target.value)}
                 rows={3}
                 className="bg-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => { set("patient_signature_unable", false); set("patient_signature_unable_reason", ""); }}
                  className="text-xs text-slate-500 underline"
                >
                  Cancel -- capture signature instead
                </button>
              </CardContent>
            </Card>
          )}
        </SignatureSlot>
      </div>

      {/* Punch Out */}
      <Card className="border-slate-200">
        <CardContent className="pt-4 pb-4 space-y-3">
          {form.time_out ? (
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <MapPin className="w-5 h-5 text-slate-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Punched Out: {form.time_out}</p>
                {form.punch_out_location && (
                  <p className="text-xs text-slate-500">{form.punch_out_location.lat.toFixed(5)}, {form.punch_out_location.lng.toFixed(5)}</p>
                )}
                {form.punch_out_reason && (
                  <p className="text-xs text-amber-600 mt-0.5">Unable to punch out: {form.punch_out_reason}</p>
                )}
                {form.time_in && form.duration_minutes > 0 && (
                  <p className="text-xs text-teal-600">Duration: {form.duration_minutes} min</p>
                )}
              </div>
              <button type="button" onClick={() => { set("time_out", ""); set("punch_out_location", null); set("punch_out_reason", ""); set("duration_minutes", ""); setUnableToPunchOut(false); setManualTimeOut(""); }} className="text-slate-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={punchingOut}
                  className="flex-1 gap-2 bg-slate-800 hover:bg-slate-900"
                  onClick={async () => {
                    setPunchingOut(true);
                    setUnableToPunchOut(false);
                    const now = new Date();
                    const timeOut = now.toTimeString().slice(0, 5);
                    set("time_out", timeOut);
                    if (form.time_in && timeOut) {
                      const [inH, inM] = form.time_in.split(":").map(Number);
                      const [outH, outM] = timeOut.split(":").map(Number);
                      const dur = (outH * 60 + outM) - (inH * 60 + inM);
                      if (dur > 0) set("duration_minutes", dur);
                    }
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => { set("punch_out_location", { lat: pos.coords.latitude, lng: pos.coords.longitude }); setPunchingOut(false); },
                        () => { setPunchingOut(false); }
                      );
                    } else {
                      setPunchingOut(false);
                    }
                  }}
                >
                  <MapPin className="w-4 h-4" />
                  {punchingOut ? "Getting location..." : "Punch Out"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`flex-1 gap-2 ${unableToPunchOut ? "bg-amber-50 border-amber-400 text-amber-800" : "border-amber-300 text-amber-700 hover:bg-amber-50"}`}
                  onClick={() => setUnableToPunchOut(!unableToPunchOut)}
                >
                  Unable to Punch Out
                </Button>
              </div>
              {unableToPunchOut && (
                <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-3">
                  <p className="text-xs font-semibold text-amber-800">Reason (e.g. no network, no GPS signal) <span className="text-red-500">&#9733;</span></p>
                  <DictationTextarea
                    placeholder="Describe why you were unable to punch out..."
                    value={form.punch_out_reason || ""}
                    onChange={(e) => set("punch_out_reason", e.target.value)}
                    rows={2}
                    className="text-sm bg-white"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={manualTimeOut}
                      onChange={(e) => setManualTimeOut(e.target.value)}
                      className="max-w-[140px] bg-white"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={!manualTimeOut || !(form.punch_out_reason || "").trim()}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => {
                        set("time_out", manualTimeOut);
                        if (form.time_in && manualTimeOut) {
                          const [inH, inM] = form.time_in.split(":").map(Number);
                          const [outH, outM] = manualTimeOut.split(":").map(Number);
                          const dur = (outH * 60 + outM) - (inH * 60 + inM);
                          if (dur > 0) set("duration_minutes", dur);
                        }
                        setUnableToPunchOut(false);
                      }}
                    >
                      Confirm Time
                    </Button>
                    {!!(manualTimeOut && !(form.punch_out_reason || "").trim()) && (
                      <span className="text-xs text-red-500">Enter a reason first</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
