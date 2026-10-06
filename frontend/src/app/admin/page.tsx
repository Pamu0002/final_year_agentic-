import { serverFetch } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatGrid } from "@/components/admin/StatGrid";
import { DashboardAlerts } from "@/components/admin/DashboardAlerts";
import { RecentReservations } from "@/components/admin/RecentReservations";

interface AdminStats {
  totalUsers: number;
  totalRestaurants: number;
  activeReservations: number;
  totalRevenue: number;
  totalPayments: number;
  verificationPending: number;
}

interface RecentReservation {
  id: string;
  user: { name: string | null; email: string };
  restaurant: { name: string };
  date: string;
  time: string;
  partySize: number;
  status: string;
}

export default async function AdminDashboardPage() {
  const [user, stats, recentResPage] = await Promise.all([
    requireAdmin(),
    serverFetch<AdminStats>("admin/stats"),
    serverFetch<{ data: RecentReservation[] }>("admin/reservations?limit=5&sort=recent").catch(
      () => ({ data: [] })
    ),
  ]);
  const recentRes: RecentReservation[] = recentResPage.data ?? [];

  /* Build an inline summary string for the greeting header */
  const summaryParts: string[] = [];
  if (stats.verificationPending > 0)
    summaryParts.push(`${stats.verificationPending} pending verification`);
  if (stats.activeReservations > 0)
    summaryParts.push(`${stats.activeReservations} active reservations`);
  summaryParts.push(`${stats.totalRestaurants} restaurants`);
  const inlineSummary = summaryParts.join(" · ");

  const displayName = user.name?.trim()?.split(" ")[0] || user.email.split("@")[0];

  return (
    <div>
      <PageHeader
        title="Platform overview"
        description="Monitor AgentDine operations, activity, and performance from one place."
        greeting={displayName}
        inlineSummary={inlineSummary}
      />

      <div className="space-y-6 px-5 pb-10 pt-5 sm:px-7 lg:px-10">
        <DashboardAlerts verificationPending={stats.verificationPending} />

        <StatGrid>
          <StatCard
            label="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon="users"
            accent="blue"
          />
          <StatCard
            label="Total Restaurants"
            value={stats.totalRestaurants.toLocaleString()}
            icon="building"
          />
          <StatCard
            label="Active Reservations"
            value={stats.activeReservations.toLocaleString()}
            icon="calendar"
            accent="green"
          />
          <StatCard
            label="Total Revenue"
            value={`LKR ${new Intl.NumberFormat("en-LK", {
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(stats.totalRevenue)}`}
            icon="dollar"
            accent="green"
          />
          <StatCard
            label="Total Payments"
            value={stats.totalPayments.toLocaleString()}
            icon="card"
          />
          <StatCard
            label="Pending Verification"
            value={stats.verificationPending}
            icon="alert"
            accent={stats.verificationPending > 0 ? "orange" : "default"}
          />
        </StatGrid>

        <RecentReservations reservations={recentRes} />
      </div>
    </div>
  );
}
