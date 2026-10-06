"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  LucideIcon,
  TrendingDown,
  TrendingUp,
  Users,
  Building2,
  CalendarDays,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  users: Users,
  building: Building2,
  calendar: CalendarDays,
  dollar: DollarSign,
  card: CreditCard,
  alert: AlertCircle,
  check: CheckCircle2,
  x: XCircle,
  rotate: RotateCcw,
} as const;

export type StatIconName = keyof typeof ICON_MAP;

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon | StatIconName;
  trend?: { value: string; up: boolean };
  accent?: "default" | "green" | "orange" | "red" | "blue";
}

const ACCENT_CLASSES = {
  default: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  red: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  blue: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
};

const ACCENT_BARS = {
  default: "bg-stone-400",
  green: "bg-emerald-500",
  orange: "bg-orange-500",
  red: "bg-rose-500",
  blue: "bg-sky-500",
};

const ACCENT_GLOW = {
  default: "",
  green: "hover:shadow-emerald-500/8",
  orange: "hover:shadow-orange-500/8",
  red: "hover:shadow-rose-500/8",
  blue: "hover:shadow-sky-500/8",
};

/* ── Count-up hook ─────────────────────────────────────────────────────────── */

function useCountUp(end: number, duration = 1400, enabled = true) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!enabled || end === 0) {
      setCurrent(end);
      return;
    }

    let raf: number;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic for a smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * end));

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, enabled]);

  return current;
}

/* ── Extract numeric value from a string like "LKR 1.2M" or "347" ─────── */

function extractNumber(val: string | number): number {
  if (typeof val === "number") return val;
  const match = val.replace(/,/g, "").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function formatLikeOriginal(original: string | number, animatedNum: number): string {
  if (typeof original === "number") return animatedNum.toLocaleString();

  // Preserve original formatting (e.g., "LKR 1.2M")
  const str = String(original);
  const numMatch = str.replace(/,/g, "").match(/[\d.]+/);
  if (!numMatch) return str;

  // Check if the original number has a compact suffix (K, M, etc.)
  const afterNum = str.slice(str.indexOf(numMatch[0]) + numMatch[0].length);
  const beforeNum = str.slice(0, str.indexOf(numMatch[0]));

  // If original uses compact notation, animate the compact number
  if (afterNum.match(/[KMB]/i)) {
    const targetCompact = parseFloat(numMatch[0]);
    const ratio = animatedNum / (extractNumber(original) || 1);
    const animatedCompact = (targetCompact * ratio).toFixed(
      numMatch[0].includes(".") ? 1 : 0
    );
    return `${beforeNum}${animatedCompact}${afterNum}`;
  }

  // Otherwise animate the raw number with comma formatting
  return `${beforeNum}${animatedNum.toLocaleString()}${afterNum}`;
}

/* ── Card animation variant ─────────────────────────────────────────────── */

const cardVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 350, damping: 28 },
  },
};

/* ── Component ─────────────────────────────────────────────────────────── */

export function StatCard({
  label,
  value,
  icon,
  trend,
  accent = "default",
}: StatCardProps) {
  const Icon = typeof icon === "string" ? ICON_MAP[icon] || AlertCircle : icon;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const numericTarget = extractNumber(value);
  const animated = useCountUp(numericTarget, 1400, inView);

  return (
    <motion.div ref={ref} variants={cardVariant} style={{ perspective: 900 }}>
      <motion.div
        whileHover={{ y: -4, scale: 1.015, rotateX: -1.5, rotateY: 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <Card
          className={cn(
            "group relative min-h-40 overflow-hidden border-border/70 transition-all duration-300",
            "hover:shadow-xl",
            ACCENT_GLOW[accent]
          )}
        >
          {/* Accent bar */}
          <span className={cn("absolute inset-y-0 left-0 w-1 transition-all duration-300 group-hover:w-1.5", ACCENT_BARS[accent])} />

          {/* Subtle background glow */}
          <div className={cn(
            "pointer-events-none absolute -right-8 -top-8 size-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100",
            accent === "green" && "bg-emerald-500/10",
            accent === "blue" && "bg-sky-500/10",
            accent === "orange" && "bg-orange-500/10",
            accent === "red" && "bg-rose-500/10",
            accent === "default" && "bg-stone-500/10",
          )} />

          <CardContent className="flex h-full items-start justify-between gap-4 p-5 pl-6 sm:p-6 sm:pl-7">
            <div className="min-w-0 space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {label}
              </p>
              <p className="truncate text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                {inView ? formatLikeOriginal(value, animated) : "0"}
              </p>
              {trend && (
                <p
                  className={cn(
                    "flex items-center gap-1 text-xs font-semibold",
                    trend.up
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  )}
                >
                  {trend.up ? (
                    <TrendingUp className="size-3.5" />
                  ) : (
                    <TrendingDown className="size-3.5" />
                  )}
                  {trend.value}
                </p>
              )}
            </div>
            <div
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-2xl transition-transform duration-200 group-hover:scale-110",
                ACCENT_CLASSES[accent]
              )}
            >
              <Icon className="size-5" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
