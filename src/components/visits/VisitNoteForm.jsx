"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getPatientVisits } from "@/lib/api-client/visit-notes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import SignatureCapture from "./SignatureCapture";
import AgencyDocumentsSection from "./AgencyDocumentsSection";
import DischargeOasisSection from "./DischargeOasisSection";
import SLPSwallowSection from "./SLPSwallowSection";
import AdditionalUploads from "./AdditionalUploads";
import DCPlanEducationSection from "./DCPlanEducationSection";
import MobilitySection from "./MobilitySection";
import SignatureTab from "./SignatureTab";
import LibraryDocumentsPicker from "./LibraryDocumentsPicker";
import ReevalPlanTab from "./ReevalPlanTab";
import ReevalTab from "./ReevalTab";
import NomncTab from "./NomncTab";
import IntakeTab from "./IntakeTab";
import VitalsTab from "./VitalsTab";
import SubjectiveTab from "./SubjectiveTab";
import ObjectiveTab from "./ObjectiveTab";
import AdlsTab from "./AdlsTab";
import AssessmentTab from "./AssessmentTab";
import GoalsPlanTab from "./GoalsPlanTab";
import SoapNoteTab from "./SoapNoteTab";
import TreatmentRenderedTab from "./TreatmentRenderedTab";
import TreatmentGoalsTab from "./TreatmentGoalsTab";
import RecertGoalsTab from "./RecertGoalsTab";
import ReEvalGoalsTab from "./ReEvalGoalsTab";
import DischargeTab from "./DischargeTab";
import NotesTab from "./NotesTab";

const COMMON_CPT = ["97110", "97112", "97116", "97140", "97530", "97535", "97542", "97150", "97161", "97162", "97163", "92507", "92508", "92526"];

function getTabsForVisitType(visitType, agencyDocsOnly = false, therapyType = "", addOns = {}) {
  if (agencyDocsOnly) return ["Intake", "Signature"];
  if (visitType === "evaluation") {
    const mobilityTab = therapyType === "Occupational Therapy" ? "Function" : therapyType === "Speech Therapy" ? "Swallow" : "Mobility";
    const tabs = ["Intake", "Vitals", "Subjective", "Objective", "ADL's", mobilityTab, "Assessment", "Goals & Plan", "DC Plan & Edu"];
    if (addOns.nomnc) tabs.push("NOMNC");
    tabs.push("Signature");
    return tabs;
  } else if (visitType === "treatment") {
    const tabs = ["Intake", "Vitals", "SOAP Note", "Treatment Rendered", "Goals"];
    if (addOns.nomnc) tabs.push("NOMNC");
    tabs.push("Signature");
    return tabs;
  } else if (visitType === "re_evaluation") {
    const tabs = ["Intake", "Vitals", "Re-Evaluation", "Treatment Rendered", "Goals", "Plan"];
    if (addOns.nomnc) tabs.push("NOMNC");
    tabs.push("Signature");
    return tabs;
  } else if (visitType === "recertification") {
    const tabs = ["Intake", "Vitals", "Re-Evaluation", "Treatment Rendered", "Goals", "Plan"];
    if (addOns.nomnc) tabs.push("NOMNC");
    tabs.push("Signature");
    return tabs;
  } else if (visitType === "discharge_with_visit") {
    const tabs = ["Intake", "Vitals", "Treatment Rendered", "Discharge"];
    if (addOns.nomnc) tabs.push("NOMNC");
    tabs.push("Signature");
    return tabs;
  } else if (visitType === "discharge_without_visit") {
    const tabs = ["Intake", "Discharge"];
    if (addOns.nomnc) tabs.push("NOMNC");
    tabs.push("Signature");
    return tabs;
  } else if (visitType === "eval_refused" || visitType === "missed_visit") {
    return ["Intake", "Notes", "Signature"];
  }
  return ["Intake", "Vitals", "Notes", "Signature"];
}

