// UI-only redesign: Restyled restaurant dashboard overview with elevated stat cards and quick action tiles
import { serverFetch } from "@/lib/server/api";
import { requireRestaurantAdmin } from "@/lib/server/auth";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarCheck,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  MessageSquareMore,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { PortalPageHeader } from "@/components/restaurant-portal/PortalPageHeader";
import { cn } from "@/lib/utils";

interface PortalStats {
  restaurantName: string;
  avgRating: number | null;
  totalReviews: number;
  totalReservations: number;
  activeReservations: number;
  pendingReservations: number;
  totalRevenue: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = "green",
}: {
  label: string;
  value: string | number;
  icon: typeof CalendarCheck;
  accent?: "green" | "terracotta" | "gold" | "blue";
}) {
  const accents = {
    green: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-[#D4B57D] border-primary/20",
    terracotta: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/20",
    gold: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20",
    blue: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border-sky-500/20",
  };

  const accentBars = {
    green: "bg-primary",
    terracotta: "bg-orange-500",
    gold: "bg-amber-500",
    blue: "bg-sky-500",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 sm:p-6">
      {/* Accent indicator bar */}
      <span className={cn("absolute inset-y-0 left-0 w-1 transition-all duration-300 group-hover:w-1.5", accentBars[accent])} />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <p className="mt-3 truncate text-3xl font-bold tracking-tight text-foreground font-sans tabular-nums">{value}</p>
        </div>
        <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl border transition-transform duration-300 group-hover:scale-110 shadow-xs", accents[accent])}>
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

const QUICK_ACTIONS = [
  { href: "/restaurant/reservations", label: "Manage reservations", detail: "Review today’s bookings & table assignments", icon: CalendarClock },
  { href: "/restaurant/menu", label: "Update your menu", detail: "Items, pricing, dietary tags and availability", icon: UtensilsCrossed },
  { href: "/restaurant/availability", label: "Set availability", detail: "Open table capacity and time slot limits", icon: Clock3 },
];

export default async function RestaurantDashboard() {
  await requireRestaurantAdmin();
  const stats = await serverFetch<PortalStats>("restaurant-portal/stats").catch(() => null);
  if (!stats) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Could not load dashboard. Make sure the backend is running and the restaurant account is seeded.
      </div>
    );
  }

  return (
    <div className="space-y-8 px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
      <PortalPageHeader
        title={stats.restaurantName}
        description="Your live service overview, guest activity, and restaurant performance."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total reservations" value={stats.totalReservations} icon={CalendarCheck} accent="blue" />
        <StatCard label="Active reservations" value={stats.activeReservations} icon={CalendarClock} />
        <StatCard label="Pending confirmation" value={stats.pendingReservations} icon={Clock3} accent="terracotta" />
        <StatCard
          label="Total revenue"
          value={`LKR ${new Intl.NumberFormat("en-LK", { notation: "compact", maximumFractionDigits: 1 }).format(stats.totalRevenue)}`}
          icon={CircleDollarSign}
        />
        <StatCard
          label="Average rating"
          value={stats.avgRating != null ? stats.avgRating.toFixed(1) : "New"}
          icon={Star}
          accent="gold"
        />
        <StatCard label="Guest reviews" value={stats.totalReviews} icon={MessageSquareMore} accent="gold" />
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Quick actions</h2>
            <p className="mt-1 text-xs text-muted-foreground">Essential tools to keep today’s dining service running smoothly.</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {QUICK_ACTIONS.map(({ href, label, detail, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-[#D4B57D] group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-sm text-foreground group-hover:text-primary dark:group-hover:text-[#D4B57D] transition-colors">{label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground leading-relaxed">{detail}</span>
              </span>
              <ArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary dark:group-hover:text-[#D4B57D]" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
