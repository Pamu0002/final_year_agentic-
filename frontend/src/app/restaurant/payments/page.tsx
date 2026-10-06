// UI-only redesign: Restyled payments page with status filter pills, revenue card, and unified table styling
import { Suspense } from "react";
import { serverFetch } from "@/lib/server/api";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/admin/PaginationBar";
import { PaymentStatusButton } from "@/components/restaurant-portal/PaymentStatusButton";
import { PortalPageHeader } from "@/components/restaurant-portal/PortalPageHeader";
import { CircleDollarSign, CreditCard, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receiptUrl: string | null;
  orderItems: OrderItem[] | null;
  createdAt: string;
  user: { name: string | null; email: string };
  reservation: { id: string; date: string; time: string; partySize: number };
}

interface PaginatedPayments {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
}

interface SearchParams { page?: string; status?: string }

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  SUCCEEDED: { label: "Succeeded", cls: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/30" },
  PENDING:   { label: "Pending", cls: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/30" },
  FAILED:    { label: "Failed", cls: "bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-500/30" },
  REFUNDED:  { label: "Refunded", cls: "bg-slate-500/10 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 border-slate-500/30" },
};

const STATUS_OPTIONS = ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"];

function OrderItemsCell({ items, amount }: { items: OrderItem[] | null; amount: number }) {
  if (!items?.length) return <span className="text-muted-foreground/40 text-xs font-mono">—</span>;
  const preview = items.slice(0, 2);
  const rest = items.length - 2;
  return (
    <div className="space-y-0.5">
      {preview.map((item, i) => (
        <div key={i} className="text-xs text-foreground flex items-center gap-1">
          <span className="font-bold text-muted-foreground">{item.quantity}×</span>{" "}
          <span className="truncate max-w-[120px]">{item.name}</span>
        </div>
      ))}
      {rest > 0 && <div className="text-[0.68rem] font-bold text-muted-foreground">+{rest} more items</div>}
      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-0.5">
        LKR {amount.toLocaleString()}
      </div>
    </div>
  );
}

export default async function PortalPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { page: pageParam, status } = await searchParams;
  const page = Number(pageParam ?? 1);
  const limit = 25;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(status ? { status } : {}),
  });

  const result = await serverFetch<PaginatedPayments>(
    `restaurant-portal/payments?${params.toString()}`
  );

  const totalRevenue = result.data
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6 px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
      <PortalPageHeader
        title="Payments"
        description={`${result.total} transactions recorded for your restaurant.`}
        actions={totalRevenue > 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/20 px-5 py-2.5 shadow-xs">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white">
              <CircleDollarSign className="size-5" />
            </span>
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Page Confirmed Revenue
              </p>
              <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 font-sans">
                LKR {totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        ) : undefined}
      />

      {/* Status filter */}
      <Suspense>
        <div className="flex flex-wrap gap-2">
          <a
            href="?page=1"
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-bold border transition-all duration-200 shadow-2xs",
              !status
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "border-border/80 bg-card text-muted-foreground hover:border-emerald-500/50 hover:text-foreground"
            )}
          >
            All Transactions
          </a>
          {STATUS_OPTIONS.map((s) => (
            <a
              key={s}
              href={`?page=1&status=${s}`}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-bold border transition-all duration-200 shadow-2xs",
                status === s
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "border-border/80 bg-card text-muted-foreground hover:border-emerald-500/50 hover:text-foreground"
              )}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </a>
          ))}
        </div>
      </Suspense>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/70 bg-muted/30 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5 text-left">Guest</th>
                <th className="px-5 py-3.5 text-left">Reservation</th>
                <th className="px-5 py-3.5 text-left">Order & Amount</th>
                <th className="px-5 py-3.5 text-left">Date</th>
                <th className="px-5 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {result.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">
                    <CreditCard className="size-10 mx-auto opacity-30 mb-2" />
                    <p className="font-semibold text-foreground">No payments found</p>
                  </td>
                </tr>
              ) : (
                result.data.map((p) => {
                  const name = p.user.name?.trim() || p.user.email.split("@")[0];
                  const initial = name[0]?.toUpperCase() || "P";
                  const badgeConfig = STATUS_BADGES[p.status] ?? { label: p.status, cls: "bg-muted text-foreground" };
                  return (
                    <tr key={p.id} className="group transition-colors duration-150 hover:bg-muted/30">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-foreground leading-tight truncate">{p.user.name ?? "Guest"}</div>
                            <div className="text-xs text-muted-foreground truncate">{p.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                          <Calendar className="size-3.5 text-emerald-600" />
                          {new Date(p.reservation.date).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Users className="size-3 text-muted-foreground" />
                          {p.reservation.time} · {p.reservation.partySize} guests
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <OrderItemsCell items={p.orderItems} amount={p.amount} />
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs font-mono">
                        {new Date(p.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider", badgeConfig.cls)}>
                          {badgeConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <PaymentStatusButton paymentId={p.id} currentStatus={p.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Suspense>
        <PaginationBar page={page} total={result.total} limit={limit} />
      </Suspense>
    </div>
  );
}
