"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  UtensilsCrossed,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Building2,
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Users,
  Image as ImageIcon,
  ArrowRight,
  Store,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AUTH_COOKIE, COOKIE_MAX_AGE } from "@/lib/cookie";
import { auth } from "@/lib/firebase";

const AREAS = [
  "Colombo 01 - Fort",
  "Colombo 02 - Slave Island",
  "Colombo 03 - Kollupitiya",
  "Colombo 04 - Bambalapitiya",
  "Colombo 05 - Havelock Town",
  "Colombo 07 - Cinnamon Gardens",
  "Mount Lavinia",
  "Negombo",
  "Kandy",
  "Galle",
  "Battaramulla",
  "Nugegoda",
  "Rajagiriya",
];

const CUISINE_LIST = [
  "Sri Lankan",
  "Seafood",
  "Fine Dining",
  "Italian",
  "Indian",
  "Japanese",
  "Chinese",
  "Thai",
  "BBQ & Grill",
  "Burger",
  "Pizza",
  "Sushi",
  "Vegetarian",
  "Mediterranean",
  "French",
  "Café & Bakery",
  "Pub & Bar",
];

const PRICE_RANGES = [
  { value: "BUDGET", label: "Budget ($)" },
  { value: "MODERATE", label: "Moderate ($$)" },
  { value: "EXPENSIVE", label: "Upscale ($$$)" },
  { value: "FINE_DINING", label: "Fine Dining ($$$$)" },
];

