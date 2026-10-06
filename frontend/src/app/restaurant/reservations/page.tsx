// UI-only redesign: Restyled reservations page with guest avatar badges and unified table styling
import { Fragment, Suspense } from "react";
import { Star, CalendarDays, Users, Clock } from "lucide-react";
import { serverFetch } from "@/lib/server/api";
import { PaginationBar } from "@/components/admin/PaginationBar";
import { ReservationStatusSelect } from "@/components/restaurant-portal/ReservationStatusSelect";
import { ReservationCalendar } from "@/components/restaurant-portal/ReservationCalendar";
import { PortalPageHeader } from "@/components/restaurant-portal/PortalPageHeader";
import { RestaurantReservationJourney } from "@/components/restaurant-portal/RestaurantReservationJourney";
import { ReservationDateFilter } from "@/components/restaurant-portal/ReservationDateFilter";
import { cn } from "@/lib/utils";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

interface Payment {
  orderItems: OrderItem[] | null;
  amount: number;
  status: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  imageUrls: string;
  createdAt: string;
}

interface Reservation {
  id: string;
  date: string;
  time: string;
  partySize: number;
  specialRequests: string | null;
  status: string;
  confirmationExpiresAt: string | null;
  user: { name: string | null; email: string; phone: string | null };
  payment: Payment | null;
  review: Review | null;
}

interface PaginatedReservations {
  data: Reservation[];
  total: number;
  page: number;
  limit: number;
}

function ReviewCell({ review }: { review: Review | null }) {
  if (!review) return <span className="text-muted-foreground/40 text-xs font-mono">—</span>;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`size-3 ${n <= review.rating ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/25"}`}
          />
        ))}
        <span className="text-xs font-semibold text-muted-foreground ml-1">{review.rating}/5</span>
      </div>
      {review.comment && (
        <p className="text-xs text-muted-foreground max-w-[160px] truncate" title={review.comment}>{review.comment}</p>
      )}
    </div>
  );
}

function OrderCell({ payment }: { payment: Payment | null }) {
  if (!payment?.orderItems?.length) {
    return <span className="text-muted-foreground/40 text-xs font-mono">—</span>;
  }
  const items = payment.orderItems;
  const preview = items.slice(0, 2);
  const rest = items.length - 2;
  return (
    <div className="space-y-0.5">
      {preview.map((item, i) => (
        <div key={i} className="text-xs text-foreground flex items-center gap-1">
          <span className="font-semibold text-muted-foreground">{item.quantity}×</span>
          <span className="truncate max-w-[120px]">{item.name}</span>
        </div>
      ))}
      {rest > 0 && <div className="text-[0.68rem] font-bold text-muted-foreground">+{rest} more items</div>}
      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-0.5">
        LKR {payment.amount.toLocaleString()}
      </div>
    </div>
  );
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, tomorrow)) return "Tomorrow";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function groupByDate(reservations: Reservation[]): [string, Reservation[]][] {
  const map = new Map<string, Reservation[]>();
  for (const r of reservations) {
    const key = r.date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries());
}

interface SearchParams { page?: string; status?: string; view?: string; date?: string }

