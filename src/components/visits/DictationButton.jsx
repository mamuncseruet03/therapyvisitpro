"use client";

import React, { useState, useRef } from "react";
import { Mic, MicOff, Square } from "lucide-react";

/**
 * DictationButton - wraps a Textarea with a microphone button for speech-to-text.
 * Usage:
 *   <DictationTextarea value={...} onChange={...} rows={3} placeholder="..." />
 */
export function DictationTextarea({ value, onChange, className = "", ...props }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const supported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      const current = value || "";
      const separator = current && !current.endsWith(" ") ? " " : "";
      onChange({ target: { value: current + separator + transcript } });
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopDictation = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  if (!supported) {
    return (
      <textarea
        value={value}
        onChange={onChange}
        className={`flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className}`}
        {...props}
      />
    );
  }

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        className={`flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 pr-10 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${listening ? "border-red-400 ring-1 ring-red-300" : ""} ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={listening ? stopDictation : startDictation}
        title={listening ? "Stop dictation" : "Dictate (speech to text)"}
        className={`absolute right-2 top-2 p-1 rounded-md transition-colors ${
          listening
            ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse"
            : "bg-slate-100 text-slate-500 hover:bg-teal-100 hover:text-teal-600"
        }`}
      >
        {listening ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
      </button>
      {listening && (
        <p className="text-[11px] text-red-500 mt-0.5 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Listening... speak now. Click stop when done.
        </p>
      )}
    </div>
  );
}
