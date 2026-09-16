"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Check, RotateCcw, MapPin, Maximize2, PenLine } from "lucide-react";

function SignatureCanvas({ onSave, onCancel, existingSignature, label }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [location, setLocation] = useState(null);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    resize();

    if (existingSignature) {
      const img = new Image();
      img.onload = () => {
        const rect = canvas.getBoundingClientRect();
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = existingSignature;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }

    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [existingSignature]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasDrawn(true);
  }, [isDrawing]);

  const endDraw = useCallback((e) => {
    e.preventDefault();
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    onSave({ signature: canvas.toDataURL("image/png"), timestamp: new Date().toISOString(), location });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <PenLine className="w-5 h-5 text-teal-600" />
          <span className="font-semibold text-slate-800">{label}</span>
          {location && <MapPin className="w-4 h-4 text-teal-500" />}
        </div>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-full hover:bg-slate-100">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="flex-1 bg-slate-50 p-3 min-h-0">
        <div className="h-full bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-inner">
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none cursor-crosshair block"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white shrink-0 gap-3">
        <Button type="button" variant="outline" onClick={clear} disabled={!hasDrawn} className="gap-2">
          <RotateCcw className="w-4 h-4" /> Clear
        </Button>
        {location && (
          <p className="text-xs text-slate-400 hidden sm:block truncate flex-1 text-center">
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </p>
        )}
        <Button type="button" onClick={save} disabled={!hasDrawn} className="gap-2 bg-teal-600 hover:bg-teal-700">
          <Check className="w-4 h-4" /> Save Signature
        </Button>
      </div>
    </div>
  );
}

export default function SignatureCapture({ label, onSave, onCancel, existingSignature, triggerLabel, triggerVariant }) {
  const [open, setOpen] = useState(false);

  const handleSave = (data) => {
    setOpen(false);
    onSave(data);
  };

  const handleCancel = () => {
    setOpen(false);
    onCancel?.();
  };

  const isOutline = triggerVariant === "outline";

  return (
    <>
      {isOutline ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <PenLine className="w-4 h-4" />
          {triggerLabel || label}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-3 px-4 py-5 border-2 border-dashed border-teal-300 rounded-xl bg-teal-50 hover:bg-teal-100 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center shadow group-hover:scale-105 transition-transform">
            <PenLine className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-teal-800">{triggerLabel || label}</p>
            <p className="text-xs text-teal-600 flex items-center gap-1">
              <Maximize2 className="w-3 h-3" /> Tap to open full-screen signing
            </p>
          </div>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col" style={{ touchAction: "none" }}>
          <SignatureCanvas
            label={label}
            onSave={handleSave}
            onCancel={handleCancel}
            existingSignature={existingSignature}
          />
        </div>
      )}
    </>
  );
}
