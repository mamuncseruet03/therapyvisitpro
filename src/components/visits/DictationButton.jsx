"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, Mic, Square } from "lucide-react";

/**
 * DictationButton - wraps a Textarea with a microphone button for speech-to-text.
 * Usage:
 *   <DictationTextarea value={...} onChange={...} rows={3} placeholder="..." />
 */
export function DictationTextarea({ value, onChange, className = "", ...props }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [dictationError, setDictationError] = useState("");
  const recognitionRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const baseValueRef = useRef("");
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setSupported("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const emitValue = (spokenText) => {
    const current = baseValueRef.current;
    const separator = current && spokenText && !current.endsWith(" ") ? " " : "";
    const nextValue = `${current}${separator}${spokenText}`.slice(0, props.maxLength || Infinity);
    onChangeRef.current?.({ target: { value: nextValue } });
  };

  const startDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || listening) return;

    setDictationError("");
    baseValueRef.current = value || "";
    finalTranscriptRef.current = "";

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript || "";
        if (event.results[index].isFinal) finalText += transcript;
        else interimText += transcript;
      }

      if (finalText.trim()) {
        finalTranscriptRef.current = `${finalTranscriptRef.current} ${finalText}`.trim();
      }

      emitValue(`${finalTranscriptRef.current} ${interimText}`.trim());
    };

    recognition.onerror = (event) => {
      const messages = {
        "not-allowed": "Microphone access was denied. Allow microphone access in the browser and try again.",
        "service-not-allowed": "Speech recognition is blocked by the browser or operating system.",
        "audio-capture": "No working microphone was found.",
        network: "Speech recognition could not reach the network service.",
        "no-speech": "No speech was detected. Please try again.",
      };
      setDictationError(messages[event.error] || "Dictation stopped unexpectedly. Please try again.");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setDictationError("Unable to start dictation. Please try again.");
    }
  };

  const stopDictation = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        className={`flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 pr-10 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${listening ? "border-red-400 ring-1 ring-red-300" : ""} ${className}`}
        {...props}
      />
      {supported && (
        <button
          type="button"
          onClick={listening ? stopDictation : startDictation}
          title={listening ? "Stop dictation" : "Dictate (speech to text)"}
          aria-label={listening ? "Stop dictation" : "Start dictation"}
          aria-pressed={listening}
          className={`absolute right-2 top-2 p-1 rounded-md transition-colors ${
            listening
              ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse"
              : "bg-slate-100 text-slate-500 hover:bg-teal-100 hover:text-teal-600"
          }`}
        >
          {listening ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>
      )}
      {listening && (
        <p className="text-[11px] text-red-500 mt-0.5 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Listening... speak now. Click stop when done.
        </p>
      )}
      {dictationError && (
        <p role="alert" className="text-[11px] text-red-600 mt-1 flex items-start gap-1">
          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
          {dictationError}
        </p>
      )}
    </div>
  );
}
