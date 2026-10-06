// UI-only redesign: Restyled analytics page header and overview layout
import { serverFetch } from "@/lib/server/api";
import { PortalAnalyticsCharts } from "@/components/restaurant-portal/PortalAnalyticsCharts";
import { PortalPageHeader } from "@/components/restaurant-portal/PortalPageHeader";
import { BarChart3 } from "lucide-react";

interface PortalAnalytics {
  totalRevenue: number;
  peakHours: { time: string; count: number }[];
  topMenuItems: { name: string; count: number; revenue: number }[];
  statusBreakdown: { status: string; count: number }[];
}

export default async function PortalAnalyticsPage() {
  const analytics = await serverFetch<PortalAnalytics>(
    "restaurant-portal/analytics"
  ).catch(() => null);

  if (!analytics) {
    return (
      <div className="space-y-6 px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
        <PortalPageHeader
          title="Performance Analytics"
          description="Track reservation trends, revenue metrics, and dining habits."
        />
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/80 bg-card py-20 text-center shadow-xs">
          <BarChart3 className="size-12 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-foreground">Analytics data pending</p>
          <p className="text-xs text-muted-foreground">Complete reservations to populate revenue and guest activity trends.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
      <PortalPageHeader
        title="Performance Analytics"
        description={`Performance trends and guest behaviour · LKR ${analytics.totalRevenue.toLocaleString()} total revenue.`}
      />
      <PortalAnalyticsCharts analytics={analytics} />
    </div>
  );
}
