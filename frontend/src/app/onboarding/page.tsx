"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Flame,
  ShieldAlert,
  Wallet,
  Compass,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AUTH_COOKIE, COOKIE_MAX_AGE } from "@/lib/cookie";
import { auth } from "@/lib/firebase";

const CUISINE_OPTIONS = [
  { id: "Sri Lankan", label: "Sri Lankan", icon: "🍛" },
  { id: "Japanese", label: "Japanese", icon: "🍣" },
  { id: "Italian", label: "Italian", icon: "🍝" },
  { id: "Indian", label: "Indian", icon: "🥘" },
  { id: "Seafood", label: "Seafood", icon: "🦀" },
  { id: "Chinese", label: "Chinese", icon: "🥢" },
  { id: "Thai", label: "Thai", icon: "🍲" },
  { id: "BBQ", label: "BBQ & Grill", icon: "🥩" },
  { id: "Burger", label: "Burgers", icon: "🍔" },
  { id: "Pizza", label: "Pizza", icon: "🍕" },
  { id: "Sushi", label: "Sushi", icon: "🍱" },
  { id: "Vegetarian", label: "Vegetarian", icon: "🥗" },
  { id: "Mediterranean", label: "Mediterranean", icon: "🥙" },
  { id: "French", label: "French Fine Dining", icon: "🍷" },
  { id: "Mexican", label: "Mexican", icon: "🌮" },
];

const DIETARY_OPTIONS = [
  { id: "Halal", label: "Halal" },
  { id: "Vegetarian", label: "Vegetarian" },
  { id: "Vegan", label: "Vegan" },
  { id: "Gluten-Free", label: "Gluten-Free" },
  { id: "Nut-Free", label: "Nut-Free" },
  { id: "Dairy-Free", label: "Dairy-Free" },
  { id: "None", label: "No Restrictions" },
];

const BUDGET_OPTIONS = [
  { value: "BUDGET", label: "Budget Friendly", desc: "Under Rs. 1,500 / person", icon: "💵" },
  { value: "MODERATE", label: "Moderate", desc: "Rs. 1,500 - 4,000 / person", icon: "💳" },
  { value: "EXPENSIVE", label: "Upscale", desc: "Rs. 4,000 - 10,000 / person", icon: "✨" },
  { value: "FINE_DINING", label: "Fine Dining", desc: "Rs. 10,000+ / person", icon: "👑" },
];

const OCCASION_OPTIONS = [
  { id: "Romantic Dates", label: "Romantic Dates", desc: "Intimate vibes & candle light" },
  { id: "Family Gatherings", label: "Family Gatherings", desc: "Spacious seating & kid friendly" },
  { id: "Business Lunches", label: "Business Lunches", desc: "Quiet atmosphere & good Wi-Fi" },
  { id: "Casual Quick Bites", label: "Casual Quick Bites", desc: "Fast service & relaxed" },
  { id: "Nightlife & Drinks", label: "Nightlife & Cocktails", desc: "Great bar & vibrant music" },
  { id: "Rooftop Views", label: "Rooftop & Ocean Views", desc: "Scenic Colombo skyline views" },
];

