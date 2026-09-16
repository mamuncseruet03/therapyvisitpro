"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#0d9488", "#3b82f6", "#8b5cf6"];
const LABELS = ["Physical Therapy", "Occupational Therapy", "Speech Therapy"];

export default function TherapyBreakdown({ visits = [] }) {
  const data = LABELS.map((label) => ({
    name: label.replace(" Therapy", ""),
    value: visits.filter((v) => v.therapy_type === label).length,
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Visits by Discipline</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {data.map((item, index) => (
            <div key={item.name} className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-2 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span>{item.name}</span>
              </div>
              <p className="mt-1 text-lg font-semibold text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
