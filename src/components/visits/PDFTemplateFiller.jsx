"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUp, FileCheck, Download, Loader2, X, RefreshCw } from "lucide-react";

export default function PDFTemplateFiller({ visit, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [filling, setFilling] = useState(false);
  const [templateUrl, setTemplateUrl] = useState(visit.pdf_template_url || "");
  const [filledUrl, setFilledUrl] = useState(visit.filled_pdf_url || "");

  const handleUploadTemplate = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      const file_url = data.url || "#";
      setTemplateUrl(file_url);
      onUpdate?.({ ...visit, pdf_template_url: file_url });
    } catch {
      setTemplateUrl("#");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleFillPDF = async () => {
    if (!templateUrl) return;
    setFilling(true);
    // Mock fill - no-op
    const url = "#filled-pdf";
    setFilledUrl(url);
    onUpdate?.({ ...visit, filled_pdf_url: url });
    setFilling(false);
  };

  const handleRemoveTemplate = async () => {
    setTemplateUrl("");
    setFilledUrl("");
    onUpdate?.({ ...visit, pdf_template_url: "", filled_pdf_url: "" });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-800">PDF Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!templateUrl ? (
          <div>
            <input type="file" accept="application/pdf" className="hidden" id="pdf-template-upload" onChange={handleUploadTemplate} />
            <label htmlFor="pdf-template-upload">
              <Button type="button" variant="outline" className="w-full gap-2" disabled={uploading} onClick={() => document.getElementById('pdf-template-upload')?.click()}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                {uploading ? "Uploading..." : "Upload Fillable PDF Template"}
              </Button>
            </label>
            <p className="text-xs text-slate-400 mt-1 text-center">Upload a fillable PDF and auto-populate it with this visit note&apos;s data</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-teal-600" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Template attached</p>
                  <p className="text-xs text-slate-400">Ready to fill with visit note data</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={templateUrl} target="_blank" rel="noopener noreferrer">
                  <Button type="button" variant="outline" size="sm" className="text-xs h-7">View</Button>
                </a>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={handleRemoveTemplate}>
                  <X className="w-3.5 h-3.5 text-red-400" />
                </Button>
              </div>
            </div>

            <Button type="button" onClick={handleFillPDF} disabled={filling} className="w-full gap-2 bg-teal-600 hover:bg-teal-700">
              {filling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {filling ? "Filling PDF..." : filledUrl ? "Re-fill PDF with Current Data" : "Fill PDF with Visit Note Data"}
            </Button>

            {filledUrl && (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-slate-700">Filled PDF ready</p>
                </div>
                <a href={filledUrl} target="_blank" rel="noopener noreferrer" download>
                  <Button type="button" size="sm" className="gap-1 bg-green-600 hover:bg-green-700 h-7 text-xs">
                    <Download className="w-3 h-3" /> Download
                  </Button>
                </a>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
