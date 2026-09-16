"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Camera, X, ExternalLink, Loader2, Paperclip } from "lucide-react";

export default function AdditionalUploads({ uploads = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      const file_url = data.url || "#";
      const name = file.name || `Photo_${new Date().toLocaleTimeString()}`;
      onChange([...uploads, { name, url: file_url, uploaded_at: new Date().toISOString() }]);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => uploadFile(f));
    e.target.value = "";
  };

  const openCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(s);
      setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 100);
    } catch {
      alert("Camera not available. Please use file upload instead.");
    }
  };

  const closeCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraOpen(false);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    closeCamera();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg"));
    const name = `Photo_${Date.now()}.jpg`;
    const formData = new FormData();
    formData.append("file", new File([blob], name, { type: "image/jpeg" }));
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      onChange([...uploads, { name, url: data.url || "#", uploaded_at: new Date().toISOString() }]);
    } catch {
      onChange([...uploads, { name, url: "#", uploaded_at: new Date().toISOString() }]);
    }
  };

  const removeUpload = (idx) => onChange(uploads.filter((_, i) => i !== idx));

  return (
    <Card className="border-l-4 border-l-indigo-400">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-indigo-500" />
            Additional Visit Documents
          </CardTitle>
          {uploads.length > 0 && (
            <Badge variant="outline" className="text-indigo-600 border-indigo-300">
              {uploads.length} file{uploads.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">Upload or photograph any additional documents for this visit</p>
      </CardHeader>
      <CardContent className="space-y-3">

        {/* Camera View */}
        {cameraOpen && (
          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-black">
            <video ref={videoRef} autoPlay playsInline className="w-full max-h-64 object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
              <Button type="button" onClick={capturePhoto} className="bg-white text-slate-800 hover:bg-slate-100 gap-2">
                <Camera className="w-4 h-4" /> Capture
              </Button>
              <Button type="button" variant="ghost" onClick={closeCamera} className="bg-white/80 text-slate-600 hover:bg-white gap-2">
                <X className="w-4 h-4" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Uploaded files list */}
        {uploads.length > 0 && (
          <div className="space-y-2">
            {uploads.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border bg-indigo-50 border-indigo-200">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-sm text-slate-700 truncate">{doc.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-teal-600">
                      <ExternalLink className="w-3 h-3" /> View
                    </Button>
                  </a>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => removeUpload(idx)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,application/pdf,.doc,.docx"
          />
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Uploading..." : "Upload File"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2"
            disabled={uploading || cameraOpen}
            onClick={openCamera}
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
