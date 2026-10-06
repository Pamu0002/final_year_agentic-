import { serverFetch } from "@/lib/server/api";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Phone, Mail, Globe, Star, ArrowLeft,
  Map, Tag, Users, Clock, CheckCircle2, ChevronRight,
  UtensilsCrossed, Sparkles, ShieldCheck,
} from "lucide-react";
import { FavoriteButton } from "@/components/customer/FavoriteButton";
import { WaitlistJoinForm } from "@/components/customer/WaitlistJoinForm";
import { BookTableDialog } from "@/components/customer/BookTableDialog";
import { OpenChatButton } from "@/components/customer/OpenChatButton";

// ── types ─────────────────────────────────────────────────────────────────────

interface OpeningHoursDay { open?: string; close?: string; isOpen?: boolean; closed?: boolean }
type OpeningHours = Record<string, OpeningHoursDay | string | null>;

interface Restaurant {
  id: string; name: string; description: string | null;
  address: string; area: string; phone: string | null; email: string | null; website: string | null;
  cuisineTypes: string[]; imageUrls: string[]; profileImageUrl: string | null; coverImageUrl: string | null;
  priceRange: string; isActive: boolean; isVerified: boolean;
  avgRating: number | null; totalReviews: number; totalSeats: number | null;
  reservationDeposit: number;
  latitude: number | null; longitude: number | null; openingHours: OpeningHours | null;
}

interface MenuItem {
  id: string; name: string; description: string | null;
  price: number; category: string; imageUrl: string | null; isAvailable: boolean;
}

interface Review {
  id: string; rating: number; comment: string | null; createdAt: string;
  user: { name: string | null; avatarUrl: string | null };
  reply: { content: string } | null;
}

interface Promotion {
  id: string; title: string; description: string | null;
  type: "DISCOUNT" | "HAPPY_HOUR" | "SPECIAL_EVENT" | "SEASONAL" | "COUPON";
  discountValue: number | null; startDate: string; endDate: string;
  menuItems: MenuItem[];
}

// ── constants ─────────────────────────────────────────────────────────────────

const PRICE_LABEL: Record<string, string> = {
  BUDGET: "$", MODERATE: "$$", EXPENSIVE: "$$$", FINE_DINING: "$$$$",
};
const PRICE_FULL: Record<string, string> = {
  BUDGET: "Budget", MODERATE: "Moderate", EXPENSIVE: "Expensive", FINE_DINING: "Fine Dining",
};
const DAY_ORDER = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const DAY_LABEL: Record<string, string> = {
  monday:"Monday", tuesday:"Tuesday", wednesday:"Wednesday", thursday:"Thursday",
  friday:"Friday", saturday:"Saturday", sunday:"Sunday",
};

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

