"use client";

import { Bell, CalendarCheck, Search, Menu } from "lucide-react";

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 mb-2">
      {/* Greeting & Headline */}
      <div>
        <p className="text-sm font-medium text-[#746B66]">
          Hello Dave, Welcome back
        </p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#292526] font-sans">
          Your Dashboard is updated
        </h1>
      </div>

      {/* Top-Right Outline Icons */}
      <div className="flex items-center gap-3">
        <button
          className="grid size-11 place-items-center rounded-2xl border border-slate-200/80 bg-white text-[#292526] hover:bg-slate-50 transition-all shadow-xs"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="size-5 stroke-[1.8]" />
        </button>

        <button
          className="grid size-11 place-items-center rounded-2xl border border-slate-200/80 bg-white text-[#292526] hover:bg-slate-50 transition-all shadow-xs"
          title="Calendar Events"
          aria-label="Calendar Events"
        >
          <CalendarCheck className="size-5 stroke-[1.8]" />
        </button>

        <button
          className="grid size-11 place-items-center rounded-2xl border border-slate-200/80 bg-white text-[#292526] hover:bg-slate-50 transition-all shadow-xs"
          title="Search"
          aria-label="Search"
        >
          <Search className="size-5 stroke-[1.8]" />
        </button>

        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="grid size-11 place-items-center rounded-2xl bg-[#6B1E2E] text-white lg:hidden shadow-xs"
            aria-label="Open sidebar"
          >
            <Menu className="size-5" />
          </button>
        )}
      </div>
    </header>
  );
}
