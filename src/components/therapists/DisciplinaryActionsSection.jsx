"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, FileText, ExternalLink, Loader2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const ACTION_LABELS = {
  verbal_warning: "Verbal Warning",
  written_warning: "Written Warning",
  final_warning: "Final Warning",
  suspension: "Suspension",
  termination: "Termination",
  other: "Other",
};

const ACTION_COLORS = {
  verbal_warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  written_warning: "bg-orange-50 text-orange-700 border-orange-200",
  final_warning: "bg-red-50 text-red-700 border-red-200",
  suspension: "bg-red-100 text-red-800 border-red-300",
  termination: "bg-slate-200 text-slate-700 border-slate-300",
  other: "bg-slate-50 text-slate-600 border-slate-200",
};

const EMPTY_INCIDENT = {
  incident_date: "",
  description: "",
  action_type: "",
  document_url: "",
  document_name: "",
  review_date: "",
  notes: "",
};

function IncidentForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_INCIDENT });
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      set("document_url", data.url || "#");
      set("document_name", file.name);
    } catch {
      set("document_url", "#");
      set("document_name", file.name);
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleSave = () => {
    if (!form.incident_date || !form.action_type || !form.description) {
      toast.error("Please fill in incident date, type, and description.");
      return;
    }
    onSave({
      ...form,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    });
  };

  return (
    <div className="border border-red-200 rounded-xl bg-red-50/30 p-4 space-y-3">
      <div className="text-xs font-semibold text-red-700 uppercase tracking-wide">New Disciplinary Action</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Incident Date *</Label>
          <Input type="date" value={form.incident_date} onChange={e => set("incident_date", e.target.value)} className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Action Type *</Label>
          <Select value={form.action_type} onValueChange={v => set("action_type", v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs">Description *</Label>
        <textarea
          className="w-full text-sm border border-input rounded-md px-3 py-2 h-20 resize-none focus:outline-none focus:ring-1 focus:ring-ring bg-white"
          value={form.description}
          onChange={e => set("description", e.target.value)}
          placeholder="Describe the incident..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Review Date</Label>
          <Input type="date" value={form.review_date} onChange={e => set("review_date", e.target.value)} className="h-8 text-sm" />
          <p className="text-[10px] text-slate-400 mt-0.5">HR will be notified 2 days prior</p>
        </div>
        <div>
          <Label className="text-xs">Warning Document</Label>
          {form.document_url ? (
            <div className="flex items-center gap-2">
              <a href={form.document_url} target="_blank" rel="noopener noreferrer">
                <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs text-teal-600">
                  <ExternalLink className="w-3 h-3" /> {form.document_name || "View"}
                </Button>
              </a>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { set("document_url", ""); set("document_name", ""); }}>
                Remove
              </Button>
            </div>
          ) : (
            <label>
              <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.jpg,.png" />
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs cursor-pointer w-full" asChild>
                <span>
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {uploading ? "Uploading…" : "Upload Document"}
                </span>
              </Button>
            </label>
          )}
        </div>
      </div>
      <div>
        <Label className="text-xs">Notes</Label>
        <Input value={form.notes} onChange={e => set("notes", e.target.value)} className="h-8 text-sm" placeholder="Optional notes..." />
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="button" size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleSave}>
          Save Incident
        </Button>
      </div>
    </div>
  );
}

function IncidentCard({ incident, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50/60 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-800">
              {incident.incident_date ? format(new Date(incident.incident_date + "T00:00:00"), "MMM d, yyyy") : "—"}
            </span>
            <Badge variant="outline" className={`text-xs ${ACTION_COLORS[incident.action_type] || ""}`}>
              {ACTION_LABELS[incident.action_type] || incident.action_type}
            </Badge>
            {incident.review_date && (
              <span className="text-xs text-indigo-600 font-medium">
                Review: {format(new Date(incident.review_date + "T00:00:00"), "MMM d, yyyy")}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">{incident.description}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {incident.document_url && <FileText className="w-3.5 h-3.5 text-teal-500" title="Has document" />}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-2 bg-slate-50/30">
          <div className="text-sm text-slate-600 whitespace-pre-wrap">{incident.description}</div>
          {incident.notes && <div className="text-xs text-slate-500 italic">{incident.notes}</div>}
          <div className="flex items-center gap-4 flex-wrap pt-1">
            {incident.document_url && (
              <a href={incident.document_url} target="_blank" rel="noopener noreferrer">
                <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs text-teal-600 border-teal-200">
                  <ExternalLink className="w-3 h-3" /> {incident.document_name || "View Document"}
                </Button>
              </a>
            )}
            {incident.created_by && (
              <span className="text-xs text-slate-400">Added by {incident.created_by}</span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-red-500 hover:bg-red-50 ml-auto"
              onClick={() => onDelete(incident.id)}
            >
              <Trash2 className="w-3 h-3" /> Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DisciplinaryActionsSection({ actions = [], onChange, currentUserName }) {
  const [showForm, setShowForm] = useState(false);

  const handleSave = (incident) => {
    onChange([...actions, { ...incident, created_by: currentUserName || "HR" }]);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    onChange(actions.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-slate-700">Disciplinary Actions</span>
          {actions.length > 0 && (
            <Badge className="bg-orange-100 text-orange-700 text-xs">{actions.length}</Badge>
          )}
        </div>
        {!showForm && (
          <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setShowForm(true)}>
            <Plus className="w-3 h-3" /> Add Incident
          </Button>
        )}
      </div>

      {showForm && (
        <IncidentForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {actions.length === 0 && !showForm ? (
        <div className="text-center py-6 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
          No disciplinary actions on record
        </div>
      ) : (
        <div className="space-y-2">
          {[...actions].sort((a, b) => new Date(b.incident_date) - new Date(a.incident_date)).map(incident => (
            <IncidentCard key={incident.id} incident={incident} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
