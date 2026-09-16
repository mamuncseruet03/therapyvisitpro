"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getDocuments, createDocument, updateDocument, deleteDocument } from "@/lib/api-client/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FileText, Trash2, Eye, Upload, ToggleLeft, ToggleRight, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function DocumentLibrary() {
  const effectiveUser = useCurrentUser();
  const isAdmin = ["admin", "superuser"].includes(effectiveUser?.role) || ["admin", "superuser"].includes(effectiveUser?.user_type);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "", file_url: "", file_name: "" });
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const handleCreate = async (data) => {
    try {
      const result = await createDocument(data);
      if (result?.success) { toast.success("Document added"); resetForm(); loadDocuments(); }
    } catch (err) { toast.error("Failed to add document"); }
  };
  const handleUpdate = async ({ id, data }) => {
    try {
      const result = await updateDocument(id, data);
      if (result?.success) { toast.success("Document updated"); resetForm(); loadDocuments(); }
    } catch (err) { toast.error("Failed to update document"); }
  };
  const handleDelete = async (id) => {
    try {
      const result = await deleteDocument(id);
      if (result?.success) { toast.success("Document deleted"); loadDocuments(); }
    } catch (err) { toast.error("Failed to delete document"); }
  };

  const resetForm = () => {
    setForm({ name: "", description: "", category: "", file_url: "", file_name: "" });
    setEditing(null);
    setShowForm(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setForm((f) => ({ ...f, file_url: data.url, file_name: data.fileName || file.name }));
    } catch (err) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!form.name || !form.file_url) { toast.error("Name and file are required"); return; }
    if (editing) {
      handleUpdate({ id: editing.id, data: { ...form, is_active: editing.is_active } });
    } else {
      handleCreate({ ...form, is_active: true });
    }
  };

  const openEdit = (doc) => {
    setEditing(doc);
    setForm({ name: doc.name, description: doc.description || "", category: doc.category || "", file_url: doc.file_url, file_name: doc.file_name || "" });
    setShowForm(true);
  };

  const toggleActive = (doc) => {
    handleUpdate({ id: doc.id, data: { is_active: !doc.is_active } });
  };

  const categories = [...new Set(documents.map(d => d.category).filter(Boolean))];

  if (!isAdmin) {
    return <div className="flex items-center justify-center py-20 text-slate-400">Admin access required.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Document Library</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage documents therapists can attach to visit notes</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2 bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4" /> Add Document
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400">Loading…</div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No documents yet. Add your first document above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className={`transition-opacity ${doc.is_active ? "" : "opacity-60"}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">{doc.name}</span>
                    {doc.category && <Badge variant="outline" className="text-xs">{doc.category}</Badge>}
                    <Badge variant={doc.is_active ? "default" : "secondary"} className={`text-xs ${doc.is_active ? "bg-green-100 text-green-700 border-green-200" : ""}`}>
                      {doc.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {doc.description && <p className="text-sm text-slate-500 mt-0.5 truncate">{doc.description}</p>}
                  {doc.file_name && <p className="text-xs text-slate-400 mt-0.5">{doc.file_name}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => window.open(doc.file_url, "_blank")} title="View">
                    <Eye className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => toggleActive(doc)} title={doc.is_active ? "Deactivate" : "Activate"}>
                    {doc.is_active ? <ToggleRight className="w-5 h-5 text-teal-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(doc)} title="Edit">
                    <Pencil className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} title="Delete">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Document" : "Add Document"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Document Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Home Exercise Program Template" />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Forms, Exercises, Consent" list="cat-list" />
              <datalist id="cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." rows={2} />
            </div>
            <div>
              <Label>File *</Label>
              {form.file_url ? (
                <div className="flex items-center gap-2 mt-1 p-2 bg-teal-50 border border-teal-200 rounded-lg">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span className="text-sm text-slate-700 flex-1 truncate">{form.file_name || "File attached"}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, file_url: "", file_name: "" }))}>Change</Button>
                </div>
              ) : (
                <div className="mt-1">
                  <input type="file" id="lib-file" className="hidden" onChange={handleFileUpload} />
                  <label htmlFor="lib-file">
                    <Button type="button" variant="outline" className="w-full gap-2" disabled={uploading} onClick={() => document.getElementById("lib-file").click()}>
                      <Upload className="w-4 h-4" />{uploading ? "Uploading…" : "Upload File"}
                    </Button>
                  </label>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} className="bg-teal-600 hover:bg-teal-700" disabled={submitting}>
                {editing ? "Save Changes" : "Add Document"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
