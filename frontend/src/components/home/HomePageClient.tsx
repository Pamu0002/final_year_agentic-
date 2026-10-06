"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, MotionConfig, useInView, type Variants } from "framer-motion";
import {
  MessageSquare, CalendarDays, Star, MapPin,
  ArrowRight, Sparkles, Utensils, LocateFixed, Loader2, ChevronDown, Search, Check, Tag,
  Wallet, Crown, X, CalendarOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RestaurantItem, MenuItem, PromotionItem } from "@/app/(customer)/home/page";
import type { Reservation } from "@/components/customer/ReservationCard";
import { HomeBookingProgress } from "@/components/customer/HomeBookingProgress";

// ── FAQ data ──────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "How do I reserve a table?",
    a: "Choose a restaurant, select Book Table, then enter your date, time, and party size. Review the details and confirm to add the reservation to your account.",
  },
  {
    q: "Do I need an account to browse restaurants?",
    a: "No. Anyone can explore restaurants, cuisines, menus, and reviews. You only need a free account when you want to reserve a table, save favourites, or manage bookings.",
  },
  {
    q: "Can I change or cancel a reservation?",
    a: "Open Reservations from your customer account to review upcoming bookings. Available change or cancellation options depend on the reservation status and restaurant policy.",
  },
  {
    q: "How does the Near me feature work?",
    a: "With your permission, the browser shares your current location long enough to sort restaurants by distance. You can clear location sorting at any time.",
  },
  {
    q: "Which restaurants are listed?",
    a: "AgentDine features restaurants across Colombo, from Sri Lankan and seafood venues to Japanese, Italian, Indian, and more. New restaurants can be reviewed and activated by the platform administrator.",
  },
  {
    q: "What if my preferred time is unavailable?",
    a: "Try another time on the same day, adjust your party size, or compare another nearby restaurant. Availability is shown for the restaurant and date you select.",
  },
];

// ── FAQ accordion component ───────────────────────────────────────────────────

function ChatbotFAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="faq" ref={ref} className="scroll-mt-24 border-y border-border/60 bg-muted/25 px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14"
        >
          <motion.aside variants={fadeUp} className="relative overflow-hidden rounded-[2rem] bg-[#47131F] p-8 text-white shadow-2xl shadow-primary/10 sm:p-10 lg:sticky lg:top-28">
            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-[#D4B57D]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 size-72 rounded-full bg-[#B08D57]/20 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-white/80">
                <Utensils className="size-4 text-[#D4B57D]" /> Plan your next meal
              </span>
              <h2 className="mt-7 font-heading text-4xl leading-tight sm:text-5xl">Ready to find your table?</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-white/70">
                Explore restaurants across Colombo, compare menus and reviews, then reserve when you find the right place.
              </p>

              <div className="mt-7 space-y-3 text-sm text-white/80">
                {["Browse without an account", "Filter by cuisine, rating, or budget", "Manage reservations in one place"].map(item => (
                  <div key={item} className="flex items-center gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#B08D57]"><Check className="size-3" strokeWidth={3} /></span>
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Button asChild size="lg" className="bg-white text-[#47131F] hover:bg-white/90">
                  <a href="#restaurants">Explore restaurants <ArrowRight className="size-4" /></a>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  <Link href="/login?mode=register">Create free account</Link>
                </Button>
              </div>
            </div>
          </motion.aside>

          <motion.div variants={fadeUp}>
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><MessageSquare className="size-4" /> Good to know</span>
              <h2 className="mt-3 font-heading text-4xl sm:text-5xl">Questions before you book?</h2>
              <p className="mt-3 max-w-xl leading-7 text-muted-foreground">Quick answers about discovering restaurants and managing your reservations.</p>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => {
                const isOpen = open === i;
                return (
                  <div key={item.q} className={`overflow-hidden rounded-2xl border bg-card transition-all duration-200 ${isOpen ? "border-primary/35 shadow-md shadow-primary/5" : "border-border hover:border-primary/25"}`}>
                    <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6" aria-expanded={isOpen}>
                      <span className="text-base font-semibold leading-snug text-foreground">{item.q}</span>
                      <span className={`grid size-8 shrink-0 place-items-center rounded-full transition-colors ${isOpen ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                        <ChevronDown className={`size-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                      </span>
                    </button>
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden">
                        <p className="px-5 pb-6 text-sm leading-7 text-muted-foreground sm:px-6">{item.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

const PRICE_LABEL: Record<string, string> = {
  BUDGET: "Budget", MODERATE: "Moderate",
  EXPENSIVE: "Expensive", FINE_DINING: "Fine Dining",
};

const POPULAR_CUISINES = ["Sri Lankan", "Japanese", "Italian", "Seafood", "Indian"];

const PROMOTION_LABEL: Record<PromotionItem["type"], string> = {
  DISCOUNT: "Special offer",
  HAPPY_HOUR: "Happy hour",
  SPECIAL_EVENT: "Special event",
  SEASONAL: "Seasonal offer",
  COUPON: "Exclusive offer",
};

const CUISINE_EMOJI: Record<string, string> = {
  Japanese: "🍱", Italian: "🍕", Indian: "🍛", Chinese: "🥡",
  Thai: "🍜", "Sri Lankan": "🍲", Seafood: "🦞", BBQ: "🥩",
  Burger: "🍔", Pizza: "🍕", Sushi: "🍣", Vegetarian: "🥗",
  Mediterranean: "🫒", French: "🥐", Mexican: "🌮",
};

function getCuisineEmoji(cuisines: string[]): string {
  for (const c of cuisines) {
    if (CUISINE_EMOJI[c]) return CUISINE_EMOJI[c];
  }
  return "🍽️";
}

// ── animation variants ────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

// ── section wrapper with scroll trigger ──────────────────────────────────────

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}


// ── restaurant card ───────────────────────────────────────────────────────────

function RestaurantCard({ r, isPreferred }: { r: RestaurantItem; isPreferred?: boolean }) {
  const cuisines   = r.cuisineTypes;
  const cardImage  = r.coverImageUrl ?? r.imageUrls[0] ?? null;
  const emoji      = getCuisineEmoji(cuisines);

  /* Gradient mesh fallbacks for when no image is available */
  const CARD_GRADIENTS = [
    "bg-gradient-to-br from-[#f3d8c8] via-[#e7ad91] to-[#b85f43]",
    "bg-gradient-to-br from-[#dce9dd] via-[#a8c9b0] to-[#4e785e]",
    "bg-gradient-to-br from-[#c8d8f3] via-[#91ade7] to-[#4355b8]",
    "bg-gradient-to-br from-[#f3ecc8] via-[#e7d291] to-[#b89843]",
    "bg-gradient-to-br from-[#E3CEC8] via-[#BD9B6A] to-[#7843b8]",
  ];
  const gradientIndex = r.name.charCodeAt(0) % CARD_GRADIENTS.length;

  return (
    <Link href={`/restaurants/${r.id}`} className="block [perspective:1200px]">
    <motion.div
      variants={cardVariant}
      whileHover={{ y: -8, scale: 1.02, rotateX: -2, rotateY: 3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`group relative h-full rounded-[1.25rem] overflow-hidden border bg-card cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-primary/15 transition-all duration-300 ${
        isPreferred ? "border-primary/50 ring-2 ring-primary/25" : "border-border/80"
      }`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Image / rich gradient mesh header */}
      <div className="relative h-56 overflow-hidden">
        {cardImage ? (
          <Image
            src={cardImage}
            alt={r.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            unoptimized
          />
        ) : (
          <div className={`absolute inset-0 ${CARD_GRADIENTS[gradientIndex]}`}>
            {/* Floating emoji graphics */}
            <div className="absolute inset-0 flex items-center justify-center select-none">
              <span className="text-7xl opacity-25 blur-[1px] group-hover:blur-0 group-hover:opacity-40 transition-all duration-500">{emoji}</span>
            </div>
            {/* Glass pill in corner */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-sm">
              <Utensils className="size-3" /> {cuisines[0] ?? "Restaurant"}
            </div>
          </div>
        )}

        {/* Cinematic overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />

        {/* Shimmer sweep effect on hover */}
        <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* Top badges row */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {isPreferred && (
            <Badge className="bg-[#47131F]/90 text-white border border-[#D4B57D]/40 text-[10px] gap-1 shadow-lg backdrop-blur-sm">
              <Sparkles className="size-3 text-[#D4B57D]" /> For You
            </Badge>
          )}
          <Badge variant="secondary" className="bg-black/50 text-white border-0 backdrop-blur-md text-[10px] shadow-lg">
            {PRICE_LABEL[r.priceRange] ?? r.priceRange}
          </Badge>
        </div>

        {/* Profile image or cuisine emoji top-left */}
        {r.profileImageUrl ? (
          <div className="absolute top-3 left-3">
            <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-white/70 bg-muted shadow-lg ring-2 ring-white/20">
              <Image src={r.profileImageUrl} alt={r.name} fill className="object-cover" unoptimized />
            </div>
          </div>
        ) : cardImage ? (
          <div className="absolute top-3 left-3 flex items-center justify-center size-10 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-xl shadow-lg">
            {emoji}
          </div>
        ) : null}

        {/* Rating pill overlay at bottom-right of image */}
        {r.avgRating != null && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#47131F] shadow-lg backdrop-blur-sm">
            <Star className="size-3 fill-[#B08D57] text-[#B08D57]" />
            {r.avgRating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors duration-200">
            {r.name}
          </h3>
          {r.closureStatus && (
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                r.closureStatus.isClosedNow
                  ? "border-[#8E3045]/25 bg-[#8E3045]/10 text-[#8E3045] dark:text-[#F0A6B6]"
                  : "border-[#B08D57]/30 bg-[#D4B57D]/15 text-[#765A2C] dark:text-[#E4C98F]"
              }`}
            >
              <CalendarOff className="size-3" />
              {r.closureStatus.label}
            </span>
          )}
        </div>

        {r.closureStatus?.reason && (
          <p className="rounded-lg border border-border/70 bg-muted/45 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            {r.closureStatus.reason}
          </p>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{r.area}</span>
          {r.distanceKm != null && (
            <>
              <span className="mx-1">&middot;</span>
              <span className="text-primary font-medium">{r.distanceKm} km away</span>
            </>
          )}
        </div>

        {cuisines.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {cuisines.slice(0, 3).map((c) => (
              <span key={c} className="rounded-full bg-primary/8 text-primary text-[10px] px-2.5 py-0.5 font-semibold border border-primary/15">
                {c}
              </span>
            ))}
          </div>
        )}

        {r.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{r.description}</p>
        )}

        {/* CTA footer */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-sm font-semibold text-primary">
          <span className="group-hover:underline underline-offset-2 transition-all">Explore &amp; book</span>
          <span className="grid size-7 place-items-center rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-200">
            <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>

      {/* Glow ring on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-[1.25rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-2 ring-primary/25 shadow-lg shadow-primary/10" />
    </motion.div>
    </Link>
  );
}

// ── how it works step ─────────────────────────────────────────────────────────

const STEPS = [
  {
    icon: Search,
    label: "Discover",
    title: "Find your place",
    desc: "Search by cuisine, location, rating, or budget and compare restaurants that match your plans.",
    accent: "bg-terracotta/10 text-terracotta ring-terracotta/15",
  },
  {
    icon: CalendarDays,
    label: "Choose",
    title: "Pick your moment",
    desc: "Select your date, time, and party size, then review the available reservation details.",
    accent: "bg-primary/10 text-primary ring-primary/15",
  },
  {
    icon: Check,
    label: "Confirm",
    title: "Reserve and relax",
    desc: "Confirm your table and keep every upcoming reservation easy to review or manage from your account.",
    accent: "bg-amber-500/10 text-amber-700 ring-amber-500/15 dark:text-amber-300",
  },
];

// ── floating orb ──────────────────────────────────────────────────────────────

// ── featured dish card ────────────────────────────────────────────────────────

const DISH_GRADIENTS = [
  "from-[#f3d8c8] via-[#e7ad91] to-[#b85f43]",
  "from-[#dce9dd] via-[#a8c9b0] to-[#4e785e]",
  "from-[#f3e7bd] via-[#d9bf78] to-[#936e2c]",
  "from-[#E7DED2] via-[#BBAA99] to-[#6e6098]",
];

function getDishEmoji(dish: MenuItem): string {
  const text = `${dish.name} ${dish.category}`.toLowerCase();
  if (/ice|dessert|cake|watalappan|sweet/.test(text)) return "🍨";
  if (/naan|bread|roti/.test(text)) return "🫓";
  if (/burger/.test(text)) return "🍔";
  if (/rib|grill|steak|pork/.test(text)) return "🍖";
  if (/ramen|noodle/.test(text)) return "🍜";
  if (/curry|rice|hopper|biryani/.test(text)) return "🍛";
  if (/salad|vegetable/.test(text)) return "🥗";
  return "🍽️";
}

function DishCard({ dish, restaurantId }: { dish: MenuItem; restaurantId?: string }) {
  const dietary: string[] = (() => { try { return JSON.parse(dish.dietaryInfo); } catch { return []; } })();
  const visualIndex = Array.from(dish.name).reduce((total, character) => total + character.charCodeAt(0), 0) % DISH_GRADIENTS.length;
  const dishEmoji = getDishEmoji(dish);

  return (
    <motion.div
      variants={cardVariant}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.6rem] border border-border bg-card shadow-sm transition-shadow hover:shadow-xl hover:shadow-primary/10"
    >
      <div className="relative h-52 overflow-hidden bg-secondary">
        {dish.imageUrl ? (
          <Image src={dish.imageUrl} alt={dish.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${DISH_GRADIENTS[visualIndex]}`}>
            <div className="absolute -right-8 -top-8 size-36 rounded-full border border-white/20 bg-white/10" />
            <div className="absolute -bottom-12 -left-8 size-40 rounded-full border border-white/15 bg-black/5" />
            <div className="absolute inset-0 grid place-items-center text-7xl drop-shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3" aria-hidden="true">
              {dishEmoji}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
        <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
          {dish.category || "Chef selection"}
        </span>
        <div className="absolute bottom-4 left-4 rounded-full bg-white px-3.5 py-2 text-sm font-bold text-[#47131F] shadow-lg">
          LKR {dish.price.toLocaleString()}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        {dish.restaurantName && (
          <p className="mb-2 truncate text-xs font-semibold uppercase tracking-[0.14em] text-terracotta">{dish.restaurantName}</p>
        )}
        <h3 className="font-heading text-2xl leading-tight text-foreground line-clamp-2">{dish.name}</h3>
        {dish.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{dish.description}</p>}
        {dietary.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {dietary.slice(0, 3).map(item => <span key={item} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-primary">{item}</span>)}
          </div>
        )}
        <div className="mt-auto pt-5">
          {restaurantId ? (
            <Link href={`/restaurants/${restaurantId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              View restaurant menu <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">Available on the menu</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── main export ───────────────────────────────────────────────────────────────

export function HomePageClient({
  restaurants: initialRestaurants,
  featuredDishes = [],
  promotions = [],
  reservations = [],
  userPreferredCuisines = [],
}: {
  restaurants: RestaurantItem[];
  featuredDishes?: MenuItem[];
  promotions?: PromotionItem[];
  reservations?: Reservation[];
  userPreferredCuisines?: string[];
}) {
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [locating, setLocating] = useState(false);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("All");
  const [discoveryFilter, setDiscoveryFilter] = useState<"all" | "top-rated" | "budget" | "fine-dining">("all");
  const [showAllCuisines, setShowAllCuisines] = useState(false);
  const [activePreferences, setActivePreferences] = useState<string[]>(userPreferredCuisines);

  // Client side fallback: fetch auth/me if userPreferredCuisines wasn't available at SSR
  useEffect(() => {
    if (activePreferences.length === 0) {
      fetch("/api/proxy/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((userData) => {
          if (userData?.diningPreferences?.cuisines?.length) {
            setActivePreferences(userData.diningPreferences.cuisines);
          }
        })
        .catch(() => {});
    }
    // This is intentionally a one-time fallback. The server normally provides
    // preferences; re-running after setActivePreferences would duplicate the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getMatchScore = (r: RestaurantItem) => {
    if (!activePreferences || activePreferences.length === 0) return 0;
    return r.cuisineTypes.filter((c) =>
      activePreferences.some((p) => p.toLowerCase() === c.toLowerCase())
    ).length;
  };

  const cuisines = Array.from(new Set(restaurants.flatMap(r => r.cuisineTypes))).sort();
  const featuredCuisines = POPULAR_CUISINES.filter(c => cuisines.includes(c));
  const additionalCuisines = cuisines.filter(c => !featuredCuisines.includes(c));
  const visibleRestaurants = restaurants
    .filter(r =>
      (cuisine === "All" || r.cuisineTypes.includes(cuisine)) &&
      (discoveryFilter === "all" ||
        (discoveryFilter === "top-rated" && (r.avgRating ?? 0) >= 4) ||
        (discoveryFilter === "budget" && r.priceRange === "BUDGET") ||
        (discoveryFilter === "fine-dining" && r.priceRange === "FINE_DINING")) &&
      `${r.name} ${r.area} ${r.cuisineTypes.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase())
    )
    .sort((a, b) => {
      if (discoveryFilter === "top-rated") return (b.avgRating ?? 0) - (a.avgRating ?? 0);
      const scoreA = getMatchScore(a);
      const scoreB = getMatchScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA; // Preferred cuisines FIRST!
      return (b.avgRating ?? 0) - (a.avgRating ?? 0);
    });
  const featuredPromotion = promotions.find(p => initialRestaurants.some(r => r.id === p.restaurant.id));
  const promotionRestaurant = featuredPromotion
    ? initialRestaurants.find(r => r.id === featuredPromotion.restaurant.id)
    : undefined;
  const heroRestaurant = promotionRestaurant ?? initialRestaurants.find(r => r.coverImageUrl || r.imageUrls[0]) ?? initialRestaurants[0];
  const heroImage = featuredPromotion?.imageUrl || heroRestaurant?.coverImageUrl || heroRestaurant?.imageUrls[0] || "/images/agentdine-hero-dining.webp";
  const heroCuisines = heroRestaurant?.cuisineTypes.slice(0, 2).join(" · ") || "Sri Lankan inspired";
  const heroPrice = heroRestaurant ? PRICE_LABEL[heroRestaurant.priceRange] ?? heroRestaurant.priceRange : "Curated dining";

  const findNearMe = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation isn't supported by this browser.");
      return;
    }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `/api/proxy/restaurants?lat=${latitude}&lng=${longitude}&limit=50`
          );
          if (!res.ok) throw new Error();
          const data = (await res.json()) as { data: RestaurantItem[] };
          setRestaurants(data.data);
          setNearMeActive(true);
        } catch {
          setLocationError("Couldn't load nearby restaurants. Please try again.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationError("Location permission denied — enable it to see restaurants near you.");
        setLocating(false);
      }
    );
  };

  const resetNearMe = () => {
    setRestaurants(initialRestaurants);
    setNearMeActive(false);
    setLocationError("");
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-background text-foreground">

      <HomeBookingProgress initialReservations={reservations} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto grid items-center gap-10 px-5 py-12 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-7">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Good food. Great company.
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-heading text-5xl sm:text-6xl xl:text-7xl leading-[1.08] tracking-tight"
          >
            Find your next <span className="italic text-primary">favourite table.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed"
          >
            Discover trusted restaurants, compare menus, check availability, and reserve a memorable table in minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3"
          >
            <Button asChild size="lg" className="gap-2 px-6">
              <a href="#restaurants">
                Explore restaurants
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="gap-2 px-5 border-border hover:border-primary/50"
              onClick={findNearMe}
              disabled={locating}
            >
              {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
              {locating ? "Finding restaurants…" : "Find near me"}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
          >
            {[
              initialRestaurants.length > 0 ? `${initialRestaurants.length}+ restaurants` : "Curated restaurants",
              "Instant reservations",
              "Verified reviews",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <span className="grid size-4 place-items-center rounded-full bg-primary/12 text-primary">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
                {item}
              </span>
            ))}
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 28, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="group relative min-h-[440px] w-full min-w-0 overflow-hidden rounded-[2.25rem] border border-border bg-secondary shadow-2xl shadow-primary/10 sm:aspect-[5/4] sm:min-h-0"
        >
          <Image
            src={heroImage}
            alt={heroRestaurant?.name ? `${heroRestaurant.name} dining experience` : "Sri Lankan dishes shared around a restaurant table"}
            fill
            priority
            unoptimized={heroImage.startsWith("http")}
            sizes="(min-width: 1280px) 560px, (min-width: 1024px) 45vw, 100vw"
            className="object-cover transition-transform duration-1000 group-hover:scale-[1.035]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#211A1B]/95 via-[#211A1B]/25 to-[#211A1B]/15" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-5 sm:p-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">
              {featuredPromotion ? <Tag className="size-3.5 text-[#D4B57D]" /> : <Sparkles className="size-3.5 text-[#D4B57D]" />}
              {featuredPromotion
                ? featuredPromotion.discountValue != null
                  ? `${featuredPromotion.discountValue}% off`
                  : PROMOTION_LABEL[featuredPromotion.type]
                : "Featured tonight"}
            </span>
            {heroRestaurant?.avgRating != null && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-bold text-[#47131F] shadow-lg">
                <Star className="size-4 fill-[#B08D57] text-[#B08D57]" />
                {heroRestaurant.avgRating.toFixed(1)}
              </span>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4B57D]">
              {heroCuisines}
            </p>
            <h2 className="max-w-lg font-heading text-3xl leading-tight sm:text-4xl">
              {heroRestaurant?.name ?? "Flavours worth gathering for"}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/75">
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {heroRestaurant?.area ?? "Colombo"}</span>
              <span>{heroPrice}</span>
              {heroRestaurant && <span>{heroRestaurant.totalReviews} review{heroRestaurant.totalReviews === 1 ? "" : "s"}</span>}
            </div>
            <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/20 pt-5">
              {featuredPromotion ? (
                <div className="hidden min-w-0 max-w-sm sm:block">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#D4B57D]">
                    {PROMOTION_LABEL[featuredPromotion.type]} · Ends {new Date(featuredPromotion.endDate).toLocaleDateString("en-LK", { day: "numeric", month: "short" })}
                  </p>
                  <p className="mt-1 truncate text-base font-semibold text-white">{featuredPromotion.title}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-white/70">
                    {featuredPromotion.menuItems.length > 0
                      ? `${featuredPromotion.menuItems.slice(0, 3).map((item) => item.name).join(" · ")}${featuredPromotion.menuItems.length > 3 ? ` · +${featuredPromotion.menuItems.length - 3} more` : ""}`
                      : featuredPromotion.description}
                  </p>
                </div>
              ) : (
                <p className="hidden max-w-sm line-clamp-2 text-sm leading-6 text-white/70 sm:block">
                  {heroRestaurant?.description || "An inviting table, thoughtful flavours, and a meal made to be shared."}
                </p>
              )}
              <Button asChild className="ml-auto shrink-0 bg-white text-[#47131F] hover:bg-white/90">
                <Link href={heroRestaurant ? `/restaurants/${heroRestaurant.id}` : "#restaurants"}>
                  {featuredPromotion ? "View offer" : heroRestaurant ? "View restaurant" : "Explore restaurants"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Discovery shortcuts ───────────────────────────────────────────── */}
      <Section className="mx-auto max-w-7xl px-5 pb-14 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <motion.button
            type="button"
            variants={fadeUp}
            onClick={() => setDiscoveryFilter(discoveryFilter === "top-rated" ? "all" : "top-rated")}
            aria-pressed={discoveryFilter === "top-rated"}
            className={`group flex min-w-0 items-center gap-4 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${discoveryFilter === "top-rated" ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-card hover:border-primary/40"}`}
          >
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${discoveryFilter === "top-rated" ? "bg-white/15" : "bg-terracotta/10 text-terracotta"}`}>
              <Star className="size-5" />
            </span>
            <span>
              <span className="block font-semibold">Top rated</span>
              <span className={`mt-0.5 block text-sm ${discoveryFilter === "top-rated" ? "text-primary-foreground/75" : "text-muted-foreground"}`}>Guest favourites, rated 4+</span>
            </span>
          </motion.button>

          <motion.button
            type="button"
            variants={fadeUp}
            onClick={nearMeActive ? resetNearMe : findNearMe}
            disabled={locating}
            aria-pressed={nearMeActive}
            className={`group flex min-w-0 items-center gap-4 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 ${nearMeActive ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-card hover:border-primary/40"}`}
          >
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${nearMeActive ? "bg-white/15" : "bg-primary/10 text-primary"}`}>
              {locating ? <Loader2 className="size-5 animate-spin" /> : <LocateFixed className="size-5" />}
            </span>
            <span>
              <span className="block font-semibold">Near you</span>
              <span className={`mt-0.5 block text-sm ${nearMeActive ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{nearMeActive ? "Sorted by distance" : "Use your current location"}</span>
            </span>
          </motion.button>

          <motion.button
            type="button"
            variants={fadeUp}
            onClick={() => setCuisine(cuisine === "Sri Lankan" ? "All" : "Sri Lankan")}
            aria-pressed={cuisine === "Sri Lankan"}
            className={`group flex min-w-0 items-center gap-4 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${cuisine === "Sri Lankan" ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-border bg-card hover:border-primary/40"}`}
          >
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl text-xl ${cuisine === "Sri Lankan" ? "bg-white/15" : "bg-primary/10"}`} aria-hidden="true">🍲</span>
            <span>
              <span className="block font-semibold">Sri Lankan</span>
              <span className={`mt-0.5 block text-sm ${cuisine === "Sri Lankan" ? "text-primary-foreground/75" : "text-muted-foreground"}`}>Discover local favourites</span>
            </span>
          </motion.button>
        </div>
      </Section>

      {/* ── Restaurants ───────────────────────────────────────────────────── */}
      <section id="restaurants" className="max-w-7xl mx-auto px-5 sm:px-8 pb-20 scroll-mt-24">
        <Section className="mb-7">
          <motion.div variants={fadeUp} className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-terracotta mb-2 flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> Explore restaurants
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl">Where will you dine?</h2>
              <p className="text-muted-foreground mt-1">
                {nearMeActive ? "Places ordered by distance from your current location" : "Find the right place for tonight, this weekend, or any occasion."}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-bold text-primary shadow-sm backdrop-blur-md">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              {visibleRestaurants.length} {visibleRestaurants.length === 1 ? "place" : "places"}
            </span>
          </motion.div>
        </Section>

        {/* Ultra-modern Glassmorphic Search & Filter Card */}
        <div className="relative mb-10 overflow-hidden rounded-[2.5rem] border border-white/20 bg-card/85 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl transition-all duration-300">
          {/* Subtle decorative mesh gradient in card background */}
          <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full bg-terracotta/10 blur-3xl" />

          <div className="relative z-10 space-y-6">
            {/* Row 1: Hero Search Input & Location / Cuisine Toggle Actions */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_auto_auto]">
              <div className="group relative sm:col-span-2 md:col-span-1">
                <label className="flex h-14 items-center gap-3 rounded-2xl border border-border/80 bg-background/90 px-4 transition-all duration-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20 hover:border-primary/50 shadow-inner">
                  <Search className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    aria-label="Search restaurants, areas, or cuisines"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search restaurants, locations or cuisines…"
                    className="w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:outline-none"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Clear search"
                    >
                      <X className="size-4" />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      ⌘K
                    </kbd>
                  )}
                </label>
              </div>

              <Button
                type="button"
                variant={nearMeActive ? "default" : "outline"}
                className={`h-14 w-full gap-2 rounded-2xl px-6 text-sm font-semibold transition-all duration-200 md:w-auto ${
                  nearMeActive
                    ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                    : "border-border/80 bg-background/80 hover:border-primary/50 hover:bg-card"
                }`}
                onClick={nearMeActive ? resetNearMe : findNearMe}
                disabled={locating}
              >
                {locating ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
                {nearMeActive ? "Clear location" : "Near me"}
              </Button>

              {additionalCuisines.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 w-full rounded-2xl border-border/80 bg-background/80 px-6 text-sm font-semibold hover:border-primary/50 hover:bg-card transition-all duration-200 md:w-auto"
                  onClick={() => setShowAllCuisines((current) => !current)}
                  aria-expanded={showAllCuisines}
                >
                  {showAllCuisines ? "Fewer cuisines" : `More cuisines +${additionalCuisines.length}`}
                </Button>
              )}
            </div>

            {/* Row 2: Dining Style Filter Tabs with Animated Pill Slider */}
            <div className="flex flex-wrap items-center gap-2" aria-label="Filter by dining style">
              {[
                { value: "all", label: "All places", icon: Utensils },
                { value: "top-rated", label: "Top rated", icon: Star },
                { value: "budget", label: "Budget friendly", icon: Wallet },
                { value: "fine-dining", label: "Fine dining", icon: Crown },
              ].map((option) => {
                const Icon = option.icon;
                const isActive = discoveryFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDiscoveryFilter(option.value as typeof discoveryFilter)}
                    aria-pressed={isActive}
                    className={`relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive ? "text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="activeDiningFilterPill"
                        className="absolute inset-0 rounded-full bg-primary shadow-md"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className={`size-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Row 3: Popular Cuisines Row with Animated Pill Slider */}
            <div className="border-t border-border/60 pt-5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/80">
                Popular cuisines
              </p>
              <div className="flex flex-wrap gap-2" aria-label="Filter by cuisine">
                {["All", ...featuredCuisines].map((c) => {
                  const isActive = cuisine === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCuisine(c)}
                      aria-pressed={isActive}
                      className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        isActive ? "text-primary-foreground font-semibold" : "border border-border/70 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="activeCuisineChipPill"
                          className="absolute inset-0 rounded-full bg-primary shadow-sm"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10">{c === "All" ? "All cuisines" : c}</span>
                    </button>
                  );
                })}
              </div>

              {showAllCuisines && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 flex flex-wrap gap-2 overflow-hidden"
                >
                  {additionalCuisines.map((c) => {
                    const isActive = cuisine === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCuisine(c)}
                        aria-pressed={isActive}
                        className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          isActive ? "text-primary-foreground font-semibold" : "border border-border/70 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="activeCuisineChipPill"
                            className="absolute inset-0 rounded-full bg-primary shadow-sm"
                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                          />
                        )}
                        <span className="relative z-10">{c}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </div>

            {locationError && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium"
                role="alert"
              >
                {locationError}
              </motion.p>
            )}
          </div>
        </div>

        <Section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleRestaurants.map((r) => (
            <RestaurantCard key={r.id} r={r} isPreferred={getMatchScore(r) > 0} />
          ))}
        </Section>
        {visibleRestaurants.length === 0 && <div className="rounded-2xl border border-dashed p-10 text-center"><Utensils className="mx-auto mb-4 h-8 w-8 text-primary" /><h3 className="font-heading text-2xl">{restaurants.length ? "A different flavour?" : "Your next discovery is on its way"}</h3><p className="mt-2 text-sm text-muted-foreground">{restaurants.length ? "Try another cuisine, dining style, or search term." : "Restaurants will appear here when they are available. Please check back soon."}</p>{restaurants.length > 0 && <Button variant="outline" className="mt-4" onClick={() => { setQuery(""); setCuisine("All"); setDiscoveryFilter("all"); if (nearMeActive) resetNearMe(); }}>Clear filters</Button>}</div>}
      </section>

      {/* ── Featured Dishes ───────────────────────────────────────────────── */}
      {featuredDishes.length > 0 && (
        <section id="featured-dishes" className="scroll-mt-24 border-y border-border/60 bg-muted/25 px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <Section className="mb-9">
              <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">From the kitchen</p>
                  <h2 className="font-heading text-3xl sm:text-4xl">Dishes worth discovering</h2>
                  <p className="mt-2 max-w-xl text-muted-foreground">A taste of what Colombo&apos;s restaurants are serving right now.</p>
                </div>
                <a href="#restaurants" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                  Explore all restaurants <ArrowRight className="size-4" />
                </a>
              </motion.div>
            </Section>
            <Section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredDishes.slice(0, 8).map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  restaurantId={initialRestaurants.find(restaurant => restaurant.name === dish.restaurantName)?.id}
                />
              ))}
            </Section>
          </div>
        </section>
      )}

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-24 px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Section className="mb-12 text-center">
            <motion.div variants={fadeUp} className="mx-auto max-w-2xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" /> From search to seat
              </span>
              <h2 className="font-heading text-4xl leading-tight sm:text-5xl">Your table, in three easy steps.</h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Everything you need to discover a restaurant and secure your reservation without the usual back-and-forth.
              </p>
            </motion.div>
          </Section>

          <Section className="relative grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden border-t border-dashed border-primary/20 md:block" />
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                variants={cardVariant}
                whileHover={{ y: -5 }}
                className="group relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-xl hover:shadow-primary/8"
              >
                <span className="pointer-events-none absolute -right-1 -top-6 font-heading text-[8rem] leading-none text-primary/[0.045]" aria-hidden="true">{i + 1}</span>
                <div className="relative flex items-center justify-between gap-4">
                  <div className={`grid size-14 place-items-center rounded-2xl ring-8 ${step.accent}`}>
                    <step.icon className="size-6" />
                  </div>
                  <span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground">0{i + 1}</span>
                </div>
                <div className="relative mt-8">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">{step.label}</p>
                  <h3 className="font-heading text-2xl text-foreground">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.desc}</p>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
              </motion.div>
            ))}
          </Section>

          <Section className="mt-10 text-center">
            <motion.div variants={fadeUp}>
              <Button asChild size="lg" className="rounded-xl px-7">
                <a href="#restaurants">Start exploring <ArrowRight className="size-4" /></a>
              </Button>
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ── Chatbot FAQ ───────────────────────────────────────────────────── */}
      <ChatbotFAQ />

    </div>
    </MotionConfig>
  );
}
