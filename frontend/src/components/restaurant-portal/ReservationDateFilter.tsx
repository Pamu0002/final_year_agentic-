"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReservationDateFilterProps {
  selectedDate: string;
  today: string;
}

export function ReservationDateFilter({ selectedDate, today }: ReservationDateFilterProps) {
  const [date, setDate] = useState(selectedDate);
  const router = useRouter();

  function showDate(nextDate: string) {
    setDate(nextDate);
    router.push(`/restaurant/reservations?view=list&date=${encodeURIComponent(nextDate)}`);
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1 shadow-xs">
      <label className="flex items-center gap-2 rounded-lg px-2.5 text-xs font-bold text-muted-foreground">
        <CalendarDays className="size-4 text-primary" />
        <span className="hidden sm:inline">Show date</span>
        <input
          type="date"
          value={date}
          onChange={(event) => showDate(event.target.value)}
          className="h-9 rounded-md border-0 bg-transparent px-1 text-sm font-semibold text-foreground outline-none"
          aria-label="Select reservation date"
        />
      </label>
      {date !== today && (
        <Button type="button" variant="ghost" size="sm" onClick={() => showDate(today)}>
          <RotateCcw className="size-3.5" />
          Today
        </Button>
      )}
    </div>
  );
}
