"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, X, ExternalLink, Loader2 } from "lucide-react";

const PROFESSIONAL_FILES = [
  { key: "resume", label: "Resume" },
  { key: "professional_license", label: "Professional License" },
  { key: "professional_registration", label: "Professional Registration" },
  { key: "cpr_certification", label: "CPR Certification" },
];

const HEALTH_FILES = [
  { key: "annual_physical", label: "Annual Physical" },
  { key: "tb_testing", label: "TB Testing" },
  { key: "mmr_titer", label: "MMR Titer" },
  { key: "flu_vaccination", label: "Flu Vaccination" },
  { key: "hepatitis_b", label: "Hepatitis B" },
];

const MISC_FILES = [
  { key: "i9", label: "I-9" },
  { key: "w4", label: "W-4" },
  { key: "contract", label: "Contract" },
  { key: "background_check", label: "Background Check" },
  { key: "release", label: "Release" },
];

function FileRow({ label, fileKey, url, expDate, onUpload, onRemove, onExpDateChange }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      onUpload(fileKey, data.url || "#");
    } catch {
      onUpload(fileKey, "#");
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="py-2.5 border-b last:border-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-sm text-slate-700 truncate">{label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {url ? (
            <>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs text-teal-600 border-teal-200 hover:bg-teal-50">
                  <ExternalLink className="w-3 h-3" /> View
                </Button>
              </a>
              <label>
                <input type="file" className="hidden" onChange={handleFileChange} />
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" asChild>
                  <span className="cursor-pointer">{uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Replace"}</span>
                </Button>
              </label>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(fileKey)}>
                <X className="w-3.5 h-3.5 text-red-400" />
              </Button>
            </>
          ) : (
            <label>
              <input type="file" className="hidden" onChange={handleFileChange} />
              <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs cursor-pointer" asChild>
                <span>
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {uploading ? "Uploading…" : "Upload"}
                </span>
              </Button>
            </label>
          )}
        </div>
      </div>
      {/* Expiration date row */}
      <div className="flex items-center gap-2 mt-1.5 ml-6">
        <span className="text-xs text-slate-400 shrink-0">Exp. Date:</span>
        <Input
          type="date"
          className="h-6 text-xs w-36 px-2"
          value={expDate || ""}
          onChange={(e) => onExpDateChange(fileKey, e.target.value)}
          placeholder="N/A"
        />
        {expDate && (
          <button type="button" onClick={() => onExpDateChange(fileKey, "")} className="text-slate-300 hover:text-red-400">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function TherapistFilesSection({ files = {}, onChange }) {
  const handleUpload = (key, url) => onChange({ ...files, [key]: url });
  const handleRemove = (key) => {
    const updated = { ...files };
    delete updated[key];
    delete updated[`${key}_exp`];
    onChange(updated);
  };
  const handleExpDateChange = (key, date) => onChange({ ...files, [`${key}_exp`]: date });

  const renderGroup = (list) => list.map((f) => (
    <FileRow
      key={f.key}
      label={f.label}
      fileKey={f.key}
      url={files[f.key]}
      expDate={files[`${f.key}_exp`]}
      onUpload={handleUpload}
      onRemove={handleRemove}
      onExpDateChange={handleExpDateChange}
    />
  ));

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Professional Documents</div>
        <div className="rounded-lg border bg-slate-50/50 px-4">{renderGroup(PROFESSIONAL_FILES)}</div>
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Health Forms</div>
        <div className="rounded-lg border bg-slate-50/50 px-4">{renderGroup(HEALTH_FILES)}</div>
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Miscellaneous Forms</div>
        <div className="rounded-lg border bg-slate-50/50 px-4">{renderGroup(MISC_FILES)}</div>
      </div>
    </div>
  );
}
