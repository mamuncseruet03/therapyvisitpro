"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setPending(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Unable to request a reset link");
      setMessage(body?.message || "If an active account exists for that email, a reset link has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request a reset link");
    } finally { setPending(false); }
  };

  return <Card className="w-full max-w-md border-slate-100"><CardContent className="p-8">
    <div className="mb-7 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600"><Activity className="h-7 w-7 text-white" /></div><h1 className="text-xl font-bold text-slate-900">Reset your password</h1><p className="mt-2 text-sm text-slate-500">Enter your account email and we’ll send a secure reset link.</p></div>
    <form onSubmit={submit} className="space-y-4">
      {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="space-y-2"><Label htmlFor="reset-email">Email</Label><Input id="reset-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
      <Button type="submit" disabled={pending} className="w-full bg-teal-600 hover:bg-teal-700">{pending ? "Sending…" : "Send reset link"}</Button>
    </form>
    <Link href="/login" className="mt-5 flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-teal-700"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
  </CardContent></Card>;
}
