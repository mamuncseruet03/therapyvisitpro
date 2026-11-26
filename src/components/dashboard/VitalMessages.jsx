"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acknowledgeVitalMessage, loadTherapistVitalMessages } from "@/app/(app)/Communications/actions";

export default function VitalMessages({ userId }) {
  const [messages, setMessages] = useState([]);
  const [pendingId, setPendingId] = useState(null);
  useEffect(() => {
    let active = true;
    loadTherapistVitalMessages().then((items) => {
      if (active) setMessages(items);
    }).catch(() => {
      if (active) toast.error("Could not load vital alert messages.");
    });
    return () => { active = false; };
  }, [userId]);

  async function acknowledge(id) {
    setPendingId(id);
    try {
      await acknowledgeVitalMessage(id);
      setMessages((items) => items.filter((item) => item.id !== id));
    } catch {
      toast.error("Could not acknowledge this message. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  if (!messages.length) return null;
  return (
    <section aria-label="Vital alert messages" className="space-y-3">
      {messages.map(({ id, title, message }) => (
        <article key={id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold">{title}</h2>
          <p className="my-2 whitespace-pre-wrap text-sm">{message}</p>
          <Button size="sm" disabled={pendingId !== null} onClick={() => acknowledge(id)}>Acknowledge</Button>
        </article>
      ))}
    </section>
  );
}
