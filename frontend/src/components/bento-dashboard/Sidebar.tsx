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
  Sparkles,
  Zap,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { USER_PROFILE } from "./bento-mock-data";
import { NavItemId } from "./types";

interface SidebarProps {
  activeNav?: NavItemId;
  onSelectNav?: (id: NavItemId) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS: { id: NavItemId; label: string; icon: typeof LayoutDashboard; badge?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "email", label: "Email", icon: Mail, badge: "3" },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "tasks", label: "Tasks", icon: CheckSquare, badge: "8" },
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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const sidebarContent = (
    <aside className="flex h-full w-[17.5rem] flex-col justify-between bg-[#3A2429] text-white p-6 rounded-r-3xl shadow-2xl antialiased select-none border-r border-[#612536]/40">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative grid size-10 place-items-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/25">
              <Zap className="size-5" />
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-[#3A2429]" />
            </div>
            <div>
              <span className="block font-sans text-xl font-extrabold tracking-tight text-white leading-none">
                NovaPulse
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200/70">
                SaaS Studio
              </span>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="grid size-8 place-items-center rounded-xl text-indigo-300 hover:text-white hover:bg-white/10 md:hidden"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* User Profile Card */}
        <div className="relative">
          <div
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            className="group flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-[#522231] p-3 transition-all duration-200 hover:bg-[#69283A] border border-[#753044]/50"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-xs">
                {/* Fallback styled avatar */}
                <div className="grid size-full place-items-center bg-gradient-to-tr from-amber-400 to-rose-400 text-xs font-bold text-white">
                  AR
                </div>
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white tracking-tight">
                  {USER_PROFILE.name}
                </p>
                <p className="truncate text-[10.5px] font-medium text-indigo-200/60">
                  {USER_PROFILE.role}
                </p>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "size-4 text-indigo-300 transition-transform duration-200",
                profileDropdownOpen && "rotate-180 text-white"
              )}
            />
          </div>

          {/* Simple Dropdown Card */}
          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl bg-[#2A2022] p-2.5 shadow-xl border border-[#753044]"
              >
                <div className="px-2.5 py-1.5 text-[11px] text-indigo-200/80 border-b border-white/10 mb-1">
                  Signed in as <span className="font-bold text-white">Alex R.</span>
                </div>
                <button
                  onClick={() => setProfileDropdownOpen(false)}
                  className="w-full text-left rounded-xl px-2.5 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Workspace Settings
                </button>
                <button
                  onClick={() => setProfileDropdownOpen(false)}
                  className="w-full text-left rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 pt-2">
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
                  "relative group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-xs font-semibold transition-all duration-200",
                  isActive
                    ? "text-white font-bold"
                    : "text-indigo-200/75 hover:bg-[#522231]/70 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBentoNavPill"
                    className="absolute inset-0 rounded-2xl bg-[#753044] shadow-md shadow-indigo-950/30"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-3">
                  <Icon
                    className={cn(
                      "size-4.5 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-white" : "text-indigo-300"
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="relative z-10 flex items-center gap-2">
                  {item.badge && (
                    <span className="grid size-5 place-items-center rounded-full bg-indigo-500/30 text-[10px] font-bold text-indigo-200">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight
                    className={cn(
                      "size-3.5 transition-transform duration-200 group-hover:translate-x-0.5",
                      isActive ? "text-white opacity-90" : "text-indigo-400/50"
                    )}
                  />
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Banner */}
      <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#5B2233] to-[#342528] p-4 border border-[#753044]/60">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-xl bg-pink-500/20 text-pink-400">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Nova Pro Plan</p>
            <p className="text-[10.5px] text-indigo-200/60 font-medium">85% cloud compute used</p>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex md:shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile Backdrop & Drawer */}
      <AnimatePresence>
        {isOpenMobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-72 md:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