export default function RegisterRestaurantPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Owner Info
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2: Restaurant Identity & Location
  const [restaurantName, setRestaurantName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState(AREAS[2]); // Default Colombo 03
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [restaurantEmail, setRestaurantEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [priceRange, setPriceRange] = useState<"BUDGET" | "MODERATE" | "EXPENSIVE" | "FINE_DINING">("MODERATE");

  // Step 3: Cuisine & Capacity
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(["Sri Lankan"]);
  const [totalSeats, setTotalSeats] = useState<number>(40);
  const [maxCapacity, setMaxCapacity] = useState<number>(10);

  // Step 4: Operating Hours & Media
  const [openTime, setOpenTime] = useState("11:00");
  const [closeTime, setCloseTime] = useState("23:00");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine],
    );
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!ownerName.trim()) { setError("Owner name is required"); return false; }
      if (!email.trim() || !email.includes("@")) { setError("Valid email is required"); return false; }
      if (password.length < 6) { setError("Password must be at least 6 characters"); return false; }
      return true;
    }
    if (currentStep === 2) {
      if (!restaurantName.trim()) { setError("Restaurant name is required"); return false; }
      if (!address.trim()) { setError("Street address is required"); return false; }
      if (!area) { setError("Area selection is required"); return false; }
      return true;
    }
    if (currentStep === 3) {
      if (selectedCuisines.length === 0) { setError("Select at least one cuisine type"); return false; }
      if (!totalSeats || totalSeats < 1) { setError("Valid total seat capacity is required"); return false; }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    }
  };

  async function handleRegisterRestaurant(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep(step)) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Create Firebase Auth user
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();
      document.cookie = `${AUTH_COOKIE}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;

      // 2. Register User record as RESTAURANT_ADMIN
      const userRes = await fetch("/api/proxy/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          firebaseUid: credential.user.uid,
          email,
          name: ownerName,
          phone: phone || undefined,
          role: "RESTAURANT_ADMIN",
        }),
      });

      if (!userRes.ok) {
        const errData = await userRes.json();
        throw new Error(errData.error || errData.message || "Failed to create restaurant admin account");
      }

      // 3. Register Restaurant record in Portal
      const openingHours = {
        monday: { open: openTime, close: closeTime },
        tuesday: { open: openTime, close: closeTime },
        wednesday: { open: openTime, close: closeTime },
        thursday: { open: openTime, close: closeTime },
        friday: { open: openTime, close: closeTime },
        saturday: { open: openTime, close: closeTime },
        sunday: { open: openTime, close: closeTime },
      };

      const imageUrls = [profileImageUrl, coverImageUrl].filter(Boolean);

      const portalRes = await fetch("/api/proxy/portal/restaurant", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: restaurantName,
          description: description || undefined,
          address,
          area,
          phone: restaurantPhone || phone || undefined,
          email: restaurantEmail || email || undefined,
          website: website || undefined,
          cuisineTypes: selectedCuisines,
          priceRange,
          openingHours,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
          totalSeats: Number(totalSeats),
          maxCapacity: Number(maxCapacity),
        }),
      });

      if (!portalRes.ok) {
        const errData = await portalRes.json();
        throw new Error(errData.error || errData.message || "Failed to register restaurant profile");
      }

      // 4. Redirect to Restaurant Portal
      router.push("/restaurant");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-background/95 px-6 backdrop-blur sm:px-12">
        <Link href="/" className="flex items-center gap-3 font-heading text-2xl text-primary" aria-label="AgentDine home">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <UtensilsCrossed className="size-5" />
          </span>
          <span>AgentDine Partner</span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Already a partner? Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-[#47131F] text-white px-6 py-10 sm:px-12 lg:py-14">
        <div className="mx-auto max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur">
            <Store className="size-4 text-[#D4B57D]" />
            Restaurant Partner Portal
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Grow your restaurant with AI dining reservations
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-white/80">
            Join Sri Lanka&apos;s premier agentic AI dining platform. Connect with diners, manage tables, and automate reservations seamlessly.
          </p>
        </div>
      </section>

      {/* Main Content Form */}
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            <span>Step {step} of 4</span>
            <span>
              {step === 1
                ? "Account Setup"
                : step === 2
                ? "Restaurant Profile"
                : step === 3
                ? "Cuisine & Seating"
                : "Operating Hours & Media"}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border bg-card p-6 shadow-xl sm:p-10">
          <form onSubmit={handleRegisterRestaurant} className="space-y-6">
            {/* STEP 1: Account Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold">Owner Account Information</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your admin login credentials for managing your restaurant on AgentDine.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="ownerName" className="font-semibold">Owner / Manager Full Name</Label>
                    <Input
                      id="ownerName"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Kasun Perera"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-semibold">Work Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@restaurant.lk"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-semibold">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="phone" className="font-semibold">Mobile / Direct Contact Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Restaurant Identity */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold">Restaurant Profile & Location</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Provide public information displayed to customers and the AI assistant.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="restName" className="font-semibold">Restaurant Name</Label>
                    <Input
                      id="restName"
                      required
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      placeholder="e.g. Ceylon Ocean Grill"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="desc" className="font-semibold">Short Description / Tagline</Label>
                    <Textarea
                      id="desc"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="A short overview of your ambiance, signature offerings, or story..."
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="font-semibold">Street Address</Label>
                    <Input
                      id="address"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 42 Galle Road"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area" className="font-semibold">Area / City</Label>
                    <select
                      id="area"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:ring-2 focus:ring-primary"
                    >
                      {AREAS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restPhone" className="font-semibold">Restaurant Phone</Label>
                    <Input
                      id="restPhone"
                      value={restaurantPhone}
                      onChange={(e) => setRestaurantPhone(e.target.value)}
                      placeholder="+94 11 234 5678"
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priceRange" className="font-semibold">Price Tier</Label>
                    <select
                      id="priceRange"
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value as any)}
                      className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:ring-2 focus:ring-primary"
                    >
                      {PRICE_RANGES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Cuisines & Seating */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold">Cuisines & Seating Capacity</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Help customers find your food style and manage reservation availability.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="font-semibold">Cuisine Categories (Select all that apply)</Label>
                  <div className="flex flex-wrap gap-2">
                    {CUISINE_LIST.map((c) => {
                      const selected = selectedCuisines.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCuisine(c)}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                            selected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {selected && <Check className="mr-1.5 inline size-4" />}
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="totalSeats" className="font-semibold">Total Seating Capacity</Label>
                    <Input
                      id="totalSeats"
                      type="number"
                      min={1}
                      required
                      value={totalSeats}
                      onChange={(e) => setTotalSeats(Number(e.target.value))}
                      className="h-12 rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">Maximum seats in your dining room</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxCap" className="font-semibold">Max Guests per Slot</Label>
                    <Input
                      id="maxCap"
                      type="number"
                      min={1}
                      required
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(Number(e.target.value))}
                      className="h-12 rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">Limit per 30-min booking slot</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Hours & Images */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold">Operating Hours & Media</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set default opening hours and add photo links for your restaurant card.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="openTime" className="font-semibold">Opening Time</Label>
                    <Input
                      id="openTime"
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="closeTime" className="font-semibold">Closing Time</Label>
                    <Input
                      id="closeTime"
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="profileImage" className="font-semibold">Profile Logo Image URL <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input
                      id="profileImage"
                      type="url"
                      value={profileImageUrl}
                      onChange={(e) => setProfileImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="coverImage" className="font-semibold">Cover Banner Image URL <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input
                      id="coverImage"
                      type="url"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/50 p-4 flex items-start gap-3 text-xs text-muted-foreground border">
                  <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                  <span>
                    Your restaurant registration will be submitted to the AgentDine system. Once registered, you will have instant access to your admin dashboard to add menus, tables, and manage bookings.
                  </span>
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            {/* Step Controls */}
            <div className="flex items-center justify-between border-t pt-6">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="h-12 rounded-xl px-5"
                >
                  <ChevronLeft className="mr-1.5 size-4" /> Previous
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="h-12 rounded-xl px-6 text-base font-semibold"
                >
                  Continue <ChevronRight className="ml-1.5 size-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 rounded-xl px-8 text-base font-semibold bg-primary text-primary-foreground shadow-lg"
                >
                  {loading ? (
                    "Registering Restaurant..."
                  ) : (
                    <>
                      Submit & Register Restaurant <Sparkles className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
