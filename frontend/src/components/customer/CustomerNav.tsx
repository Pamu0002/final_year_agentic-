"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { AUTH_COOKIE } from "@/lib/cookie";
import {
  CalendarDays,
  User,
  LogOut,
  UtensilsCrossed,
  Home,
  Bell,
  Trophy,
  MessageSquareWarning,
  MessageCircle,
  Heart,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TimeGreeting } from "@/components/TimeGreeting";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/reservations", label: "Bookings & Payments", icon: CalendarDays },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/waitlist", label: "Waitlist", icon: Clock },
  { href: "/loyalty", label: "Loyalty", icon: Trophy },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/complaints", label: "Complaints", icon: MessageSquareWarning },
  { href: "/profile", label: "Profile", icon: User },
];

interface CustomerNavProps {
  name: string | null;
  email: string;
}

export function CustomerNav({ name, email }: CustomerNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 grid shrink-0 grid-cols-[1fr_auto] items-center gap-x-3 border-b border-white/10 dark:border-white/5 bg-background/75 backdrop-blur-xl px-4 md:px-8 shadow-sm">
      <div className="contents">
        <Link
          href="/home"
          aria-label="AgentDine home"
          className="group flex shrink-0 items-center gap-2.5 font-heading text-xl text-primary transition-transform hover:scale-105"
        >
          <div className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-[#47131f] text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/30 backdrop-blur-md transition-transform group-hover:rotate-6">
            <UtensilsCrossed className="h-4 w-4" />
          </div>
          <span className="font-extrabold tracking-tight">AgentDine</span>
        </Link>

        <nav
          aria-label="Customer navigation"
          className="col-span-2 row-start-2 flex min-w-0 items-center gap-1.5 overflow-x-auto border-t border-border/40 py-2 scrollbar-none"
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;

            return (
              <Link key={href} href={href} aria-label={label} title={label} className="relative">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    "relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "text-primary-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/10 dark:hover:bg-white/5 hover:backdrop-blur-md"
                  )}
                >
                  {/* Sliding Frosted Glass Active Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeCustomerTabGlassPill"
                      className="absolute inset-0 rounded-xl bg-primary/90 backdrop-blur-md border border-white/25 shadow-lg shadow-primary/25"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    >
                      {/* Glass Sheen Streak */}
                      <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                    </motion.div>
                  )}

                  <Icon
                    className={cn(
                      "relative z-10 h-4 w-4 transition-all duration-200",
                      isActive ? "scale-110 drop-shadow" : "opacity-80"
                    )}
                  />
                  <span className="relative z-10">{label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="col-start-2 row-start-1 flex h-20 shrink-0 items-center gap-3">
        <div className="hidden 2xl:block">
          <TimeGreeting name={name} />
        </div>
        <ThemeToggle />
        <span className="hidden xl:block text-sm font-medium text-muted-foreground truncate max-w-[140px]">
          {name ?? email}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Sign out"
          className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all hover:scale-105"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
