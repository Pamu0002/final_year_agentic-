// UI-only redesign: Glassmorphic top navigation bar with breadcrumbs and animated avatar ring
"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { AUTH_COOKIE } from "@/lib/cookie";
import { ChevronRight, LogOut, Menu, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

interface AdminTopBarProps {
  email: string;
  name: string | null;
  onMenuClick?: () => void;
}

const PAGE_NAMES: Record<string, string> = {
  admin: "Administration",
  restaurant: "Restaurant portal",
  restaurants: "Restaurants",
  verification: "Verification",
  users: "Users",
  reservations: "Reservations",
  payments: "Payments",
  reviews: "Guest reviews",
  complaints: "Complaints",
  notifications: "Notifications",
  analytics: "Analytics",
  settings: "Settings",
  logs: "Audit logs",
  menu: "Menu management",
  availability: "Operating availability",
  holidays: "Closing dates",
  promotions: "Promotions & Vouchers",
  profile: "Restaurant profile",
  ai: "AI assistant",
};

export function AdminTopBar({ email, name, onMenuClick }: AdminTopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const area = PAGE_NAMES[segments[0]] ?? "Workspace";
  const current = segments.length > 1 ? PAGE_NAMES[segments[1]] ?? "Details" : "Overview";
  const displayName = name?.trim() || email.split("@")[0];
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const handleLogout = async () => {
    await signOut(auth);
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 flex h-[4.75rem] shrink-0 items-center justify-between border-b border-border/70 bg-card/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8 shadow-sm">
      {/* Left side: Mobile menu & Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick && (
          <Button
            variant="outline"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden size-9 rounded-xl border-border/80 bg-background/50 hover:bg-accent"
            aria-label="Open navigation"
          >
            <Menu className="size-4 text-foreground" />
          </Button>
        )}
        <div className="hidden items-center gap-2 text-xs sm:flex">
          <span className="font-semibold text-muted-foreground uppercase tracking-wider">{area}</span>
          <ChevronRight className="size-3.5 text-muted-foreground/50" />
          <span className="font-heading font-bold text-sm text-foreground">{current}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 dark:bg-primary/20 px-3 py-1 text-xs font-semibold text-primary dark:text-[#D4B57D] sm:hidden">
          <ShieldCheck className="size-3.5 text-primary dark:text-[#D4B57D]" />
          {area}
        </span>
      </div>

      {/* Right side: Actions, User info, Theme toggle */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3.5">
        <ThemeToggle />
        <div className="mx-1 hidden h-6 w-px bg-border/80 sm:block" />

        <div className="hidden min-w-0 text-right lg:block">
          <p className="max-w-40 truncate text-xs font-bold leading-tight text-foreground">{displayName}</p>
          <p className="mt-0.5 max-w-40 truncate text-[0.68rem] leading-tight text-muted-foreground">{email}</p>
        </div>

        <div className="relative grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-[#47131F] text-xs font-extrabold text-white shadow-md ring-2 ring-primary/20">
          {initials || "AD"}
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-card" />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Sign out"
          title="Sign out"
          className="size-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
