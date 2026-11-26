"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TreatmentGoalsTab({ form, set, patientVisits = [], canAdd }) {
  const [goalText, setGoalText] = useState("");
  const selected = form.goals_addressed || [];
  const custom = form.follow_up_goals || [];
  const evaluationGoals = patientVisits
    .filter((visit) => visit.visit_type === "evaluation" && visit.therapy_type === form.therapy_type && ["completed", "signed"].includes(visit.status))
    .flatMap((visit) => (visit.eval_treatment_goals || []).map((goal) => goal.goal?.trim()).filter(Boolean));
  const goals = [...new Set([...evaluationGoals, ...custom, ...selected])];
  function addGoal() {
    const goal = goalText.trim();
    if (!canAdd || !goal || goals.includes(goal)) return;
    set("follow_up_goals", [...custom, goal]);
    setGoalText("");
  }
  return (
    <Card>
      <CardHeader><CardTitle>Goals from Evaluation</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {!goals.length && <p className="text-sm text-slate-500">No evaluation goals found for this therapy type.</p>}
        {goals.map((goal) => (
          <label key={goal} className="flex items-center gap-3 rounded border p-3">
            <input type="checkbox" checked={selected.includes(goal)} onChange={(event) =>
              set("goals_addressed", event.target.checked ? [...selected, goal] : selected.filter((item) => item !== goal))
            } />
            {goal}
          </label>
        ))}
        {canAdd && <div className="space-y-2">
          <Label htmlFor="follow-up-goal">New Goal</Label>
          <div className="flex gap-2">
            <Input id="follow-up-goal" value={goalText} onChange={(event) => setGoalText(event.target.value)} />
            <Button type="button" onClick={addGoal} disabled={!goalText.trim()}>Add Goal</Button>
          </div>
        </div>}
      </CardContent>
    </Card>
  );
}
