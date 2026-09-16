"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";

// Helper components
function RadioGroup({ name, options, value, onChange, horizontal = false }) {
  return (
    <div className={`space-y-1 ${horizontal ? "flex flex-wrap gap-4 space-y-0" : ""}`}>
      {options.map((opt) => (
        <label key={opt.value} className="flex items-start gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="w-4 h-4 mt-0.5 text-teal-600 cursor-pointer shrink-0"
          />
          <span className="text-sm text-slate-700">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function CheckGroup({ options, values = [], onChange, columns = 1 }) {
  const toggle = (val) => {
    const next = values.includes(val) ? values.filter(v => v !== val) : [...values, val];
    onChange(next);
  };
  return (
    <div className={`grid gap-1 ${columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-1"}`}>
      {options.map((opt) => (
        <label key={opt} className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={values.includes(opt)}
            onChange={() => toggle(opt)}
            className="w-4 h-4 mt-0.5 rounded border-slate-300 text-teal-600 cursor-pointer shrink-0"
          />
          <span className="text-sm text-slate-700">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border-l-4 border-l-teal-500">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setOpen(!open)}>
        <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between uppercase tracking-wide">
          {title}
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </CardTitle>
      </CardHeader>
      {open && <CardContent className="space-y-4 pt-0">{children}</CardContent>}
    </Card>
  );
}

function Field({ label, children, inline = false }) {
  return (
    <div className={inline ? "flex items-center gap-3" : "space-y-1"}>
      {label && <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</Label>}
      {children}
    </div>
  );
}

const GG_CODES = [
  { value: "06", label: "06 - Independent" },
  { value: "05", label: "05 - Setup/clean-up assistance" },
  { value: "04", label: "04 - Supervision or touching" },
  { value: "03", label: "03 - Partial/moderate assistance" },
  { value: "02", label: "02 - Substantial/maximal assistance" },
  { value: "01", label: "01 - Dependent" },
  { value: "07", label: "07 - Patient refused" },
  { value: "09", label: "09 - Not applicable" },
  { value: "10", label: "10 - Environmental limitations" },
  { value: "88", label: "88 - Medical condition/safety" },
  { value: "0", label: "0 - No information/Not assessed" },
];

function GGItem({ label, name, value, onChange }) {
  return (
    <div className="border rounded-lg p-3 space-y-2 bg-white">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div className="grid grid-cols-3 gap-1">
        {GG_CODES.map(opt => (
          <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name={name} value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} className="w-3.5 h-3.5 text-teal-600 cursor-pointer" />
            <span className="text-xs text-slate-600">{opt.value}</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-slate-400 italic">{GG_CODES.find(o => o.value === value)?.label || "Not selected"}</p>
    </div>
  );
}

export default function DcOasisForm({ value = {}, onChange }) {
  const set = (key, val) => onChange({ ...value, [key]: val });
  const setNested = (section, key, val) => onChange({ ...value, [section]: { ...(value[section] || {}), [key]: val } });
  const g = (key, def = "") => value[key] ?? def;
  const gn = (section, key, def = "") => (value[section] || {})[key] ?? def;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Badge className="bg-teal-700 text-white text-xs">OASIS-E2</Badge>
        <h2 className="text-lg font-bold text-slate-800">D/C Not to Inpatient Facility (OASIS-E2)</h2>
      </div>
      <p className="text-xs text-slate-500">Extended Home Care · Effective 4/1/2026 · Centers for Medicare &amp; Medicaid Services</p>

      {/* ADMINISTRATIVE INFORMATION */}
      <Section title="Administrative Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="(M0018) National Provider Identifier (NPI)">
            <div className="flex gap-2 items-center">
              <Input value={g("m0018_npi")} onChange={e => set("m0018_npi", e.target.value)} placeholder="NPI" className="flex-1" />
              <label className="flex items-center gap-1 text-xs text-slate-600 whitespace-nowrap">
                <input type="checkbox" checked={g("m0018_unknown", false)} onChange={e => set("m0018_unknown", e.target.checked)} className="w-3.5 h-3.5" /> UK
              </label>
            </div>
          </Field>
          <Field label="(M0010) CMS Certification Number">
            <Input value={g("m0010")} onChange={e => set("m0010", e.target.value)} />
          </Field>
          <Field label="(M0014) Branch State">
            <Input value={g("m0014")} onChange={e => set("m0014", e.target.value)} maxLength={2} className="max-w-[80px]" />
          </Field>
          <Field label="(M0016) Branch ID Number">
            <Input value={g("m0016")} onChange={e => set("m0016", e.target.value)} />
          </Field>
          <Field label="(M0020) Patient ID Number">
            <Input value={g("m0020")} onChange={e => set("m0020", e.target.value)} />
          </Field>
          <Field label="(M0040) Patient Name">
            <div className="flex gap-2">
              <Input value={g("m0040_name")} onChange={e => set("m0040_name", e.target.value)} placeholder="Full Name" className="flex-1" />
              <Input value={g("m0040_suffix")} onChange={e => set("m0040_suffix", e.target.value)} placeholder="Suffix" className="w-20" />
            </div>
          </Field>
          <Field label="(M0050) Patient State of Residence">
            <Input value={g("m0050")} onChange={e => set("m0050", e.target.value)} maxLength={2} className="max-w-[80px]" />
          </Field>
          <Field label="(M0060) Patient ZIP Code">
            <Input value={g("m0060")} onChange={e => set("m0060", e.target.value)} maxLength={10} className="max-w-[140px]" />
          </Field>
          <Field label="(M0030) Start of Care Date">
            <Input type="date" value={g("m0030")} onChange={e => set("m0030", e.target.value)} />
          </Field>
          <Field label="(M0032) Resumption of Care Date">
            <div className="flex gap-2 items-center">
              <Input type="date" value={g("m0032")} onChange={e => set("m0032", e.target.value)} />
              <label className="flex items-center gap-1 text-xs text-slate-600 whitespace-nowrap">
                <input type="checkbox" checked={g("m0032_na", false)} onChange={e => set("m0032_na", e.target.checked)} className="w-3.5 h-3.5" /> NA
              </label>
            </div>
          </Field>
          <Field label="(M0064) Social Security Number">
            <div className="flex gap-2 items-center">
              <Input value={g("m0064")} onChange={e => set("m0064", e.target.value)} placeholder="XXX-XX-XXXX" />
              <label className="flex items-center gap-1 text-xs text-slate-600 whitespace-nowrap">
                <input type="checkbox" checked={g("m0064_uk", false)} onChange={e => set("m0064_uk", e.target.checked)} className="w-3.5 h-3.5" /> UK
              </label>
            </div>
          </Field>
          <Field label="(M0063) Medicare Number (including suffix)">
            <div className="flex gap-2 items-center">
              <Input value={g("m0063")} onChange={e => set("m0063", e.target.value)} />
              <label className="flex items-center gap-1 text-xs text-slate-600 whitespace-nowrap">
                <input type="checkbox" checked={g("m0063_na", false)} onChange={e => set("m0063_na", e.target.checked)} className="w-3.5 h-3.5" /> NA - No Medicare
              </label>
            </div>
          </Field>
          <Field label="(M0065) Medicaid Number">
            <div className="flex gap-2 items-center">
              <Input value={g("m0065")} onChange={e => set("m0065", e.target.value)} />
              <label className="flex items-center gap-1 text-xs text-slate-600 whitespace-nowrap">
                <input type="checkbox" checked={g("m0065_na", false)} onChange={e => set("m0065_na", e.target.checked)} className="w-3.5 h-3.5" /> NA - No Medicaid
              </label>
            </div>
          </Field>
          <Field label="(M0066) Birth Date">
            <Input type="date" value={g("m0066")} onChange={e => set("m0066", e.target.value)} />
          </Field>
          <Field label="(A0810) Sex">
            <RadioGroup name="a0810" horizontal value={g("a0810")} onChange={v => set("a0810", v)} options={[
              { value: "1", label: "1 - Male" },
              { value: "2", label: "2 - Female" },
            ]} />
          </Field>
        </div>

        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="(M0080) Discipline of Person Completing Assessment">
            <RadioGroup name="m0080" horizontal value={g("m0080")} onChange={v => set("m0080", v)} options={[
              { value: "1", label: "1 - RN" }, { value: "2", label: "2 - PT" },
              { value: "3", label: "3 - SLP/ST" }, { value: "4", label: "4 - OT" },
            ]} />
          </Field>
          <Field label="(M0090) Date Assessment Completed">
            <Input type="date" value={g("m0090")} onChange={e => set("m0090", e.target.value)} />
          </Field>
        </div>

        <Field label="(M0100) This Assessment is Currently Being Completed for the Following Reason:">
          <RadioGroup name="m0100" value={g("m0100")} onChange={v => set("m0100", v)} options={[
            { value: "1", label: "1 - Start of care - further visits planned" },
            { value: "3", label: "3 - Resumption of care (after inpatient stay)" },
            { value: "4", label: "4 - Recertification (follow-up) reassessment" },
            { value: "5", label: "5 - Other follow-up" },
            { value: "6", label: "6 - Transferred to an inpatient facility - patient not discharged from agency" },
            { value: "7", label: "7 - Transferred to an inpatient facility - patient discharged from agency" },
            { value: "8", label: "8 - Death at home" },
            { value: "9", label: "9 - Discharge from agency" },
          ]} />
        </Field>

        <Field label="Barriers to Care (check all that apply)">
          <CheckGroup values={g("barriers_to_care", [])} onChange={v => set("barriers_to_care", v)} options={[
            "None", "Cultural/Religious preferences", "Environmental barriers",
            "Family conflicts", "Noncompliance", "Other"
          ]} columns={2} />
        </Field>

        <Field label="(M0150) Current Payment Sources for Home Care (check all that apply)">
          <CheckGroup values={g("m0150", [])} onChange={v => set("m0150", v)} columns={2} options={[
            "0 - None; no charge for current services",
            "1 - Medicare (traditional fee-for-service)",
            "2 - Medicare (HMO/managed care/Advantage plan)",
            "3 - Medicaid (traditional fee-for-service)",
            "4 - Medicaid (HMO/managed care)",
            "5 - Workers' compensation",
            "6 - Title programs (e.g., Title III, V, or XX)",
            "7 - Other government (e.g., TriCare, VA)",
            "8 - Private insurance",
            "9 - Private HMO/managed care",
            "10 - Self-pay",
            "11 - Other (specify)",
            "UK - Unknown",
          ]} />
        </Field>

        <Field label="Who is present/participating in this visit? (check all that apply)">
          <CheckGroup values={g("visit_participants", [])} onChange={v => set("visit_participants", v)} columns={2} options={[
            "Caregiver", "Family", "Patient", "Friend/Neighbor", "Health Care Provider", "Other"
          ]} />
          <Textarea placeholder="Additional details..." value={g("visit_participants_notes")} onChange={e => set("visit_participants_notes", e.target.value)} rows={2} className="mt-2" />
        </Field>
      </Section>

      {/* VITAL SIGNS */}
      <Section title="Vital Signs" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 border rounded-lg p-3">
            <p className="text-sm font-semibold text-slate-700">Blood Pressure 1</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Systolic"><Input value={gn("bp1","systolic")} onChange={e => setNested("bp1","systolic",e.target.value)} /></Field>
              <Field label="Diastolic"><Input value={gn("bp1","diastolic")} onChange={e => setNested("bp1","diastolic",e.target.value)} /></Field>
            </div>
            <Field label="Position">
              <RadioGroup name="bp1_pos" horizontal value={gn("bp1","position")} onChange={v => setNested("bp1","position",v)} options={[{value:"lying",label:"Lying"},{value:"sitting",label:"Sitting"},{value:"standing",label:"Standing"}]} />
            </Field>
          </div>
          <div className="space-y-2 border rounded-lg p-3">
            <p className="text-sm font-semibold text-slate-700">Blood Pressure 2</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Systolic"><Input value={gn("bp2","systolic")} onChange={e => setNested("bp2","systolic",e.target.value)} /></Field>
              <Field label="Diastolic"><Input value={gn("bp2","diastolic")} onChange={e => setNested("bp2","diastolic",e.target.value)} /></Field>
            </div>
            <Field label="Position">
              <RadioGroup name="bp2_pos" horizontal value={gn("bp2","position")} onChange={v => setNested("bp2","position",v)} options={[{value:"lying",label:"Lying"},{value:"sitting",label:"Sitting"},{value:"standing",label:"Standing"}]} />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Pulse Rate 1"><Input value={g("pulse1")} onChange={e => set("pulse1", e.target.value)} /></Field>
          <Field label="Pulse Rate 2"><Input value={g("pulse2")} onChange={e => set("pulse2", e.target.value)} /></Field>
          <Field label="Respirations"><Input value={g("respirations")} onChange={e => set("respirations", e.target.value)} /></Field>
          <Field label="Temperature"><Input value={g("temperature")} onChange={e => set("temperature", e.target.value)} /></Field>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="O2 Flow Rate (LPM)"><Input value={g("o2_flow_rate")} onChange={e => set("o2_flow_rate", e.target.value)} /></Field>
          <Field label="Oxygen Saturation (%)"><Input value={g("o2_saturation")} onChange={e => set("o2_saturation", e.target.value)} /></Field>
          <Field label="Oxygen Use">
            <RadioGroup name="o2_use" horizontal value={g("o2_use")} onChange={v => set("o2_use", v)} options={[{value:"none",label:"None"},{value:"prn",label:"PRN"},{value:"continuous",label:"Continuous"}]} />
          </Field>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Height (ft)"><Input value={g("height_ft")} onChange={e => set("height_ft", e.target.value)} /></Field>
          <Field label="Height (in)"><Input value={g("height_in")} onChange={e => set("height_in", e.target.value)} /></Field>
          <Field label="Weight (lbs)"><Input value={g("weight_lbs")} onChange={e => set("weight_lbs", e.target.value)} /></Field>
          <Field label="BMI"><Input value={g("bmi")} readOnly className="bg-slate-50" /></Field>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={g("weight_loss", false)} onChange={e => set("weight_loss", e.target.checked)} className="w-4 h-4 rounded" /> Weight loss since last visit
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={g("weight_gain", false)} onChange={e => set("weight_gain", e.target.checked)} className="w-4 h-4 rounded" /> Weight gain since last visit
          </label>
        </div>
        <Field label="Notes"><Textarea value={g("vitals_notes")} onChange={e => set("vitals_notes", e.target.value)} rows={2} /></Field>
      </Section>

      {/* PAIN */}
      <Section title="Pain" defaultOpen={false}>
        <Field label="Pain Present?">
          <RadioGroup name="pain_present" horizontal value={g("pain_present")} onChange={v => set("pain_present", v)} options={[{value:"yes",label:"Yes"},{value:"no",label:"No"}]} />
        </Field>

        {g("pain_present") === "yes" && (
          <>
            {[1,2].map(n => (
              <div key={n} className="border rounded-lg p-4 space-y-3">
                <p className="font-semibold text-sm text-slate-700">Pain Location {n}</p>
                <Field label="Location"><Input value={gn(`pain${n}`,"location")} onChange={e => setNested(`pain${n}`,"location",e.target.value)} /></Field>
                <Field label="Type">
                  <RadioGroup name={`pain${n}_type`} horizontal value={gn(`pain${n}`,"type")} onChange={v => setNested(`pain${n}`,"type",v)} options={[{value:"acute",label:"Acute"},{value:"recent",label:"Recent onset"},{value:"chronic",label:"Chronic"}]} />
                </Field>
                <Field label="Intensity Scale (0-10)">
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={10} value={gn(`pain${n}`,"intensity") || 0} onChange={e => setNested(`pain${n}`,"intensity",parseInt(e.target.value))} className="flex-1" />
                    <span className="w-8 text-center font-bold text-teal-700">{gn(`pain${n}`,"intensity") || 0}</span>
                  </div>
                </Field>
                <Field label="Precipitating Factors"><Input value={gn(`pain${n}`,"precipitating")} onChange={e => setNested(`pain${n}`,"precipitating",e.target.value)} /></Field>
                <Field label="Does the pain radiate?">
                  <RadioGroup name={`pain${n}_radiate`} horizontal value={gn(`pain${n}`,"radiate")} onChange={v => setNested(`pain${n}`,"radiate",v)} options={[{value:"yes",label:"Yes"},{value:"no",label:"No"}]} />
                </Field>
                <Field label="Pain in patient's own words"><Input value={gn(`pain${n}`,"patient_words")} onChange={e => setNested(`pain${n}`,"patient_words",e.target.value)} /></Field>
                <Field label="What is pain preventing patient from doing?"><Input value={gn(`pain${n}`,"preventing")} onChange={e => setNested(`pain${n}`,"preventing",e.target.value)} /></Field>
                <Field label="How long does the pain last?"><Input value={gn(`pain${n}`,"duration")} onChange={e => setNested(`pain${n}`,"duration",e.target.value)} /></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Pattern to pain?">
                    <RadioGroup name={`pain${n}_pattern`} horizontal value={gn(`pain${n}`,"pattern")} onChange={v => setNested(`pain${n}`,"pattern",v)} options={[{value:"yes",label:"Yes"},{value:"no",label:"No"}]} />
                  </Field>
                  <Field label="Does pain vary?">
                    <RadioGroup name={`pain${n}_vary`} horizontal value={gn(`pain${n}`,"vary")} onChange={v => setNested(`pain${n}`,"vary",v)} options={[{value:"yes",label:"Yes"},{value:"no",label:"No"}]} />
                  </Field>
                </div>
                <Field label="Physician">
                  <RadioGroup name={`pain${n}_phys`} horizontal value={gn(`pain${n}`,"physician")} onChange={v => setNested(`pain${n}`,"physician",v)} options={[{value:"aware",label:"Aware"},{value:"notified",label:"Notified"}]} />
                </Field>
              </div>
            ))}

            <div className="border-t pt-4 space-y-3">
              <p className="font-semibold text-sm text-slate-700">Section J — Pain Effect on Function</p>
              <Field label="(J0510) Pain Effect on Sleep — Over the past 5 days:">
                <RadioGroup name="j0510" value={g("j0510")} onChange={v => set("j0510", v)} options={[
                  {value:"0",label:"0 - Does not apply - no pain in past 5 days"},
                  {value:"1",label:"1 - Rarely or not at all"},
                  {value:"2",label:"2 - Occasionally"},
                  {value:"3",label:"3 - Frequently"},
                  {value:"4",label:"4 - Almost constantly"},
                  {value:"8",label:"8 - Unable to answer"},
                ]} />
              </Field>
              <Field label="(J0520) Pain Interference with Therapy Activities — Over the past 5 days:">
                <RadioGroup name="j0520" value={g("j0520")} onChange={v => set("j0520", v)} options={[
                  {value:"0",label:"0 - Does not apply - no rehab therapy in past 5 days"},
                  {value:"1",label:"1 - Rarely or not at all"},
                  {value:"2",label:"2 - Occasionally"},
                  {value:"3",label:"3 - Frequently"},
                  {value:"4",label:"4 - Almost constantly"},
                  {value:"8",label:"8 - Unable to answer"},
                ]} />
              </Field>
              <Field label="(J0530) Pain Interference with Day-to-Day Activities — Over the past 5 days:">
                <RadioGroup name="j0530" value={g("j0530")} onChange={v => set("j0530", v)} options={[
                  {value:"1",label:"1 - Rarely or not at all"},
                  {value:"2",label:"2 - Occasionally"},
                  {value:"3",label:"3 - Frequently"},
                  {value:"4",label:"4 - Almost constantly"},
                  {value:"8",label:"8 - Unable to answer"},
                ]} />
              </Field>
            </div>
          </>
        )}
      </Section>

      {/* INTEGUMENTARY */}
      <Section title="Integumentary System" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Skin Color">
            <div className="flex gap-3 mb-1">
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={g("skin_color_wnl",false)} onChange={e=>set("skin_color_wnl",e.target.checked)} className="w-3.5 h-3.5" /> WNL</label>
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={g("skin_color_na",false)} onChange={e=>set("skin_color_na",e.target.checked)} className="w-3.5 h-3.5" /> NA</label>
            </div>
            <CheckGroup values={g("skin_color",[])} onChange={v=>set("skin_color",v)} options={["1-Pale","2-Flushed","3-Ashen","4-Jaundiced","5-Cyanosis","6-Other"]} />
          </Field>
          <Field label="Skin Turgor">
            <div className="flex gap-3 mb-1">
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={g("skin_turgor_wnl",false)} onChange={e=>set("skin_turgor_wnl",e.target.checked)} className="w-3.5 h-3.5" /> WNL</label>
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={g("skin_turgor_na",false)} onChange={e=>set("skin_turgor_na",e.target.checked)} className="w-3.5 h-3.5" /> NA</label>
            </div>
            <RadioGroup name="skin_turgor" horizontal value={g("skin_turgor")} onChange={v=>set("skin_turgor",v)} options={[{value:"good",label:"1-Good"},{value:"fair",label:"2-Fair"},{value:"poor",label:"3-Poor"}]} />
          </Field>
          <Field label="Skin Temperature">
            <CheckGroup values={g("skin_temp",[])} onChange={v=>set("skin_temp",v)} options={["1-Warm","2-Cool","3-Hot","4-Cold","5-Other"]} columns={2} />
          </Field>
          <Field label="Skin Moisture">
            <CheckGroup values={g("skin_moisture",[])} onChange={v=>set("skin_moisture",v)} options={["1-Dry","2-Clammy","3-Diaphoretic","4-Other"]} columns={2} />
          </Field>
        </div>
        <Field label="Skin Alterations"><Input value={g("skin_alterations")} onChange={e=>set("skin_alterations",e.target.value)} /></Field>
        <Field label="Notes"><Textarea value={g("skin_notes")} onChange={e=>set("skin_notes",e.target.value)} rows={2} /></Field>

        {/* Pressure Ulcers */}
        <div className="border-t pt-4 space-y-3">
          <p className="font-semibold text-sm text-slate-700">Pressure Ulcer/Wound Assessment</p>
          <Field label="(M1306) Does patient have at least one Unhealed Pressure Ulcer/Injury at Stage 2 or Higher?">
            <RadioGroup name="m1306" horizontal value={g("m1306")} onChange={v=>set("m1306",v)} options={[{value:"0",label:"0 - No"},{value:"1",label:"1 - Yes"}]} />
          </Field>
          {g("m1306") === "1" && (
            <Field label="(M1307) Oldest Stage 2 Pressure Ulcer present at discharge:">
              <RadioGroup name="m1307" value={g("m1307")} onChange={v=>set("m1307",v)} options={[
                {value:"1",label:"1 - Was present at most recent SOC/ROC assessment"},
                {value:"2",label:"2 - Developed since most recent SOC/ROC assessment"},
                {value:"na",label:"NA - No Stage 2 pressure ulcers present at discharge"},
              ]} />
            </Field>
          )}
          <Field label="(M1324) Stage of Most Problematic Unhealed Pressure Ulcer/Injury that is Stageable:">
            <RadioGroup name="m1324" horizontal value={g("m1324")} onChange={v=>set("m1324",v)} options={[
              {value:"1",label:"Stage 1"},{value:"2",label:"Stage 2"},{value:"3",label:"Stage 3"},{value:"4",label:"Stage 4"},
              {value:"na",label:"NA - No pressure ulcers"},
            ]} />
          </Field>
          <Field label="(M1330) Does patient have a Stasis Ulcer?">
            <RadioGroup name="m1330" value={g("m1330")} onChange={v=>set("m1330",v)} options={[
              {value:"0",label:"0 - No"},{value:"1",label:"1 - Yes, BOTH observable and unobservable"},
              {value:"2",label:"2 - Yes, observable ONLY"},{value:"3",label:"3 - Yes, unobservable ONLY"},
            ]} />
          </Field>
          <Field label="(M1340) Does patient have a Surgical Wound?">
            <RadioGroup name="m1340" value={g("m1340")} onChange={v=>set("m1340",v)} options={[
              {value:"0",label:"0 - No"},{value:"1",label:"1 - Yes, at least one observable surgical wound"},
              {value:"2",label:"2 - Surgical wound known but not observable"},
            ]} />
          </Field>
        </div>
      </Section>

      {/* RESPIRATORY */}
      <Section title="Respiratory System" defaultOpen={false}>
        <Field label="Respiratory Status (Mark all that apply)">
          <div className="flex gap-3 mb-2">
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={g("resp_wnl",false)} onChange={e=>set("resp_wnl",e.target.checked)} className="w-3.5 h-3.5" /> WNL</label>
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={g("resp_na",false)} onChange={e=>set("resp_na",e.target.checked)} className="w-3.5 h-3.5" /> NA</label>
          </div>
          <CheckGroup values={g("resp_status",[])} onChange={v=>set("resp_status",v)} columns={2} options={[
            "1-Orthopnea","2-Dyspnea","3-Paroxysmal nocturnal dyspnea","4-Abnormal breathing patterns",
            "5-Accessory muscles used","6-Inspiratory strider","7-Retraction/Labored breathing",
            "8-Unable to cough or expectorate independently","9-Dry non-productive cough","10-Other",
          ]} />
        </Field>
        <Field label="(M1400) When is the patient dyspneic or noticeably Short of Breath?">
          <RadioGroup name="m1400" value={g("m1400")} onChange={v=>set("m1400",v)} options={[
            {value:"0",label:"0 - Patient is not short of breath"},
            {value:"1",label:"1 - When walking more than 20 feet, climbing stairs"},
            {value:"2",label:"2 - With moderate exertion (dressing, commode, walking < 20 feet)"},
            {value:"3",label:"3 - With minimal exertion (eating, talking, other ADLs) or with agitation"},
            {value:"4",label:"4 - At rest (during day or night)"},
          ]} />
        </Field>
        <Field label="Notes"><Textarea value={g("resp_notes")} onChange={e=>set("resp_notes",e.target.value)} rows={2} /></Field>
      </Section>

      {/* CARDIOVASCULAR */}
      <Section title="Cardiovascular System" defaultOpen={false}>
        <Field label="Circulation (Mark all that apply)">
          <CheckGroup values={g("circulation",[])} onChange={v=>set("circulation",v)} columns={2} options={[
            "1-Fatigue","2-Anginal pain/discomfort","3-Cramping/Pain of extremities","4-Varicosities",
            "5-Clubbing","6-Syncope","7-Palpitations","8-Diaphoresis","9-Temperature change lower extremities","10-Other",
          ]} />
        </Field>
        <Field label="Heart Sounds">
          <CheckGroup values={g("heart_sounds",[])} onChange={v=>set("heart_sounds",v)} columns={3} options={["Regular","Irregular","Murmur","Other"]} />
        </Field>
        <Field label="Notes"><Textarea value={g("cardio_notes")} onChange={e=>set("cardio_notes",e.target.value)} rows={2} /></Field>
        <Field label="Edema">
          <RadioGroup name="edema" horizontal value={g("edema")} onChange={v=>set("edema",v)} options={[{value:"none",label:"None noted"},{value:"na",label:"NA"}]} />
          {g("edema") !== "none" && g("edema") !== "na" && (
            <div className="mt-2 grid grid-cols-2 gap-3">
              {["Non-pitting","1+","2+","3+","4+"].map(s => (
                <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="edema_grade" checked={g("edema_grade")===s} onChange={()=>set("edema_grade",s)} className="w-4 h-4 text-teal-600" /> {s}
                </label>
              ))}
            </div>
          )}
        </Field>
      </Section>

      {/* GU/GI */}
      <Section title="GU/GI/Elimination System" defaultOpen={false}>
        <Field label="Genitourinary Status (Mark all that apply)">
          <CheckGroup values={g("gu_status",[])} onChange={v=>set("gu_status",v)} columns={2} options={[
            "1-Urgency","2-Frequency","3-Burning","4-Hesitancy","5-Nocturia","6-Polyuria","7-Oliguria","8-Anuria","9-Hematuria","10-Other",
          ]} />
        </Field>
        <Field label="(M1600) Has patient been treated for a Urinary Tract Infection in the past 14 days?">
          <RadioGroup name="m1600" horizontal value={g("m1600")} onChange={v=>set("m1600",v)} options={[
            {value:"0",label:"0 - No"},{value:"1",label:"1 - Yes"},{value:"na",label:"NA - Patient on prophylactic treatment"},
          ]} />
        </Field>
        <Field label="(M1620) Bowel Incontinence Frequency">
          <RadioGroup name="m1620" value={g("m1620")} onChange={v=>set("m1620",v)} options={[
            {value:"0",label:"0 - Very rarely or never has bowel incontinence"},
            {value:"1",label:"1 - Less than once weekly"},
            {value:"2",label:"2 - One to three times weekly"},
            {value:"3",label:"3 - Four to six times weekly"},
            {value:"4",label:"4 - On a daily basis"},
            {value:"5",label:"5 - More often than once daily"},
            {value:"na",label:"NA - Patient has ostomy for bowel elimination"},
          ]} />
        </Field>
        <Field label="Gastrointestinal Status (Mark all that apply)">
          <CheckGroup values={g("gi_status",[])} onChange={v=>set("gi_status",v)} columns={2} options={[
            "1-Anorexia","2-Nausea","3-Emesis","4-Dysphagia","5-Heartburn/Reflux","6-History of ulcers","7-Other",
          ]} />
        </Field>
        <Field label="Notes"><Textarea value={g("gi_notes")} onChange={e=>set("gi_notes",e.target.value)} rows={2} /></Field>
      </Section>

      {/* COGNITIVE PATTERNS */}
      <Section title="Cognitive Patterns" defaultOpen={false}>
        <Field label="(C0100) Should Brief Interview for Mental Status (BIMS) be Conducted?">
          <RadioGroup name="c0100" value={g("c0100")} onChange={v=>set("c0100",v)} options={[
            {value:"0",label:"0 - No (patient is rarely/never understood)"},
            {value:"1",label:"1 - Yes"},
            {value:"-",label:"- Not assessed/no information"},
          ]} />
        </Field>

        {g("c0100") === "1" && (
          <div className="border rounded-lg p-4 space-y-4 bg-slate-50">
            <p className="font-semibold text-sm text-slate-700">Brief Interview for Mental Status (BIMS)</p>
            <Field label="(C0200) Repetition of Three Words — Number repeated after first attempt:">
              <RadioGroup name="c0200" horizontal value={g("c0200")} onChange={v=>set("c0200",v)} options={[
                {value:"0",label:"0-None"},{value:"1",label:"1-One"},{value:"2",label:"2-Two"},{value:"3",label:"3-Three"},{value:"-",label:"-Not assessed"},
              ]} />
            </Field>
            <Field label="(C0300A) Able to report correct year:">
              <RadioGroup name="c0300a" horizontal value={g("c0300a")} onChange={v=>set("c0300a",v)} options={[
                {value:"0",label:"0-Missed >5yrs"},{value:"1",label:"1-Missed 2-5yrs"},{value:"2",label:"2-Missed 1yr"},{value:"3",label:"3-Correct"},{value:"-",label:"-Not assessed"},
              ]} />
            </Field>
            <Field label="(C0300B) Able to report correct month:">
              <RadioGroup name="c0300b" horizontal value={g("c0300b")} onChange={v=>set("c0300b",v)} options={[
                {value:"0",label:"0-Missed >1mo"},{value:"1",label:"1-Missed 6d–1mo"},{value:"2",label:"2-Within 5 days"},{value:"-",label:"-Not assessed"},
              ]} />
            </Field>
            <Field label="(C0300C) Able to report correct day of week:">
              <RadioGroup name="c0300c" horizontal value={g("c0300c")} onChange={v=>set("c0300c",v)} options={[
                {value:"0",label:"0-Incorrect"},{value:"1",label:"1-Correct"},{value:"-",label:"-Not assessed"},
              ]} />
            </Field>
            <Field label="(C0500) BIMS Summary Score:">
              <div className="flex items-center gap-3">
                <Input type="number" min={0} max={99} value={g("c0500")} onChange={e=>set("c0500",e.target.value)} className="w-24" />
                <p className="text-xs text-slate-500">0-7: Severe · 8-12: Moderate · 13-15: Intact · 99: Unable to complete</p>
              </div>
            </Field>
          </div>
        )}

        <Field label="(M1700) Cognitive Functioning:">
          <RadioGroup name="m1700" value={g("m1700")} onChange={v=>set("m1700",v)} options={[
            {value:"0",label:"0 - Alert/oriented, able to focus and shift attention"},
            {value:"1",label:"1 - Requires prompting only under stressful/unfamiliar conditions"},
            {value:"2",label:"2 - Requires assistance in specific situations or low stimulus environment"},
            {value:"3",label:"3 - Requires considerable assistance in routine situations"},
            {value:"4",label:"4 - Totally dependent due to constant disorientation, coma, or delirium"},
          ]} />
        </Field>
        <Field label="(M1710) When confused (last 14 days):">
          <RadioGroup name="m1710" value={g("m1710")} onChange={v=>set("m1710",v)} options={[
            {value:"0",label:"0-Never"},{value:"1",label:"1-New or complex situations only"},
            {value:"2",label:"2-On awakening or at night only"},{value:"3",label:"3-Day and evening, not constantly"},
            {value:"4",label:"4-Constantly"},{value:"na",label:"NA-Patient nonresponsive"},
          ]} />
        </Field>
        <Field label="(M1720) When anxious (last 14 days):">
          <RadioGroup name="m1720" value={g("m1720")} onChange={v=>set("m1720",v)} options={[
            {value:"0",label:"0-None of the time"},{value:"1",label:"1-Less often than daily"},
            {value:"2",label:"2-Daily, not constantly"},{value:"3",label:"3-All of the time"},
            {value:"na",label:"NA-Patient nonresponsive"},
          ]} />
        </Field>
      </Section>

      {/* EMOTIONAL/BEHAVIORAL */}
      <Section title="Emotional/Behavioral Status" defaultOpen={false}>
        <Field label="(D0700) Social Isolation — How often do you feel lonely or isolated?">
          <RadioGroup name="d0700" value={g("d0700")} onChange={v=>set("d0700",v)} options={[
            {value:"0",label:"0-Never"},{value:"1",label:"1-Rarely"},{value:"2",label:"2-Sometimes"},
            {value:"3",label:"3-Often"},{value:"4",label:"4-Always"},
            {value:"7",label:"7-Patient declines to respond"},{value:"8",label:"8-Patient unable to respond"},
          ]} />
        </Field>
        <Field label="(M1740) Cognitive/behavioral/psychiatric symptoms AT LEAST ONCE A WEEK (Mark all that apply):">
          <CheckGroup values={g("m1740",[])} onChange={v=>set("m1740",v)} options={[
            "1-Memory deficit","2-Impaired decision-making","3-Verbal disruption",
            "4-Physical aggression","5-Disruptive/infantile/socially inappropriate behavior",
            "6-Delusional/hallucinatory/paranoid behavior","7-None of the above",
          ]} />
        </Field>
        <Field label="(M1745) Frequency of Disruptive Behavior Symptoms:">
          <RadioGroup name="m1745" value={g("m1745")} onChange={v=>set("m1745",v)} options={[
            {value:"0",label:"0-Never"},{value:"1",label:"1-Less than once a month"},
            {value:"2",label:"2-Once a month"},{value:"3",label:"3-Several times each month"},
            {value:"4",label:"4-Several times a week"},{value:"5",label:"5-At least daily"},
          ]} />
        </Field>
      </Section>

      {/* ADL/IADL */}
      <Section title="ADL/IADL's" defaultOpen={false}>
        {[
          {code:"m1800",label:"(M1800) Grooming",options:[
            {v:"0",l:"0-Able to groom self unaided"},{v:"1",l:"1-Utensils must be placed within reach"},
            {v:"2",l:"2-Someone must assist"},{v:"3",l:"3-Patient depends entirely on someone else"},
          ]},
          {code:"m1810",label:"(M1810) Dress UPPER Body",options:[
            {v:"0",l:"0-Able independently"},{v:"1",l:"1-Able if clothing laid out"},
            {v:"2",l:"2-Someone must help put on clothing"},{v:"3",l:"3-Depends entirely on another"},
          ]},
          {code:"m1820",label:"(M1820) Dress LOWER Body",options:[
            {v:"0",l:"0-Able independently"},{v:"1",l:"1-Able if clothing laid out"},
            {v:"2",l:"2-Someone must help"},{v:"3",l:"3-Depends entirely on another"},
          ]},
          {code:"m1830",label:"(M1830) Bathing",options:[
            {v:"0",l:"0-Able to bathe self in shower/tub independently"},
            {v:"1",l:"1-With devices, able independently"},
            {v:"2",l:"2-Able with intermittent assistance"},
            {v:"3",l:"3-Requires presence throughout"},
            {v:"4",l:"4-Unable to use shower/tub, able at sink/commode"},
            {v:"5",l:"5-Participates in bathing with assistance"},
            {v:"6",l:"6-Bathed totally by another person"},
          ]},
          {code:"m1840",label:"(M1840) Toilet Transferring",options:[
            {v:"0",l:"0-Able independently"},{v:"1",l:"1-Able when reminded/supervised"},
            {v:"2",l:"2-Unable to toilet, uses bedside commode"},{v:"3",l:"3-Able to use bedpan/urinal independently"},
            {v:"4",l:"4-Totally dependent"},
          ]},
          {code:"m1845",label:"(M1845) Toileting Hygiene",options:[
            {v:"0",l:"0-Able independently"},{v:"1",l:"1-Able if supplies laid out"},
            {v:"2",l:"2-Someone must help"},{v:"3",l:"3-Depends entirely on another"},
          ]},
          {code:"m1850",label:"(M1850) Transferring",options:[
            {v:"0",l:"0-Able to independently transfer"},{v:"1",l:"1-Minimal assistance or device"},
            {v:"2",l:"2-Able to bear weight/pivot but can't transfer self"},{v:"3",l:"3-Unable to transfer or bear weight"},
            {v:"4",l:"4-Bedfast, able to turn self"},{v:"5",l:"5-Bedfast, unable to turn self"},
          ]},
          {code:"m1860",label:"(M1860) Ambulation/Locomotion",options:[
            {v:"0",l:"0-Independently walks even/uneven surfaces and stairs"},
            {v:"1",l:"1-One-handed device, independent"},{v:"2",l:"2-Two-handed device or supervision for stairs"},
            {v:"3",l:"3-Walks only with supervision/assistance"},{v:"4",l:"4-Chairfast, wheels self independently"},
            {v:"5",l:"5-Chairfast, unable to wheel self"},{v:"6",l:"6-Bedfast"},
          ]},
          {code:"m1870",label:"(M1870) Feeding or Eating",options:[
            {v:"0",l:"0-Able to independently feed self"},{v:"1",l:"1-Independent with setup or intermittent assistance"},
            {v:"2",l:"2-Unable to feed self, must be assisted throughout"},
            {v:"3",l:"3-Takes oral AND supplemental via NG/gastrostomy"},
            {v:"4",l:"4-Unable to take orally, fed by NG/gastrostomy"},{v:"5",l:"5-Unable orally or by tube"},
          ]},
        ].map(item => (
          <Field key={item.code} label={item.label}>
            <RadioGroup name={item.code} value={g(item.code)} onChange={v=>set(item.code,v)} options={item.options.map(o=>({value:o.v,label:o.l}))} />
          </Field>
        ))}
      </Section>

      {/* GG0130 SELF-CARE */}
      <Section title="GG0130 — Self-Care (Discharge Performance)" defaultOpen={false}>
        <p className="text-xs text-slate-500 mb-3">Code patient's usual performance at Discharge. 06=Independent → 01=Dependent. 07=Refused, 09=N/A, 10=Env. limits, 88=Medical/safety, 0=Not assessed.</p>
        <div className="space-y-3">
          {[
            {key:"gg_eating",label:"A. Eating — ability to use utensils to bring food/liquid to mouth and swallow"},
            {key:"gg_oral_hygiene",label:"B. Oral Hygiene — ability to clean teeth/dentures"},
            {key:"gg_toileting_hygiene",label:"C. Toileting Hygiene — maintain perineal hygiene, adjust clothes"},
            {key:"gg_shower",label:"E. Shower/bathe self — bathe, wash, rinse, dry (excludes back/hair)"},
            {key:"gg_upper_dressing",label:"F. Upper Body Dressing — dress/undress above the waist"},
            {key:"gg_lower_dressing",label:"G. Lower Body Dressing — dress/undress below the waist (excl. footwear)"},
            {key:"gg_footwear",label:"H. Putting on/taking off footwear — socks, shoes, fasteners"},
          ].map(item => (
            <GGItem key={item.key} label={item.label} name={item.key} value={g(item.key)} onChange={v=>set(item.key,v)} />
          ))}
        </div>
      </Section>

      {/* GG0170 MOBILITY */}
      <Section title="GG0170 — Mobility (Discharge Performance)" defaultOpen={false}>
        <p className="text-xs text-slate-500 mb-3">Code patient's usual performance at Discharge using the 6-point scale.</p>
        <div className="space-y-3">
          {[
            {key:"gg_roll",label:"A. Roll left and right — roll from lying on back to left and right side"},
            {key:"gg_sit_to_lying",label:"B. Sit to lying — move from sitting on side of bed to lying flat"},
            {key:"gg_lying_to_sit",label:"C. Lying to sitting on side of bed — from lying to sitting with no back support"},
            {key:"gg_sit_to_stand",label:"D. Sit to stand — come to standing from chair, wheelchair, or bed"},
            {key:"gg_chair_bed",label:"E. Chair/bed-to-chair transfer"},
            {key:"gg_toilet_transfer",label:"F. Toilet transfer — get on and off toilet or commode"},
            {key:"gg_car_transfer",label:"G. Car transfer — transfer in/out of car or van"},
            {key:"gg_walk10",label:"I. Walk 10 feet — once standing, walk at least 10 feet"},
            {key:"gg_walk50",label:"J. Walk 50 feet with two turns"},
            {key:"gg_walk150",label:"K. Walk 150 feet"},
            {key:"gg_walk_uneven",label:"L. Walking 10 feet on uneven surfaces (turf, gravel)"},
            {key:"gg_1step",label:"M. 1 step (curb) — go up and down a curb"},
            {key:"gg_4steps",label:"N. 4 steps — go up and down 4 steps with or without a rail"},
            {key:"gg_12steps",label:"O. 12 steps — go up and down 12 steps with or without a rail"},
            {key:"gg_pick_up",label:"P. Picking up object — bend/stoop from standing to pick up small object"},
          ].map(item => (
            <GGItem key={item.key} label={item.label} name={item.key} value={g(item.key)} onChange={v=>set(item.key,v)} />
          ))}
        </div>

        <Field label="Q. Does patient use wheelchair/scooter?">
          <RadioGroup name="uses_wheelchair" horizontal value={g("uses_wheelchair")} onChange={v=>set("uses_wheelchair",v)} options={[{value:"0",label:"0-No"},{value:"1",label:"1-Yes"}]} />
        </Field>
        {g("uses_wheelchair") === "1" && (
          <div className="space-y-3">
            <GGItem label="R. Wheel 50 feet with two turns" name="gg_wheel50" value={g("gg_wheel50")} onChange={v=>set("gg_wheel50",v)} />
            <GGItem label="S. Wheel 150 feet" name="gg_wheel150" value={g("gg_wheel150")} onChange={v=>set("gg_wheel150",v)} />
            <Field label="Wheelchair type">
              <RadioGroup name="wheelchair_type" horizontal value={g("wheelchair_type")} onChange={v=>set("wheelchair_type",v)} options={[{value:"manual",label:"1-Manual"},{value:"motorized",label:"2-Motorized"}]} />
            </Field>
          </div>
        )}
      </Section>

      {/* CARE MANAGEMENT */}
      <Section title="Care Management" defaultOpen={false}>
        {[
          {code:"m2102a",label:"(M2102a) ADL assistance (transfer/ambulation, bathing, dressing, toileting, eating)"},
          {code:"m2102c",label:"(M2102c) Medication administration (oral, inhaled, or injectable)"},
          {code:"m2102d",label:"(M2102d) Medical procedures/treatments (wound dressing, home exercise)"},
          {code:"m2102f",label:"(M2102f) Supervision and safety (due to cognitive impairment)"},
        ].map(item => (
          <Field key={item.code} label={item.label}>
            <RadioGroup name={item.code} value={g(item.code)} onChange={v=>set(item.code,v)} options={[
              {value:"0",label:"0 - No assistance needed"},
              {value:"1",label:"1 - Non-agency caregiver(s) currently provide assistance"},
              {value:"2",label:"2 - Non-agency caregiver(s) need training/supportive services"},
              {value:"3",label:"3 - Non-agency caregiver(s) not likely to provide assistance"},
              {value:"4",label:"4 - Assistance needed, but no non-agency caregiver available"},
            ]} />
          </Field>
        ))}

        <Field label="(M2005) Medication Intervention — Did the agency complete physician prescribed/recommended actions?">
          <RadioGroup name="m2005" value={g("m2005")} onChange={v=>set("m2005",v)} options={[
            {value:"0",label:"0 - No"},{value:"1",label:"1 - Yes"},
            {value:"9",label:"9 - NA - No potential medication issues identified"},
            {value:"-",label:"- Not assessed/no information"},
          ]} />
        </Field>

        <Field label="(M2020) Management of Oral Medications:">
          <RadioGroup name="m2020" value={g("m2020")} onChange={v=>set("m2020",v)} options={[
            {value:"0",label:"0 - Able to independently take correct oral medications"},
            {value:"1",label:"1 - Able if dosages preprepared or drug diary developed"},
            {value:"2",label:"2 - Able if given reminders by another person"},
            {value:"3",label:"3 - UNABLE to take medication unless administered by another"},
            {value:"na",label:"NA - No oral medications prescribed"},
          ]} />
        </Field>
      </Section>

      {/* MUSCULOSKELETAL */}
      <Section title="Musculoskeletal" defaultOpen={false}>
        <Field label="Musculoskeletal (Mark all that apply)">
          <div className="flex gap-3 mb-2">
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={g("msk_na",false)} onChange={e=>set("msk_na",e.target.checked)} className="w-3.5 h-3.5" /> NA</label>
          </div>
          <CheckGroup values={g("msk",[])} onChange={v=>set("msk",v)} columns={3} options={[
            "Hx arthritis","Joint pain","Tenderness","Weakness","Deformities","Gout","Stiffness","Leg cramps","Unequal grasp",
            "Swollen joints","Numbness","Tremor","Contractures","Decreased ROM","Atrophy",
          ]} />
        </Field>
        <Field label="Paralysis (describe)"><Input value={g("msk_paralysis")} onChange={e=>set("msk_paralysis",e.target.value)} /></Field>
        <Field label="Amputation (where)"><Input value={g("msk_amputation")} onChange={e=>set("msk_amputation",e.target.value)} /></Field>
        <Field label="Coordination, gait, balance (describe)"><Textarea value={g("msk_coordination")} onChange={e=>set("msk_coordination",e.target.value)} rows={2} /></Field>
        <Field label="Comments (Prostheses, appliances)"><Textarea value={g("msk_comments")} onChange={e=>set("msk_comments",e.target.value)} rows={2} /></Field>
      </Section>

      {/* SECTION J - FALLS */}
      <Section title="Section J — Health Conditions / Falls" defaultOpen={false}>
        <Field label="(J1800) Any Falls Since SOC/ROC, whichever is more recent?">
          <RadioGroup name="j1800" horizontal value={g("j1800")} onChange={v=>set("j1800",v)} options={[
            {value:"0",label:"0 - No"},{value:"1",label:"1 - Yes"},{value:"-",label:"- Not assessed/no information"},
          ]} />
        </Field>
        {g("j1800") === "1" && (
          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700">(J1900) Number of Falls Since SOC/ROC, by injury level:</p>
            {[
              {key:"j1900a",label:"A. No injury — no evidence of injury, no complaints of pain"},
              {key:"j1900b",label:"B. Injury (except major) — as described in OASIS manual"},
              {key:"j1900c",label:"C. Major injury — as described in OASIS manual"},
            ].map(item => (
              <Field key={item.key} label={item.label}>
                <RadioGroup name={item.key} horizontal value={g(item.key)} onChange={v=>set(item.key,v)} options={[
                  {value:"0",label:"0-None"},{value:"1",label:"1-One"},{value:"2",label:"2-Two or more"},{value:"-",label:"-Not assessed"},
                ]} />
              </Field>
            ))}
          </div>
        )}
      </Section>

      {/* DISCHARGE */}
      <Section title="Discharge Information" defaultOpen={false}>
        <Field label="(M0906) Discharge/Transfer/Death Date">
          <Input type="date" value={g("m0906")} onChange={e=>set("m0906",e.target.value)} />
        </Field>
        <Field label="(M2301) Emergent Care — Has patient utilized a hospital emergency department since most recent SOC/ROC?">
          <RadioGroup name="m2301" value={g("m2301")} onChange={v=>set("m2301",v)} options={[
            {value:"0",label:"0 - No"},
            {value:"1",label:"1 - Yes, used ED WITHOUT hospital admission"},
            {value:"2",label:"2 - Yes, used ED WITH hospital admission"},
            {value:"uk",label:"UK - Unknown"},
          ]} />
        </Field>
        <Field label="(M2410) To which Inpatient Facility has the patient been admitted?">
          <RadioGroup name="m2410" value={g("m2410")} onChange={v=>set("m2410",v)} options={[
            {value:"1",label:"1 - Hospital"},{value:"2",label:"2 - Rehabilitation facility"},
            {value:"3",label:"3 - Nursing home"},{value:"4",label:"4 - Hospice"},
            {value:"na",label:"NA - No inpatient facility admission"},
          ]} />
        </Field>
        <Field label="(M2420) Discharge Disposition — Where is the patient after discharge?">
          <RadioGroup name="m2420" value={g("m2420")} onChange={v=>set("m2420",v)} options={[
            {value:"1",label:"1 - Patient remained in community (without skilled services from Medicare Certified HHA)"},
            {value:"2",label:"2 - Patient remained in community (with skilled services from Medicare Certified HHA)"},
            {value:"3",label:"3 - Patient transferred to non-institutional hospice"},
            {value:"4",label:"4 - Unknown — patient moved to geographic location not served by this agency"},
            {value:"uk",label:"UK - Other unknown"},
          ]} />
        </Field>
        <Field label="(M2401b) Falls prevention interventions — included in plan of care AND implemented?">
          <RadioGroup name="m2401b" horizontal value={g("m2401b")} onChange={v=>set("m2401b",v)} options={[
            {value:"0",label:"0-No"},{value:"1",label:"1-Yes"},{value:"na",label:"NA"},
          ]} />
        </Field>
        <Field label="(M2401c) Depression interventions — included in plan of care AND implemented?">
          <RadioGroup name="m2401c" horizontal value={g("m2401c")} onChange={v=>set("m2401c",v)} options={[
            {value:"0",label:"0-No"},{value:"1",label:"1-Yes"},{value:"na",label:"NA"},
          ]} />
        </Field>
        <Field label="(M2401d) Interventions to monitor and mitigate pain — included in plan of care AND implemented?">
          <RadioGroup name="m2401d" horizontal value={g("m2401d")} onChange={v=>set("m2401d",v)} options={[
            {value:"0",label:"0-No"},{value:"1",label:"1-Yes"},{value:"na",label:"NA"},
          ]} />
        </Field>
        <Field label="(A2121) Provision of Reconciled Medication List to Subsequent Provider at Discharge?">
          <RadioGroup name="a2121" horizontal value={g("a2121")} onChange={v=>set("a2121",v)} options={[
            {value:"0",label:"0 - No"},{value:"1",label:"1 - Yes"},
          ]} />
        </Field>
        {g("a2121") === "1" && (
          <Field label="(A2122) Route of Transmission to Subsequent Provider:">
            <CheckGroup values={g("a2122",[])} onChange={v=>set("a2122",v)} options={[
              "A. Electronic Health Record","B. Health Information Exchange",
              "C. Verbal (in-person, telephone, video)","D. Paper-based (fax, copies, printouts)","E. Other Methods (texting, email, CDs)",
            ]} />
          </Field>
        )}
        <Field label="(A2123) Provision of Reconciled Medication List to Patient at Discharge?">
          <RadioGroup name="a2123" horizontal value={g("a2123")} onChange={v=>set("a2123",v)} options={[
            {value:"0",label:"0 - No"},{value:"1",label:"1 - Yes"},
          ]} />
        </Field>
        {g("a2123") === "1" && (
          <Field label="(A2124) Route of Transmission to Patient:">
            <CheckGroup values={g("a2124",[])} onChange={v=>set("a2124",v)} options={[
              "A. Electronic Health Record","B. Health Information Exchange",
              "C. Verbal (in-person, telephone, video)","D. Paper-based (fax, copies, printouts)","E. Other Methods (texting, email, CDs)",
            ]} />
          </Field>
        )}
      </Section>

      <div className="text-xs text-slate-400 pt-2 border-t">
        OASIS-E2 · Effective 4/1/2026 · Centers for Medicare &amp; Medicaid Services · OMB Control Number: 0938-1279 · Expires 12/31/2027
      </div>
    </div>
  );
}