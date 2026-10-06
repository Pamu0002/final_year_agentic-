import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Utensils, MapPin, CreditCard, Star, Sparkles, ChevronRight } from "lucide-react";

interface Insights {
  totalDiningExperiences: number;
  totalSpent: number;
  avgRatingGiven: number | null;
  topCuisines: { cuisine: string; count: number }[];
  topRestaurants: { id: string; name: string; count: number }[];
  monthlyDining: { month: string; count: number }[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  accentColor = "bg-indigo-50 text-[#6B1E2E]",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accentColor?: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-xs hover:shadow-md transition-shadow">
      <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${accentColor}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-extrabold text-[#292526] tracking-tight leading-none">{value}</p>
        <p className="text-xs font-semibold text-[#746B66] mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

export function InsightsCard({ insights }: { insights: Insights | null }) {
  if (!insights) {
    return (
      <Card className="rounded-[24px] border border-slate-200/70 bg-white shadow-md p-8 text-center">
        <CardContent className="space-y-3 p-0">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-indigo-50 text-[#6B1E2E]">
            <Sparkles className="size-6" />
          </div>
          <h3 className="text-base font-extrabold text-[#292526]">No Dining History Yet</h3>
          <p className="text-xs font-medium text-[#746B66] max-w-xs mx-auto">
            Book your first table to start tracking your dining experiences, top cuisines, and rewards!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <StatCard
          icon={Utensils}
          label="Dining Experiences"
          value={String(insights.totalDiningExperiences)}
          accentColor="bg-indigo-50 text-[#6B1E2E]"
        />
        <StatCard
          icon={CreditCard}
          label="Total Spent"
          value={`LKR ${insights.totalSpent.toLocaleString()}`}
          accentColor="bg-emerald-50 text-emerald-600"
        />
        {insights.avgRatingGiven != null && (
          <StatCard
            icon={Star}
            label="Avg Rating Given"
            value={insights.avgRatingGiven.toFixed(1)}
            accentColor="bg-amber-50 text-amber-500"
          />
        )}
        {insights.monthlyDining.length > 0 && (
          <StatCard
            icon={TrendingUp}
            label="Most Active Month"
            value={insights.monthlyDining.reduce((a, b) => (a.count > b.count ? a : b)).month}
            accentColor="bg-purple-50 text-[#B08D57]"
          />
        )}
      </div>

      {/* Favourite Cuisines */}
      {insights.topCuisines.length > 0 && (
        <Card className="rounded-[24px] border border-slate-200/70 bg-white shadow-md overflow-hidden">
          <CardHeader className="bg-slate-50/60 border-b border-slate-100 px-6 py-4">
            <CardTitle className="text-sm font-extrabold text-[#292526] flex items-center gap-2">
              <Utensils className="size-4 text-[#6B1E2E]" />
              Favourite Cuisines Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3.5">
            {insights.topCuisines.map((c, i) => {
              const max = insights.topCuisines[0].count;
              const pct = Math.round((c.count / max) * 100);
              return (
                <div key={c.cuisine} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#292526] flex items-center gap-2">
                      <span className="text-[10px] text-[#746B66] font-mono">#{i + 1}</span>
                      {c.cuisine}
                    </span>
                    <span className="text-[#746B66]">{c.count} visits ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#6B1E2E] to-[#B08D57] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Most Visited Restaurants */}
      {insights.topRestaurants.length > 0 && (
        <Card className="rounded-[24px] border border-slate-200/70 bg-white shadow-md overflow-hidden">
          <CardHeader className="bg-slate-50/60 border-b border-slate-100 px-6 py-4">
            <CardTitle className="text-sm font-extrabold text-[#292526] flex items-center gap-2">
              <MapPin className="size-4 text-[#B08D57]" />
              Most Visited Restaurants
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {insights.topRestaurants.map((r, i) => (
              <Link
                key={r.id}
                href={`/restaurants/${r.id}`}
                className="group flex items-center justify-between rounded-2xl p-3 hover:bg-[#F1E9DD] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid size-7 place-items-center rounded-xl bg-indigo-50 text-[11px] font-extrabold text-[#6B1E2E]">
                    #{i + 1}
                  </span>
                  <span className="truncate text-xs font-bold text-[#292526] group-hover:text-[#6B1E2E]">
                    {r.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-[#746B66] bg-slate-100 px-2.5 py-1 rounded-full">
                    {r.count} visit{r.count !== 1 ? "s" : ""}
                  </span>
                  <ChevronRight className="size-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
