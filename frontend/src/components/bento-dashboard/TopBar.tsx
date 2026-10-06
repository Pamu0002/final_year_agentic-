"use client";

import { Bell, Calendar, Search, Menu } from "lucide-react";
import { USER_PROFILE } from "./bento-mock-data";

interface TopBarProps {
  onOpenMobileMenu?: () => void;
}

export function TopBar({ onOpenMobileMenu }: TopBarProps) {
  const firstName = USER_PROFILE.name.split(" ")[0];

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-7 mb-2 border-b border-slate-100">
      {/* Left Greeting */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Hello {firstName}, welcome back
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
          Workspace Overview
        </h1>
      </div>

      {/* Right Action Icons & Search */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search button / bar */}
        <div className="relative flex items-center">
          <button
            className="flex items-center gap-2 rounded-2xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors shadow-2xs"
            title="Search workspace"
          >
            <Search className="size-4 text-slate-400" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-block rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-200">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Calendar Icon Button */}
        <button
          className="grid size-10 place-items-center rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
          title="Calendar view"
        >
          <Calendar className="size-4.5" />
        </button>

        {/* Notifications Icon Button */}
        <button
          className="relative grid size-10 place-items-center rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
          title="Notifications"
        >
          <Bell className="size-4.5" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* Mobile Menu Trigger */}
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="grid size-10 place-items-center rounded-2xl bg-[#3A2429] text-white md:hidden shadow-xs"
            aria-label="Open sidebar"
          >
            <Menu className="size-5" />
          </button>
        )}
      </div>
    </header>
  );
}
