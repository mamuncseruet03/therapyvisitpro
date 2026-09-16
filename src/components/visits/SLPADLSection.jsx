"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EVAL_GOAL_OPTIONS = ["", "1", "2", "3", "4", "5", "6", "7"];
const VC_TC_OPTIONS = ["", "1", "2", "3"];

const SCORE_COLS = ["Eval", "VC", "TC", "Goal"];

const ADL_ROWS = [
  { key: "primary_functions", label: "Primary Functions" },
  { key: "automatic_speech", label: "Automatic Speech" },
  { key: "auditory_comprehension", label: "Auditory Comprehension" },
  { key: "naming", label: "Naming" },
  { key: "repetition_words", label: "Repetition Words" },
  { key: "repetition_phrases", label: "Repetition Phrases" },
  { key: "reading_prosody", label: "Reading Prosody" },
  { key: "abstract_reasoning", label: "Abstract Reasoning" },
  { key: "direct_imitation", label: "Direct Imitation" },
  { key: "imitate_gestures", label: "Imitate Gestures" },
  { key: "imitate", label: "Imitate" },
  { key: "fluency", label: "Fluency" },
  { key: "syntax_grammar", label: "Syntax / Grammar" },
  { key: "formulation_organization", label: "Formulation / Organization Fluency" },
  { key: "prosody", label: "Prosody" },
  { key: "functional_communication", label: "Functional Communication / Ability" },
  { key: "voice_quality", label: "Voice Quality" },
  { key: "vocal_pattern", label: "Vocal Pattern" },
  { key: "intelligibility_fluency", label: "Intelligibility / Fluency" },
  { key: "articulation_praxis", label: "Articulation / Praxis" },
  { key: "gross_motor_memory", label: "Gross Motor Memory" },
  { key: "picture_memory", label: "Picture Memory" },
  { key: "praxis_sustained_attention", label: "Praxis Sustained Attention" },
  { key: "long_term_memory", label: "Long-term Memory" },
  { key: "orientation", label: "Orientation" },
  { key: "dysarthria", label: "Dysarthria" },
  { key: "apraxia", label: "Apraxia" },
  { key: "intellectual_deficit", label: "Intellectual Deficit" },
];

const ColSelect = ({ value, onChange, options }) => (
  <Select value={value || ""} onValueChange={onChange}>
    <SelectTrigger className="h-7 w-16 text-xs px-1">
      <SelectValue placeholder="—" />
    </SelectTrigger>
    <SelectContent>
      {options.map((o) => (
        <SelectItem key={o} value={o || "__none__"}>{o || "—"}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default function SLPADLSection({ slpAdl = {}, onChange }) {
  const set = (key, col, value) => {
    onChange({
      ...slpAdl,
      [key]: {
        ...(slpAdl[key] || {}),
        [col]: value === "__none__" ? "" : value,
      },
    });
  };

  const setOther = (idx, field, value) => {
    const others = slpAdl.other_rows ? [...slpAdl.other_rows] : [
      { label: "", oral: "", ic: "", tc: "", gait: "" },
      { label: "", oral: "", ic: "", tc: "", gait: "" },
      { label: "", oral: "", ic: "", tc: "", gait: "" },
    ];
    while (others.length <= idx) others.push({ label: "", oral: "", ic: "", tc: "", gait: "" });
    others[idx] = { ...others[idx], [field]: value };
    onChange({ ...slpAdl, other_rows: others });
  };

  const otherRows = slpAdl.other_rows || [
    { label: "", oral: "", ic: "", tc: "", gait: "" },
    { label: "", oral: "", ic: "", tc: "", gait: "" },
    { label: "", oral: "", ic: "", tc: "", gait: "" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800">ADL Function</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b">
                <th className="text-left py-2 px-3 font-semibold text-slate-700 w-48"></th>
                {SCORE_COLS.map((col) => (
                  <th key={col} className="text-center py-2 px-1 font-semibold text-slate-700 w-24">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ADL_ROWS.map((row, i) => {
                const rowData = slpAdl[row.key] || {};
                return (
                  <tr key={row.key} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="py-1.5 px-3 font-medium text-teal-700 text-xs leading-tight">{row.label}</td>
                    <td className="py-1.5 px-1 text-center">
                      <ColSelect value={rowData.oral} onChange={(v) => set(row.key, "oral", v)} options={EVAL_GOAL_OPTIONS} />
                    </td>
                    <td className="py-1.5 px-1 text-center">
                      <ColSelect value={rowData.ic} onChange={(v) => set(row.key, "ic", v)} options={VC_TC_OPTIONS} />
                    </td>
                    <td className="py-1.5 px-1 text-center">
                      <ColSelect value={rowData.tc} onChange={(v) => set(row.key, "tc", v)} options={VC_TC_OPTIONS} />
                    </td>
                    <td className="py-1.5 px-1 text-center">
                      <ColSelect value={rowData.gait} onChange={(v) => set(row.key, "gait", v)} options={EVAL_GOAL_OPTIONS} />
                    </td>
                  </tr>
                );
              })}

              {/* Other rows */}
              <tr className="bg-slate-100 border-t">
                <td colSpan={5} className="py-2 px-3 font-semibold text-slate-700 text-xs">Other</td>
              </tr>
              {otherRows.map((row, i) => (
                <tr key={`other_${i}`} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="py-1.5 px-3">
                    <Input
                      value={row.label || ""}
                      onChange={(e) => setOther(i, "label", e.target.value)}
                      placeholder="Description"
                      className="h-7 text-xs"
                    />
                  </td>
                  <td className="py-1.5 px-1 text-center">
                    <ColSelect value={row.oral} onChange={(v) => setOther(i, "oral", v === "__none__" ? "" : v)} options={EVAL_GOAL_OPTIONS} />
                  </td>
                  <td className="py-1.5 px-1 text-center">
                    <ColSelect value={row.ic} onChange={(v) => setOther(i, "ic", v === "__none__" ? "" : v)} options={VC_TC_OPTIONS} />
                  </td>
                  <td className="py-1.5 px-1 text-center">
                    <ColSelect value={row.tc} onChange={(v) => setOther(i, "tc", v === "__none__" ? "" : v)} options={VC_TC_OPTIONS} />
                  </td>
                  <td className="py-1.5 px-1 text-center">
                    <ColSelect value={row.gait} onChange={(v) => setOther(i, "gait", v === "__none__" ? "" : v)} options={EVAL_GOAL_OPTIONS} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
