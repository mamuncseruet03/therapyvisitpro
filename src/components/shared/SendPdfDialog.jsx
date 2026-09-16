"use client";

import React, { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function SendPdfDialog({ documentName, defaultSubject, documentType, documentId }) {
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState(defaultSubject || documentName);
  const [message, setMessage] = useState(`Please find ${documentName} attached.`);
  const [sending, setSending] = useState(false);

  const sendEmail = async () => {
    setSending(true);
    try {
      const response = await fetch("/api/v1/documents/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: documentType, id: documentId, recipient, subject, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send email");
      toast.success("PDF emailed successfully");
      setOpen(false);
    } catch (error) {
      toast.error(error.message || "Unable to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Mail className="h-4 w-4" /> Email PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Email PDF</DialogTitle>
          <DialogDescription>
            Sends the generated PDF as an email attachment.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="pdf-email-recipient">Recipient</Label>
            <Input id="pdf-email-recipient" type="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="name@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pdf-email-subject">Subject</Label>
            <Input id="pdf-email-subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pdf-email-message">Message</Label>
            <Textarea id="pdf-email-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={5} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={sendEmail} disabled={!recipient.trim() || sending}>{sending ? "Sending..." : "Send Email"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
