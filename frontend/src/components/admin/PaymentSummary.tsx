import { StatCard } from "./StatCard";
import { StatGrid } from "./StatGrid";
import { PaymentSummaryStats } from "@/types/admin";

interface PaymentSummaryProps {
  stats: PaymentSummaryStats;
}

export function PaymentSummary({ stats }: PaymentSummaryProps) {
  return (
    <StatGrid>
      <StatCard
        label="Total Revenue"
        value={`LKR ${stats.totalRevenue.toLocaleString()}`}
        icon="dollar"
        accent="green"
      />
      <StatCard
        label="Succeeded Payments"
        value={stats.succeeded}
        icon="check"
        accent="green"
      />
      <StatCard
        label="Failed Payments"
        value={stats.failed}
        icon="x"
        accent={stats.failed > 0 ? "red" : "default"}
      />
      <StatCard
        label="Refunded"
        value={stats.refunded}
        icon="rotate"
        accent="orange"
      />
    </StatGrid>
  );
}
