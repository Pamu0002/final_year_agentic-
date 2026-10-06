import { serverFetch } from "@/lib/server/api";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { HomePageClient } from "@/components/home/HomePageClient";
import type { Reservation } from "@/components/customer/ReservationCard";

export interface RestaurantItem {
  id: string;
  name: string;
  description: string | null;
  area: string;
  cuisineTypes: string[];
  imageUrls: string[];
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  priceRange: string;
  avgRating: number | null;
  totalReviews: number;
  distanceKm?: number;
  closureStatus: {
    isClosedNow: boolean;
    allDay: boolean;
    label: string;
    reason: string | null;
    startTime: string | null;
    endTime: string | null;
    startDate: string;
    endDate: string;
  } | null;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  dietaryInfo: string;
  isAvailable: boolean;
  restaurantName?: string;
}

export interface PromotionItem {
  id: string;
  title: string;
  description: string;
  type: "DISCOUNT" | "HAPPY_HOUR" | "SPECIAL_EVENT" | "SEASONAL" | "COUPON";
  discountValue: number | null;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  menuItems: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
    imageUrl: string | null;
  }>;
  restaurant: {
    id: string;
    name: string;
    area: string;
    cuisineTypes: string[];
    imageUrls: string[];
    priceRange: string;
  };
}

export default async function HomePage() {
  let restaurants: RestaurantItem[] = [];
  let featuredDishes: MenuItem[] = [];
  let promotions: PromotionItem[] = [];
  let reservations: Reservation[] = [];

  const user = await getAuthenticatedUser();
  const userPreferredCuisines = user?.diningPreferences?.cuisines ?? [];

  const [restaurantResult, promotionResult, reservationResult] = await Promise.allSettled([
    serverFetch<RestaurantItem[] | { data: RestaurantItem[] }>("restaurants"),
    serverFetch<PromotionItem[]>("restaurants/promotions"),
    serverFetch<Reservation[]>("reservations"),
  ]);
  if (restaurantResult.status === "fulfilled") {
    restaurants = Array.isArray(restaurantResult.value)
      ? restaurantResult.value
      : restaurantResult.value.data ?? [];
  }
  if (promotionResult.status === "fulfilled") promotions = promotionResult.value;
  if (reservationResult.status === "fulfilled") reservations = reservationResult.value;

  // Fetch menus from up to 4 restaurants for the featured dishes section
  const sample = restaurants.slice(0, 4);
  await Promise.allSettled(
    sample.map(async (r) => {
      try {
        const items = await serverFetch<MenuItem[]>(`restaurants/${r.id}/menu`);
        const available = items.filter((i) => i.isAvailable).slice(0, 3);
        available.forEach((i) => { i.restaurantName = r.name; });
        featuredDishes.push(...available);
      } catch { /* skip */ }
    })
  );

  // Keep server rendering deterministic and cap the selection at 8.
  featuredDishes = featuredDishes
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 8);

  return (
    <HomePageClient
      restaurants={restaurants}
      featuredDishes={featuredDishes}
      promotions={promotions}
      reservations={reservations}
      userPreferredCuisines={userPreferredCuisines}
    />
  );
}
