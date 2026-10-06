import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { serverFetch } from "@/lib/server/api";
import { HomePageClient } from "@/components/home/HomePageClient";
import { GuestChatPopup } from "@/components/GuestChatPopup";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TimeGreeting } from "@/components/TimeGreeting";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";
import type { RestaurantItem, MenuItem, PromotionItem } from "@/app/(customer)/home/page";

export default async function RootPage() {
  const user = await getAuthenticatedUser();

  if (user) {
    if (user.role === "SYSTEM_ADMIN") redirect("/admin");
    if (user.role === "RESTAURANT_ADMIN") redirect("/restaurant");
    redirect("/home");
  }

  // Public landing for guests
  let restaurants: RestaurantItem[] = [];
  let featuredDishes: MenuItem[] = [];
  let promotions: PromotionItem[] = [];

  const [restaurantResult, promotionResult] = await Promise.allSettled([
    serverFetch<RestaurantItem[] | { data: RestaurantItem[] }>("restaurants"),
    serverFetch<PromotionItem[]>("restaurants/promotions"),
  ]);
  if (restaurantResult.status === "fulfilled") {
    restaurants = Array.isArray(restaurantResult.value)
      ? restaurantResult.value
      : restaurantResult.value.data ?? [];
  }
  if (promotionResult.status === "fulfilled") promotions = promotionResult.value;

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
  featuredDishes = [...featuredDishes].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8);

  return (
    <div className="relative">
      {/* Guest nav bar */}
      <header className="sticky top-0 z-30 grid h-20 grid-cols-[1fr_auto] items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-8 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="flex w-fit items-center gap-2 font-heading text-xl text-primary sm:text-2xl" aria-label="AgentDine home">
          <UtensilsCrossed className="hidden h-5 w-5 text-primary sm:block" />
          <span>AgentDine</span>
        </Link>
        <div className="hidden md:block">
          <TimeGreeting />
        </div>
        <div className="flex items-center justify-self-end gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
            <Link href="/register-restaurant">Partner with Us</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/login?mode=register">Get Started</Link>
          </Button>
        </div>
      </header>

      <HomePageClient restaurants={restaurants} featuredDishes={featuredDishes} promotions={promotions} />

      {/* Floating guest chat */}
      <GuestChatPopup />
    </div>
  );
}
