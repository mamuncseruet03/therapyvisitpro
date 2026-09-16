"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save, ChevronDown, ChevronUp, GripVertical, FileText } from "lucide-react";
import { toast } from "sonner";
import { updateAgency } from "@/lib/api-client/agencies";

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long Text" },
  { value: "checkbox", label: "Checkbox" },
  { value: "select", label: "Dropdown" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "signature", label: "Signature" },
];

const WEEK_DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function FieldRow({ field, idx, onChange, onRemove }) {
  return (
    <div className="flex items-start gap-2 p-3 border rounded-lg bg-white">
      <GripVertical className="w-4 h-4 text-slate-300 mt-2 shrink-0" />
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <Label className="text-xs text-slate-500">Field Label</Label>
          <Input
            value={field.label || ""}
            onChange={(e) => onChange(idx, "label", e.target.value)}
            placeholder="e.g. Physician Signature"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-slate-500">Type</Label>
          <Select value={field.type || "text"} onValueChange={(v) => onChange(idx, "type", v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((ft) => (
                <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer mt-5">
            <input
              type="checkbox"
              checked={field.required || false}
              onChange={(e) => onChange(idx, "required", e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600"
            />
            <span className="text-xs text-slate-600">Required</span>
          </label>
        </div>
      </div>
      <button type="button" onClick={() => onRemove(idx)} className="text-slate-300 hover:text-red-500 mt-1.5">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function SectionCard({ section, sectionIdx, onUpdate, onRemove }) {
  const [collapsed, setCollapsed] = useState(false);

  const updateField = (fieldIdx, key, value) => {
    const fields = [...(section.fields || [])];
    fields[fieldIdx] = { ...fields[fieldIdx], [key]: value };
    onUpdate(sectionIdx, { ...section, fields });
  };

  const addField = () => {
    const fields = [...(section.fields || []), { label: "", type: "text", required: false }];
    onUpdate(sectionIdx, { ...section, fields });
  };

  const removeField = (fieldIdx) => {
    const fields = (section.fields || []).filter((_, i) => i !== fieldIdx);
    onUpdate(sectionIdx, { ...section, fields });
  };

  return (
    <Card className="border border-slate-200">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              value={section.name || ""}
              onChange={(e) => onUpdate(sectionIdx, { ...section, name: e.target.value })}
              placeholder="Section name (e.g. Physician Orders, OASIS Summary)"
              className="h-8 text-sm font-medium"
            />
          </div>
          <Badge variant="outline" className="text-xs shrink-0">{(section.fields || []).length} fields</Badge>
          <button type="button" onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-slate-600">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => onRemove(sectionIdx)} className="text-slate-300 hover:text-red-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="pt-0 px-4 pb-4 space-y-2">
          {(section.fields || []).length === 0 && (
            <p className="text-xs text-slate-400 py-2">No fields yet. Add a field below.</p>
          )}
          {(section.fields || []).map((field, fieldIdx) => (
            <FieldRow
              key={fieldIdx}
              field={field}
              idx={fieldIdx}
              onChange={updateField}
              onRemove={removeField}
            />
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addField} className="w-full gap-2 border-dashed mt-2">
            <Plus className="w-3.5 h-3.5" /> Add Field
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

export default function AgencyDocumentationSetup({ agencies }) {
  const [selectedAgencyId, setSelectedAgencyId] = useState("");
  const [sections, setSections] = useState([]);
  const [workWeekStartDay, setWorkWeekStartDay] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedAgency = agencies.find((a) => a.id === selectedAgencyId);

  useEffect(() => {
    if (selectedAgency) {
      setSections(selectedAgency.documentation_setup || []);
      setWorkWeekStartDay(selectedAgency.work_week_start_day ?? 0);
      setSaved(false);
    }
  }, [selectedAgencyId]);

  const addSection = () => {
    setSections([...sections, { name: "", fields: [] }]);
  };

  const updateSection = (idx, updated) => {
    const next = [...sections];
    next[idx] = updated;
    setSections(next);
  };

  const removeSection = (idx) => {
    setSections(sections.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!selectedAgencyId) return;
    setSaving(true);
    try {
      await updateAgency(selectedAgencyId, {
        documentation_setup: sections,
        work_week_start_day: workWeekStartDay,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save documentation setup");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex-1">
            <Label className="text-sm font-medium text-slate-700 mb-1 block">Select Agency</Label>
            <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an agency to configure..." />
              </SelectTrigger>
              <SelectContent>
                {agencies.filter(a => a.status === "active").map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!selectedAgencyId && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <FileText className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">Select an agency to configure its documentation format</p>
        </div>
      )}

      {selectedAgencyId && (
        <>
          {/* Work Week Start Day */}
          <Card className="border border-teal-100 bg-teal-50/40">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-slate-800 block mb-0.5">Work Week Start Day</Label>
                  <p className="text-xs text-slate-500">All patients under this agency will use this day as the start of their therapy frequency/duration week</p>
                </div>
                <div className="w-44">
                  <Select value={String(workWeekStartDay)} onValueChange={(v) => setWorkWeekStartDay(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WEEK_DAYS.map((d) => (
                        <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">{selectedAgency?.name} — Documentation Format</h2>
              <p className="text-xs text-slate-500 mt-0.5">Custom sections and fields applied to all patients under this agency</p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : saved ? "Saved!" : "Save Format"}
            </Button>
          </div>

          <div className="space-y-3">
            {sections.length === 0 && (
              <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-xl">
                <p className="text-sm">No sections configured yet.</p>
                <p className="text-xs mt-1">Add a section to define the documentation format for this agency.</p>
              </div>
            )}
            {sections.map((section, idx) => (
              <SectionCard
                key={idx}
                section={section}
                sectionIdx={idx}
                onUpdate={updateSection}
                onRemove={removeSection}
              />
            ))}
            <Button type="button" variant="outline" onClick={addSection} className="w-full gap-2 border-dashed border-teal-300 text-teal-700 hover:bg-teal-50">
              <Plus className="w-4 h-4" /> Add Section
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
