"use client";

import { useState } from "react";
import {
  UploadCloud,
  Plus,
  FolderKanban,
  RotateCcw,
  ArrowRight,
  Play,
  Flame,
  CloudSun,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { BentoCard } from "./BentoCard";
import { CircularProgress } from "./CircularProgress";
import { TransactionRow } from "./TransactionRow";
import { MOCK_TRANSACTIONS, MOCK_UPCOMING_TASKS } from "./bento-mock-data";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function BentoGrid() {
  const [activeUpdatesTab, setActiveUpdatesTab] = useState<"brand" | "tasks">("brand");
  const [projectsCount, setProjectsCount] = useState(14);
  const [tasks, setTasks] = useState(MOCK_UPCOMING_TASKS);
  const [uploadsCount, setUploadsCount] = useState(128);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleRefreshProjects = () => {
    setProjectsCount((prev) => (prev === 14 ? 16 : 14));
  };

  const handleAddUpload = () => {
    setUploadsCount((prev) => prev + 1);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[minmax(180px,auto)]">
      {/* ─────────────────────────────────────────────────────────────
          1. LATEST UPLOADS CARD (Soft Peach/Cream)
      ───────────────────────────────────────────────────────────── */}
      <BentoCard
        variant="peach"
        className="flex flex-col justify-between overflow-hidden group min-h-[190px]"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#B08D57]">
              Assets & Files
            </span>
            <h3 className="mt-1 text-lg font-bold text-slate-800 tracking-tight">
              Latest uploads
            </h3>
          </div>
          <div className="grid size-10 place-items-center rounded-2xl bg-[#ffdac2] text-[#B08D57] shadow-xs">
            <UploadCloud className="size-5" />
          </div>
        </div>

        {/* Visual File Badges Cluster */}
        <div className="my-2 flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl bg-white/80 px-2.5 py-1 shadow-2xs border border-white">
            <FileText className="size-3.5 text-amber-500" />
            <span className="text-[11px] font-bold text-slate-700">PDFs</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-white/80 px-2.5 py-1 shadow-2xs border border-white">
            <ImageIcon className="size-3.5 text-rose-500" />
            <span className="text-[11px] font-bold text-slate-700">Images</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">+12 types</span>
        </div>

        <div className="flex items-end justify-between pt-1">
          <div>
            <p className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight">
              {uploadsCount} <span className="text-xs font-semibold text-slate-500">files</span>
            </p>
            <p className="text-[11px] font-medium text-slate-500">3.4 GB total storage</p>
          </div>

          <button
            onClick={handleAddUpload}
            className="grid size-10 place-items-center rounded-full bg-[#B08D57] text-white shadow-md shadow-[#B08D57]/25 transition-transform duration-200 hover:scale-110 active:scale-95"
            title="Upload new file"
            aria-label="Upload file"
          >
            <Plus className="size-5" />
          </button>
        </div>
      </BentoCard>

      {/* ─────────────────────────────────────────────────────────────
          2. OPEN PROJECTS CARD (Light Lavender)
      ───────────────────────────────────────────────────────────── */}
      <BentoCard
        variant="lavender"
        className="flex flex-col justify-between min-h-[190px]"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid size-10 place-items-center rounded-2xl bg-[#E1CEC8] text-[#8F6A3D] shadow-xs">
              <FolderKanban className="size-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8F6A3D]">
                Workflows
              </span>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                Open projects
              </h3>
            </div>
          </div>

          <button
            onClick={handleRefreshProjects}
            className="grid size-8 place-items-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors"
            title="Sync projects"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>

        <div className="my-2">
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {projectsCount}
          </p>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            86 active tasks assigned across 4 teams
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-[#E5D4CE]">
          <span className="text-[11px] font-semibold text-slate-500">
            Next sprint in 3d
          </span>
          <a
            href="#tasks"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#8F6A3D] hover:underline"
          >
            Complete tasks <ArrowRight className="size-3" />
          </a>
        </div>
      </BentoCard>

      {/* ─────────────────────────────────────────────────────────────
          3. LATEST MEDIA CARD (Small Square 1x1 - Mint)
      ───────────────────────────────────────────────────────────── */}
      <BentoCard
        variant="mint"
        className="flex flex-col justify-between min-h-[190px]"
      >
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
            Studio
          </span>
          <div className="grid size-10 place-items-center rounded-2xl bg-emerald-200/80 text-emerald-700 shadow-xs">
            <Play className="size-4.5 fill-current ml-0.5" />
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-800 tracking-tight">
            Latest media
          </h3>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 tracking-tight">
            34 <span className="text-xs font-semibold text-slate-500">clips</span>
          </p>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          4K Video Encoding Ready
        </div>
      </BentoCard>

      {/* ─────────────────────────────────────────────────────────────
          5. WHAT'S YOUR PLAN? CARD (Tall Card Spanning 2 Rows - Navy)
      ───────────────────────────────────────────────────────────── */}
      <BentoCard
        variant="navy-photo"
        className="row-span-1 md:row-span-2 flex flex-col justify-between min-h-[380px] p-7"
      >
        {/* Background aesthetic gradient / stars overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1b224e]/80 via-[#101430]/90 to-[#0b0e22] z-0" />
        
        {/* Decorative subtle atmospheric grid glow */}
        <div className="absolute -top-16 -right-16 size-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        {/* Content Top */}
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-indigo-200 backdrop-blur-md border border-white/10">
            <Sparkles className="size-3 text-amber-300" />
            Focus Agenda
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
            What&apos;s your plan?
          </h3>
          <p className="text-xs text-indigo-200/70 leading-relaxed">
            3 major strategy roadmap reviews scheduled before end of quarter.
          </p>
        </div>

        {/* Weather Widget In Middle */}
        <div className="relative z-10 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudSun className="size-5 text-amber-400" />
              <span className="text-xs font-semibold text-white">San Francisco</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200/80">
              Clear Sky
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white font-sans tracking-tight">
              24°C
            </span>
            <span className="text-xs text-indigo-200/70">Sunny & Breezy</span>
          </div>
        </div>

        {/* Floating Circular Blue Button Bottom */}
        <div className="relative z-10 flex items-center justify-between pt-2">
          <span className="text-xs font-semibold text-indigo-200/70">
            Daily sync · 2:00 PM
          </span>
          <button
            className="relative grid size-12 place-items-center rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white shadow-lg shadow-blue-500/30 transition-transform duration-200 hover:scale-110 active:scale-95"
            title="Start plan mode"
            aria-label="Action button"
          >
            <ArrowUpRight className="size-5.5 stroke-[2.5]" />
          </button>
        </div>
      </BentoCard>

      {/* ─────────────────────────────────────────────────────────────
          4. URGENT TO DO CARD (Small Square 1x1 - Dark Indigo)
      ───────────────────────────────────────────────────────────── */}
      <BentoCard
        variant="dark-indigo"
        className="flex flex-col justify-between min-h-[190px]"
      >
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-300">
            Priority
          </span>
          <div className="grid size-10 place-items-center rounded-2xl bg-rose-500/20 text-rose-400 shadow-xs border border-rose-500/30">
            <Flame className="size-5" />
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Urgent to do
          </h3>
          <p className="mt-1 text-2xl font-extrabold text-white tracking-tight">
            06 <span className="text-xs font-semibold text-indigo-200/70">due today</span>
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] font-medium text-indigo-200/70 border-t border-indigo-900/60 pt-2">
          <span>Client deliverables</span>
          <span className="font-bold text-rose-400">High Impact</span>
        </div>
      </BentoCard>

      {/* ─────────────────────────────────────────────────────────────
          6. LATEST UPDATES SECTION (Spanning 2 Columns - White Card)
      ───────────────────────────────────────────────────────────── */}
      <BentoCard
        variant="white"
        className="col-span-1 md:col-span-2 flex flex-col justify-between min-h-[290px]"
      >
        <div>
          {/* Header & Interactive Tab Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Activity
              </span>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                Latest updates
              </h3>
            </div>

            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-500">
              <button
                onClick={() => setActiveUpdatesTab("brand")}
                className={cn(
                  "rounded-lg px-3 py-1.5 transition-all duration-200",
                  activeUpdatesTab === "brand"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "hover:text-slate-800"
                )}
              >
                Brand additions
              </button>
              <button
                onClick={() => setActiveUpdatesTab("tasks")}
                className={cn(
                  "rounded-lg px-3 py-1.5 transition-all duration-200",
                  activeUpdatesTab === "tasks"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "hover:text-slate-800"
                )}
              >
                Upcoming tasks ({tasks.filter((t) => !t.completed).length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-3">
            <AnimatePresence mode="wait">
              {activeUpdatesTab === "brand" ? (
                <motion.div
                  key="brand-tab"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-1"
                >
                  {MOCK_TRANSACTIONS.slice(0, 4).map((tx) => (
                    <TransactionRow key={tx.id} item={tx} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="tasks-tab"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-2 pt-1"
                >
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-3 transition-colors hover:bg-slate-100/70"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-lg border transition-colors",
                            task.completed
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-300 bg-white"
                          )}
                        >
                          {task.completed && <CheckCircle2 className="size-4" />}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "truncate text-xs font-bold tracking-tight text-slate-800",
                              task.completed && "line-through text-slate-400"
                            )}
                          >
                            {task.title}
                          </p>
                          <p className="text-[11px] font-medium text-slate-400">
                            {task.project} · {task.dueDate}
                          </p>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shrink-0",
                          task.priority === "high" && "bg-rose-100 text-rose-600",
                          task.priority === "medium" && "bg-amber-100 text-amber-700",
                          task.priority === "low" && "bg-slate-200 text-slate-600"
                        )}
                      >
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Synced with live integrations</span>
          <span className="text-indigo-600 hover:underline cursor-pointer">
            View full log →
          </span>
        </div>
      </BentoCard>

      {/* ─────────────────────────────────────────────────────────────
          7. CIRCULAR PROGRESS CARD (White Background, Orange Ring)
      ───────────────────────────────────────────────────────────── */}
      <BentoCard
        variant="white"
        className="flex flex-col items-center justify-center p-6 text-center min-h-[240px]"
      >
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
          Milestones
        </span>
        <CircularProgress
          percentage={78}
          size={140}
          strokeWidth={13}
          color="#f97316"
          label="Task completion rate"
          sublabel="18 of 24 tasks completed"
        />
      </BentoCard>

      {/* ─────────────────────────────────────────────────────────────
          8. GREAT JOB, YOU SAVED CARD (Pink-to-Purple Gradient)
      ───────────────────────────────────────────────────────────── */}
      <BentoCard
        variant="gradient-pink-purple"
        className="flex flex-col justify-between overflow-hidden relative min-h-[240px] p-7"
      >
        {/* Subtle decorative circles */}
        <div className="absolute -right-8 -bottom-8 size-36 rounded-full bg-white/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-pink-200">
              Savings & Rewards
            </span>
            <h3 className="mt-1 text-lg font-bold text-white tracking-tight">
              Great job, you saved!
            </h3>
          </div>
          <div className="grid size-10 place-items-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
            <TrendingUp className="size-5" />
          </div>
        </div>

        <div className="relative z-10 my-3">
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
            $14,850.00
          </p>
          <p className="mt-1 text-xs font-semibold text-pink-100/90 flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-amber-300" />
            +2,450 XP earned this month
          </p>
        </div>

        {/* Card brand logo bottom-right */}
        <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/20">
          <span className="text-[11px] font-medium text-pink-200">
            Nova Business Tier
          </span>
          {/* Stylized payment card circles logo */}
          <div className="flex items-center -space-x-2">
            <span className="size-5 rounded-full bg-amber-400/90 shadow-xs" />
            <span className="size-5 rounded-full bg-rose-400/90 shadow-xs" />
          </div>
        </div>
      </BentoCard>
    </div>
  );
}
