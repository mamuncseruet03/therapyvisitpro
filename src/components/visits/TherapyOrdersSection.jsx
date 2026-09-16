"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays, startOfWeek, endOfWeek, format, parseISO } from "date-fns";

function generateWeeks(certStart, certEnd) {
  const weeks = [];
  if (!certStart || !certEnd) return weeks;
  const start = parseISO(certStart);
  const end = parseISO(certEnd);
  let weekStart = startOfWeek(start, { weekStartsOn: 1 });
  let weekNum = 1;
  while (weekStart <= end) {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const clampedEnd = weekEnd > end ? end : weekEnd;
    weeks.push({
      week_label: `Week ${weekNum}`,
      week_start: format(weekStart, "yyyy-MM-dd"),
      week_end: format(clampedEnd, "yyyy-MM-dd"),
      display: `Week ${weekNum}: ${format(weekStart, "MMM d")} - ${format(clampedEnd, "MMM d, yyyy")}`,
    });
    weekStart = addDays(weekEnd, 1);
    weekNum++;
  }
  return weeks;
}

const VISIT_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7];

export default function TherapyOrdersSection({ therapyOrders, certPeriodStart, certPeriodEnd, visitDate, onChange }) {
  const [weeks, setWeeks] = useState([]);

  const evalOnly = therapyOrders.eval_only || false;

  useEffect(() => {
    const evalDate = visitDate ? parseISO(visitDate) : new Date();
    const allWeeks = generateWeeks(certPeriodStart, certPeriodEnd);
    const generated = allWeeks.filter((w) => parseISO(w.week_end) >= evalDate);
    setWeeks(generated);
    if (generated.length > 0) {
      const existingMap = {};
      (therapyOrders.weekly_visits || []).forEach((w) => {
        existingMap[w.week_start] = w.visits;
      });
      const weekly_visits = generated.map((w) => ({
        week_label: w.week_label,
        week_start: w.week_start,
        week_end: w.week_end,
        visits: existingMap[w.week_start] ?? (therapyOrders.frequency ?? 0),
      }));
      onChange({ ...therapyOrders, weekly_visits });
    }
  }, [certPeriodStart, certPeriodEnd, visitDate]);

  const handleWeekVisits = (weekStart, visits) => {
    const updated = {
      ...therapyOrders,
      weekly_visits: (therapyOrders.weekly_visits || []).map((w) =>
        w.week_start === weekStart ? { ...w, visits } : w
      ),
    };
    onChange(updated);
  };

  const toggleEvalOnly = () => {
    onChange({ ...therapyOrders, eval_only: !evalOnly, eval_only_reason: !evalOnly ? (therapyOrders.eval_only_reason || "") : "" });
  };

  return (
    <Card className="border-l-4 border-l-teal-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-800">Therapy Orders</CardTitle>
            <p className="text-xs text-slate-500 mt-1">Set visit frequency and schedule across the certification period</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={evalOnly}
              onChange={toggleEvalOnly}
              className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer"
            />
            <span className={`text-sm font-medium ${evalOnly ? "text-amber-700" : "text-slate-600"}`}>Eval Only</span>
          </label>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Eval Only Reason */}
        {evalOnly && (
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-amber-800">
              Reason for Eval Only -- why is treatment not being recommended? <span className="text-red-500">&#9733;</span>
            </p>
            <Textarea
              placeholder="e.g. Patient declined treatment, condition does not warrant skilled therapy, goals met at evaluation..."
              value={therapyOrders.eval_only_reason || ""}
              onChange={(e) => onChange({ ...therapyOrders, eval_only_reason: e.target.value })}
              rows={3}
              className="text-sm bg-white"
            />
          </div>
        )}

        {/* Weekly Visit Schedule -- hidden when Eval Only */}
        {!evalOnly && (
          !certPeriodStart || !certPeriodEnd ? (
            <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Add a certification period to the patient record to configure weekly visit schedule.
            </div>
          ) : (
            <div>
              <Label className="mb-2 block">Visit Frequency</Label>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {(therapyOrders.weekly_visits || []).map((w) => (
                  <div key={w.week_start} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border bg-slate-50">
                    <span className="text-sm text-slate-700 flex-1">
                      <span className="font-medium">{w.week_label}</span>
                      <span className="text-slate-400 ml-2 text-xs">
                        {w.week_start && w.week_end
                          ? `${format(parseISO(w.week_start), "MMM d")} - ${format(parseISO(w.week_end), "MMM d, yyyy")}`
                          : ""}
                      </span>
                    </span>
                    <Select
                      value={String(w.visits ?? 0)}
                      onValueChange={(v) => handleWeekVisits(w.week_start, parseInt(v))}
                    >
                      <SelectTrigger className="w-20 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VISIT_OPTIONS.map((n) => (
                          <SelectItem key={n} value={String(n)}>{n} visit{n !== 1 ? "s" : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              {(therapyOrders.weekly_visits || []).length > 0 && (
                <div className="mt-2 text-xs text-slate-500 text-right">
                  Total ordered visits: <span className="font-semibold text-slate-700">
                    {(therapyOrders.weekly_visits || []).reduce((s, w) => s + (w.visits || 0), 0)}
                  </span>
                </div>
              )}
            </div>
          )
        )}

        {/* Eval Only summary */}
        {evalOnly && (therapyOrders.weekly_visits || []).length > 0 && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Eval Only selected -- therapy orders will be generated for the evaluation visit only. No treatment visits will be scheduled.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
