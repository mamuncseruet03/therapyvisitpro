"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, CheckCircle, AlertCircle, Loader2, X, ExternalLink, FolderOpen } from "lucide-react";

// agencySourceDocs: the agency's own uploaded documents [{name, url, type}] -- used in agency_docs mode
export default function AgencyDocumentsSection({ agencyName, agencyDocs = [], requiredDocNames = [], agencySourceDocs = [], onChange }) {
  const [uploading, setUploading] = useState(null);

  if (!requiredDocNames || requiredDocNames.length === 0) return null;

  // agencyDocsMode: true when the agency has source docs with matching names
  const isAgencyDocsMode = agencySourceDocs.length > 0;

  const getDoc = (name) => agencyDocs.find((d) => d.name === name);
  const getSourceDoc = (name) => agencySourceDocs.find((d) => d.name === name);

  const handleUpload = async (e, docName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(docName);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      const file_url = data.url || "#";
      const updated = agencyDocs.filter((d) => d.name !== docName);
      onChange([...updated, { name: docName, url: file_url, required: true }]);
    } finally {
      setUploading(null);
    }
  };

  const removeDoc = (docName) => {
    onChange(agencyDocs.filter((d) => d.name !== docName));
  };

  const allFilled = requiredDocNames.every((name) => !!getDoc(name)?.url || !!getSourceDoc(name)?.url);

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-500" />
            Agency Documents
          </CardTitle>
          {allFilled ? (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
              <CheckCircle className="w-3 h-3" /> All Available
            </Badge>
          ) : (
            <Badge variant="outline" className="text-orange-600 border-orange-300 gap-1">
              <AlertCircle className="w-3 h-3" /> {requiredDocNames.filter(n => !getDoc(n)?.url && !getSourceDoc(n)?.url).length} Missing
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {isAgencyDocsMode
            ? <>Open and fill out <span className="font-medium text-slate-700">{agencyName}</span>&apos;s documents as part of this visit</>
            : <>Required by <span className="font-medium text-slate-700">{agencyName}</span> for each visit note</>
          }
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {requiredDocNames.map((docName) => {
            const doc = getDoc(docName);
            const sourceDoc = getSourceDoc(docName);
            const isUploading = uploading === docName;
            const hasSourceUrl = !!sourceDoc?.url;
            const hasUploadedUrl = !!doc?.url;
            const isAvailable = hasSourceUrl || hasUploadedUrl;

            return (
              <div key={docName} className={`flex items-center justify-between p-3 rounded-lg border ${isAvailable ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isAvailable ? (
                    <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-700 truncate block">{docName}</span>
                    {isAgencyDocsMode && hasSourceUrl && (
                      <span className="text-xs text-blue-600">Tap to open & fill out</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Agency-provided source doc -- show Open button */}
                  {hasSourceUrl && (
                    <a href={sourceDoc.url} target="_blank" rel="noopener noreferrer">
                      <Button type="button" size="sm" className="h-7 gap-1 bg-blue-600 hover:bg-blue-700 text-white">
                        <ExternalLink className="w-3 h-3" /> Open
                      </Button>
                    </a>
                  )}

                  {/* Uploaded filled version */}
                  {hasUploadedUrl && (
                    <>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-teal-600 border-teal-300">
                          <ExternalLink className="w-3 h-3" /> View Filled
                        </Button>
                      </a>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => removeDoc(docName)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}

                  {/* Upload button -- always available to upload a completed/filled copy */}
                  <input
                    type="file"
                    id={`agency-doc-${docName}`}
                    className="hidden"
                    onChange={(e) => handleUpload(e, docName)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-slate-600"
                    disabled={isUploading}
                    onClick={() => document.getElementById(`agency-doc-${docName}`).click()}
                    title="Upload completed/filled copy"
                  >
                    {isUploading ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="w-3 h-3" /> {hasUploadedUrl ? "Replace" : "Upload"}</>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        {isAgencyDocsMode && (
          <p className="text-xs text-slate-400 mt-3">Open each document, fill it out, then optionally upload the completed copy back.</p>
        )}
      </CardContent>
    </Card>
  );
}
