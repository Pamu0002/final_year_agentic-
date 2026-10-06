// UI-only redesign: Restyled analytics chart tiles with rounded borders and responsive charts
"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
} from "recharts";
import { Clock, PieChart as PieIcon, Award } from "lucide-react";

interface PortalAnalytics {
  totalRevenue: number;
  peakHours: { time: string; count: number }[];
  topMenuItems: { name: string; count: number; revenue: number }[];
  statusBreakdown: { status: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "var(--chart-5, #10b981)", PENDING: "var(--chart-3, #f59e0b)", COMPLETED: "var(--chart-1, #0284c7)",
  CANCELLED: "var(--destructive, #f43f5e)", NO_SHOW: "var(--muted-foreground, #64748b)",
};

export function PortalAnalyticsCharts({ analytics }: { analytics: PortalAnalytics }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {analytics.peakHours.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <Clock className="size-5 text-primary" /> Peak Booking Hours
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Most active reservation times throughout the day.</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics.peakHours.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} name="Reservations" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {analytics.statusBreakdown.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <PieIcon className="size-5 text-primary" /> Reservation Status Distribution
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Breakdown of confirmed vs completed and cancelled bookings.</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={analytics.statusBreakdown} dataKey="count" nameKey="status"
                cx="50%" cy="50%" outerRadius={80}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}>
                {analytics.statusBreakdown.map((e) => (
                  <Cell key={e.status} fill={STATUS_COLORS[e.status] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {analytics.topMenuItems.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4 lg:col-span-2">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <Award className="size-5 text-primary" /> Top Menu Dishes
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Ranked by volume of completed guest pre-orders.</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics.topMenuItems.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0284c7" radius={[0, 6, 6, 0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
