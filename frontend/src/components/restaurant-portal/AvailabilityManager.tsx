// UI-only redesign: Restyled availability slot manager with modern time pickers and save toasts
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Slot {
  time: string;
  capacity: number;
  bookedSeats: number;
  remainingSeats?: number;
  available: boolean;
  isBlocked: boolean;
  note?: string | null;
}

export function AvailabilityManager() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchSlots = async () => {
    setLoading(true);
    const res = await fetch(`/api/proxy/restaurant-portal/availability/${date}`);
    if (res.ok) setSlots(await res.json() as Slot[]);
    setLoaded(true);
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const response = await fetch(`/api/proxy/restaurant-portal/availability/${date}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots }),
    });
    const body = await response.json().catch(() => ({})) as { error?: string };
    setMessage(response.ok ? "Availability updated successfully." : body.error ?? "Could not save availability.");
    setSaving(false);
  };

  const addSlot = () => setSlots((p) => [...p, { time: "12:00", capacity: 10, bookedSeats: 0, available: true, isBlocked: false }]);
  const removeSlot = (i: number) => setSlots((p) => p.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, field: keyof Slot, value: string | number | boolean) =>
    setSlots((p) => p.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 max-w-lg text-xs font-semibold">
        <div className="space-y-1.5 flex-1">
          <Label htmlFor="date" className="text-foreground flex items-center gap-1.5">
            <Calendar className="size-3.5 text-primary" /> Select Target Date
          </Label>
          <Input id="date" type="date" value={date} onChange={(e) => { setDate(e.target.value); setLoaded(false); }} className="rounded-xl border-border/80" />
        </div>
        <Button onClick={fetchSlots} disabled={loading} className="rounded-xl bg-primary hover:bg-primary text-white font-bold text-xs px-4 h-10 shadow-sm">
          {loading ? "Loading…" : "Load Time Slots"}
        </Button>
      </div>

      {loaded && (
        <div className="space-y-4 pt-2">
          {slots.length === 0 ? (
            <p className="text-xs text-muted-foreground font-semibold rounded-xl bg-muted/30 p-4 text-center">No time slot overrides configured for this date.</p>
          ) : (
            <div className="space-y-2.5">
              {slots.map((slot, i) => (
                <div key={i} className={cn("grid gap-3 rounded-2xl border p-3.5 shadow-2xs sm:grid-cols-[8rem_8rem_7rem_1fr_auto] sm:items-center text-xs font-semibold", slot.isBlocked ? "border-rose-500/30 bg-rose-500/5" : "border-border/80 bg-card")}>
                  <Input type="time" value={slot.time} onChange={(e) => updateSlot(i, "time", e.target.value)} className="w-28 rounded-xl border-border/80 font-mono font-bold" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Capacity:</span>
                    <Input type="number" min="1" value={slot.capacity} onChange={(e) => updateSlot(i, "capacity", Number(e.target.value))} className="w-16 h-8 rounded-lg border-border/80 font-bold" />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer font-bold select-none">
                    <input type="checkbox" checked={slot.isBlocked} onChange={(e) => { updateSlot(i, "isBlocked", e.target.checked); updateSlot(i, "available", !e.target.checked); }} className="size-3.5 accent-rose-600 rounded" />
                    <span className={slot.isBlocked ? "text-rose-600 dark:text-rose-400" : ""}>Block Slot</span>
                  </label>
                  <Input value={slot.note ?? ""} onChange={(e) => updateSlot(i, "note", e.target.value)} placeholder={`Note · ${slot.bookedSeats} booked`} className="h-8 rounded-xl border-border/80" />
                  <Button variant="ghost" size="icon" className="size-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => removeSlot(i)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2.5 pt-2">
            <Button variant="outline" onClick={addSlot} className="rounded-xl border-border/80 font-bold text-xs h-10 px-4">
              <Plus className="size-4 mr-1.5" /> Add Time Slot
            </Button>
            <Button onClick={save} disabled={saving} className="rounded-xl bg-primary hover:bg-primary text-white font-bold text-xs h-10 px-5 shadow-sm">
              <Save className="size-4 mr-1.5" />
              {saving ? "Saving…" : "Save Overrides"}
            </Button>
          </div>
          {message && (
            <p className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-[#D4B57D] mt-2">
              <CheckCircle2 className="size-4" /> {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
