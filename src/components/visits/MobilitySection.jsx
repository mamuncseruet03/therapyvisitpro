"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FUNCTIONAL_LEVELS = [
  { value: "independent", label: "Independent" },
  { value: "modified_independent", label: "Modified Independent" },
  { value: "supervision", label: "Supervision" },
  { value: "minimal_assist", label: "Minimal Assist" },
  { value: "moderate_assist", label: "Moderate Assist" },
  { value: "maximal_assist", label: "Maximal Assist" },
  { value: "dependent", label: "Dependent" },
];

const SENSORY_COLS = ["NT", "I", "MIN", "MOD", "SI", "U"];
const COGNITIVE_COLS = ["NT", "I", "MIN", "MOD", "SI", "U"];
const COGNITIVE_COL_LABELS = { NT: "Not Tested", I: "Intact", MIN: "Minimally Impaired", MOD: "Moderately Impaired", SI: "Severely Impaired", U: "Absent/Unable" };
const COGNITIVE_ROWS = ["Short Term Memory", "Long Term Memory", "Orientation: Person", "Orientation: Place", "Orientation: Time"];
const SENSORY_COL_LABELS = { NT: "Not Tested", I: "Intact", MIN: "Minimally Impaired", MOD: "Moderately Impaired", SI: "Severely Impaired", U: "Absent/Unable" };
const SENSORY_ROWS = ["Visual Function", "Hearing Function", "Pain Perception", "Temperature Perception", "Pressure Awareness"];

