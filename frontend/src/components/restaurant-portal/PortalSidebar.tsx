// UI-only redesign: Elevated deep green sidebar with spring active pill and high-contrast section headers
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  UtensilsCrossed,
  CreditCard,
  Star,
  BarChart3,
  Bot,
  Tag,
  Clock,
  CalendarOff,
  Store,
  ChefHat,
  Sparkles,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const NAV_SECTIONS = [
  {
    label: "Today",
    items: [
      { href: "/restaurant", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/restaurant/reservations", label: "Reservations", icon: CalendarDays },
      { href: "/restaurant/notifications", label: "Notifications", icon: Bell },
      { href: "/restaurant/payments", label: "Payments", icon: CreditCard },
      { href: "/restaurant/reviews", label: "Guest reviews", icon: Star },
    ],
  },
  {
    label: "Restaurant",
    items: [
      { href: "/restaurant/menu", label: "Menu", icon: UtensilsCrossed },
      { href: "/restaurant/promotions", label: "Promotions", icon: Tag },
      { href: "/restaurant/availability", label: "Availability", icon: Clock },
      { href: "/restaurant/holidays", label: "Closing dates", icon: CalendarOff },
      { href: "/restaurant/profile", label: "Profile", icon: Building2 },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/restaurant/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/restaurant/ai", label: "AI assistant", icon: Bot },
    ],
  },
];

interface PortalSidebarProps {
  onMobileItemClick?: () => void;
}

export function PortalSidebar({ onMobileItemClick }: PortalSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[17.5rem] flex-col border-r border-sidebar-border/80 bg-sidebar text-sidebar-foreground shadow-2xl shadow-[#211A1B]/25 antialiased select-none">
      {/* Brand Header */}
      <div className="border-b border-sidebar-border/60 px-5 py-5">
        <Link
          href="/restaurant"
          onClick={onMobileItemClick}
          className="group flex items-center gap-3.5 rounded-xl transition-all"
        >
          <span className="relative grid size-11 place-items-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25 transition-transform duration-300 group-hover:scale-105">
            <ChefHat className="size-5" />
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#D4B57D] ring-2 ring-sidebar" />
          </span>
          <span className="min-w-0">
            <span className="block font-heading text-2xl font-bold leading-none tracking-tight text-sidebar-foreground">
              AgentDine
            </span>
            <span className="mt-1.5 flex items-center gap-1 text-[0.66rem] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/70">
              <Sparkles className="size-2.5 text-amber-400" />
              Restaurant Studio
            </span>
          </span>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="scrollbar-hide flex-1 space-y-6 overflow-y-auto px-3.5 py-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[0.68rem] font-extrabold uppercase tracking-[0.22em] text-sidebar-foreground/55">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onMobileItemClick}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200",
                      active
                        ? "text-sidebar-primary-foreground font-bold"
                        : "text-sidebar-foreground/78 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="activePortalNavPill"
                        className="absolute inset-0 rounded-xl bg-sidebar-primary shadow-md shadow-[#47131F]/20"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}

                    <Icon
                      className={cn(
                        "relative z-10 size-[1.15rem] shrink-0 transition-transform duration-200 group-hover:scale-110",
                        active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                      )}
                    />
                    <span className="relative z-10 truncate">{label}</span>

                    {active && (
                      <span className="relative z-10 ml-auto size-1.5 rounded-full bg-current opacity-90" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Service Footer Badge */}
      <div className="p-3.5">
        <div className="flex items-center gap-3 rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/50 p-3.5 backdrop-blur-sm shadow-sm">
          <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-sidebar-foreground shadow-inner">
            <Store className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-bold text-sidebar-foreground">Service workspace</span>
            <span className="mt-0.5 block truncate text-[0.68rem] font-medium text-sidebar-foreground/65">
              Verified Restaurant Partner
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}
