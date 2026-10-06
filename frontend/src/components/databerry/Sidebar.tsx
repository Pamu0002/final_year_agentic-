"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Mail,
  FolderKanban,
  CheckSquare,
  Users,
  CreditCard,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DataberryNavId } from "./types";

interface SidebarProps {
  activeNav?: DataberryNavId;
  onSelectNav?: (id: DataberryNavId) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS: { id: DataberryNavId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "email", label: "Email", icon: Mail },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "teams", label: "Teams", icon: Users },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "upcoming", label: "Upcoming", icon: CalendarClock },
  { id: "done", label: "Done", icon: CheckCircle2 },
];

export function Sidebar({
  activeNav = "dashboard",
  onSelectNav,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  const sidebarContent = (
    <aside className="flex h-full w-[295px] flex-col justify-between bg-[#6B1E2E] text-white p-7 rounded-[28px] shadow-2xl select-none relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 size-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />

      <div className="space-y-7 relative z-10">
        {/* Brand Logo */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-white font-sans">
              databerry<span className="text-sm font-semibold opacity-80">™</span>
            </span>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="grid size-8 place-items-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 lg:hidden"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {/* User Block */}
        <div className="relative">
          <div
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-white/[0.08] p-3 transition-colors hover:bg-white/[0.12]"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Circular Avatar */}
              <div className="relative size-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                  alt="Dave johnson"
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white tracking-tight leading-tight">
                  Dave johnson
                </p>
                <p className="truncate text-[11px] font-normal text-white/60 leading-tight mt-0.5">
                  Founder and Ceo
                </p>
              </div>
            </div>

            {/* Lavender rounded-square dropdown button */}
            <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#B08D57] text-white shadow-xs">
              <ChevronDown className={cn("size-4 transition-transform duration-200", profileOpen && "rotate-180")} />
            </div>
          </div>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 right-0 mt-2 z-30 rounded-2xl bg-[#521725] p-2 border border-white/10 shadow-xl text-xs space-y-1"
              >
                <div className="px-3 py-1.5 text-white/50 border-b border-white/10 font-medium">dave@databerry.io</div>
                <button onClick={() => setProfileOpen(false)} className="w-full text-left px-3 py-1.5 rounded-lg text-white hover:bg-white/10">Account Settings</button>
                <button onClick={() => setProfileOpen(false)} className="w-full text-left px-3 py-1.5 rounded-lg text-rose-300 hover:bg-rose-500/20">Sign Out</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items (~68px vertical cadence) */}
        <nav className="space-y-2 pt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectNav?.(item.id);
                  onCloseMobile?.();
                }}
                className={cn(
                  "group flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-white/20 text-white shadow-xs"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={cn("size-5 transition-transform duration-200 group-hover:scale-105", isActive ? "text-white" : "text-white/80")} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={cn("size-4 transition-transform duration-200 group-hover:translate-x-0.5", isActive ? "text-white" : "text-white/40")} />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar bottom indicator */}
      <div className="relative z-10 pt-4 border-t border-white/10 text-[11px] text-white/50 flex items-center justify-between">
        <span>databerry studio v2.4</span>
        <span className="size-2 rounded-full bg-emerald-400" />
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Floating Sidebar */}
      <div className="hidden lg:block shrink-0 h-full p-4 pl-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpenMobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 p-4 lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