function getTodayInColombo(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export default async function PortalReservationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { page: pageParam, status, view = "list", date } = await searchParams;
  const page = Number(pageParam ?? 1);
  const limit = 25;
  const today = getTodayInColombo();
  const selectedDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(status ? { status } : {}),
    ...(view === "list" ? { from: selectedDate, to: selectedDate } : {}),
  });

  const result = await serverFetch<PaginatedReservations>(
    `restaurant-portal/reservations?${params.toString()}`
  );

  const grouped = groupByDate(result.data);

  return (
    <div className="space-y-6 px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
      <PortalPageHeader
        title="Reservations"
        description={view === "list"
          ? `${result.total} booking${result.total !== 1 ? "s" : ""} for ${formatDateLabel(selectedDate).toLowerCase()}.`
          : `${result.total} booking${result.total !== 1 ? "s" : ""} recorded across your restaurant calendar.`}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {view === "list" && <ReservationDateFilter selectedDate={selectedDate} today={today} />}
            <div className="flex rounded-xl border border-border bg-card p-1 text-xs font-bold shadow-xs">
              <a
                href="?view=calendar"
                className={cn(
                  "px-4 py-2 rounded-lg transition-all duration-200",
                  view === "calendar"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                Calendar View
              </a>
              <a
                href={`?view=list&date=${selectedDate}`}
                className={cn(
                  "px-4 py-2 rounded-lg transition-all duration-200",
                  view === "list"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                List View
              </a>
            </div>
          </div>
        }
      />

      {view === "calendar" && <ReservationCalendar />}

      {view === "list" && (
        <>
          {result.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/80 bg-card py-20 text-center shadow-xs">
              <CalendarDays className="size-12 text-muted-foreground/30" />
              <p className="text-sm font-semibold text-foreground">No reservations for {formatDateLabel(selectedDate).toLowerCase()}</p>
              <p className="text-xs text-muted-foreground">Choose another date above to view its bookings.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([dateKey, rows]) => (
                <div key={dateKey} className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all">
                  {/* Date section header */}
                  <div className="flex items-center gap-3 border-b border-border/70 bg-muted/40 px-5 py-3.5">
                    <span className="grid size-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CalendarDays className="size-4" />
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {formatDateLabel(dateKey)}
                    </span>
                    <span className="ml-auto rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {rows.length} {rows.length === 1 ? "booking" : "bookings"}
                    </span>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border/60 bg-muted/20 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        <tr>
                          <th className="px-5 py-3 text-left">Guest Details</th>
                          <th className="px-5 py-3 text-left">Time</th>
                          <th className="px-5 py-3 text-left">Party Size</th>
                          <th className="px-5 py-3 text-left">Special Requests</th>
                          <th className="px-5 py-3 text-left">Pre-Order</th>
                          <th className="px-5 py-3 text-left">Review</th>
                          <th className="px-5 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {rows.map((r) => {
                          const name = r.user.name?.trim() || r.user.email.split("@")[0];
                          const initial = name[0]?.toUpperCase() || "G";
                          return (
                            <Fragment key={r.id}>
                            <tr className="group transition-colors duration-150 hover:bg-muted/30">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                                    {initial}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-foreground leading-tight truncate">
                                      {r.user.name ?? "Guest"}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">{r.user.email}</div>
                                    {r.user.phone && (
                                      <div className="text-[0.68rem] font-mono text-muted-foreground">{r.user.phone}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
                                  <Clock className="size-3 text-muted-foreground" />
                                  {r.time}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                                  <Users className="size-3" />
                                  {r.partySize} guests
                                </span>
                              </td>
                              <td className="px-5 py-3.5 max-w-[200px]">
                                {r.specialRequests ? (
                                  <p className="truncate text-xs italic text-muted-foreground" title={r.specialRequests}>
                                    &ldquo;{r.specialRequests}&rdquo;
                                  </p>
                                ) : (
                                  <span className="text-muted-foreground/40 text-xs font-mono">—</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5">
                                <OrderCell payment={r.payment} />
                              </td>
                              <td className="px-5 py-3.5">
                                <ReviewCell review={r.review} />
                              </td>
                              <td className="px-5 py-3.5">
                                <ReservationStatusSelect
                                  reservationId={r.id}
                                  currentStatus={r.status}
                                  paymentStatus={r.payment?.status}
                                  confirmationExpiresAt={r.confirmationExpiresAt}
                                />
                              </td>
                            </tr>
                            <tr className="bg-muted/10">
                              <td colSpan={7} className="overflow-x-auto px-5 pb-4 pt-1">
                                <RestaurantReservationJourney reservation={r} />
                              </td>
                            </tr>
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Suspense>
            <PaginationBar page={page} total={result.total} limit={limit} />
          </Suspense>
        </>
      )}
    </div>
  );
}
