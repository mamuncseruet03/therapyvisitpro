"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const EVAL_GOAL_OPTIONS = ["", "1", "2", "3", "4", "5", "6", "7"];

const FACIAL_ROWS = [
  { key: "facial_symmetry_right", label: "Facial Symmetry Right" },
  { key: "facial_symmetry_left", label: "Facial Symmetry Left" },
];

const ORAL_ROWS = [
  { key: "labial_symmetry_right", label: "Labial Symmetry Right" },
  { key: "labial_symmetry_left", label: "Labial Symmetry Left" },
  { key: "lingual_rom", label: "Lingual ROM" },
  { key: "lingual_coordination", label: "Lingual Coordination" },
  { key: "dentition", label: "Dentition" },
  { key: "mastication", label: "Mastication" },
];

const THICKNESS_COLS = ["Thin", "Nectar", "Honey", "Pudding"];

const LIQUID_ROWS = [
  { key: "timeliness_oral_phase", label: "Timeliness of Oral Phase", hasGoal: true },
  { key: "drooling_spillage", label: "Drooling/Spillage of Bolus", hasGoal: true },
  { key: "residue_oral_cavity", label: "Residue in Oral Cavity", hasGoal: true },
  { key: "pharyngeal_trigger", label: "Pharyngeal Trigger", hasGoal: true },
  { key: "laryngeal_elevation", label: "Laryngeal Elevation", hasGoal: true },
  { key: "wet_vocal_quality", label: "Wet Vocal Quality", hasGoal: false },
  { key: "cough", label: "Cough", hasGoal: false },
  { key: "other_overt", label: "Other Overt S/S", hasGoal: true },
];

