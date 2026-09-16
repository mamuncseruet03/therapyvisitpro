"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Save, Plus, X, Upload, FileText, Loader2, DollarSign, ChevronDown, ChevronUp } from "lucide-react";

const THERAPY_TYPES = ["Physical Therapy", "Occupational Therapy", "Speech Therapy"];
const VISIT_TYPES = [
  { value: "evaluation", label: "Evaluation" },
  { value: "treatment", label: "Treatment" },
  { value: "re_evaluation", label: "Re-evaluation" },
  { value: "discharge", label: "Discharge" }
];

export default function AgencyForm({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || {
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    fax: "",
    email: "",
    contacts: [],
    rates: [],
    documents: [],
    required_visit_documents: [],
    notes: "",
    status: "active",
  });
  const [newDocName, setNewDocName] = useState("");
  const [docSectionCollapsed, setDocSectionCollapsed] = useState({});

  const FIELD_TYPES = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Long Text" },
    { value: "checkbox", label: "Checkbox" },
    { value: "select", label: "Dropdown" },
    { value: "date", label: "Date" },
    { value: "number", label: "Number" },
    { value: "signature", label: "Signature" },
  ];

  const addDocSection = () => {
    const sections = form.documentation_setup || [];
    set("documentation_setup", [...sections, { name: "", fields: [] }]);
  };

  const removeDocSection = (idx) => {
    set("documentation_setup", (form.documentation_setup || []).filter((_, i) => i !== idx));
  };

  const updateDocSection = (idx, updated) => {
    const sections = [...(form.documentation_setup || [])];
    sections[idx] = updated;
    set("documentation_setup", sections);
  };

  const addDocField = (sectionIdx) => {
    const sections = [...(form.documentation_setup || [])];
    sections[sectionIdx] = { ...sections[sectionIdx], fields: [...(sections[sectionIdx].fields || []), { label: "", type: "text", required: false }] };
    set("documentation_setup", sections);
  };

  const removeDocField = (sectionIdx, fieldIdx) => {
    const sections = [...(form.documentation_setup || [])];
    sections[sectionIdx] = { ...sections[sectionIdx], fields: (sections[sectionIdx].fields || []).filter((_, i) => i !== fieldIdx) };
    set("documentation_setup", sections);
  };

  const updateDocField = (sectionIdx, fieldIdx, key, value) => {
    const sections = [...(form.documentation_setup || [])];
    const fields = [...(sections[sectionIdx].fields || [])];
    fields[fieldIdx] = { ...fields[fieldIdx], [key]: value };
    sections[sectionIdx] = { ...sections[sectionIdx], fields };
    set("documentation_setup", sections);
  };
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const addContact = () => {
    const arr = form.contacts || [];
    set("contacts", [...arr, { name: "", title: "", phone: "", email: "" }]);
  };

  const removeContact = (idx) => {
    const arr = form.contacts || [];
    set("contacts", arr.filter((_, i) => i !== idx));
  };

  const updateContact = (idx, field, value) => {
    const arr = [...(form.contacts || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    set("contacts", arr);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      const arr = form.documents || [];
      set("documents", [
        ...arr,
        {
          name: file.name,
          type: "contract",
          url: data.url || "#",
          uploaded_date: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (idx) => {
    const arr = form.documents || [];
    set("documents", arr.filter((_, i) => i !== idx));
  };

  const updateDocument = (idx, field, value) => {
    const arr = [...(form.documents || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    set("documents", arr);
  };

  const getRate = (therapyType, visitType) => {
    const rate = (form.rates || []).find(
      r => r.therapy_type === therapyType && r.visit_type === visitType
    );
    return rate?.rate || "";
  };

  const updateRate = (therapyType, visitType, value) => {
    const rates = [...(form.rates || [])];
    const idx = rates.findIndex(
      r => r.therapy_type === therapyType && r.visit_type === visitType
    );

    if (idx >= 0) {
      if (value === "" || value === null) {
        rates.splice(idx, 1);
      } else {
        rates[idx] = { ...rates[idx], rate: parseFloat(value) };
      }
    } else if (value !== "" && value !== null) {
      rates.push({ therapy_type: therapyType, visit_type: visitType, rate: parseFloat(value) });
    }

    set("rates", rates);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" />
            {initial ? "Edit Agency" : "Add New Agency"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Agency Name *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm text-slate-700 mb-3">Location</h3>
            <div className="space-y-3">
              <div>
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>City</Label>
                  <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="NY" />
                </div>
                <div>
                  <Label>ZIP</Label>
                  <Input value={form.zip} onChange={(e) => set("zip", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm text-slate-700 mb-3">Agency Contact</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div>
                <Label>Fax</Label>
                <Input value={form.fax} onChange={(e) => set("fax", e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-slate-700">Contact Persons</h3>
              <Button type="button" variant="outline" size="sm" onClick={addContact} className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Contact
              </Button>
            </div>
            <div className="space-y-3">
              {(form.contacts || []).length === 0 ? (
                <div className="text-sm text-slate-400 py-2">No contacts added</div>
              ) : (
                (form.contacts || []).map((contact, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-3 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-500">Contact {idx + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-red-600"
                        onClick={() => removeContact(idx)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input
                          placeholder="Contact name"
                          value={contact.name || ""}
                          onChange={(e) => updateContact(idx, "name", e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Title</Label>
                        <Input
                          placeholder="Job title"
                          value={contact.title || ""}
                          onChange={(e) => updateContact(idx, "title", e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Phone</Label>
                        <Input
                          placeholder="Phone number"
                          value={contact.phone || ""}
                          onChange={(e) => updateContact(idx, "phone", e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input
                          type="email"
                          placeholder="Email address"
                          value={contact.email || ""}
                          onChange={(e) => updateContact(idx, "email", e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm text-slate-700 mb-3">Rate Schedule</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-2 border-b font-medium text-slate-700">Therapy Type</th>
                    {VISIT_TYPES.map(vt => (
                      <th key={vt.value} className="text-left p-2 border-b font-medium text-slate-700">
                        {vt.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {THERAPY_TYPES.map(tt => (
                    <tr key={tt} className="border-b last:border-b-0">
                      <td className="p-2 font-medium text-slate-600 text-xs">{tt}</td>
                      {VISIT_TYPES.map(vt => (
                        <td key={vt.value} className="p-2">
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={getRate(tt, vt.value)}
                              onChange={(e) => updateRate(tt, vt.value, e.target.value)}
                              className="h-8 text-sm pl-6"
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Documentation Setup */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm text-slate-700">Documentation Setup</h3>
                <p className="text-xs text-slate-400 mt-0.5">Custom documentation sections applied to all patients under this agency</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addDocSection} className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Section
              </Button>
            </div>

            {/* Work Week Start Day */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-teal-50 border border-teal-100 mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Work Week Start Day</p>
                <p className="text-xs text-slate-500 mt-0.5">Sets the calendar start day for frequency &amp; duration for all patients under this agency</p>
              </div>
              <Select value={String(form.work_week_start_day ?? 0)} onValueChange={(v) => set("work_week_start_day", Number(v))}>
                <SelectTrigger className="w-36 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((d, i) => (
                    <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assistants Allowed for Treatment */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100 mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Assistants Allowed for Treatment</p>
                <p className="text-xs text-slate-500 mt-0.5">If No, PTA/COTA cannot be assigned to patients under this agency</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => set("assistants_allowed", true)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    form.assistants_allowed !== false ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-200 hover:border-green-300"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => set("assistants_allowed", false)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    form.assistants_allowed === false ? "bg-red-500 text-white border-red-500" : "bg-white text-slate-600 border-slate-200 hover:border-red-300"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Supervisory Visits — only when assistants are allowed */}
            {form.assistants_allowed !== false && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100 mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Supervisory Visits Needed</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Every Nth visit must be done by the supervising therapist (not an assistant).
                    Subsequent assistant visits are on hold until that visit is completed.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={form.supervisory_visit_frequency ? String(form.supervisory_visit_frequency) : "none"}
                    onValueChange={(v) => set("supervisory_visit_frequency", v === "none" ? null : Number(v))}
                  >
                    <SelectTrigger className="w-28 h-8 text-sm">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <SelectItem key={n} value={String(n)}>Every {n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Document Mode */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100 mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Documentation Source</p>
                <p className="text-xs text-slate-500 mt-0.5">Agency Docs Only: therapist selects from this agency's uploaded documents during intake</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => set("document_mode", "theradocs")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    (form.document_mode ?? "theradocs") === "theradocs" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  Use TheraDocs
                </button>
                <button
                  type="button"
                  onClick={() => set("document_mode", "agency_docs")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    form.document_mode === "agency_docs" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  Agency Docs Only
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {(form.documentation_setup || []).length === 0 && (
                <p className="text-sm text-slate-400 py-1">No documentation sections configured</p>
              )}
              {(form.documentation_setup || []).map((section, sIdx) => (
                <div key={sIdx} className="border rounded-lg bg-slate-50/50">
                  <div className="flex items-center gap-2 p-3">
                    <input
                      className="flex-1 h-8 rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Section name (e.g. Physician Orders)"
                      value={section.name || ""}
                      onChange={(e) => updateDocSection(sIdx, { ...section, name: e.target.value })}
                    />
                    <span className="text-xs text-slate-400 shrink-0">{(section.fields || []).length} fields</span>
                    <button type="button" onClick={() => setDocSectionCollapsed(p => ({ ...p, [sIdx]: !p[sIdx] }))} className="text-slate-400 hover:text-slate-600">
                      {docSectionCollapsed[sIdx] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <button type="button" onClick={() => removeDocSection(sIdx)} className="text-slate-300 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {!docSectionCollapsed[sIdx] && (
                    <div className="px-3 pb-3 space-y-2">
                      {(section.fields || []).map((field, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 bg-white border rounded-md p-2">
                          <input
                            className="flex-1 h-7 rounded border border-input bg-white px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="Field label"
                            value={field.label || ""}
                            onChange={(e) => updateDocField(sIdx, fIdx, "label", e.target.value)}
                          />
                          <Select value={field.type || "text"} onValueChange={(v) => updateDocField(sIdx, fIdx, "type", v)}>
                            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FIELD_TYPES.map(ft => <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <label className="flex items-center gap-1 cursor-pointer text-xs text-slate-600 shrink-0">
                            <input type="checkbox" checked={field.required || false} onChange={(e) => updateDocField(sIdx, fIdx, "required", e.target.checked)} className="w-3 h-3" />
                            Req
                          </label>
                          <button type="button" onClick={() => removeDocField(sIdx, fIdx)} className="text-slate-300 hover:text-red-500 shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addDocField(sIdx)} className="w-full text-xs text-teal-600 border border-dashed border-teal-300 rounded-md py-1.5 hover:bg-teal-50 flex items-center justify-center gap-1">
                        <Plus className="w-3 h-3" /> Add Field
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-slate-700">Agency Specific Documents</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("doc-upload").click()}
                disabled={uploading}
                className="h-7 text-xs"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3 mr-1" /> Upload PDF
                  </>
                )}
              </Button>
              <input
                id="doc-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <div className="space-y-2">
              {(form.documents || []).length === 0 ? (
                <div className="text-sm text-slate-400 py-2">No documents uploaded</div>
              ) : (
                (form.documents || []).map((doc, idx) => (
                  <div key={idx} className="border rounded-lg p-3 bg-slate-50/50 flex items-start gap-3">
                    <FileText className="w-4 h-4 text-teal-600 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Document name"
                          value={doc.name || ""}
                          onChange={(e) => updateDocument(idx, "name", e.target.value)}
                          className="h-8 text-sm flex-1"
                        />
                        <Select
                          value={doc.type || "contract"}
                          onValueChange={(v) => updateDocument(idx, "type", v)}
                        >
                          <SelectTrigger className="h-8 w-32 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="agreement">Agreement</SelectItem>
                            <SelectItem value="license">License</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal-600 hover:underline"
                      >
                        View Document
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-600"
                      onClick={() => removeDocument(idx)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Required Visit Documents */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm text-slate-700">Required Visit Documents</h3>
                <p className="text-xs text-slate-400 mt-0.5">Documents therapists must upload for every visit note at this agency</p>
              </div>
            </div>
            <div className="space-y-2 mb-3">
              {(form.required_visit_documents || []).length === 0 ? (
                <div className="text-sm text-slate-400 py-1">No required documents configured</div>
              ) : (
                (form.required_visit_documents || []).map((docName, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-md border bg-orange-50 border-orange-200">
                    <span className="text-sm text-slate-700">{docName}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-red-600"
                      onClick={() => set("required_visit_documents", (form.required_visit_documents || []).filter((_, i) => i !== idx))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                placeholder="Document name (e.g. 485 Form, OASIS, POC...)"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newDocName.trim()) {
                    e.preventDefault();
                    set("required_visit_documents", [...(form.required_visit_documents || []), newDocName.trim()]);
                    setNewDocName("");
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newDocName.trim()) {
                    set("required_visit_documents", [...(form.required_visit_documents || []), newDocName.trim()]);
                    setNewDocName("");
                  }
                }}
                className="h-9 shrink-0"
              >
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Additional information about the agency..." />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name} className="bg-teal-600 hover:bg-teal-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Agency"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
