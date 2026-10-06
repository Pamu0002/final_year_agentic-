"use client";

import { useSyncExternalStore } from "react";
import { Coffee, MoonStar, Sun, Sunset } from "lucide-react";

type TimePeriod = "morning" | "afternoon" | "evening" | "night" | "welcome";

const PERIOD_DETAILS = {
  morning: {
    label: "Good morning",
    prompt: "What sounds good today?",
    icon: Coffee,
    tone: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  },
  afternoon: {
    label: "Good afternoon",
    prompt: "Ready to find your table?",
    icon: Sun,
    tone: "bg-terracotta/12 text-terracotta",
  },
  evening: {
    label: "Good evening",
    prompt: "Dinner plans start here.",
    icon: Sunset,
    tone: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  },
  night: {
    label: "Good night",
    prompt: "Planning tomorrow's meal?",
    icon: MoonStar,
    tone: "bg-primary/10 text-primary",
  },
  welcome: {
    label: "Welcome",
    prompt: "Find your next favourite table.",
    icon: Sun,
    tone: "bg-primary/10 text-primary",
  },
} satisfies Record<TimePeriod, { label: string; prompt: string; icon: typeof Sun; tone: string }>;

function getTimePeriod(): TimePeriod {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

function subscribeToClock(onChange: () => void) {
  const interval = window.setInterval(onChange, 60_000);
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearInterval(interval);
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function getServerPeriod(): TimePeriod {
  return "welcome";
}

export function TimeGreeting({ name }: { name?: string | null }) {
  const period = useSyncExternalStore(subscribeToClock, getTimePeriod, getServerPeriod);
  const details = PERIOD_DETAILS[period];
  const Icon = details.icon;
  const firstName = name?.trim().split(/\s+/)[0];

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-3 py-2 shadow-sm backdrop-blur" aria-live="polite">
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${details.tone}`}>
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold leading-tight text-foreground">
          {details.label}{firstName ? `, ${firstName}` : ""}
        </span>
        <span className="block truncate text-[11px] leading-tight text-muted-foreground">{details.prompt}</span>
      </span>
    </div>
  );
}
