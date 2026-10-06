"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CalendarDays, Clock, Users, Minus, Plus,
  ChevronRight, ChevronLeft, ShoppingCart, CreditCard, Loader2,
  Check, UtensilsCrossed, ReceiptText, ShieldCheck, Sparkles,
} from "lucide-react";
import Image from "next/image";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SlotCapacity {
  time: string;
  bookedSeats: number;
  maxCapacity: number;
  remainingSeats: number;
  available: boolean;
  isBlocked?: boolean;
  reason?: string | null;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  imageUrl?: string | null;
  isAvailable: boolean;
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface Props {
  restaurantId: string;
  restaurantName: string;
  totalSeats?: number | null;
  isActive: boolean;
  defaultOpen?: boolean;
  reservationDeposit?: number;
  initialDate: string;
  triggerLabel?: string;
  triggerClassName?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const SERVICE_CHARGE_RATE = 0.10;

function pad(n: number) { return String(n).padStart(2, "0"); }

function defaultSlots(): string[] {
  const slots: string[] = [];
  for (let h = 9; h <= 21; h++) {
    slots.push(`${pad(h)}:00`);
    slots.push(`${pad(h)}:30`);
  }
  return slots;
}

// ── Main component ─────────────────────────────────────────────────────────────

export function BookTableDialog({
  restaurantId, restaurantName, totalSeats, isActive, defaultOpen = false,
  reservationDeposit = 1000, initialDate, triggerLabel = "Reserve a Table", triggerClassName,
}: Props) {
  const [open, setOpen] = useState(defaultOpen && isActive);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [specialRequests, setSpecialRequests] = useState("");
  const [slotCapacity, setSlotCapacity] = useState<SlotCapacity[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(defaultOpen && isActive);

  // Step 2 state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());

  // Step 3 / submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxParty = totalSeats ?? 20;

  // Fetch per-slot booked capacity when date changes
  useEffect(() => {
    if (!open || !date) return;
    fetch(`/api/proxy/restaurants/${restaurantId}/slot-capacity?date=${date}`)
      .then((r) => r.json())
      .then((data: SlotCapacity[]) => {
        setSlotCapacity(Array.isArray(data) ? data : null);
      })
      .catch(() => setSlotCapacity(null))
      .finally(() => setLoadingSlots(false));
  }, [date, open, restaurantId]);

  const changePartySize = (nextSize: number) => {
    setPartySize(nextSize);
    const selectedCapacity = slotCapacity?.find((slot) => slot.time === time);
    if (selectedCapacity && selectedCapacity.maxCapacity - selectedCapacity.bookedSeats < nextSize) {
      setTime("");
    }
  };

  // Fetch menu when entering step 2
  const fetchMenu = useCallback(async () => {
    if (menuItems.length > 0) return;
    setLoadingMenu(true);
    try {
      const res = await fetch(`/api/proxy/restaurants/${restaurantId}/menu`);
      const data = await res.json() as MenuItem[];
      setMenuItems(Array.isArray(data) ? data.filter((i) => i.isAvailable) : []);
    } catch {
      setMenuItems([]);
    } finally {
      setLoadingMenu(false);
    }
  }, [restaurantId, menuItems.length]);

  const goToStep2 = () => {
    setStep(2);
    fetchMenu();
  };

  // Cart helpers
  const setQty = (item: MenuItem, qty: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      if (qty <= 0) {
        next.delete(item.id);
      } else {
        next.set(item.id, {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: qty,
          category: item.category,
        });
      }
      return next;
    });
  };

  const cartItems = Array.from(cart.values());
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const serviceCharge = Math.round(subtotal * SERVICE_CHARGE_RATE);
  const total = reservationDeposit + subtotal + serviceCharge;
  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);

  // Group menu by category
  const categories = Array.from(new Set(menuItems.map((i) => i.category)));

  // Submit: create reservation → create checkout session → redirect
  const handlePayment = async () => {
    setSubmitting(true);
    setError(null);
    let pendingReservationId: string | null = null;
    try {
      // 1. Create reservation
      const resRes = await fetch("/api/proxy/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          date,
          time,
          partySize,
          specialRequests: specialRequests.trim() || undefined,
        }),
      });
      if (!resRes.ok) {
        const body = await resRes.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Could not create reservation");
      }
      const reservation = await resRes.json() as { id: string };
      pendingReservationId = reservation.id;

      // 2. Create checkout session
      const payRes = await fetch("/api/proxy/payments/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: reservation.id,
          orderItems: cartItems,
        }),
      });
      if (!payRes.ok) {
        const body = await payRes.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Could not initiate payment");
      }
      const { paymentUrl } = await payRes.json() as { paymentUrl: string; amount: number };

      // 3. Redirect to Stripe Checkout
      window.location.assign(paymentUrl);
    } catch (err) {
      if (pendingReservationId) {
        await fetch(`/api/proxy/reservations/${pendingReservationId}`, { method: "DELETE" }).catch(() => undefined);
      }
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setDate(initialDate);
    setTime("");
    setPartySize(2);
    setSpecialRequests("");
    setError(null);
    setSlotCapacity(null);
    setCart(new Map());
    setMenuItems([]);
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (v) {
      setSlotCapacity(null);
      setTime("");
      setLoadingSlots(true);
    } else {
      reset();
    }
  };

  const timeSlots = slotCapacity ? slotCapacity.map((slot) => slot.time) : defaultSlots();

  const contentClass = step === 1 ? "sm:max-w-[34rem]" : "sm:max-w-2xl";

  const progressSteps = [
    { label: "Booking", detail: "Date & guests", icon: CalendarDays },
    { label: "Pre-order", detail: "Optional", icon: UtensilsCrossed },
    { label: "Payment", detail: "Review & pay", icon: ReceiptText },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        disabled={!isActive}
        className={cn(buttonVariants(), "w-full gap-2", triggerClassName)}
      >
        <CalendarDays className="h-4 w-4" />
        {triggerLabel}
      </DialogTrigger>

      <DialogContent className={`${contentClass} flex max-h-[92dvh] flex-col overflow-hidden rounded-[1.75rem] border-border/80 bg-background p-0 shadow-2xl`}>

        {/* ── Header ── */}
        <DialogHeader className="shrink-0 border-b border-border/70 bg-gradient-to-br from-primary/[0.09] via-card to-secondary/40 px-6 pb-5 pt-6 text-left">
          <div className="flex items-start gap-3 pr-7">
            {step > 1 && (
              <button
                onClick={() => { setStep(step === 3 ? 2 : 1); setError(null); }}
                aria-label="Previous booking step"
                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background/80 text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="size-3.5" /> Private dining request
              </div>
              <DialogTitle className="font-heading text-2xl leading-tight sm:text-3xl">
                {step === 1 ? "Reserve a Table" : step === 2 ? "Choose Your Order" : "Review & Pay"}
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm font-medium">{restaurantName}</DialogDescription>
            </div>
          </div>
          <ol aria-label="Booking progress" className="mt-5 flex items-start">
            {progressSteps.map(({ label, detail, icon: Icon }, i) => {
              const number = i + 1;
              const complete = step > number;
              const active = step === number;
              return (
                <li key={label} aria-current={active ? "step" : undefined} className="relative flex min-w-0 flex-1 items-start last:flex-none">
                  <div className="relative z-10 flex min-w-0 flex-col items-center text-center">
                    <span className={cn(
                      "grid size-9 place-items-center rounded-full border text-xs font-bold shadow-sm transition-all",
                      complete && "border-primary bg-primary text-primary-foreground",
                      active && "border-primary bg-background text-primary ring-4 ring-primary/10",
                      !complete && !active && "border-border bg-muted text-muted-foreground",
                    )}>
                      {complete ? <Check className="size-4" /> : <Icon className="size-4" />}
                    </span>
                    <span className={cn("mt-2 whitespace-nowrap text-[0.7rem] font-bold", active || complete ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                    <span className="hidden whitespace-nowrap text-[0.6rem] text-muted-foreground sm:block">{detail}</span>
                  </div>
                  {i < progressSteps.length - 1 && (
                    <span className={cn("mt-[1.1rem] h-px flex-1", step > number ? "bg-primary" : "bg-border")} />
                  )}
                </li>
              );
            })}
          </ol>
        </DialogHeader>

        {/* ── Step 1: Date / Time / Party ── */}
        {step === 1 && (
          <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {error && (
              <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}
            {/* Date */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-foreground">
                <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary"><CalendarDays className="h-3.5 w-3.5" /></span>
                Choose a date
              </label>
              <input
                type="date"
                value={date}
                min={initialDate}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTime("");
                  setSlotCapacity(null);
                  setLoadingSlots(true);
                }}
                required
                className="h-12 w-full rounded-xl border border-input bg-card px-4 text-base font-medium shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>

            {/* Time slots */}
            <div className="space-y-2.5">
              <div className="flex items-end justify-between gap-3">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-foreground">
                <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary"><Clock className="h-3.5 w-3.5" /></span>
                Available times
              </label>
              {time && <span className="text-xs font-semibold text-primary">Selected {time}</span>}
              </div>
              {loadingSlots ? (
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-10 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid max-h-44 grid-cols-4 gap-2 overflow-y-auto pr-1">
                  {timeSlots.map((t) => {
                    const cap = slotCapacity?.find((s) => s.time === t);
                    const full = cap ? !cap.available || cap.remainingSeats < partySize : false;
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={full}
                        onClick={() => { setTime(t); setError(null); }}
                        className={`min-h-10 rounded-xl border px-2 py-2 text-sm font-semibold tabular-nums transition-all
                          ${full
                            ? "border-border/30 text-muted-foreground/40 cursor-not-allowed line-through"
                            : time === t
                              ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                              : "border-border bg-card text-foreground shadow-sm hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5"
                          }`}
                      >
                        <span className="block">{t}</span>
                        {cap && !full && cap.remainingSeats <= 5 && <span className="block text-[0.55rem] font-medium opacity-75">{cap.remainingSeats} seats left</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              {!time && !loadingSlots && (
                <p className="text-[10px] text-muted-foreground">
                  {timeSlots.length === 0 ? "The restaurant is closed or has no available slots on this date." : "Select a time slot above"}
                </p>
              )}
            </div>

            {/* Party size */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div>
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-foreground">
                <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary"><Users className="h-3.5 w-3.5" /></span>
                Party size
              </label>
              <p className="mt-1 pl-9 text-xs text-muted-foreground">How many guests are joining?</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => changePartySize(Math.max(1, partySize - 1))}
                  className="flex size-10 items-center justify-center rounded-full border border-input bg-background transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-40"
                  disabled={partySize <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-9 text-center text-xl font-bold tabular-nums text-foreground">
                  {partySize}
                </span>
                <button
                  type="button"
                  onClick={() => changePartySize(Math.min(maxParty, partySize + 1))}
                  className="flex size-10 items-center justify-center rounded-full border border-input bg-background transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-40"
                  disabled={partySize >= maxParty}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Special requests */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-[0.12em] text-foreground">
                Special Requests <span className="font-normal text-muted-foreground normal-case">(optional)</span>
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Allergies, dietary needs, anniversary, birthday cake…"
                className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm leading-6 shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>
          <div className="shrink-0 border-t border-border/70 bg-card/95 px-6 py-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Reservation deposit</span>
              <strong className="text-foreground">LKR {reservationDeposit.toLocaleString()}</strong>
            </div>
            <Button
              className="h-12 w-full gap-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/15"
              disabled={!date || !time || !isActive}
              onClick={goToStep2}
            >
              Continue to optional menu
              <ChevronRight className="h-4 w-4" />
            </Button>
            <p className="mt-2 text-center text-[10px] leading-4 text-muted-foreground">
              You can skip food selection and reserve the table only
            </p>
          </div>
          </div>
        )}

        {/* ── Step 2: Menu Selection ── */}
        {step === 2 && (
          <div className="flex min-h-0 flex-1 flex-col">
            {loadingMenu ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : menuItems.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><UtensilsCrossed className="size-6" /></span>
                <h3 className="mt-4 text-lg font-bold text-foreground">No pre-order menu available</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">You can still reserve your table and order directly when you arrive.</p>
                <Button className="mt-6 h-11 rounded-xl px-6 font-bold" onClick={() => setStep(3)}>
                  Continue to review <ChevronRight className="size-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                  <div className="rounded-2xl border border-primary/15 bg-primary/[0.05] px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">Pre-ordering is completely optional</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Add dishes now for a smoother arrival, or continue and order at the restaurant.</p>
                  </div>
                  {categories.map((category) => (
                    <div key={category}>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                        {category}
                      </h3>
                      <div className="space-y-3">
                        {menuItems.filter((i) => i.category === category).map((item) => {
                          const qty = cart.get(item.id)?.quantity ?? 0;
                          return (
                            <div key={item.id} className="flex gap-3 items-center rounded-xl border border-border bg-card p-3">
                              {/* Image */}
                              {item.imageUrl ? (
                                <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                                  <Image
                                    src={item.imageUrl}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <div className="h-16 w-16 shrink-0 rounded-lg bg-muted flex items-center justify-center text-2xl">
                                  🍽️
                                </div>
                              )}
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground leading-tight">{item.name}</p>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                                )}
                                <p className="text-sm font-semibold text-primary mt-1">
                                  LKR {item.price.toLocaleString()}
                                </p>
                              </div>
                              {/* Qty stepper */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {qty > 0 ? (
                                  <>
                                    <button
                                      onClick={() => setQty(item, qty - 1)}
                                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-input bg-background hover:bg-muted transition-colors"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                                    <button
                                      onClick={() => setQty(item, qty + 1)}
                                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => setQty(item, 1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-border/70 bg-card/95 px-6 py-4 backdrop-blur">
                  <div className="flex justify-between mb-3 text-sm"><span className="text-muted-foreground">Pay today (deposit + optional order)</span><strong className="text-primary tabular-nums">LKR {total.toLocaleString()}</strong></div>
                  <Button
                    className="h-12 w-full gap-2 rounded-xl font-bold shadow-lg shadow-primary/15"
                    onClick={() => setStep(3)}
                  >
                    {cartItems.length > 0 ? <ShoppingCart className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {cartItems.length > 0 ? "Review Order" : "Continue Without Pre-order"}
                    {totalItems > 0 && (
                      <span className="ml-auto rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
                        {totalItems} item{totalItems !== 1 ? "s" : ""}
                      </span>
                    )}
                  </Button>
                  {cartItems.length === 0 && (
                    <p className="text-center text-[10px] text-muted-foreground mt-1">
                      You can reserve the table now and order at the restaurant
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 3: Bill Review ── */}
        {step === 3 && (
          <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* Booking summary */}
            <div className="rounded-2xl border border-border bg-card px-4 py-4 text-sm shadow-sm">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-foreground">Your reservation request</p>
              <div className="space-y-2">
              <div className="flex gap-2 items-center text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                <span>{new Date(date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} at {time}</span>
              </div>
              <div className="flex gap-2 items-center text-muted-foreground">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span>{partySize} {partySize === 1 ? "person" : "people"}</span>
              </div>
              </div>
            </div>

            {/* Order items */}
            {cartItems.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your Pre-order</p>
                {cartItems.map((item) => (
                  <div key={item.menuItemId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{item.quantity}×</span>
                      <span className="text-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium tabular-nums">
                      LKR {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                No food pre-ordered. You can order directly at the restaurant.
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-border pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between font-medium text-foreground">
                <span>Reservation deposit</span>
                <span className="tabular-nums">LKR {reservationDeposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Food subtotal</span>
                <span className="tabular-nums">LKR {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Service charge (10%)</span>
                <span className="tabular-nums">LKR {serviceCharge.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-primary text-lg p-3 rounded-lg bg-secondary mt-3">
                <span>Total</span>
                <span className="tabular-nums">LKR {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3 rounded-2xl border border-primary/20 bg-primary/[0.06] p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><ShieldCheck className="size-4" /></span>
              <div>
                <p className="text-sm font-bold text-foreground">Payment sends your booking request</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">The restaurant must accept your table after payment. If it does not respond before the deadline, we automatically cancel the reservation and refund your payment.</p>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

          </div>
          <div className="shrink-0 border-t border-border/70 bg-card/95 px-6 py-4 backdrop-blur">
            <Button
              className="h-12 w-full gap-2 rounded-xl font-bold shadow-lg shadow-primary/15"
              disabled={submitting || !isActive}
              onClick={handlePayment}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Pay &amp; Send Request · LKR {total.toLocaleString()}
                </>
              )}
            </Button>
            <p className="mt-2 text-center text-[10px] leading-4 text-muted-foreground">
              Secure Stripe checkout · restaurant confirmation follows payment
            </p>
          </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
