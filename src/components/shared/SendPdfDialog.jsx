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

export default function SendPdfDialog({ documentName, defaultSubject }) {
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState(defaultSubject || documentName);
  const [message, setMessage] = useState(`Please find ${documentName} attached.`);

  const openEmailClient = () => {
    const query = new URLSearchParams({ subject, body: message });
    window.location.href = `mailto:${encodeURIComponent(recipient)}?${query.toString()}`;
    setOpen(false);
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
            Opens your email app with the message prepared. Download the PDF first and attach it in your email app.
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
          <Button onClick={openEmailClient} disabled={!recipient.trim()}>Open Email App</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
