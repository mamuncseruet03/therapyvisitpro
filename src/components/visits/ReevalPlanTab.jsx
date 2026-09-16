"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TherapyOrdersSection from "./TherapyOrdersSection";

export default function ReevalPlanTab({ form, set, selectedPatient }) {
  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-violet-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">Plan</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Updated treatment plan and skilled service needs</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-slate-600 mb-2">Would you like to change current Plan of Care?</p>
            <div className="flex gap-6">
              {["Yes", "No"].map((option) => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="change_plan_of_care"
                    checked={form.change_plan_of_care === option}
                    onChange={() => set("change_plan_of_care", option)}
                    className="w-4 h-4 text-teal-600 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-slate-600 mb-2">Would you like to create or update new orders?</p>
            <div className="flex gap-6">
              {["Yes", "No"].map((option) => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="create_update_orders"
                    checked={form.create_update_orders === option}
                    onChange={() => set("create_update_orders", option)}
                    className="w-4 h-4 text-teal-600 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {form.create_update_orders === "Yes" && (
        <TherapyOrdersSection
          therapyOrders={form.therapy_orders || {}}
          certPeriodStart={form.visit_date}
          certPeriodEnd={selectedPatient?.cert_period_end}
          visitDate={form.visit_date}
          onChange={(orders) => set("therapy_orders", orders)}
        />
      )}
    </div>
  );
}
