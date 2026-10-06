"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  Sparkles,
  Star,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AUTH_COOKIE, COOKIE_MAX_AGE } from "@/lib/cookie";
import { auth } from "@/lib/firebase";

type Tab = "login" | "register";

const CUISINE_OPTIONS = [
  "Sri Lankan", "Japanese", "Italian", "Indian", "Chinese", "Thai", "Seafood", "BBQ",
  "Burger", "Pizza", "Sushi", "Vegetarian", "Mediterranean", "French", "Mexican",
];
const LANGUAGE_OPTIONS = ["English", "Sinhala", "Tamil"];
const BUDGET_OPTIONS = [
  { value: "BUDGET", label: "Budget" },
  { value: "MODERATE", label: "Moderate" },
  { value: "EXPENSIVE", label: "Expensive" },
  { value: "FINE_DINING", label: "Fine Dining" },
];

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() =>
    searchParams.get("mode") === "register" ? "register" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [budgetPreference, setBudgetPreference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const toggleCuisine = (cuisine: string) => {
    setCuisines((current) =>
      current.includes(cuisine)
        ? current.filter((item) => item !== cuisine)
        : [...current, cuisine],
    );
  };

  const switchTab = (nextTab: Tab) => {
    setTab(nextTab);
    setError(null);
    setResetSent(false);
  };

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email first, then choose forgot password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setLoading(false);
    }
  }

  async function setTokenAndRedirect(token: string) {
    document.cookie = `${AUTH_COOKIE}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    const meRes = await fetch("/api/proxy/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = meRes.ok ? (await meRes.json()) as { role: string } : null;
    if (me?.role === "SYSTEM_ADMIN") router.push("/admin");
    else if (me?.role === "RESTAURANT_ADMIN") router.push("/restaurant");
    else router.push("/home");
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      await setTokenAndRedirect(token);
    } catch (err) {
      setError(
        err instanceof Error && (err as { code?: string }).code === "auth/invalid-credential"
          ? "That email and password combination is not correct."
          : err instanceof Error
            ? err.message
            : "Sign-in failed",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();
      document.cookie = `${AUTH_COOKIE}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      await fetch("/api/proxy/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          firebaseUid: credential.user.uid,
          email,
          name,
          phone: phone || undefined,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
          preferredLanguage: preferredLanguage || undefined,
          cuisines: cuisines.length ? cuisines : undefined,
          budgetPreference: budgetPreference || undefined,
        }),
      });
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      const token = await credential.user.getIdToken();
      document.cookie = `${AUTH_COOKIE}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      await fetch("/api/proxy/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          firebaseUid: credential.user.uid,
          email: credential.user.email,
          name: credential.user.displayName,
        }),
      });
      await setTokenAndRedirect(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(420px,0.9fr)_minmax(560px,1.1fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#47131F] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pointer-events-none absolute -left-24 top-1/3 size-80 rounded-full bg-[#B08D57]/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -top-16 size-96 rounded-full bg-[#D4B57D]/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:28px_28px]" />

        <Link href="/" className="relative flex w-fit items-center gap-3" aria-label="AgentDine home">
          <span className="grid size-11 place-items-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur">
            <UtensilsCrossed className="size-5" />
          </span>
          <span className="font-heading text-3xl tracking-tight">AgentDine</span>
        </Link>

        <div className="relative max-w-xl py-12">
          <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-white/80 backdrop-blur">
            <Sparkles className="size-4 text-[#D4B57D]" />
            Thoughtful dining, from search to seat
          </div>
          <h1 className="font-heading text-5xl leading-[1.05] tracking-[-0.035em] xl:text-7xl">
            Your next table is closer than you think.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/68">
            Discover memorable restaurants, reserve in moments, and keep every plan in one calm place.
          </p>

          <div className="mt-9 grid gap-3 text-sm text-white/82 sm:grid-cols-3">
            {["Curated restaurants", "Simple reservations", "Personal favourites"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#B08D57]">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative max-w-lg rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/15 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4B57D]">Tonight&apos;s pick</p>
              <h2 className="mt-2 font-heading text-2xl">A table worth remembering</h2>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/65">
                <span className="flex items-center gap-1.5"><MapPin className="size-4" /> Colombo</span>
                <span className="flex items-center gap-1.5"><Star className="size-4 fill-[#D4B57D] text-[#D4B57D]" /> 4.9</span>
              </div>
            </div>
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#B08D57] shadow-lg shadow-black/10">
              <CalendarCheck className="size-6" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen flex-col px-4 py-5 sm:px-8 lg:px-12 xl:px-20">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <Link href="/" className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Back to home
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-2xl flex-1 items-center py-8 sm:py-12">
          <div className="w-full">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2 text-primary" aria-label="AgentDine home">
                <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <UtensilsCrossed className="size-5" />
                </span>
                <span className="font-heading text-2xl">AgentDine</span>
              </Link>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-terracotta">
                {tab === "login" ? "Welcome back" : "Join the table"}
              </p>
              <h1 className="font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
                {tab === "login" ? "Good to see you again." : "Create your dining profile."}
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
                {tab === "login"
                  ? "Sign in to manage reservations, saved restaurants, and your personalised recommendations."
                  : "Tell us a little about you and we’ll make every restaurant discovery feel more personal."}
              </p>
            </div>

            <div className="mb-7 grid grid-cols-2 rounded-2xl bg-muted p-1.5" role="tablist" aria-label="Authentication options">
              <button type="button" role="tab" aria-selected={tab === "login"} className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${tab === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`} onClick={() => switchTab("login")}>
                Sign in
              </button>
              <button type="button" role="tab" aria-selected={tab === "register"} className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${tab === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`} onClick={() => switchTab("register")}>
                Create account
              </button>
            </div>

            <Button type="button" variant="outline" className="h-12 w-full rounded-xl text-base shadow-sm" onClick={handleGoogle} disabled={loading}>
              <GoogleIcon />
              Continue with Google
            </Button>

            <div className="my-7 flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or continue with email
              <span className="h-px flex-1 bg-border" />
            </div>

            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email address</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-13 rounded-xl pl-12 text-base" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                    <button type="button" onClick={handleForgotPassword} className="text-sm font-semibold text-primary hover:underline">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-13 rounded-xl px-12 text-base" />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>

                {resetSent && (
                  <p className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300" role="status">
                    <Check className="mt-0.5 size-4 shrink-0" /> Password reset email sent. Check your inbox.
                  </p>
                )}
                {error && <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{error}</p>}

                <Button type="submit" className="h-13 w-full rounded-xl text-base" disabled={loading}>
                  {loading ? "Signing in…" : <>Sign in <ArrowRight className="size-5" /></>}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name" className="text-sm font-semibold">Full name</Label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                      <Input id="name" type="text" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="h-12 rounded-xl pl-12 text-base" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-sm font-semibold">Email address</Label>
                    <Input id="reg-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-12 rounded-xl text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-sm font-semibold">Password</Label>
                    <div className="relative">
                      <Input id="reg-password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" className="h-12 rounded-xl pr-11 text-base" />
                      <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-phone" className="text-sm font-semibold">Phone <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input id="reg-phone" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+94 77 000 0000" className="h-12 rounded-xl text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-dob" className="text-sm font-semibold">Date of birth <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input id="reg-dob" type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className="h-12 rounded-xl text-base" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-lang" className="text-sm font-semibold">Preferred language</Label>
                    <select id="reg-lang" value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none transition-shadow focus:border-ring focus:ring-3 focus:ring-ring/50">
                      <option value="">Select language</option>
                      {LANGUAGE_OPTIONS.map((language) => <option key={language} value={language}>{language}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-budget" className="text-sm font-semibold">Budget preference</Label>
                    <select id="reg-budget" value={budgetPreference} onChange={(event) => setBudgetPreference(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none transition-shadow focus:border-ring focus:ring-3 focus:ring-ring/50">
                      <option value="">No preference</option>
                      {BUDGET_OPTIONS.map((budget) => <option key={budget.value} value={budget.value}>{budget.label}</option>)}
                    </select>
                  </div>
                </div>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-semibold">Cuisines you enjoy <span className="font-normal text-muted-foreground">(optional)</span></legend>
                  <div className="flex flex-wrap gap-2">
                    {CUISINE_OPTIONS.map((cuisine) => {
                      const selected = cuisines.includes(cuisine);
                      return (
                        <button type="button" key={cuisine} aria-pressed={selected} onClick={() => toggleCuisine(cuisine)} className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${selected ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                          {selected && <Check className="mr-1 inline size-3.5" />}{cuisine}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {error && <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{error}</p>}

                <Button type="submit" className="h-13 w-full rounded-xl text-base" disabled={loading}>
                  {loading ? "Creating your account…" : <>Create my account <ArrowRight className="size-5" /></>}
                </Button>
                <p className="text-center text-xs leading-5 text-muted-foreground">
                  By creating an account, you agree to use AgentDine responsibly and keep your details accurate.
                </p>
              </form>
            )}

            <div className="mt-8 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
              <div>
                <p className="font-semibold text-sm text-foreground">Are you a Restaurant Owner?</p>
                <p className="text-xs text-muted-foreground">Register your restaurant to accept bookings & access AI analytics.</p>
              </div>
              <Button asChild size="sm" variant="outline" className="mt-3 sm:mt-0 border-primary/30 text-primary hover:bg-primary/10">
                <Link href="/register-restaurant">Register Venue &rarr;</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <LoginPageContent />
    </Suspense>
  );
}
