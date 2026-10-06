"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TimeSeriesPoint } from "@/types/admin";

interface RevenueTrendChartProps {
  data: TimeSeriesPoint[];
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(v) =>
            new Date(v).toLocaleDateString("en-LK", {
              month: "short",
              day: "numeric",
            })
          }
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          labelFormatter={(v) => new Date(v).toLocaleDateString("en-LK")}
          formatter={(v) => [`LKR ${Number(v).toLocaleString()}`, "Revenue"]}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="var(--chart-1)"
          fill="var(--chart-1)"
          fillOpacity={0.12}
          strokeWidth={2}
          name="Revenue"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
