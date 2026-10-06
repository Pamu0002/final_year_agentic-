// UI-only redesign: Restyled availability page container and section headers
import { AvailabilityManager } from "@/components/restaurant-portal/AvailabilityManager";
import { PortalPageHeader } from "@/components/restaurant-portal/PortalPageHeader";
import { TableManager } from "@/components/restaurant-portal/TableManager";
import { Clock, Sliders } from "lucide-react";

export default function PortalAvailabilityPage() {
  return (
    <div className="space-y-6 px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
      <PortalPageHeader
        title="Availability & Seats"
        description="Control dining table capacity and customize time slot limits for each service date."
      />
      <TableManager />
      <section className="space-y-4 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            Date & Time Slot Overrides
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Adjust seat capacity or block specific service times on demand.</p>
        </div>
        <AvailabilityManager />
      </section>
    </div>
  );
}
