"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

const MAX_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return "";
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FaceSheetUpload({ value, onChange, disabled = false }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_SIZE) {
      toast.error("Face sheet cannot exceed 10 MB.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/referrals/face-sheet", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Face sheet upload failed");
      onChange(result);
      toast.success("Face sheet uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Face sheet upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-dashed bg-slate-50 p-4">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
        onChange={uploadFile}
        disabled={disabled || uploading}
      />
      {value?.url ? (
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 shrink-0 text-teal-600" />
          <div className="min-w-0 flex-1">
            <a href={value.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium text-teal-700 hover:underline">
              {value.fileName || "View face sheet"}
            </a>
            <p className="text-xs text-slate-500">{formatFileSize(value.fileSize)}</p>
          </div>
          <Button type="button" variant="outline" size="sm" disabled={disabled || uploading} onClick={() => inputRef.current?.click()}>
            Replace
          </Button>
          <Button type="button" variant="ghost" size="icon" disabled={disabled || uploading} aria-label="Remove face sheet" onClick={() => onChange(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          {uploading ? <Loader2 className="h-7 w-7 animate-spin text-teal-600" /> : <Upload className="h-7 w-7 text-slate-400" />}
          <div>
            <p className="text-sm font-medium text-slate-700">{uploading ? "Uploading face sheet..." : "Upload face sheet"}</p>
            <p className="text-xs text-slate-500">PDF, JPG, PNG, or WebP up to 10 MB</p>
          </div>
          {!uploading && (
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
              Choose File
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