const EvalGoalSelect = ({ value, onChange }) => (
  <Select value={value || ""} onValueChange={onChange}>
    <SelectTrigger className="h-7 w-16 text-xs px-1">
      <SelectValue placeholder="—" />
    </SelectTrigger>
    <SelectContent>
      {EVAL_GOAL_OPTIONS.map((o) => (
        <SelectItem key={o} value={o || "__none__"}>{o || "—"}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const STRATEGIES_GROUP1 = ["Chin Tuck", "Small Sips", "Small Bites"];
const STRATEGIES_GROUP2 = ["No Straws", "Double Swallow", "Bite/Sip Seq"];
const STRATEGIES_GROUP3 = ["Head Turn L", "Head Turn R", "Liq by Spoon"];

function StrategyTable({ strategies, data, onChange }) {
  const set = (strategy, row, val) => {
    onChange({ ...data, [`${strategy}_${row}`]: val });
  };
  return (
    <table className="text-xs border-collapse mb-4">
      <thead>
        <tr>
          <th className="text-left py-1 pr-4 font-semibold text-slate-700 w-28">Strategy</th>
          {strategies.map((s) => (
            <th key={s} className="text-center py-1 px-2 font-semibold text-slate-700 w-24">{s}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {["Tested", "Recommended"].map((row) => (
          <tr key={row}>
            <td className="py-1.5 pr-4 font-medium text-slate-700">{row}</td>
            {strategies.map((s) => (
              <td key={s} className="text-center py-1.5 px-2">
                <input
                  type="checkbox"
                  checked={!!(data[`${s}_${row}`])}
                  onChange={(e) => set(s, row, e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer"
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ThicknessModal({ title, data, onChange, onClose }) {
  const setCell = (rowKey, col, subKey, value) => {
    onChange({
      ...data,
      [`${rowKey}_${col}_${subKey}`]: value === "__none__" ? "" : value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="text-left py-2 px-2 font-semibold text-slate-700 w-36">Liquid</th>
                <th className="text-center py-2 px-1 font-semibold text-slate-600 w-8"></th>
                {THICKNESS_COLS.map((col) => (
                  <th key={col} className="text-center py-2 px-2 font-semibold text-slate-700">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LIQUID_ROWS.map((row, i) => (
                <React.Fragment key={row.key}>
                  {/* Eval row */}
                  <tr className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="py-1.5 px-2 font-medium text-teal-700 leading-tight">{row.label}</td>
                    <td className="py-1.5 px-1 text-xs text-slate-400"></td>
                    {THICKNESS_COLS.map((col) => (
                      <td key={col} className="py-1.5 px-1 text-center">
                        <EvalGoalSelect
                          value={data[`${row.key}_${col}_eval`]}
                          onChange={(v) => setCell(row.key, col, "eval", v)}
                        />
                      </td>
                    ))}
                  </tr>
                  {/* Goal row */}
                  {row.hasGoal && (
                    <tr className={i % 2 === 0 ? "bg-blue-50/40" : "bg-slate-100/60"}>
                      <td className="py-1.5 px-2 text-slate-500 italic pl-4">Goal</td>
                      <td></td>
                      {THICKNESS_COLS.map((col) => (
                        <td key={col} className="py-1.5 px-1 text-center">
                          <EvalGoalSelect
                            value={data[`${row.key}_${col}_goal`]}
                            onChange={(v) => setCell(row.key, col, "goal", v)}
                          />
                        </td>
                      ))}
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t sticky bottom-0 bg-white">
          <Button type="button" onClick={onClose} className="bg-teal-600 hover:bg-teal-700">Save</Button>
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

export default function SLPSwallowSection({ swallow = {}, onChange }) {
  const [openModal, setOpenModal] = useState(null);

  const setField = (key, subKey, value) => {
    onChange({
      ...swallow,
      [key]: { ...(swallow[key] || {}), [subKey]: value === "__none__" ? "" : value },
    });
  };

  const setTop = (key, value) => onChange({ ...swallow, [key]: value });

  const setStrategy = (data) => {
    onChange({ ...swallow, strategies: { ...(swallow.strategies || {}), ...data } });
  };

  const setModalData = (type, data) => {
    onChange({ ...swallow, [`${type.toLowerCase()}_data`]: data });
  };

  const strategies = swallow.strategies || {};

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800">Swallow Function</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Facial Symmetry */}
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left py-1 pr-4 font-semibold text-slate-700 w-48"></th>
              <th className="text-center py-1 px-2 font-semibold text-slate-700 w-20">Eval</th>
              <th className="text-center py-1 px-2 font-semibold text-slate-700 w-20">Goal</th>
            </tr>
          </thead>
          <tbody>
            {FACIAL_ROWS.map((row, i) => {
              const d = swallow[row.key] || {};
              return (
                <tr key={row.key} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="py-1.5 pr-4 font-medium text-teal-700">{row.label}</td>
                  <td className="py-1.5 px-2 text-center">
                    <EvalGoalSelect value={d.eval} onChange={(v) => setField(row.key, "eval", v)} />
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <EvalGoalSelect value={d.goal} onChange={(v) => setField(row.key, "goal", v)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Oral Motor / Lingual */}
        <div className="border-t pt-4">
          <table className="w-full text-xs border-collapse">
            <tbody>
              {ORAL_ROWS.map((row, i) => {
                const d = swallow[row.key] || {};
                return (
                  <tr key={row.key} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="py-1.5 pr-4 font-medium text-teal-700 w-48">{row.label}</td>
                    <td className="py-1.5 px-2 text-center w-20">
                      <EvalGoalSelect value={d.eval} onChange={(v) => setField(row.key, "eval", v)} />
                    </td>
                    <td className="py-1.5 px-2 text-center w-20">
                      <EvalGoalSelect value={d.goal} onChange={(v) => setField(row.key, "goal", v)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Liquids / Solids / Meats */}
        <div className="border-t pt-4 space-y-3">
          {["Liquids", "Solids", "Meats"].map((item) => {
            const dataKey = `${item.toLowerCase()}_data`;
            const hasData = swallow[dataKey] && Object.keys(swallow[dataKey]).some(k => swallow[dataKey][k]);
            return (
              <div key={item} className="flex items-center gap-4">
                <span className="text-sm font-medium text-teal-700 w-20">{item}</span>
                <button
                  type="button"
                  onClick={() => setOpenModal(item)}
                  className={`px-4 py-1 rounded text-sm font-medium border transition-colors ${
                    hasData
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200"
                  }`}
                >
                  Test
                </button>
                {hasData && <span className="text-xs text-teal-600">Data entered</span>}
              </div>
            );
          })}
        </div>

        {/* Strategy Tables */}
        <div className="border-t pt-4 space-y-2">
          <StrategyTable strategies={STRATEGIES_GROUP1} data={strategies} onChange={setStrategy} />
          <StrategyTable strategies={STRATEGIES_GROUP2} data={strategies} onChange={setStrategy} />
          <StrategyTable strategies={STRATEGIES_GROUP3} data={strategies} onChange={setStrategy} />
        </div>

        {/* Recommended Diet */}
        <div className="border-t pt-4 space-y-2">
          <Label className="text-sm font-medium text-slate-700">Recommended Diet</Label>
          <div className="relative">
            <Textarea
              maxLength={600}
              value={swallow.recommended_diet || ""}
              onChange={(e) => setTop("recommended_diet", e.target.value)}
              rows={4}
              className="text-sm"
            />
            <span className="absolute right-2 bottom-2 text-xs text-slate-400">
              {(swallow.recommended_diet || "").length} of 600
            </span>
          </div>
        </div>

        {/* Modified Barium Swallow Study */}
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium text-slate-700 whitespace-nowrap">Modified Barium Swallow Study?</Label>
          <Select value={swallow.modified_barium || "No"} onValueChange={(v) => setTop("modified_barium", v)}>
            <SelectTrigger className="w-24 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="No">No</SelectItem>
              <SelectItem value="Yes">Yes</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </CardContent>

      {/* Thickness Modal */}
      {openModal && (
        <ThicknessModal
          title={openModal}
          data={swallow[`${openModal.toLowerCase()}_data`] || {}}
          onChange={(data) => setModalData(openModal, data)}
          onClose={() => setOpenModal(null)}
        />
      )}
    </Card>
  );
}