function GoalInterventionInput({ interventions, onAdd, onRemove }) {
  const [input, setInput] = useState("");
  return (
    <div>
      <div className="flex gap-2 mt-1">
        <Input placeholder="Enter planned intervention…" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(input); setInput(""); } }} />
        <Button type="button" size="icon" variant="outline" onClick={() => { onAdd(input); setInput(""); }}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {interventions.map((g, i) => (
          <Badge key={i} variant="secondary" className="gap-1 pr-1">
            {g}<button type="button" onClick={() => onRemove(i)}><X className="w-3 h-3" /></button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function VisitNoteForm({ patients = [], therapists = [], agencies = [], onSave, onAutoSave, initial, preselectedPatientId = "", preselectedTherapyType = "" }) {
  const effectiveUser = useCurrentUser();
  const isAdmin = ["admin", "superuser"].includes(effectiveUser?.role) || ["admin", "superuser"].includes(effectiveUser?.user_type);

  const [form, setForm] = useState(initial ? {
    eval_treatment_goals: [{ goal: "", interventions: [], functional_status: "" }],
    medical_diagnoses: [],
    treatment_diagnoses: [],
    ...initial,
  } : {
    patient_id: preselectedPatientId, therapist_id: "", visit_date: new Date().toISOString().split("T")[0],
    time_in: "", time_out: "", punch_in_reason: "", punch_out_reason: "",
    therapy_type: preselectedTherapyType, agency: "", visit_type: "treatment", duration_minutes: 0,
    cpt_codes: [], subjective: "", objective: "", assessment: "", plan: "",
    medical_history: "", prior_function: "", living_environment: "",
    rom_evaluation: {}, strength_evaluation: {},
    gait_analysis: "", standardized_testing: "", standardized_tests: [],
    medical_diagnoses: [], treatment_diagnoses: [],
    goals_addressed: [], interventions: [], patient_response: "", functional_status: "",
    eval_treatment_goals: [{ goal: "", interventions: [], functional_status: "" }],
    status: "draft",
    vitals: { blood_pressure: "", heart_rate: "", respiratory_rate: "", temperature: "", oxygen_saturation: "", pain_level: "" },
  });

  const [activeTab, setActiveTab] = useState("Intake");

  const patientAgencyName = form.agency || patients.find((p) => p.id === form.patient_id)?.agency;
  const patientAgencyRecord = agencies.find((a) => a.name === patientAgencyName);
  const agencyDocsOnly = patientAgencyRecord?.document_mode === "agency_docs";

  const addOns = {
    soc_oasis: !!form.include_soc_oasis,
    roc_oasis: !!form.include_roc_oasis,
    discharge_oasis: !!form.require_discharge_oasis,
    nomnc: !!form.include_nomnc,
  };

  const tabs = getTabsForVisitType(form.visit_type, agencyDocsOnly, form.therapy_type, addOns);

  useEffect(() => {
    const newTabs = getTabsForVisitType(form.visit_type, agencyDocsOnly, form.therapy_type, addOns);
    if (!newTabs.includes(activeTab)) setActiveTab("Intake");
  }, [form.visit_type, agencyDocsOnly, form.include_nomnc]);

  const [patientVisits, setPatientVisits] = useState([]);

  useEffect(() => {
    if (form.patient_id) {
      getPatientVisits(form.patient_id).then(setPatientVisits).catch(() => {});
    } else {
      setPatientVisits([]);
    }
  }, [form.patient_id]);

  const [saving, setSaving] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [uploadingPDF, setUploadingPDF] = useState(false);

  const PTA_COTA_CREDENTIALS = ["PTA", "COTA"];
  const selectedTherapistCredentials = therapists.find((t) => t.id === form.therapist_id)?.credentials?.trim().toUpperCase();
  const isAssistant = PTA_COTA_CREDENTIALS.includes(selectedTherapistCredentials);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleCpt = (code) => {
    const arr = form.cpt_codes || [];
    set("cpt_codes", arr.includes(code) ? arr.filter((c) => c !== code) : [...arr, code]);
  };

  const addGoal = () => { if (!goalInput.trim()) return; set("goals_addressed", [...(form.goals_addressed || []), goalInput.trim()]); setGoalInput(""); };

  const selectedPatient = patients.find((p) => p.id === form.patient_id);
  const selectedTherapist = therapists.find((t) => t.id === form.therapist_id);

  useEffect(() => {
    if (form.patient_id && !form.agency && selectedPatient?.agency) set("agency", selectedPatient.agency);
  }, [form.patient_id, selectedPatient?.agency]);

  useEffect(() => {
    if (isAssistant && form.visit_type !== "treatment") set("visit_type", "treatment");
  }, [isAssistant]);

  useEffect(() => {
    if (!form.patient_id || !form.therapy_type || initial) return;
    const priorVisits = patientVisits.filter(v => v.therapy_type === form.therapy_type && (v.status === "completed" || v.status === "signed"));
    if (priorVisits.length === 0) set("visit_type", "evaluation");
    else if (form.visit_type === "evaluation") set("visit_type", "treatment");
  }, [form.patient_id, form.therapy_type, patientVisits.length]);

  const handlePDFUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPDF(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      set("pdf_template_url", data.url);
    } catch (error) { alert("Failed to upload PDF template"); } finally { setUploadingPDF(false); }
  };

  const handleSave = async (status) => {
    const isLocked = form.status === "completed" || form.status === "signed";
    if (isLocked && !isAdmin) { alert("This visit note is locked. Only administrators can unlock it for editing."); return; }
    setSaving(true);
    const cleanedVitals = form.vitals ? {
      blood_pressure: form.vitals.blood_pressure || null,
      heart_rate: form.vitals.heart_rate === "" ? null : form.vitals.heart_rate,
      respiratory_rate: form.vitals.respiratory_rate === "" ? null : form.vitals.respiratory_rate,
      temperature: form.vitals.temperature === "" ? null : form.vitals.temperature,
      oxygen_saturation: form.vitals.oxygen_saturation === "" ? null : form.vitals.oxygen_saturation,
      pain_level: form.vitals.pain_level === "" ? null : form.vitals.pain_level,
    } : null;
    const data = {
      ...form, vitals: cleanedVitals, status,
      patient_name: selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : "",
      therapist_name: selectedTherapist?.full_name || "",
      agency: form.agency || selectedPatient?.agency || "",
    };
    if (onSave) await onSave(data);
    setSaving(false);
  };

  const currentTabIndex = tabs.indexOf(activeTab);
  const goNext = async () => {
    if (currentTabErrors.length > 0) return;
    if (currentTabIndex < tabs.length - 1) { autoSaveCurrentForm(); setActiveTab(tabs[currentTabIndex + 1]); }
  };
  const goPrev = () => { if (currentTabIndex > 0) setActiveTab(tabs[currentTabIndex - 1]); };

  const autoSaveCurrentForm = () => {
    if (!form.patient_id || !form.therapist_id) return;
    const cleanedVitals = form.vitals ? {
      blood_pressure: form.vitals.blood_pressure || null,
      heart_rate: form.vitals.heart_rate === "" ? null : form.vitals.heart_rate,
      respiratory_rate: form.vitals.respiratory_rate === "" ? null : form.vitals.respiratory_rate,
      temperature: form.vitals.temperature === "" ? null : form.vitals.temperature,
      oxygen_saturation: form.vitals.oxygen_saturation === "" ? null : form.vitals.oxygen_saturation,
      pain_level: form.vitals.pain_level === "" ? null : form.vitals.pain_level,
    } : null;
    const data = {
      ...form, vitals: cleanedVitals, status: form.status === "signed" ? "signed" : "draft",
      patient_name: selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : "",
      therapist_name: selectedTherapist?.full_name || "",
      agency: form.agency || selectedPatient?.agency || "",
    };
    const autoSaveFn = onAutoSave || onSave;
    if (autoSaveFn) autoSaveFn(data).catch(() => {});
  };

  const TabBar = () => (
    <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm -mx-0 mb-6">
      <div className="flex overflow-x-auto">
        {tabs.map((tab, idx) => (
          <button key={tab} type="button"
            onClick={() => { if (tab !== activeTab) autoSaveCurrentForm(); setActiveTab(tab); }}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? "border-teal-600 text-teal-700 bg-teal-50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
          >
            <span className="mr-1.5 text-xs text-slate-400">{idx + 1}.</span>{tab}
          </button>
        ))}
      </div>
    </div>
  );

  const getTabErrors = (tab) => {
    const errors = [];
    if (tab === "Intake") {
      if (!form.patient_id) errors.push("Patient is required");
      if (!form.therapist_id) errors.push("Therapist is required");
      if (!form.visit_date) errors.push("Visit Date is required");
      if (!form.therapy_type) errors.push("Therapy Type is required");
      if (!form.time_in) errors.push("Punch In (Time In) is required");
      const hasPatientId = Object.values(form.patient_identification || {}).some(Boolean);
      if (!hasPatientId) errors.push("At least one Patient Identification method is required");
    }
    if (tab === "Vitals") {
      const vitalsSkipped = !!(form.vitals_not_taken_reason || "").trim();
      const hasVitals = form.vitals && (form.vitals.blood_pressure || form.vitals.heart_rate || form.vitals.respiratory_rate || form.vitals.temperature || form.vitals.oxygen_saturation);
      if (!vitalsSkipped && !hasVitals) errors.push("Vital signs are required — enter at least one value or provide a reason for not taking vitals");
    }
    if (tab === "Assessment" && form.visit_type === "evaluation") {
      if (!(form.assessment || "").trim()) errors.push("Clinical Impression & Prognosis is required");
    }
    if (tab === "Subjective" && form.visit_type === "evaluation") {
      const req = (v) => (v || "").trim().length >= 2;
      if (!req(form.medical_history)) errors.push("Medical History is required (min 2 characters, 'NA' accepted)");
      if (!req(form.past_surgical_history)) errors.push("Past Surgical History is required (min 2 characters, 'NA' accepted)");
      if (!req(form.subjective)) errors.push("Reason for Referral is required (min 2 characters, 'NA' accepted)");
      if (!req(form.prior_function)) errors.push("Prior Level of Function is required (min 2 characters, 'NA' accepted)");
      if (!req(form.living_environment)) errors.push("Living Environment is required (min 2 characters, 'NA' accepted)");
      if (form.therapy_type === "Physical Therapy" || form.therapy_type === "Occupational Therapy") {
        const homeboundCount = (form.homebound_reasons || []).length + (form.homebound_other !== undefined && form.homebound_other !== null ? 1 : 0);
        if (homeboundCount < 2) errors.push("Homebound Reason requires at least 2 options to be selected");
      }
      if (!req(form.therapy_objective_patient_goals)) errors.push("Patient / Caregiver Goals is required (min 2 characters, 'NA' accepted)");
      if (!req(form.precautions)) errors.push("Precautions is required (min 2 characters, 'NA' accepted)");
      if (!req(form.medication_changes)) errors.push("Medication Changes is required (min 2 characters, 'NA' accepted)");
    }
    if (tab === "DC Plan & Edu" && form.visit_type === "evaluation") {
      if (!((form.dc_plan || {}).discharge_setting || "").trim()) errors.push("Anticipated Discharge Setting is required");
      if (!((form.dc_plan || {}).discharge_criteria || "").trim()) errors.push("Discharge Criteria / Goals for Discharge is required");
      const eduTopics = (form.patient_education || {}).topics || [];
      const hasOtherTopic = (form.patient_education || {}).other_checked && ((form.patient_education || {}).other_topic || "").trim();
      if (eduTopics.length === 0 && !hasOtherTopic) errors.push("At least one Patient Education Topic is required");
      const educatedTo = (form.patient_education || {}).educated_to || [];
      if (educatedTo.length === 0) errors.push("Educated To is required — select at least one");
      if (!((form.patient_education || {}).response || "").trim()) errors.push("Patient / Caregiver Response to Education is required");
      if (!((form.dc_plan || {}).treatment_performed || "").trim()) errors.push("Treatment Performed This Visit is required");
      if (!((form.dc_plan || {}).rehab_potential || "").trim()) errors.push("Rehabilitation Potential is required");
    }
    if (tab === "Signature") {
      if (!form.therapist_signature) errors.push("Therapist Signature is required");
      const patientSigOk = form.patient_signature || (form.patient_signature_unable && (form.patient_signature_unable_reason || "").trim());
      if (!patientSigOk) {
        if (form.patient_signature_unable) errors.push("Reason for unable to capture patient signature is required");
        else errors.push("Patient Signature is required (or mark 'Unable to Capture' with a reason)");
      }
    }
    if (tab === "Goals & Plan" && form.visit_type === "evaluation") {
      const goals = form.eval_treatment_goals || [];
      const hasValidGoal = goals.some(g => (g.goal || "").trim().length > 0);
      if (!hasValidGoal) errors.push("At least one Treatment Goal is required");
      if ((form.therapy_orders || {}).eval_only && !((form.therapy_orders || {}).eval_only_reason || "").trim()) errors.push("Eval Only reason is required");
      if (!form.plan?.trim()) errors.push("Skilled Service Narrative is required");
      const cc = form.care_coordination || {};
      const hasDisciplines = (cc.disciplines || []).length > 0 || (cc.other || "").trim();
      if (!hasDisciplines) errors.push("Care Coordination: select at least one discipline or specify Other");
      if (!(cc.reason || "").trim()) errors.push("Care Coordination Reason is required");
    }
    return errors;
  };

  const currentTabErrors = getTabErrors(activeTab);

  const evalMissingFields = form.visit_type === "evaluation" ? (() => {
    const missing = [];
    if (!(form.assessment || "").trim()) missing.push("Clinical Impression & Prognosis");
    const goals = form.eval_treatment_goals || [];
    if (!goals.some(g => (g.goal || "").trim().length > 0)) missing.push("At least one Treatment Goal");
    if (!form.plan?.trim()) missing.push("Need for Skilled Services (narrative)");
    const cc = form.care_coordination || {};
    if (!((cc.disciplines || []).length > 0 || (cc.other || "").trim())) missing.push("Care Coordination");
    if (!(cc.reason || "").trim()) missing.push("Care Coordination Reason");
    return missing;
  })() : [];

  const NavButtons = () => (
    <div className="flex flex-col gap-2 pt-2 pb-4">
      {currentTabErrors.length > 0 && currentTabIndex < tabs.length - 1 && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="font-semibold mb-1">Complete required fields to continue:</p>
          <ul className="list-disc list-inside space-y-0.5">{currentTabErrors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}
      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" onClick={goPrev} disabled={currentTabIndex === 0} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>
        {currentTabIndex < tabs.length - 1 ? (
          <Button type="button" onClick={goNext} disabled={currentTabErrors.length > 0} className={`gap-2 ${currentTabErrors.length > 0 ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"}`}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <div className="flex flex-col items-end gap-2">
            {evalMissingFields.length > 0 && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 max-w-xs text-right">
                <p className="font-semibold mb-1">Required to complete:</p>
                <ul className="list-disc list-inside space-y-0.5">{evalMissingFields.map((f) => <li key={f}>{f}</li>)}</ul>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" size="lg" onClick={() => handleSave("draft")} disabled={saving || !form.patient_id || !form.therapist_id}>
                <Save className="w-4 h-4 mr-2" />Save Draft
              </Button>
              <Button size="lg" onClick={() => handleSave("completed")} disabled={saving || !form.patient_id || !form.therapist_id || evalMissingFields.length > 0} className="bg-teal-600 hover:bg-teal-700">
                <CheckCircle className="w-4 h-4 mr-2" />Complete & Sign
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-6xl">
      <TabBar />

      {/* INTAKE */}
      {activeTab === "Intake" && (
        <IntakeTab form={form} set={set} patients={patients} therapists={therapists} isAdmin={isAdmin} isAssistant={isAssistant} agencyDocsOnly={agencyDocsOnly} patientAgencyName={patientAgencyName} />
      )}

      {/* VITALS */}
      {activeTab === "Vitals" && (
        <VitalsTab form={form} set={set} />
      )}

      {/* SUBJECTIVE (evaluation) */}
      {activeTab === "Subjective" && form.visit_type === "evaluation" && (
        <SubjectiveTab form={form} set={set} />
      )}

      {/* OBJECTIVE (evaluation) */}
      {activeTab === "Objective" && form.visit_type === "evaluation" && (
        <ObjectiveTab form={form} set={set} />
      )}

      {/* ADLs (evaluation) */}
      {activeTab === "ADL's" && form.visit_type === "evaluation" && (
        <AdlsTab form={form} set={set} />
      )}

      {/* MOBILITY / FUNCTION (evaluation) */}
      {(activeTab === "Mobility" || activeTab === "Function") && form.visit_type === "evaluation" && (
        <MobilitySection form={form} set={set} isOT={form.therapy_type === "Occupational Therapy"} />
      )}

      {/* SWALLOW (SLP evaluation) */}
      {activeTab === "Swallow" && form.visit_type === "evaluation" && (
        <SLPSwallowSection swallow={form.slp_swallow || {}} onChange={(v) => set("slp_swallow", v)} />
      )}

      {/* ASSESSMENT (evaluation) */}
      {activeTab === "Assessment" && form.visit_type === "evaluation" && (
        <AssessmentTab form={form} set={set} />
      )}

      {/* GOALS & PLAN (evaluation) */}
      {activeTab === "Goals & Plan" && form.visit_type === "evaluation" && (
        <GoalsPlanTab form={form} set={set} selectedPatient={selectedPatient} />
      )}

      {/* DC PLAN & PATIENT EDUCATION (evaluation) */}
      {activeTab === "DC Plan & Edu" && form.visit_type === "evaluation" && (
        <>
          <DCPlanEducationSection form={form} set={set} />
          {form.include_soc_oasis && (<DischargeOasisSection oasis={form.soc_oasis || {}} onChange={(v) => set("soc_oasis", v)} />)}
        </>
      )}

      {/* SOAP NOTE (treatment) */}
      {activeTab === "SOAP Note" && form.visit_type === "treatment" && (
        <SoapNoteTab form={form} set={set} />
      )}

      {/* TREATMENT RENDERED */}
      {activeTab === "Treatment Rendered" && (
        <TreatmentRenderedTab form={form} set={set} patientVisits={patientVisits} />
      )}

      {/* RE-EVALUATION */}
      {activeTab === "Re-Evaluation" && (form.visit_type === "re_evaluation" || form.visit_type === "recertification") && (
        <ReevalTab form={form} set={set} isAssistant={isAssistant} therapistName={selectedTherapist?.full_name} therapists={therapists} selectedPatient={selectedPatient} />
      )}

      {/* GOALS (treatment) */}
      {activeTab === "Goals" && form.visit_type === "treatment" && (
        <TreatmentGoalsTab form={form} set={set} patientVisits={patientVisits} />
      )}

      {/* GOALS (recertification) */}
      {activeTab === "Goals" && form.visit_type === "recertification" && (
        <RecertGoalsTab form={form} set={set} />
      )}

      {/* PLAN (recertification) */}
      {activeTab === "Plan" && form.visit_type === "recertification" && (
        <>
          <ReevalPlanTab form={form} set={set} selectedPatient={selectedPatient} />
          {form.include_roc_oasis && (<DischargeOasisSection oasis={form.roc_oasis || {}} onChange={(v) => set("roc_oasis", v)} />)}
        </>
      )}

      {/* GOALS (re_evaluation) */}
      {activeTab === "Goals" && form.visit_type === "re_evaluation" && (
        <ReEvalGoalsTab form={form} set={set} />
      )}

      {/* PLAN (re_evaluation) */}
      {activeTab === "Plan" && form.visit_type === "re_evaluation" && (
        <ReevalPlanTab form={form} set={set} selectedPatient={selectedPatient} />
      )}

      {/* DISCHARGE */}
      {activeTab === "Discharge" && (form.visit_type === "discharge_with_visit" || form.visit_type === "discharge_without_visit") && (
        <DischargeTab form={form} set={set} />
      )}

      {/* NOMNC */}
      {activeTab === "NOMNC" && form.include_nomnc && (
        <NomncTab form={form} set={set} />
      )}

      {/* EVAL REFUSED / MISSED VISIT */}
      {activeTab === "Notes" && (form.visit_type === "eval_refused" || form.visit_type === "missed_visit") && (
        <NotesTab form={form} set={set} />
      )}

      {/* SIGNATURE */}
      {activeTab === "Signature" && (
        <SignatureTab form={form} set={set} patientAgencyName={patientAgencyName} patientAgencyRecord={patientAgencyRecord} agencyDocsOnly={agencyDocsOnly}
          onAutoSave={(data) => { const autoSaveFn = onAutoSave || onSave; if (autoSaveFn) autoSaveFn({ ...data, status: form.status === "signed" ? "signed" : "draft" }).catch(() => {}); }} />
      )}

      <NavButtons />
    </div>
  );
}
