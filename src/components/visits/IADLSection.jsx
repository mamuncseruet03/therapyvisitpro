"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const IADL_COLS = ["NT", "I", "MI", "VC", "SBA", "CGA", "MinA", "ModA", "MaxA", "D"];

const IADL_ROWS = [
  "Meal Preparation",
  "Home Management / Housekeeping",
  "Laundry",
  "Shopping",
  "Money Management / Finances",
  "Medication Management",
  "Transportation / Community Mobility",
  "Use of Communication Devices",
  "Home Maintenance",
  "Safety & Emergency Procedures",
  "Child / Pet Care",
  "Health Management",
];

const COL_LABELS = {
  NT: "Not Tested", I: "Independent", MI: "Modified Independent", VC: "Verbal Cues",
  SBA: "Stand-By Assist", CGA: "Contact Guard Assist", MinA: "Min Assist",
  ModA: "Mod Assist", MaxA: "Max Assist", D: "Dependent",
};

export default function IADLSection({ iadlGrid = {}, onChange }) {
  const handleChange = (row, col) => {
    onChange({ ...iadlGrid, [row]: col });
  };

  return (
    <Card className="border-l-4 border-l-violet-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800">
          Instrumental Activities of Daily Living (IADLs)
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          Rate the patient&apos;s level of independence for each activity.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
          {IADL_COLS.map((col) => (
            <span key={col} className="text-[10px] text-slate-500">
              <span className="font-bold text-slate-700">{col}</span> = {COL_LABELS[col]}
            </span>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left py-1 pr-2 font-medium text-slate-600 w-44"></th>
                {IADL_COLS.map((col) => (
                  <th key={col} className="text-center py-1 px-1 font-semibold text-slate-700 w-10">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {IADL_ROWS.map((row, i) => (
                <tr key={row} className={i % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                  <td className="py-2 pr-2 text-violet-700 font-medium text-xs leading-tight">{row}</td>
                  {IADL_COLS.map((col) => (
                    <td key={col} className="text-center py-2 px-1">
                      <input
                        type="radio"
                        name={`iadl_${row}`}
                        checked={(iadlGrid[row] || "") === col}
                        onChange={() => handleChange(row, col)}
                        className="w-3.5 h-3.5 text-violet-600 cursor-pointer"
                        title={COL_LABELS[col]}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
