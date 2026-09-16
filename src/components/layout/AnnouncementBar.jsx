"use client";

import { useCallback, useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLOR_CLASSES = {
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  green: "border-green-200 bg-green-50 text-green-800",
  red: "border-red-200 bg-red-50 text-red-800",
};

export default function AnnouncementBar({ canPost = false }) {
  const [announcement, setAnnouncement] = useState(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [color, setColor] = useState("blue");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch("/api/v1/announcements")
      .then((response) => response.ok ? response.json() : null)
      .then(setAnnouncement)
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const post = async () => {
    if (!message.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/v1/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, color }),
      });
      if (response.ok) {
        setOpen(false);
        setMessage("");
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-start gap-3">
        {announcement && (
          <div className={`flex min-h-10 flex-1 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ${COLOR_CLASSES[announcement.color] || COLOR_CLASSES.blue}`}>
            <Megaphone className="h-4 w-4 shrink-0" />
            <span>{announcement.message}</span>
          </div>
        )}
        {canPost && (
          <Button variant="outline" className="shrink-0 gap-2" onClick={() => setOpen(true)}>
            <Megaphone className="h-4 w-4" /> Post Announcement
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Post Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Announcement message" />
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="amber">Amber</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="red">Red</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full bg-teal-600 hover:bg-teal-700" disabled={saving || !message.trim()} onClick={post}>
              {saving ? "Posting..." : "Post Announcement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

