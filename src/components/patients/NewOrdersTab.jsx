"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const NEW_ORDER_REASONS = [
  { id: "continue_plan", label: "Continue with plan care" },
  { id: "missed_visits", label: "Missed visits" },
  { id: "declined_downgrade", label: "Patient has declined, need to downgrade goals" },
  { id: "met_goals_increase", label: "Patient has met goals need to increase goals" },
];

const MORE_VISITS_REASONS = [
  { id: "not_met_goals", label: "Patient has not met goals" },
  { id: "setback", label: "Patient experienced a setback" },
  { id: "additional_auth", label: "Additional authorization obtained" },
  { id: "physician_order", label: "Physician order for additional visits" },
];

function OrderForm({ reasons }) {
  const [checked, setChecked] = useState({});
  const [other, setOther] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [comment, setComment] = useState("");

  const toggleCheck = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSubmit = () => {
    const selected = reasons.filter((r) => checked[r.id]).map((r) => r.label);
    if (other.trim()) selected.push(`Other: ${other}`);
    if (!effectiveDate) {
      toast.error("Please enter an Order Effective Date");
      return;
    }
    if (selected.length === 0) {
      toast.error("Please select at least one reason");
      return;
    }
    toast.success("Order request submitted successfully");
    setChecked({});
    setOther("");
    setEffectiveDate("");
    setComment("");
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <p className="text-sm font-bold text-slate-800 mb-3">Reason for New Orders</p>
        <div className="space-y-2">
          {reasons.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <Checkbox
                id={r.id}
                checked={!!checked[r.id]}
                onCheckedChange={() => toggleCheck(r.id)}
              />
              <Label
                htmlFor={r.id}
                className={`text-sm cursor-pointer ${
                  r.id === "missed_visits" || r.id === "not_met_goals" || r.id === "setback"
                    ? "text-orange-600"
                    : r.id === "declined_downgrade" || r.id === "met_goals_increase"
                    ? "text-teal-700"
                    : "text-slate-700"
                }`}
              >
                {r.label}
              </Label>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-1">
            <Label className="text-sm text-slate-700 whitespace-nowrap">Other</Label>
            <Input
              value={other}
              onChange={(e) => setOther(e.target.value)}
              className="h-7 text-sm max-w-[180px]"
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-800 mb-2">Order Effective Date</p>
        <Input
          type="date"
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
          className="h-9 w-44 text-sm"
        />
      </div>

      <div>
        <p className="text-sm font-bold text-slate-800 mb-2">Comment</p>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 300))}
          rows={5}
          className="resize-y text-sm max-w-sm"
          placeholder=""
        />
        <p className="text-xs text-slate-400 mt-1 text-right max-w-sm">
          of <span className="text-orange-600 font-medium">300</span>
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        className="bg-sky-600 hover:bg-sky-700 text-white px-5"
      >
        Setup Frequency
      </Button>
    </div>
  );
}

export default function NewOrdersTab() {
  return (
    <Tabs defaultValue="new-orders">
      <TabsList className="mb-4">
        <TabsTrigger value="new-orders">Request New Orders</TabsTrigger>
        <TabsTrigger value="more-visits">Request More Visits</TabsTrigger>
      </TabsList>

      <TabsContent value="new-orders">
        <Card>
          <CardHeader className="bg-slate-100 border-b py-3 px-5">
            <CardTitle className="text-base font-bold text-slate-800">Request New Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <OrderForm reasons={NEW_ORDER_REASONS} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="more-visits">
        <Card>
          <CardHeader className="bg-slate-100 border-b py-3 px-5">
            <CardTitle className="text-base font-bold text-slate-800">Request More Visits</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <OrderForm reasons={MORE_VISITS_REASONS} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
