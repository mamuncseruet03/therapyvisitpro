"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SLPADLSection from "./SLPADLSection";
import IADLSection from "./IADLSection";

const ADL_COLS = ["NT", "I", "MI", "VC", "SBA", "CGA", "MinA", "ModA", "MaxA", "D"];
const ADL_ROWS = [
  "Grooming", "Toileting", "Bathing", "Laundry", "Shopping",
  "Transferring", "Housekeeping", "Transportation", "Feeding / Eating",
  "Ability to Use Phone", "Light Meal Preparation", "Ambulation / Locomotion",
  "Ability to Dress Lower Body", "Ability to Dress Upper Body",
];

export default function AdlsTab({ form, set }) {
  return (
    <div className="space-y-6">
      {form.therapy_type === "Speech Therapy" ? (
        <SLPADLSection slpAdl={form.slp_adl || {}} onChange={(v) => set("slp_adl", v)} />
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800">Activities of Daily Living</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead><tr><th className="text-left py-1 pr-2 font-medium text-slate-600 w-36"></th>{ADL_COLS.map(col => <th key={col} className="text-center py-1 px-1 font-semibold text-slate-700 w-10">{col}</th>)}</tr></thead>
                  <tbody>
                    {ADL_ROWS.map((row, i) => (
                      <tr key={row} className={i % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                        <td className="py-2 pr-2 text-teal-700 font-medium text-xs leading-tight">{row}</td>
                        {ADL_COLS.map(col => (<td key={col} className="text-center py-2 px-1"><input type="radio" name={`adl_${row}`} checked={(form.adl_grid || {})[row] === col} onChange={() => set("adl_grid", { ...(form.adl_grid || {}), [row]: col })} className="w-3.5 h-3.5 text-teal-600 cursor-pointer" /></td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          {form.therapy_type === "Occupational Therapy" && (<IADLSection iadlGrid={form.iadl_grid_ot || {}} onChange={(v) => set("iadl_grid_ot", v)} />)}
        </>
      )}
    </div>
  );
}
