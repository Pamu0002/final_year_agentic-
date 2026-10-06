import { serverFetch } from "@/lib/server/api";
import { ProfileForm } from "@/components/customer/ProfileForm";
import { PreferencesForm } from "@/components/customer/PreferencesForm";
import { InsightsCard } from "@/components/customer/InsightsCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User as UserIcon, Sliders, BarChart3, Calendar, Utensils, ShieldCheck, Mail, Sparkles, Award } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  diningPreferences: Record<string, unknown> | null;
  _count?: { reservations: number; reviews: number };
}

interface Insights {
  totalDiningExperiences: number;
  totalSpent: number;
  avgRatingGiven: number | null;
  topCuisines: { cuisine: string; count: number }[];
  topRestaurants: { id: string; name: string; count: number }[];
  monthlyDining: { month: string; count: number }[];
}

export default async function ProfilePage() {
  const user = await serverFetch<UserProfile>("users/me/full").catch(
    () => serverFetch<UserProfile>("users/me")
  );

  const [preferences, insights] = await Promise.all([
    serverFetch<Record<string, unknown>>("users/me/preferences").catch(() => null),
    serverFetch<Insights>("users/me/insights").catch(() => null),
  ]);

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-full bg-[#F7F1E7] py-6 sm:py-8 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#292526] font-sans">
              My Profile
            </h1>
            <p className="text-xs font-semibold text-[#746B66] mt-0.5">
              Manage your personal details, preferences & dining insights
            </p>
          </div>

          <Badge className="bg-[#B08D57] text-white font-bold text-xs px-3 py-1 rounded-full shadow-xs">
            <Sparkles className="size-3.5 mr-1" /> Verified Member
          </Badge>
        </div>

        {/* Hero Avatar Card */}
        <div className="relative rounded-[28px] bg-gradient-to-r from-[#6B1E2E] via-[#7A3146] to-[#B08D57] p-6 sm:p-8 text-white shadow-xl shadow-[#6B1E2E]/20 overflow-hidden">
          {/* Ambient Lighting */}
          <div className="absolute -top-12 -right-12 size-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 size-36 rounded-full bg-purple-900/20 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Circular Avatar */}
            <div className="relative size-20 shrink-0 rounded-full ring-4 ring-white/30 bg-white/15 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-3xl shadow-lg">
              {(user.name ?? user.email)[0].toUpperCase()}
              <span className="absolute bottom-0 right-0 grid size-6 place-items-center rounded-full bg-emerald-400 text-slate-950 ring-2 ring-white">
                <ShieldCheck className="size-3.5 stroke-[3]" />
              </span>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left min-w-0 space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {user.name ?? "Valued Diner"}
                </h2>
                <Badge className="bg-white/20 backdrop-blur-md text-white border-white/20 text-xs font-bold uppercase tracking-wider self-center sm:self-auto">
                  {user.role}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm font-medium text-white/80 flex items-center justify-center sm:justify-start gap-1.5 truncate">
                <Mail className="size-3.5 opacity-75" />
                {user.email}
              </p>

              {/* Quick Stat Badges inside Hero */}
              <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                <div className="flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-white/90 font-semibold border border-white/10">
                  <Calendar className="size-3.5 text-amber-300" />
                  <span>Member since {joinDate}</span>
                </div>
                {user._count && (
                  <div className="flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-white/90 font-semibold border border-white/10">
                    <Utensils className="size-3.5 text-emerald-300" />
                    <span>{user._count.reservations} reservation{user._count.reservations !== 1 ? "s" : ""}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-white/90 font-semibold border border-white/10">
                  <Award className="size-3.5 text-purple-300" />
                  <span>VIP Foodie</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Content */}
        <Tabs defaultValue="account" className="w-full space-y-5">
          {/* Styled Segmented Pill Tabs */}
          <TabsList className="w-full grid grid-cols-3 rounded-2xl bg-white p-1.5 border border-slate-200/70 shadow-sm h-12">
            <TabsTrigger
              value="account"
              className="rounded-xl font-extrabold text-xs sm:text-sm data-[state=active]:bg-[#6B1E2E] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <UserIcon className="size-4" />
              <span>Account</span>
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="rounded-xl font-extrabold text-xs sm:text-sm data-[state=active]:bg-[#6B1E2E] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Sliders className="size-4" />
              <span>Preferences</span>
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="rounded-xl font-extrabold text-xs sm:text-sm data-[state=active]:bg-[#6B1E2E] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <BarChart3 className="size-4" />
              <span>Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Tab Content */}
          <TabsContent value="account" className="space-y-4 focus-visible:outline-hidden">
            <ProfileForm user={user} />

            {/* Account Info Card */}
            <Card className="rounded-[24px] border border-slate-200/70 bg-white shadow-md shadow-slate-200/50">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-sm font-extrabold text-[#292526] flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[#B08D57]" />
                  Account Security & Membership
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="p-3 rounded-2xl bg-[#F1E9DD] border border-slate-100 flex items-center gap-3">
                    <Calendar className="size-4 text-[#6B1E2E]" />
                    <div>
                      <p className="font-bold text-[#292526]">Member Since</p>
                      <p className="text-[#746B66] font-medium">{joinDate}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#F1E9DD] border border-slate-100 flex items-center gap-3">
                    <Utensils className="size-4 text-emerald-600" />
                    <div>
                      <p className="font-bold text-[#292526]">Total Bookings</p>
                      <p className="text-[#746B66] font-medium">
                        {user._count?.reservations ?? 0} confirmed reservation{(user._count?.reservations ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab Content */}
          <TabsContent value="preferences" className="focus-visible:outline-hidden">
            <PreferencesForm initial={preferences} />
          </TabsContent>

          {/* Insights Tab Content */}
          <TabsContent value="insights" className="focus-visible:outline-hidden">
            <InsightsCard insights={insights} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