export default function CustomerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>("MODERATE");
  const [occasions, setOccasions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCuisine = (item: string) => {
    setCuisines((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item],
    );
  };

  const toggleDietary = (item: string) => {
    if (item === "None") {
      setDietary(["None"]);
      return;
    }
    setDietary((prev) => {
      const filtered = prev.filter((d) => d !== "None");
      return filtered.includes(item)
        ? filtered.filter((d) => d !== item)
        : [...filtered, item];
    });
  };

  const toggleOccasion = (item: string) => {
    setOccasions((prev) =>
      prev.includes(item) ? prev.filter((o) => o !== item) : [...prev, item],
    );
  };

  async function handleFinish() {
    setSubmitting(true);
    setError(null);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        document.cookie = `${AUTH_COOKIE}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
        await fetch("/api/proxy/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firebaseUid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || undefined,
            cuisines: cuisines.length > 0 ? cuisines : undefined,
            dietaryRestrictions: dietary.filter((d) => d !== "None"),
            budgetPreference: budget,
          }),
        });
      }
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save preferences");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-6 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 font-heading text-xl text-primary">
          <UtensilsCrossed className="size-5" />
          <span>AgentDine</span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/home")}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Step {step} of 4</span>
            <span>{step === 1 ? "Cuisines" : step === 2 ? "Dietary" : step === 3 ? "Budget" : "Occasions"}</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Card Wrapper */}
        <div className="rounded-3xl border bg-card p-6 shadow-xl sm:p-10">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                  <Flame className="size-3.5 text-terracotta" />
                  Personalized AI Assistant
                </div>
                <h1 className="mt-3 font-heading text-3xl sm:text-4xl">What cuisines do you love?</h1>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Select your favorite food styles. Our AI dining engine will curate tailored recommendations in Sri Lanka for you.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CUISINE_OPTIONS.map((c) => {
                  const selected = cuisines.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCuisine(c.id)}
                      className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left text-sm font-semibold transition-all ${
                        selected
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                          : "border-border bg-background text-foreground hover:border-primary/50"
                      }`}
                    >
                      <span className="text-xl">{c.icon}</span>
                      <span className="flex-1">{c.label}</span>
                      {selected && <Check className="size-4 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                  <ShieldAlert className="size-3.5" />
                  Dietary Needs
                </div>
                <h1 className="mt-3 font-heading text-3xl sm:text-4xl">Any dietary requirements?</h1>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  We match you only with menus and dishes safe for your dietary preferences.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DIETARY_OPTIONS.map((d) => {
                  const selected = dietary.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDietary(d.id)}
                      className={`flex items-center justify-between rounded-2xl border p-4 text-left text-sm font-semibold transition-all ${
                        selected
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                          : "border-border bg-background text-foreground hover:border-primary/50"
                      }`}
                    >
                      <span>{d.label}</span>
                      {selected && <Check className="size-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                  <Wallet className="size-3.5" />
                  Dining Budget
                </div>
                <h1 className="mt-3 font-heading text-3xl sm:text-4xl">What&apos;s your usual budget?</h1>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Help us recommend options that fit your spending style when dining out.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {BUDGET_OPTIONS.map((b) => {
                  const selected = budget === b.value;
                  return (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => setBudget(b.value)}
                      className={`flex flex-col gap-1 rounded-2xl border p-5 text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                          : "border-border bg-background hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{b.icon}</span>
                        {selected && <Check className="size-4 text-primary" />}
                      </div>
                      <span className="font-heading text-lg font-bold text-foreground mt-2">{b.label}</span>
                      <span className="text-xs text-muted-foreground">{b.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                  <Compass className="size-3.5" />
                  Dining Occasions
                </div>
                <h1 className="mt-3 font-heading text-3xl sm:text-4xl">What dining experiences do you seek?</h1>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Select the vibes and occasions you frequently plan for.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OCCASION_OPTIONS.map((o) => {
                  const selected = occasions.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => toggleOccasion(o.id)}
                      className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                          : "border-border bg-background text-foreground hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-base">{o.label}</span>
                        {selected && <Check className="size-4 text-primary" />}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">{o.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between border-t pt-6">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="h-11 rounded-xl px-5"
              >
                <ChevronLeft className="mr-1.5 size-4" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                className="h-11 rounded-xl px-6 text-base font-semibold"
              >
                Next <ChevronRight className="ml-1.5 size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleFinish}
                disabled={submitting}
                className="h-11 rounded-xl px-8 text-base font-semibold bg-primary text-primary-foreground shadow-lg"
              >
                {submitting ? (
                  "Setting up your AI profile..."
                ) : (
                  <>
                    Complete Profile <Sparkles className="ml-2 size-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
