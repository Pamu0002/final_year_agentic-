// UI-only redesign: Restyled review reply form with soft rounded inputs and action buttons
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";

export function ReviewReplyForm({ reviewId, existingReply }: { reviewId: string; existingReply?: string | null }) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState(existingReply ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!existingReply);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/proxy/restaurant-portal/reviews/${reviewId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setOpen(false); }
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 rounded-xl border-border/80 text-xs font-bold text-foreground hover:bg-primary/10 hover:text-primary dark:hover:text-[#D4B57D] hover:border-primary/30 transition-all shadow-2xs"
      >
        <MessageSquare className="size-3.5 mr-1.5 text-primary" />
        {saved ? "Edit Response" : "Reply to Guest"}
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 mt-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
      <Textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Write a polite, welcoming reply to this guest review…"
        rows={3}
        autoFocus
        className="rounded-xl border-border/80 bg-background text-xs focus:ring-2 focus:ring-primary/30 font-sans"
      />
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          className="h-8 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={saving || !reply.trim()}
          className="h-8 rounded-xl bg-primary hover:bg-primary text-white font-bold text-xs px-4 shadow-sm"
        >
          <Send className="size-3 mr-1.5" />
          {saving ? "Posting…" : "Post Reply"}
        </Button>
      </div>
    </form>
  );
}