// ── helpers ───────────────────────────────────────────────────────────────────

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <Star key={n} className={`${cls} ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"}`} />
      ))}
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function OpeningHoursSection({ hours }: { hours: OpeningHours }) {
  const today = DAY_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const entries = DAY_ORDER.map((d) => {
    const val = hours[d];
    if (!val || typeof val !== "object") return { day: d, label: DAY_LABEL[d], open: null, close: null, closed: true };
    const h = val as OpeningHoursDay;
    const isClosed = h.closed === true || h.isOpen === false;
    return { day: d, label: DAY_LABEL[d], open: h.open ?? null, close: h.close ?? null, closed: isClosed };
  });

  return (
    <div className="space-y-1">
      {entries.map((e) => (
        <div
          key={e.day}
          className={`flex justify-between rounded-lg px-3 py-1.5 text-xs ${
            e.day === today
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted/40"
          }`}
        >
          <span className="flex items-center gap-1.5">
            {e.day === today && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
            {e.label}
          </span>
          <span>{e.closed ? "Closed" : `${e.open ?? "—"} – ${e.close ?? "—"}`}</span>
        </div>
      ))}
    </div>
  );
}

function MenuItemCard({ item, discountPercent }: { item: MenuItem; discountPercent?: number }) {
  const discountedPrice = discountPercent
    ? Math.round(item.price * (1 - discountPercent / 100))
    : null;
  return (
    <div className={`group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-colors hover:border-primary/30 ${!item.isAvailable ? "opacity-60" : ""}`}>
      {/* Image */}
      <div className="relative h-36 w-full bg-muted overflow-hidden shrink-0">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl opacity-20 select-none">🍽️</div>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <span className="rounded-full bg-destructive/90 px-2.5 py-0.5 text-[10px] font-semibold text-white">
              Unavailable
            </span>
          </div>
        )}
        {discountPercent && item.isAvailable && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-terracotta px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
            {discountPercent}% off
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 gap-1">
        <p className="text-sm font-semibold text-foreground leading-tight line-clamp-1">{item.name}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">{item.description}</p>
        )}
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          {discountedPrice != null ? (
            <>
              <span className="text-xs text-muted-foreground line-through">LKR {item.price.toLocaleString()}</span>
              <span className="text-sm font-bold text-primary">LKR {discountedPrice.toLocaleString()}</span>
            </>
          ) : (
            <span className="text-sm font-bold text-primary">LKR {item.price.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function RestaurantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ book?: string }>;
}) {
  const { id } = await params;
  const { book } = await searchParams;
  const today = getTodayInColombo();

  let restaurant: Restaurant;
  try {
    restaurant = await serverFetch<Restaurant>(`restaurants/${id}`);
  } catch {
    notFound();
  }

  const [menuItems, reviewsData, promotions] = await Promise.all([
    serverFetch<MenuItem[]>(`restaurants/${id}/menu`).catch(() => [] as MenuItem[]),
    serverFetch<{ data: Review[]; total: number }>(`restaurants/${id}/reviews?limit=6`).catch(() => ({ data: [], total: 0 })),
    serverFetch<Promotion[]>(`restaurants/${id}/promotions`).catch(() => [] as Promotion[]),
  ]);

  const byCategory = menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
  const menuDiscounts = promotions.reduce<Record<string, number>>((discounts, promotion) => {
    if (!promotion.discountValue) return discounts;
    for (const item of promotion.menuItems) {
      discounts[item.id] = Math.max(discounts[item.id] ?? 0, promotion.discountValue);
    }
    return discounts;
  }, {});

  const coverImage = restaurant.coverImageUrl ?? restaurant.imageUrls?.[0] ?? null;
  const profileImage = restaurant.profileImageUrl ?? null;
  const mapsUrl = restaurant.latitude && restaurant.longitude
    ? `https://www.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}`
    : `https://www.google.com/maps/search/${encodeURIComponent(restaurant.name + " " + restaurant.address)}`;

  return (
    <div className="min-h-full bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className={`relative w-full overflow-hidden ${coverImage ? "h-64 sm:h-[22rem]" : "h-48 sm:h-60"}`}>
        {coverImage ? (
          <Image src={coverImage} alt={restaurant.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_78%_15%,rgba(212,181,125,0.32),transparent_28%),linear-gradient(120deg,#351019_0%,#711b2d_58%,#241719_100%)]">
            <div className="absolute -right-10 -top-28 size-72 rounded-full border border-white/10" />
            <div className="absolute right-14 top-6 size-32 rounded-full border border-white/10" />
            <div className="absolute left-[12%] top-1/2 flex -translate-y-1/2 items-center gap-4 text-white/90">
              <span className="grid size-14 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur"><UtensilsCrossed className="size-6" /></span>
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#E7C98F]">Dining in {restaurant.area}</p>
                <p className="mt-1 font-heading text-xl sm:text-2xl">A memorable table awaits</p>
              </div>
            </div>
          </div>
        )}
        <div className={`absolute inset-0 ${coverImage ? "bg-gradient-to-t from-[#211518]/80 via-transparent to-black/20" : "bg-gradient-to-r from-black/15 to-transparent"}`} />

        {/* Back button */}
        <div className="absolute left-5 top-5 sm:left-8">
          <Link
            href="/home"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>

        {/* Profile logo */}
        {profileImage && (
          <div className="absolute bottom-6 right-6 z-10 sm:right-10">
            <div className="relative h-20 w-20 rounded-2xl overflow-hidden border-4 border-background bg-muted shadow-xl">
              <Image src={profileImage} alt={`${restaurant.name} logo`} fill className="object-cover" unoptimized />
            </div>
          </div>
        )}
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-5 pb-28 lg:pb-20">

        {/* Title strip */}
        <div className="relative z-10 -mt-7 flex items-start justify-between gap-4 rounded-[1.75rem] border border-border/80 bg-background/95 p-5 shadow-xl shadow-black/5 backdrop-blur-xl sm:-mt-10 sm:p-7">
          <div className="space-y-1 min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="size-3.5" /> Curated restaurant
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-3xl leading-tight text-foreground sm:text-5xl">{restaurant.name}</h1>
              {restaurant.isVerified && (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              )}
              {!restaurant.isActive && (
                <Badge variant="destructive" className="text-xs">Temporarily Closed</Badge>
              )}
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{restaurant.area} · {restaurant.address}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {restaurant.avgRating != null && (
                <div className="flex items-center gap-1.5">
                  <Stars rating={Math.round(restaurant.avgRating)} />
                  <span className="text-sm font-semibold text-amber-500">{restaurant.avgRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({restaurant.totalReviews})</span>
                </div>
              )}
              <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground" title={PRICE_FULL[restaurant.priceRange]}>
                {PRICE_FULL[restaurant.priceRange] ?? restaurant.priceRange} · {PRICE_LABEL[restaurant.priceRange]}
              </span>
              {restaurant.cuisineTypes.slice(0, 3).map((c) => (
                <Badge key={c} variant="secondary" className="rounded-full px-2.5 py-1 text-xs font-semibold">{c}</Badge>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card p-1 shadow-sm">
            <FavoriteButton restaurantId={restaurant.id} />
          </div>
        </div>

        {/* ── Two-column layout ────────────────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* ── Left: main content ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Description */}
            {restaurant.description && (
              <div className="rounded-2xl border border-border/70 bg-card/60 p-5">
                <p className="text-base leading-7 text-muted-foreground">{restaurant.description}</p>
              </div>
            )}

            {/* Promotions */}
            {promotions.length > 0 && (
              <section>
                <SectionHeading icon={<Tag className="h-4 w-4" />} title="Active Offers" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {promotions.map((p) => (
                    <div key={p.id} className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                      <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-terracotta">{p.type.replaceAll("_", " ")}</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{p.title}</p>
                      {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="text-xs font-bold text-primary">
                          {p.discountValue != null ? `${p.discountValue}% off` : "Special event"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Until {new Date(p.endDate).toLocaleDateString("en-GB")}
                        </span>
                      </div>
                      {p.menuItems.length > 0 && (
                        <div className="space-y-1.5 border-t border-primary/15 pt-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Offer menu</p>
                          {p.menuItems.slice(0, 4).map((item) => {
                            const offerPrice = p.discountValue != null
                              ? Math.round(item.price * (1 - p.discountValue / 100))
                              : item.price;
                            return (
                              <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                                <span className="truncate font-medium text-foreground">{item.name}</span>
                                <span className="shrink-0">
                                  <span className="text-muted-foreground line-through">{item.price.toLocaleString()}</span>{" "}
                                  <span className="font-bold text-primary">LKR {offerPrice.toLocaleString()}</span>
                                </span>
                              </div>
                            );
                          })}
                          {p.menuItems.length > 4 && <p className="text-[10px] text-muted-foreground">+{p.menuItems.length - 4} more discounted items</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Gallery */}
            {restaurant.imageUrls.length > 0 && (
              <section>
                <SectionHeading title="Photos" count={restaurant.imageUrls.length} />
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                  {restaurant.imageUrls.slice(0, 8).map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted group cursor-pointer">
                      <Image src={url} alt="" fill className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Menu */}
            {Object.keys(byCategory).length > 0 && (
              <section>
                <SectionHeading title="Menu" count={menuItems.length} />
                <div className="mt-3 space-y-6">
                  {Object.entries(byCategory).map(([category, items]) => (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{category}</span>
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">{items.length} items</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {items.map((item) => (
                          <MenuItemCard key={item.id} item={item} discountPercent={menuDiscounts[item.id]} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            {reviewsData.data.length > 0 && (
              <section>
                <SectionHeading title="Reviews" count={reviewsData.total} />
                <div className="mt-3 space-y-3">
                  {reviewsData.data.map((review) => (
                    <div key={review.id} className="rounded-xl border bg-card p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {(review.user.name ?? "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-tight">{review.user.name ?? "Anonymous"}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}</p>
                          </div>
                        </div>
                        <Stars rating={review.rating} />
                      </div>
                      {review.comment && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{review.comment}</p>
                      )}
                      {review.reply && (
                        <div className="rounded-lg bg-muted/60 border border-border/50 px-3 py-2.5 space-y-0.5">
                          <p className="text-[10px] font-bold text-primary uppercase tracking-wide">Owner reply</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{review.reply.content}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Waitlist */}
            <WaitlistJoinForm restaurantId={restaurant.id} restaurantName={restaurant.name} />
          </div>

          {/* ── Right: sidebar ─────────────────────────────────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">

            {/* CTA card */}
            <div className="overflow-hidden rounded-[1.5rem] border border-primary/20 bg-card shadow-xl shadow-primary/5">
              <div className="bg-gradient-to-br from-primary/[0.12] via-card to-secondary/50 p-5">
                <div className="mb-3 flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-primary">
                  <Sparkles className="size-3.5" /> Plan your visit
                </div>
                <h2 className="font-heading text-3xl">A seat at the table</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose a time, bring your people, and optionally pre-order your meal.</p>
              </div>
              <div className="space-y-3 p-5">
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-4 py-3 text-sm">
                <span className="text-muted-foreground">Reservation deposit</span>
                <strong>LKR {restaurant.reservationDeposit.toLocaleString()}</strong>
              </div>
              {/* Direct booking */}
              <BookTableDialog
                restaurantId={restaurant.id}
                restaurantName={restaurant.name}
                totalSeats={restaurant.totalSeats}
                isActive={restaurant.isActive}
                defaultOpen={book === "true"}
                reservationDeposit={restaurant.reservationDeposit}
                initialDate={today}
              />

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* AI booking */}
              <OpenChatButton
                message={`I'd like to book a table at ${restaurant.name}. Can you help me with availability and reservations?`}
                disabled={!restaurant.isActive}
              />

              <div className="flex gap-2.5 rounded-xl bg-primary/[0.06] p-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-[0.7rem] leading-5 text-muted-foreground">Pay securely, then the restaurant confirms your table. Unconfirmed requests are cancelled and refunded automatically.</p>
              </div>

              {/* Secondary links */}
              <div className="flex gap-2 pt-0.5">
                {restaurant.website && (
                  <Button asChild variant="ghost" className="flex-1 gap-1.5 text-xs" size="sm">
                    <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-3.5 w-3.5" />
                      Website
                    </a>
                  </Button>
                )}
                <Button asChild variant="ghost" className="flex-1 gap-1.5 text-xs" size="sm">
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                    <Map className="h-3.5 w-3.5" />
                    Directions
                  </a>
                </Button>
              </div>
              </div>
            </div>

            {/* Quick info */}
            <div className="space-y-3 rounded-[1.25rem] border bg-card p-5">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Details</p>
              <div className="space-y-2.5">
                {restaurant.phone && (
                  <a href={`tel:${restaurant.phone}`} className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                      <Phone className="h-3.5 w-3.5" />
                    </div>
                    <span className="truncate">{restaurant.phone}</span>
                  </a>
                )}
                {restaurant.email && (
                  <a href={`mailto:${restaurant.email}`} className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                      <Mail className="h-3.5 w-3.5" />
                    </div>
                    <span className="truncate">{restaurant.email}</span>
                  </a>
                )}
                {restaurant.totalSeats && (
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <span>{restaurant.totalSeats} seats</span>
                  </div>
                )}
                <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <span className="leading-relaxed">{restaurant.address}</span>
                </div>
              </div>
            </div>

            {/* Opening hours */}
            {restaurant.openingHours && Object.keys(restaurant.openingHours).length > 0 && (
              <div className="space-y-3 rounded-[1.25rem] border bg-card p-5">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Hours</p>
                </div>
                <OpeningHoursSection hours={restaurant.openingHours} />
              </div>
            )}

            {/* Map link */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Map className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">View on Google Maps</p>
                <p className="text-xs text-muted-foreground truncate">{restaurant.area}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </a>

          </div>
        </div>
      </div>
      <div className="fixed bottom-0 inset-x-0 z-20 border-t bg-card/95 backdrop-blur px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <BookTableDialog restaurantId={restaurant.id} restaurantName={restaurant.name} totalSeats={restaurant.totalSeats} isActive={restaurant.isActive} reservationDeposit={restaurant.reservationDeposit} initialDate={today} triggerLabel="Book a table" />
      </div>
    </div>
  );
}

// ── section heading ───────────────────────────────────────────────────────────

function SectionHeading({ title, count, icon }: { title: string; count?: number; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span className="text-primary">{icon}</span>}
      <h2 className="font-heading text-2xl text-foreground">{title}</h2>
      {count !== undefined && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium">{count}</span>
      )}
    </div>
  );
}
