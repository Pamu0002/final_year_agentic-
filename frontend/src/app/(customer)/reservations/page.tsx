import { serverFetch } from "@/lib/server/api";
import { ReservationList } from "@/components/customer/ReservationList";
import type { Reservation } from "@/components/customer/ReservationCard";

export default async function ReservationsPage() {
  const reservations = await serverFetch<Reservation[]>("reservations").catch(() => []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your dining journey</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold">Bookings &amp; Payments</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Track every booking from reservation and payment through restaurant confirmation, dining, and your review.
          </p>
        </div>
        <ReservationList initial={reservations} />
      </div>
    </div>
  );
}
