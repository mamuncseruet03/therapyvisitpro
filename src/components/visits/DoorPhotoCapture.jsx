"use client";

import React, { useState, useRef, useEffect } from "react";
import { Camera, X, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DoorPhotoCapture({ photoUrl, onPhotoSaved, onRemove }) {
  const [mode, setMode] = useState("idle");
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [frameReady, setFrameReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    setError(null);
    setFrameReady(false);
    setMode("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions and try again.");
      setMode("idle");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;
    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      setCapturedImage(canvas.toDataURL("image/jpeg", 0.85));
      stopCamera();
      setMode("preview");
    } catch {
      stopCamera();
      setError("Could not capture the photo. Open the camera to retake it.");
      setMode("idle");
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = async () => {
    setError(null);
    setMode("uploading");
    try {
      const blob = await (await fetch(capturedImage)).blob();
      const file = new File([blob], "door-photo.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error("Photo upload failed");
      onPhotoSaved(data.url);
    } catch {
      setError("Could not upload the photo. Try again or retake it.");
      setMode("preview");
      return;
    }
    setCapturedImage(null);
    setMode("idle");
  };

  const cancel = () => {
    stopCamera();
    setCapturedImage(null);
    setMode("idle");
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Camera className="w-4 h-4 text-teal-600" />
          Patient Door Photo
        </CardTitle>
        <p className="text-xs text-slate-500">Take a live photo of the patient&apos;s door to verify the visit location</p>
      </CardHeader>
      <CardContent>
        {error && <p role="alert" className="mb-2 text-sm text-red-500">{error}</p>}
        {/* Existing photo */}
        {photoUrl && mode === "idle" && (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden border border-slate-200">
              <img src={photoUrl} alt="Patient door" className="w-full object-cover max-h-64" />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-white/90 hover:bg-white rounded-full p-1.5 shadow text-slate-600"
                  title="Retake photo"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onRemove}
                  className="bg-white/90 hover:bg-white rounded-full p-1.5 shadow text-red-500"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-teal-600 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Door photo captured
            </p>
          </div>
        )}

        {/* No photo yet */}
        {!photoUrl && mode === "idle" && (
          <div className="space-y-2">
            <Button
              type="button"
              onClick={startCamera}
              className="w-full gap-2 bg-teal-600 hover:bg-teal-700"
            >
              <Camera className="w-4 h-4" />
              Open Camera &amp; Take Photo
            </Button>
          </div>
        )}

        {/* Live camera view */}
        {mode === "camera" && (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden bg-black border border-slate-200">
              <video
                ref={videoRef}
                onLoadedData={(event) => setFrameReady(event.currentTarget.videoWidth > 0)}
                autoPlay
                playsInline
                muted
                className="w-full"
                style={{ maxHeight: "320px", objectFit: "cover" }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={cancel}
                  className="text-white/80 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!frameReady}
                  aria-label="Capture door photo"
                  className="w-14 h-14 rounded-full bg-white border-4 border-white/70 shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-300" />
                </button>
                <div className="w-12" />
              </div>
            </div>
            <p className="text-xs text-center text-slate-500">Point at the patient&apos;s door and press the button to capture</p>
          </div>
        )}

        {/* Preview captured photo */}
        {mode === "preview" && capturedImage && (
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden border border-slate-200">
              <img src={capturedImage} alt="Captured" className="w-full object-cover max-h-64" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={retake} className="flex-1 gap-2">
                <RotateCcw className="w-4 h-4" /> Retake
              </Button>
              <Button type="button" onClick={confirmPhoto} className="flex-1 gap-2 bg-teal-600 hover:bg-teal-700">
                <Check className="w-4 h-4" /> Use This Photo
              </Button>
            </div>
          </div>
        )}

        {/* Uploading */}
        {mode === "uploading" && (
          <div className="flex items-center justify-center py-6 gap-3 text-slate-500">
            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Saving photo...</span>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
