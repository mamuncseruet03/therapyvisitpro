"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight } from "lucide-react";

const UPPER_JOINTS = {
  Shoulder: ["Flexors", "Extensors", "Abductors", "Adductors", "Internal Rotators", "External Rotators"],
  Elbow: ["Flexors", "Extensors", "Pronators", "Supinators"],
  Wrist: ["Flexors", "Extensors", "Radial Deviators", "Ulnar Deviators"],
  Grip: ["Gross Grip", "Pinch Grip", "Lateral Pinch"],
};

const LOWER_JOINTS = {
  Hip: ["Flexors", "Extensors", "Abductors", "Adductors", "Internal Rotators", "External Rotators"],
  Knee: ["Flexors", "Extensors"],
  Ankle: ["Dorsiflexors", "Plantarflexors", "Invertors", "Evertors"],
};

function JointGroup({ joints, strengthEvaluation, onChange }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (joint) => setExpanded((p) => ({ ...p, [joint]: !p[joint] }));

  const getValue = (joint, muscle, side) =>
    strengthEvaluation?.[`${joint}_${muscle}_${side}`] || "";

  const setValue = (joint, muscle, side, value) => {
    onChange({ ...strengthEvaluation, [`${joint}_${muscle}_${side}`]: value });
  };

  return (
    <div className="border rounded-lg overflow-hidden divide-y">
      {Object.entries(joints).map(([joint, muscles]) => {
        const isOpen = expanded[joint];
        const hasFilled = muscles.some(
          (m) => getValue(joint, m, "L") || getValue(joint, m, "R")
        );
        return (
          <div key={joint}>
            <button
              type="button"
              onClick={() => toggle(joint)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm font-semibold text-slate-700">{joint}</span>
                {hasFilled && (
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">data entered</span>
                )}
              </div>
              <span className="text-xs text-slate-400">{muscles.length} muscle groups</span>
            </button>
            {isOpen && (
              <div className="bg-slate-50 px-4 pb-3">
                <table className="w-full text-sm mt-2">
                  <thead>
                    <tr>
                      <th className="text-left py-1.5 text-xs font-medium text-slate-500 w-40">Muscle Group</th>
                      <th className="text-center py-1.5 text-xs font-medium text-slate-500 w-32">Left</th>
                      <th className="text-center py-1.5 text-xs font-medium text-slate-500 w-32">Right</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {muscles.map((muscle) => (
                      <tr key={muscle}>
                        <td className="py-1.5 text-slate-700 text-xs">{muscle}</td>
                        <td className="py-1 px-2">
                          <Input
                            className="h-7 text-xs text-center"
                            placeholder="e.g. 5/5"
                            value={getValue(joint, muscle, "L")}
                            onChange={(e) => setValue(joint, muscle, "L", e.target.value)}
                          />
                        </td>
                        <td className="py-1 px-2">
                          <Input
                            className="h-7 text-xs text-center"
                            placeholder="e.g. 5/5"
                            value={getValue(joint, muscle, "R")}
                            onChange={(e) => setValue(joint, muscle, "R", e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StrengthEvaluationSection({ strengthEvaluation, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Upper Extremity</p>
        <JointGroup joints={UPPER_JOINTS} strengthEvaluation={strengthEvaluation} onChange={onChange} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Lower Extremity</p>
        <JointGroup joints={LOWER_JOINTS} strengthEvaluation={strengthEvaluation} onChange={onChange} />
      </div>
    </div>
  );
}
