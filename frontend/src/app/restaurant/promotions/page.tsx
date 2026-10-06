// UI-only redesign: Restyled promotions page header and container layout
import { serverFetch } from "@/lib/server/api";
import { PromotionsClient } from "@/components/restaurant-portal/PromotionsClient";
import { PortalPageHeader } from "@/components/restaurant-portal/PortalPageHeader";

interface Promotion {
  id: string;
  title: string;
  description: string;
  type: string;
  discountValue: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  imageUrl: string | null;
  menuItems: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

export default async function PortalPromotionsPage() {
  const [promotions, menuItems] = await Promise.all([
    serverFetch<Promotion[]>("restaurant-portal/promotions").catch(() => []),
    serverFetch<MenuItem[]>("restaurant-portal/menu").catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
      <PortalPageHeader
        title="Promotions & Vouchers"
        description="Create discounts, seasonal offers, and special events that bring guests back."
      />
      <PromotionsClient initial={promotions} menuItems={menuItems} />
    </div>
  );
}
