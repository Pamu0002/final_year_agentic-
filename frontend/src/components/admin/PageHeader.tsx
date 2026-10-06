"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Admin's display name for personalized greeting on dashboard */
  greeting?: string;
  /** Quick summary stats shown inline, e.g. "3 pending · 12 reservations today" */
  inlineSummary?: string;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-LK", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

export function PageHeader({ title, description, actions, greeting, inlineSummary }: PageHeaderProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden"
    >
      {/* Subtle gradient backdrop on dashboard */}
      {greeting && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-transparent to-terracotta/[0.03]" />
      )}

      <div className="flex flex-col gap-5 px-5 pb-3 pt-7 sm:px-7 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:pt-9">
        <div className="max-w-3xl">
          {greeting ? (
            <>
              <motion.p
                className="mb-1 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {getFormattedDate()}
              </motion.p>
              <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                {getTimeGreeting()}, {greeting}{" "}
                <motion.span
                  className="inline-block"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                  transition={{ delay: 0.5, duration: 1.2, ease: "easeInOut" }}
                >
                  👋
                </motion.span>
              </h1>
              {inlineSummary && (
                <motion.p
                  className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <Sparkles className="size-3.5 text-primary" />
                  {inlineSummary}
                </motion.p>
              )}
            </>
          ) : (
            <>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-terracotta">Admin workspace</p>
              <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                {title}
              </h1>
              {description && (
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">{description}</p>
              )}
            </>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </motion.div>
  );
}
