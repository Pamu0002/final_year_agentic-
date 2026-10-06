// UI-only redesign: Restyled closing dates page header and container layout
import { HolidayManager } from "@/components/restaurant-portal/HolidayManager";
import { PortalPageHeader } from "@/components/restaurant-portal/PortalPageHeader";

export default function PortalHolidaysPage() {
  return (
    <div className="space-y-6 px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
      <PortalPageHeader
        title="Closing Dates & Holidays"
        description="Mark holidays, annual closures, and blackout dates so guests always see accurate booking availability."
      />
      <HolidayManager />
    </div>
  );
}
