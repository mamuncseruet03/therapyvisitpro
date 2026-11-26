"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeCurrentUserPassword } from "@/lib/api-client/users";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function ChangePasswordDialog({ open, onOpenChange }) {
  const [values, setValues] = useState(EMPTY);
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (values.newPassword !== values.confirmPassword) return toast.error("New passwords do not match.");
    setPending(true);
    try {
      await changeCurrentUserPassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      setValues(EMPTY);
      onOpenChange(false);
      toast.success("Password changed successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password");
    } finally { setPending(false); }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent>
    <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="account-current-password">Current Password</Label><Input id="account-current-password" type="password" autoComplete="current-password" required value={values.currentPassword} onChange={(event) => setValues((current) => ({ ...current, currentPassword: event.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="account-new-password">New Password</Label><Input id="account-new-password" type="password" autoComplete="new-password" minLength={8} required value={values.newPassword} onChange={(event) => setValues((current) => ({ ...current, newPassword: event.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="account-confirm-password">Confirm New Password</Label><Input id="account-confirm-password" type="password" autoComplete="new-password" minLength={8} required value={values.confirmPassword} onChange={(event) => setValues((current) => ({ ...current, confirmPassword: event.target.value }))} /></div>
      <Button type="submit" disabled={pending} className="w-full bg-teal-600 hover:bg-teal-700">{pending ? "Changing…" : "Change Password"}</Button>
    </form>
  </DialogContent></Dialog>;
}
