"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Loader2 } from "lucide-react";

export default function ImportReferralPDF({ onImport }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
    } else {
      alert("Please select a PDF file");
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setUploading(true);

      // Mock: PDF import not available in demo
      alert("PDF import is not available in the demo version.");
      setUploading(false);
      setExtracting(false);
      setFile(null);
      return;
    } catch (error) {
      setUploading(false);
      setExtracting(false);
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Import Referral from PDF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
            {file ? (
              <div className="space-y-3">
                <FileText className="w-12 h-12 mx-auto text-teal-600" />
                <p className="font-medium text-slate-700">{file.name}</p>
                <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                  Remove
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                <Upload className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <p className="text-slate-600 font-medium mb-1">Click to upload PDF</p>
                <p className="text-sm text-slate-400">Referral form, physician notes, or intake document</p>
              </label>
            )}
          </div>

          {file && (
            <Button
              onClick={handleImport}
              disabled={uploading || extracting}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {extracting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {uploading ? "Uploading..." : extracting ? "Extracting Data..." : "Import Referral"}
            </Button>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-slate-600">
            <p className="font-medium text-blue-900 mb-1">How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Upload a PDF referral document</li>
              <li>AI extracts patient information automatically</li>
              <li>Review and complete the patient record</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
