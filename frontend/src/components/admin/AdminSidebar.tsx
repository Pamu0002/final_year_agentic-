"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarDays,
  CreditCard,
  BarChart3,
  Settings,
  ScrollText,
  ShieldCheck,
  Star,
  Bell,
  MessageSquareWarning,
  UtensilsCrossed,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/restaurants", label: "Restaurants", icon: Building2 },
      { href: "/admin/verification", label: "Verification", icon: ShieldCheck },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/reservations", label: "Reservations", icon: CalendarDays },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
    ],
  },
  {
    label: "Experience",
    items: [
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/complaints", label: "Complaints", icon: MessageSquareWarning },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/logs", label: "Audit logs", icon: ScrollText },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[17.5rem] flex-col border-r border-sidebar-border/60 bg-sidebar/90 text-sidebar-foreground shadow-2xl shadow-black/10 backdrop-blur-2xl">
      {/* ── Logo area with subtle gradient glow ── */}
      <div className="relative overflow-hidden border-b border-sidebar-border/50 px-5 py-5">
        {/* Background gradient glow */}
        <div className="pointer-events-none absolute -bottom-6 -left-6 size-28 rounded-full bg-sidebar-primary/15 blur-2xl" />
        <Link href="/admin" className="relative flex items-center gap-3 rounded-xl">
          <motion.span
            className="grid size-11 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25"
            whileHover={{ scale: 1.08, rotate: -3 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <UtensilsCrossed className="size-5" />
          </motion.span>
          <span className="min-w-0">
            <span className="block font-heading text-2xl leading-none">AgentDine</span>
            <span className="mt-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/65">
              Administration
            </span>
          </span>
        </Link>
      </div>

      {/* ── Navigation ── */}
      <nav className="scrollbar-hide flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/50">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                      active
                        ? "text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/78 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {/* Animated active pill background */}
                    {active && (
                      <motion.span
                        layoutId="adminNavPill"
                        className="absolute inset-0 rounded-xl bg-sidebar-primary shadow-lg shadow-black/15"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-3">
                      <Icon
                        className={cn(
                          "size-[1.15rem] shrink-0 transition-transform duration-200",
                          active
                            ? "text-sidebar-primary-foreground"
                            : "group-hover:scale-110 group-hover:text-sidebar-accent-foreground"
                        )}
                      />
                      <span>{label}</span>
                    </span>
                    {active && (
                      <motion.span
                        className="relative z-10 ml-auto size-1.5 rounded-full bg-current"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.15, type: "spring", stiffness: 500 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom card ── */}
      <div className="m-3 overflow-hidden rounded-2xl border border-sidebar-border/60 bg-sidebar-accent/40 p-3.5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-sidebar-primary/15 text-sidebar-primary">
            <Shield className="size-4" />
          </span>
          <span>
            <span className="block text-xs font-semibold">Secure workspace</span>
            <span className="mt-0.5 block text-[0.68rem] text-sidebar-foreground/60">System administrator</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