export default function MobilitySection({ form, set, isOT = false }) {
  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-cyan-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Mobility Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bed Mobility */}
          <div>
            <Label className="text-blue-700 font-semibold block mb-2">Bed Mobility</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {["Rolling Right", "Rolling Left", "Supine to Sit", "Sit to Supine"].map((item) => (
                <div key={item}>
                  <Label className="text-xs text-slate-600 mb-1 block">{item}</Label>
                  <Select value={(form.mobility_bed || {})[item] || ""} onValueChange={(v) => set("mobility_bed", { ...(form.mobility_bed || {}), [item]: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>{FUNCTIONAL_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Transfers */}
          <div className="border-t pt-4">
            <Label className="text-blue-700 font-semibold block mb-2">Transfers</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {["Sit to Stand", "Stand to Sit", "Bed to Chair", "Chair to Bed", "Toilet Transfer", "Tub/Shower Transfer"].map((item) => (
                <div key={item}>
                  <Label className="text-xs text-slate-600 mb-1 block">{item}</Label>
                  <Select value={(form.mobility_transfers || {})[item] || ""} onValueChange={(v) => set("mobility_transfers", { ...(form.mobility_transfers || {}), [item]: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>{FUNCTIONAL_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Ambulation */}
          <div className="border-t pt-4">
            <Label className="text-blue-700 font-semibold block mb-2">Ambulation</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <Label className="text-xs text-slate-600 mb-1 block">Assistance</Label>
                <Select value={form.ambulation_level || ""} onValueChange={(v) => set("ambulation_level", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {FUNCTIONAL_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    <SelectItem value="non_ambulatory">Non Ambulatory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-600 mb-1 block">Assistive Device</Label>
                <Select value={form.ambulation_device || ""} onValueChange={(v) => set("ambulation_device", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select device" /></SelectTrigger>
                  <SelectContent>
                    {["None","Straight Cane","Quad Cane","Hemi Walker","Standard Walker","Wheeled Walker","Rollator","Axillary Crutches","Lofstrand Crutches","Wheelchair"].map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-600 mb-1 block">Distance (feet)</Label>
                <Input type="number" placeholder="e.g. 150" value={form.ambulation_distance || ""} onChange={(e) => set("ambulation_distance", e.target.value)} className="h-8 text-xs" />
              </div>
            </div>

            {/* Weight Bearing */}
            <div className="bg-slate-50 border rounded-lg p-3 mb-3">
              <Label className="text-blue-700 font-semibold block mb-2">Weight Bearing</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: "right_le", label: "Right Lower Extremity" },
                  { key: "left_le", label: "Left Lower Extremity" },
                  { key: "right_ue", label: "Right Upper Extremity" },
                  { key: "left_ue", label: "Left Upper Extremity" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <Label className="text-xs text-slate-600 mb-1 block">{label}</Label>
                    <Select value={(form.weight_bearing || {})[key] || ""} onValueChange={(v) => set("weight_bearing", { ...(form.weight_bearing || {}), [key]: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        {["Full Weight Bearing (FWB)","Weight Bearing as Tolerated (WBAT)","Partial Weight Bearing (PWB)","Toe Touch Weight Bearing (TTWB)","Non Weight Bearing (NWB)","N/A"].map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <Label className="text-xs text-slate-600 mb-1 block">Weight Bearing Notes</Label>
                <Textarea placeholder="Weight bearing precautions, physician orders..." value={form.weight_bearing_notes || ""} onChange={(e) => set("weight_bearing_notes", e.target.value)} rows={2} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-600 mb-1 block">Ambulation Notes</Label>
              <Textarea placeholder="Gait deviations, endurance, safety observations..." value={form.ambulation_notes || ""} onChange={(e) => set("ambulation_notes", e.target.value)} rows={2} />
            </div>
          </div>

          {/* Balance */}
          <div className="border-t pt-4">
            <Label className="text-blue-700 font-semibold block mb-2">Balance</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: "sitting_static", label: "Sitting - Static" },
                { key: "sitting_dynamic", label: "Sitting - Dynamic" },
                { key: "standing_static", label: "Standing - Static" },
                { key: "standing_dynamic", label: "Standing - Dynamic" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <Label className="text-xs text-slate-600 mb-1 block">{label}</Label>
                  <Select value={(form.balance_assessment || {})[key] || ""} onValueChange={(v) => set("balance_assessment", { ...(form.balance_assessment || {}), [key]: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Normal Good","Good+","Good","Good-","Fair+","Fair","Fair-","Poor+","Poor","Poor-","Unable to Test"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Stairs */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-blue-700 font-semibold">Stairs / Steps</Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.stairs_not_applicable || false} onChange={(e) => set("stairs_not_applicable", e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" />
                <span className="text-sm text-slate-600">Not Applicable</span>
              </label>
            </div>
            {!form.stairs_not_applicable && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-600 mb-1 block">Stair Negotiation</Label>
                    <Select value={form.stair_negotiation || ""} onValueChange={(v) => set("stair_negotiation", v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>{FUNCTIONAL_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600 mb-1 block"># of Steps at Home</Label>
                    <Input type="number" placeholder="e.g. 12" value={form.stairs_at_home || ""} onChange={(e) => set("stairs_at_home", e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
                <div className="mt-2">
                  <Label className="text-xs text-slate-600 mb-1 block">Stair Notes</Label>
                  <Textarea placeholder="Railing availability, step height, technique..." value={form.stair_notes || ""} onChange={(e) => set("stair_notes", e.target.value)} rows={2} />
                </div>
              </>
            )}
          </div>

          {/* General Mobility Notes */}
          <div className="border-t pt-4">
            <Label className="text-blue-700 font-semibold">General Mobility Notes</Label>
            <Textarea placeholder="Overall mobility observations, safety concerns, equipment recommendations..." value={form.mobility_notes || ""} onChange={(e) => set("mobility_notes", e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Sensory -- OT only */}
      {isOT && (
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">Sensory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
              {SENSORY_COLS.map((col) => (
                <span key={col} className="text-[10px] text-slate-500">
                  <span className="font-bold text-slate-700">{col}</span> = {SENSORY_COL_LABELS[col]}
                </span>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-1 pr-2 font-medium text-slate-600 w-44"></th>
                    {SENSORY_COLS.map((col) => (
                      <th key={col} className="text-center py-1 px-2 font-semibold text-slate-700 w-12">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SENSORY_ROWS.map((row, i) => (
                    <tr key={row} className={i % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                      <td className="py-2 pr-2 text-indigo-700 font-medium text-xs leading-tight">{row}</td>
                      {SENSORY_COLS.map((col) => (
                        <td key={col} className="text-center py-2 px-2">
                          <input
                            type="radio"
                            name={`sensory_${row}`}
                            checked={((form.sensory_assessment || {})[row] || "") === col}
                            onChange={() => set("sensory_assessment", { ...(form.sensory_assessment || {}), [row]: col })}
                            className="w-3.5 h-3.5 text-indigo-600 cursor-pointer"
                            title={SENSORY_COL_LABELS[col]}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Label className="text-sm text-slate-600 mb-1 block">Comments</Label>
              <div className="relative">
                <Textarea maxLength={300} placeholder="" value={(form.sensory_assessment || {}).comments || ""} onChange={(e) => set("sensory_assessment", { ...(form.sensory_assessment || {}), comments: e.target.value })} rows={4} />
              </div>
              <div className="text-right text-xs text-slate-400 mt-1">{((form.sensory_assessment || {}).comments || "").length} of 300</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cognitive -- OT only */}
      {isOT && (
        <Card className="border-l-4 border-l-blue-400">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">Cognitive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
              {COGNITIVE_COLS.map((col) => (
                <span key={col} className="text-[10px] text-slate-500">
                  <span className="font-bold text-slate-700">{col}</span> = {COGNITIVE_COL_LABELS[col]}
                </span>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-1 pr-2 font-medium text-slate-600 w-44"></th>
                    {COGNITIVE_COLS.map((col) => (
                      <th key={col} className="text-center py-1 px-2 font-semibold text-slate-700 w-12">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COGNITIVE_ROWS.map((row, i) => (
                    <tr key={row} className={i % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                      <td className="py-2 pr-2 text-blue-700 font-medium text-xs leading-tight">{row}</td>
                      {COGNITIVE_COLS.map((col) => (
                        <td key={col} className="text-center py-2 px-2">
                          <input
                            type="radio"
                            name={`cognitive_${row}`}
                            checked={((form.cognitive_assessment || {})[row] || "") === col}
                            onChange={() => set("cognitive_assessment", { ...(form.cognitive_assessment || {}), [row]: col })}
                            className="w-3.5 h-3.5 text-blue-600 cursor-pointer"
                            title={COGNITIVE_COL_LABELS[col]}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Label className="text-sm text-slate-600 mb-1 block">Comments</Label>
              <div className="relative">
                <Textarea maxLength={300} placeholder="" value={(form.cognitive_assessment || {}).comments || ""} onChange={(e) => set("cognitive_assessment", { ...(form.cognitive_assessment || {}), comments: e.target.value })} rows={4} />
              </div>
              <div className="text-right text-xs text-slate-400 mt-1">{((form.cognitive_assessment || {}).comments || "").length} of 300</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prosthetic Device / Adaptive Equipment -- OT only */}
      {isOT && (
        <Card className="border-l-4 border-l-teal-400">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">Prosthetic Device/Adaptive Equipment (Existing)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: "none", label: "None", hasReason: false },
              { key: "cast_splint", label: "Cast/Splint", hasReason: true, maxLen: 100 },
              { key: "cane", label: "Cane", hasReason: true, maxLen: 100 },
              { key: "prosthesis", label: "Prosthesis", hasReason: true, maxLen: 100 },
              { key: "walker", label: "Walker", hasReason: true, maxLen: 100 },
              { key: "adaptive_device", label: "Adaptive Device", hasReason: true, maxLen: 100 },
              { key: "other", label: "Other", hasReason: true, maxLen: 100 },
            ].map(({ key, label, hasReason, maxLen }) => {
              const checked = !!((form.prosthetic_equipment || {})[key]);
              const reason = (form.prosthetic_equipment || {})[key + "_reason"] || "";
              return (
                <div key={key}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={(e) => set("prosthetic_equipment", { ...(form.prosthetic_equipment || {}), [key]: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                  {hasReason && (
                    <div className="ml-6 mt-1">
                      <div className="relative">
                        <input type="text" maxLength={maxLen} placeholder="Due to..." value={reason} onChange={(e) => set("prosthetic_equipment", { ...(form.prosthetic_equipment || {}), [key + "_reason"]: e.target.value })} className="w-full h-8 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                      </div>
                      <div className="text-right text-xs text-slate-400">of {maxLen}</div>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Need to Order */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!((form.prosthetic_equipment || {}).need_to_order)} onChange={(e) => set("prosthetic_equipment", { ...(form.prosthetic_equipment || {}), need_to_order: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" />
                <span className="text-sm text-slate-700">Need to Order</span>
              </label>
              <div className="ml-6 mt-1">
                <div className="relative">
                  <Textarea maxLength={200} placeholder="" value={(form.prosthetic_equipment || {}).need_to_order_notes || ""} onChange={(e) => set("prosthetic_equipment", { ...(form.prosthetic_equipment || {}), need_to_order_notes: e.target.value })} rows={3} />
                </div>
                <div className="text-right text-xs text-slate-400">of 200</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
