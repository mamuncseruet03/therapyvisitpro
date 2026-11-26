"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setError("");
    if (password !== confirmPassword) return setError("Passwords do not match");
    setPending(true);
    try {
      const response = await fetch("/api/v1/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, newPassword: password }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Unable to reset password");
      setComplete(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to reset password"); }
    finally { setPending(false); }
  };

  return <Card className="w-full max-w-md border-slate-100"><CardContent className="p-8">
    <div className="mb-7 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600"><Activity className="h-7 w-7 text-white" /></div><h1 className="text-xl font-bold text-slate-900">Choose a new password</h1><p className="mt-2 text-sm text-slate-500">Use at least 8 characters.</p></div>
    {!token ? <div className="space-y-4"><div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">This reset link is invalid.</div><Link href="/forgot-password"><Button className="w-full">Request another link</Button></Link></div>
    : complete ? <div className="space-y-4"><div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">Password reset successfully. You can now sign in.</div><Link href="/login"><Button className="w-full bg-teal-600 hover:bg-teal-700">Go to sign in</Button></Link></div>
    : <form onSubmit={submit} className="space-y-4">{error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div><Button type="submit" disabled={pending} className="w-full bg-teal-600 hover:bg-teal-700">{pending ? "Resetting…" : "Reset password"}</Button></form>}
  </CardContent></Card>;
}
