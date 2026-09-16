"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { verifyCurrentUserPassword } from "@/lib/api-client/users";

/**
 * Wraps sensitive HR content behind a password confirmation gate.
 * Once unlocked, content is revealed for the session lifetime of the component.
 */
export default function HRPasswordGate({ label = "HR Records", children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!password) return;
    setVerifying(true);
    setError("");
    try {
      const result = await verifyCurrentUserPassword(password);
      if (result.success) {
        setUnlocked(true);
        setPassword("");
      } else {
        setError(result.error || "Incorrect password");
      }
    } catch (err) {
      setError("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  if (unlocked) {
    return (
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs text-green-700 font-medium">Identity verified — access granted</span>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl bg-slate-50 p-5">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
          <Lock className="w-5 h-5 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">{label} — Restricted Access</p>
          <p className="text-xs text-slate-400 mt-0.5">Enter your password to view this section</p>
        </div>
        <form onSubmit={handleVerify} className="w-full max-w-xs space-y-2">
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              className="pr-10 h-9 text-sm"
              autoComplete="current-password"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPw(p => !p)}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" size="sm" className="w-full h-8 text-xs bg-slate-800 hover:bg-slate-900" disabled={verifying || !password}>
            {verifying ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Verifying&hellip;</> : "Confirm Identity"}
          </Button>
        </form>
      </div>
    </div>
  );
}
