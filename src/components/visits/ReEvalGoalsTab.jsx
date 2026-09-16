"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus } from "lucide-react";

export default function ReEvalGoalsTab({ form, set }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800">Goals</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {(form.reeval_goals || []).length === 0 && (<p className="text-sm text-slate-400 italic">No goals yet. Click &quot;Add Goal&quot; below or check that the initial evaluation has completed goals.</p>)}
          {(form.reeval_goals || []).map((goalEntry, idx) => {
            const updateEntry = (field, value) => { const updated = [...(form.reeval_goals || [])]; updated[idx] = { ...updated[idx], [field]: value }; set('reeval_goals', updated); };
            return (
              <div key={idx} className="border-b pb-6 last:border-b-0 last:pb-0 space-y-3">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold text-amber-700">Goal: {idx + 1}</p><button type="button" onClick={() => set('reeval_goals', (form.reeval_goals || []).filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button></div>
                <Textarea value={goalEntry.goal || ''} onChange={(e) => updateEntry('goal', e.target.value)} rows={3} className="text-sm" />
                <div><Label className="text-sm text-slate-600">Prior Assessment Status:</Label><Textarea value={goalEntry.prior_assessment_status || ''} onChange={(e) => updateEntry('prior_assessment_status', e.target.value)} rows={2} maxLength={300} className="text-sm mt-1" /></div>
                <div><Label className="text-sm text-slate-600">Reassessment Status:</Label><Textarea value={goalEntry.reassessment_status || ''} onChange={(e) => updateEntry('reassessment_status', e.target.value)} rows={2} maxLength={300} className="text-sm mt-1" /><div className="text-right text-xs text-slate-400 mt-0.5">{(goalEntry.reassessment_status || '').length} of 300</div></div>
                <div>
                  <Label className="text-sm text-slate-600">Goal Status:</Label>
                  <div className="flex gap-6 mt-2">{['continue', 'modify', 'goal_met'].map((status) => (<label key={status} className="flex items-center gap-2 cursor-pointer"><input type="radio" name={`goal_status_${idx}`} checked={goalEntry.goal_status === status} onChange={() => { const today = new Date().toISOString().split('T')[0]; updateEntry('goal_status', status); if (status === 'modify' && !goalEntry.modified_date) updateEntry('modified_date', today); }} className="w-4 h-4 text-teal-600 cursor-pointer" /><span className="text-sm text-slate-700 capitalize">{status === 'goal_met' ? 'Goal Met' : status.charAt(0).toUpperCase() + status.slice(1)}</span></label>))}</div>
                </div>
                {goalEntry.goal_status === 'modify' && (<div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-2"><div className="flex items-center justify-between"><Label className="text-sm font-semibold text-amber-800">Modified Goal:</Label>{goalEntry.modified_date && (<span className="text-xs text-amber-600 font-medium">Modified: {goalEntry.modified_date}</span>)}</div><Textarea placeholder="Enter the modified goal text..." value={goalEntry.modified_goal || ''} onChange={(e) => updateEntry('modified_goal', e.target.value)} rows={3} className="text-sm bg-white" /></div>)}
              </div>
            );
          })}
          <Button type="button" variant="outline" className="w-full gap-2 border-dashed mt-2" onClick={() => set('reeval_goals', [...(form.reeval_goals || []), { goal: '', prior_assessment_status: '', reassessment_status: '', goal_status: 'continue', modified_goal: '', modified_date: '' }])}>
            <Plus className="w-4 h-4" /> Add Goal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
