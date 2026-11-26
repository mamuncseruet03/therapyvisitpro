import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = { title: "Reset Password — TherapyVisit Pro" };

export default function ResetPasswordPage() {
  return <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4"><Suspense fallback={<div className="text-slate-500">Loading…</div>}><ResetPasswordForm /></Suspense></main>;
}
