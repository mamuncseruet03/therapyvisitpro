"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getTherapists, updateTherapist } from "@/lib/api-client/therapists";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, FileText, Phone, Mail, Award, ExternalLink, Pencil } from "lucide-react";
import { toast } from "sonner";

const FILE_FIELDS = [
  { key: "resume", label: "Resume" },
  { key: "professional_license", label: "Professional License" },
  { key: "professional_registration", label: "Professional Registration" },
  { key: "cpr_certification", label: "CPR Certification" },
  { key: "annual_physical", label: "Annual Physical" },
  { key: "tb_testing", label: "TB Testing" },
  { key: "mmr_titer", label: "MMR Titer" },
  { key: "flu_vaccination", label: "Flu Vaccination" },
  { key: "hepatitis_b", label: "Hepatitis B" },
];

export default function MyProfile() {
  const effectiveUser = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [uploading, setUploading] = useState({});
  const [therapists, setTherapists] = useState([]);

  const isAdmin = ["admin", "superuser"].includes(effectiveUser?.role) || ["admin", "superuser"].includes(effectiveUser?.user_type);

  const loadTherapists = useCallback(async () => {
    try {
      const data = await getTherapists();
      setTherapists(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadTherapists(); }, [loadTherapists]);

  const therapist = therapists.find(
    t => t.email === effectiveUser?.email || t.full_name === effectiveUser?.full_name
  );

  const handleUpdate = async ({ id, data }) => {
    try {
      const result = await updateTherapist(id, data);
      if (result?.success) {
        setEditing(false);
        toast.success("Profile updated");
        loadTherapists();
      }
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  const startEdit = () => {
    setForm({ ...therapist });
    setEditing(true);
  };

  const handleFileUpload = async (fieldKey, file) => {
    setUploading(prev => ({ ...prev, [fieldKey]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setForm(prev => ({ ...prev, [fieldKey]: data.url }));
      toast.success("File uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(prev => ({ ...prev, [fieldKey]: false }));
    }
  };

  const handleSave = () => {
    handleUpdate({ id: therapist.id, data: form });
  };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  if (!therapist) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <Card><CardContent className="py-16 text-center text-slate-400">
          <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No therapist profile found for your account.</p>
        </CardContent></Card>
      </div>
    );
  }

  const displayData = editing ? form : therapist;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 text-sm mt-1">Your therapist credentials and information</p>
        </div>
        {isAdmin && !editing && (
          <Button onClick={startEdit} className="gap-2 bg-teal-600 hover:bg-teal-700">
            <Pencil className="w-4 h-4" /> Edit Profile
          </Button>
        )}
        {!isAdmin && (
          <Badge variant="outline" className="text-slate-500">View Only</Badge>
        )}
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" /> Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-slate-500">Full Name</Label>
            {editing ? (
              <Input value={displayData.full_name || ""} onChange={e => set("full_name", e.target.value)} />
            ) : (
              <p className="text-sm font-medium text-slate-800 mt-1">{therapist.full_name || "—"}</p>
            )}
          </div>
          <div>
            <Label className="text-xs text-slate-500">Discipline</Label>
            {editing ? (
              <Select value={displayData.discipline || ""} onValueChange={v => set("discipline", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
                  <SelectItem value="Occupational Therapy">Occupational Therapy</SelectItem>
                  <SelectItem value="Speech Therapy">Speech Therapy</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-slate-800 mt-1">{therapist.discipline || "—"}</p>
            )}
          </div>
          <div>
            <Label className="text-xs text-slate-500">Credentials</Label>
            {editing ? (
              <Input value={displayData.credentials || ""} onChange={e => set("credentials", e.target.value)} />
            ) : (
              <p className="text-sm text-slate-800 mt-1">{therapist.credentials || "—"}</p>
            )}
          </div>
          <div>
            <Label className="text-xs text-slate-500">License Number</Label>
            {editing ? (
              <Input value={displayData.license_number || ""} onChange={e => set("license_number", e.target.value)} />
            ) : (
              <p className="text-sm text-slate-800 mt-1">{therapist.license_number || "—"}</p>
            )}
          </div>
          <div>
            <Label className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</Label>
            {editing ? (
              <Input value={displayData.phone || ""} onChange={e => set("phone", e.target.value)} />
            ) : (
              <p className="text-sm text-slate-800 mt-1">{therapist.phone || "—"}</p>
            )}
          </div>
          <div>
            <Label className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</Label>
            <p className="text-sm text-slate-800 mt-1">{therapist.email || "—"}</p>
          </div>
          <div>
            <Label className="text-xs text-slate-500">Status</Label>
            <div className="mt-1">
              <Badge className={therapist.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                {therapist.status || "active"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {editing && (
        <div className="flex gap-3">
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleSave}>Save Changes</Button>
          <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      )}

      {/* Personal Files / Compliance Documents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" /> Compliance Documents
          </CardTitle>
          {!isAdmin && <p className="text-xs text-slate-400">Contact an admin to update documents.</p>}
        </CardHeader>
        <CardContent className="space-y-3">
          {FILE_FIELDS.map(({ key, label }) => {
            const url = therapist.personal_files?.[key];
            return (
              <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {url ? (
                    <>
                      <Badge className="bg-green-50 text-green-700 text-xs">On file</Badge>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                          <ExternalLink className="w-3 h-3" /> View
                        </Button>
                      </a>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-slate-400 text-xs">Not uploaded</Badge>
                  )}
                  {isAdmin && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handleFileUpload(key, e.target.files[0]); }}
                      />
                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={uploading[key]} asChild>
                        <span>{uploading[key] ? "Uploading…" : url ? "Replace" : "Upload"}</span>
                      </Button>
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}