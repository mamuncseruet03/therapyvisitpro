"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getCommunicationNotes, addCommunicationNote } from "@/lib/api-client/communication-notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, AlertCircle, User } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const NOTE_TYPE_COLORS = {
  general: "bg-slate-100 text-slate-700",
  clinical: "bg-blue-100 text-blue-700",
  billing: "bg-green-100 text-green-700",
  urgent: "bg-red-100 text-red-700",
};

export default function CommunicationNotes({ patientId, patientName, coordinatorEmail }) {
  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotes = useCallback(async () => {
    if (!patientId) return;
    try {
      const data = await getCommunicationNotes(patientId);
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const handleSubmit = async () => {
    if (!note.trim()) return;
    setSubmitting(true);
    try {
      const result = await addCommunicationNote({
        patientId,
        patientName: patientName || "",
        note,
        noteType,
      });
      if (result?.success) {
        setNote("");
        setNoteType("general");
        toast.success("Note added successfully.");
        loadNotes();
      }
    } catch (err) {
      toast.error("Failed to add note.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-lg p-4 space-y-3">
        <Textarea
          placeholder="Add a communication note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="bg-white"
        />
        <div className="flex items-center gap-3">
          <Select value={noteType} onValueChange={setNoteType}>
            <SelectTrigger className="w-36 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="clinical">Clinical</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !note.trim()}
            className="gap-2 ml-auto"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? "Adding..." : "Add Note"}
          </Button>
        </div>
        {coordinatorEmail && (
          <p className="text-xs text-slate-400">Coordinator ({coordinatorEmail}) will be notified when a note is added.</p>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-400 py-4 text-center">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="text-sm text-slate-400 py-6 text-center">No communication notes yet.</div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notes.map((n) => (
            <div key={n.id} className="bg-white border rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700">{n.author_name || n.author_email || "Unknown"}</span>
                  <Badge className={NOTE_TYPE_COLORS[n.note_type] || NOTE_TYPE_COLORS.general}>
                    {n.note_type}
                  </Badge>
                  {n.note_type === "urgent" && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                </div>
                <span className="text-xs text-slate-400">
                  {n.created_date ? format(new Date(n.created_date), "MMM d, yyyy h:mm a") : ""}
                </span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
