"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { StatusPoint } from "@/types/admin";

interface ReservationStatusPieChartProps {
  data: StatusPoint[];
}

const COLORS: Record<string, string> = {
  CONFIRMED: "var(--chart-5)",
  PENDING: "var(--chart-3)",
  COMPLETED: "var(--chart-1)",
  CANCELLED: "var(--destructive)",
  NO_SHOW: "var(--muted-foreground)",
};

export function ReservationStatusPieChart({
  data,
}: ReservationStatusPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ name, percent }) =>
            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {data.map((entry) => (
            <Cell
              key={entry.status}
              fill={COLORS[entry.status] ?? "#94a3b8"}
            />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [v, "Reservations"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
