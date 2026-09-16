"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, ChevronDown, ChevronRight } from "lucide-react";

const ROM_OPTIONS = [
  { value: "WNL", label: "WNL - Within Normal Limits" },
  { value: "WFL", label: "WFL - Within Functional Limits" },
  { value: "restricted", label: "Restricted" },
];

const MOVEMENT_OPTIONS = {
  Shoulder: ["Flexion", "Extension", "Abduction", "Adduction", "Internal Rotation", "External Rotation"],
  Elbow: ["Flexion", "Extension", "Pronation", "Supination"],
  Wrist: ["Flexion", "Extension", "Radial Deviation", "Ulnar Deviation"],
  Hip: ["Flexion", "Extension", "Abduction", "Adduction", "Internal Rotation", "External Rotation"],
  Knee: ["Flexion", "Extension"],
  Ankle: ["Dorsiflexion", "Plantarflexion", "Inversion", "Eversion"],
  Cervical: ["Flexion", "Extension", "Left Rotation", "Right Rotation", "Left Lateral Flexion", "Right Lateral Flexion"],
  Trunk: ["Flexion", "Extension", "Left Rotation", "Right Rotation"],
};

function RestrictedDetails({ joint, side, movements, onChange }) {
  const [selectedMovement, setSelectedMovement] = useState("");
  const [romValue, setRomValue] = useState("");

  const addMovement = () => {
    if (!selectedMovement || !romValue.trim()) return;
    const updated = [...(movements || []), { movement: selectedMovement, value: romValue.trim() }];
    onChange(updated);
    setSelectedMovement("");
    setRomValue("");
  };

  const removeMovement = (idx) => {
    onChange((movements || []).filter((_, i) => i !== idx));
  };

  const availableMovements = MOVEMENT_OPTIONS[joint] || [];

  return (
    <div className="mt-2 pl-3 border-l-2 border-amber-300 space-y-2">
      <div className="text-xs font-medium text-amber-700 mb-1">Restricted ROM -- {joint} ({side})</div>
      {(movements || []).map((m, i) => (
        <div key={i} className="flex items-center gap-2 text-xs bg-amber-50 rounded px-2 py-1">
          <span className="font-medium text-slate-700">{m.movement}:</span>
          <span className="text-slate-600">{m.value}</span>
          <button type="button" onClick={() => removeMovement(i)} className="ml-auto text-slate-400 hover:text-red-500">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <div className="flex gap-2 items-center">
        <Select value={selectedMovement} onValueChange={setSelectedMovement}>
          <SelectTrigger className="h-7 text-xs flex-1">
            <SelectValue placeholder="Select movement" />
          </SelectTrigger>
          <SelectContent>
            {availableMovements.map((m) => (
              <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
            ))}
            <SelectItem value="__custom__" className="text-xs italic">Other...</SelectItem>
          </SelectContent>
        </Select>
        {selectedMovement === "__custom__" && (
          <Input
            className="h-7 text-xs flex-1"
            placeholder="Movement name"
            value={selectedMovement === "__custom__" ? "" : selectedMovement}
            onChange={(e) => setSelectedMovement(e.target.value)}
          />
        )}
        <Input
          className="h-7 text-xs w-28"
          placeholder="e.g. 0-90deg"
          value={romValue}
          onChange={(e) => setRomValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMovement())}
        />
        <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={addMovement}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function ROMEvaluationSection({ romEvaluation, onChange }) {
  const ROM_JOINTS = Object.keys(MOVEMENT_OPTIONS);

  const getStatus = (joint, side) => romEvaluation?.[`${joint}_${side}_status`] || "";
  const getMovements = (joint, side) => romEvaluation?.[`${joint}_${side}_movements`] || [];

  const setStatus = (joint, side, value) => {
    const updated = { ...romEvaluation, [`${joint}_${side}_status`]: value };
    // Clear movements if not restricted
    if (value !== "restricted") {
      delete updated[`${joint}_${side}_movements`];
    }
    onChange(updated);
  };

  const setMovements = (joint, side, movements) => {
    onChange({ ...romEvaluation, [`${joint}_${side}_movements`]: movements });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="border-b border-r px-3 py-2 text-left font-medium text-slate-600 w-32">Joint</th>
            <th className="border-b border-r px-3 py-2 text-center font-medium text-slate-600">Left</th>
            <th className="border-b px-3 py-2 text-center font-medium text-slate-600">Right</th>
          </tr>
        </thead>
        <tbody>
          {ROM_JOINTS.map((joint) => {
            const leftStatus = getStatus(joint, "L");
            const rightStatus = getStatus(joint, "R");
            const leftMovements = getMovements(joint, "L");
            const rightMovements = getMovements(joint, "R");

            return (
              <tr key={joint} className="border-b last:border-b-0">
                <td className="border-r px-3 py-2 font-medium text-slate-700 align-top">{joint}</td>
                <td className="border-r px-2 py-2 align-top">
                  <Select value={leftStatus} onValueChange={(v) => setStatus(joint, "L", v)}>
                    <SelectTrigger className={`h-8 text-xs ${leftStatus === "restricted" ? "border-amber-400 text-amber-700" : leftStatus ? "border-green-300 text-green-700" : ""}`}>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ROM_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {leftStatus === "restricted" && (
                    <RestrictedDetails
                      joint={joint}
                      side="Left"
                      movements={leftMovements}
                      onChange={(m) => setMovements(joint, "L", m)}
                    />
                  )}
                </td>
                <td className="px-2 py-2 align-top">
                  <Select value={rightStatus} onValueChange={(v) => setStatus(joint, "R", v)}>
                    <SelectTrigger className={`h-8 text-xs ${rightStatus === "restricted" ? "border-amber-400 text-amber-700" : rightStatus ? "border-green-300 text-green-700" : ""}`}>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ROM_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {rightStatus === "restricted" && (
                    <RestrictedDetails
                      joint={joint}
                      side="Right"
                      movements={rightMovements}
                      onChange={(m) => setMovements(joint, "R", m)}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
