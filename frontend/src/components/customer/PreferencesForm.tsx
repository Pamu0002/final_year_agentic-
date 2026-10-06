"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Utensils, Sparkles, DollarSign, Armchair, Check, X, Save, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const CUISINE_OPTIONS = [
  "Sri Lankan", "Japanese", "Italian", "Indian", "Chinese", "Thai", "Seafood", "BBQ",
  "Burger", "Pizza", "Sushi", "Vegetarian", "Mediterranean", "French", "Mexican",
];
const DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Halal", "Gluten-Free", "Dairy-Free", "Nut-Free", "Kosher"];
const SEATING_OPTIONS = ["Indoor", "Outdoor", "Bar", "Booth", "High-Top", "Private Room"];

const BUDGET_TIERS = [
  { id: "BUDGET", label: "Budget", icon: "$", desc: "Affordable eats" },
  { id: "MODERATE", label: "Moderate", icon: "$$", desc: "Mid-range dining" },
  { id: "EXPENSIVE", label: "Expensive", icon: "$$$", desc: "Premium spots" },
  { id: "FINE_DINING", label: "Fine Dining", icon: "$$$$", desc: "Luxury gourmet" },
];

interface Prefs {
  preferredCuisines?: string[];
  dietaryRestrictions?: string[];
  budgetPreference?: string;
  seatingPreferences?: string[];
}

export function PreferencesForm({ initial }: { initial: Record<string, unknown> | null }) {
  const pref = (initial ?? {}) as Prefs;
  const [cuisines, setCuisines] = useState<string[]>(pref.preferredCuisines ?? []);
  const [dietary, setDietary] = useState<string[]>(pref.dietaryRestrictions ?? []);
  const [budget, setBudget] = useState<string>(pref.budgetPreference ?? "");
  const [seating, setSeating] = useState<string[]>(pref.seatingPreferences ?? []);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const toggle = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const save = async () => {
    setStatus("saving");
    try {
      const res = await fetch("/api/proxy/users/me/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredCuisines: cuisines,
          dietaryRestrictions: dietary,
          budgetPreference: budget || undefined,
          seatingPreferences: seating,
        }),
      });
      setStatus(res.ok ? "saved" : "error");
      if (res.ok) setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    }
  };

  return (
    <Card className="rounded-[24px] border border-slate-200/70 bg-white shadow-md shadow-slate-200/50 overflow-hidden">
      <CardHeader className="bg-slate-50/60 border-b border-slate-100 px-6 py-4">
        <CardTitle className="text-base font-extrabold text-[#292526] flex items-center gap-2">
          <Sparkles className="size-5 text-[#B08D57]" />
          Personalized Dining Preferences
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Preferred Cuisines */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Utensils className="size-4 text-[#6B1E2E]" />
            <Label className="text-xs font-bold text-[#292526] uppercase tracking-wider">
              Preferred Cuisines
            </Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {CUISINE_OPTIONS.map((c) => {
              const selected = cuisines.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggle(cuisines, c, setCuisines)}
                  className={cn(
                    "rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 border flex items-center gap-1.5",
                    selected
                      ? "bg-[#6B1E2E] text-white border-[#6B1E2E] shadow-xs"
                      : "bg-[#F1E9DD] text-[#746B66] border-slate-200/80 hover:border-[#B08D57] hover:text-[#292526]"
                  )}
                >
                  <span>{c}</span>
                  {selected ? <Check className="size-3 text-emerald-400" /> : <X className="size-3 opacity-0 hover:opacity-100" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dietary Restrictions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#B08D57]" />
            <Label className="text-xs font-bold text-[#292526] uppercase tracking-wider">
              Dietary Restrictions
            </Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((d) => {
              const selected = dietary.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggle(dietary, d, setDietary)}
                  className={cn(
                    "rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 border flex items-center gap-1.5",
                    selected
                      ? "bg-[#B08D57] text-white border-[#B08D57] shadow-xs"
                      : "bg-[#F1E9DD] text-[#746B66] border-slate-200/80 hover:border-[#B08D57] hover:text-[#292526]"
                  )}
                >
                  <span>{d}</span>
                  {selected && <Check className="size-3 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget Preference */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-emerald-600" />
              <Label className="text-xs font-bold text-[#292526] uppercase tracking-wider">
                Budget Preference
              </Label>
            </div>
            {budget && (
              <button
                type="button"
                onClick={() => setBudget("")}
                className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1"
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {BUDGET_TIERS.map((tier) => {
              const selected = budget === tier.id;
              return (
                <div
                  key={tier.id}
                  onClick={() => setBudget(tier.id)}
                  className={cn(
                    "cursor-pointer rounded-2xl p-3 border transition-all text-center flex flex-col items-center justify-center space-y-1",
                    selected
                      ? "border-[#6B1E2E] bg-indigo-50/50 text-[#6B1E2E] shadow-xs ring-2 ring-[#6B1E2E]/20"
                      : "border-slate-200/80 bg-[#F1E9DD] text-[#746B66] hover:bg-slate-100 hover:text-[#292526]"
                  )}
                >
                  <span className="text-base font-extrabold">{tier.icon}</span>
                  <span className="text-xs font-bold">{tier.label}</span>
                  <span className="text-[10px] text-[#746B66]">{tier.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seating Preferences */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Armchair className="size-4 text-amber-500" />
            <Label className="text-xs font-bold text-[#292526] uppercase tracking-wider">
              Seating Preferences
            </Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {SEATING_OPTIONS.map((s) => {
              const selected = seating.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(seating, s, setSeating)}
                  className={cn(
                    "rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 border flex items-center gap-1.5",
                    selected
                      ? "bg-[#292526] text-white border-[#292526] shadow-xs"
                      : "bg-[#F1E9DD] text-[#746B66] border-slate-200/80 hover:border-[#292526] hover:text-[#292526]"
                  )}
                >
                  <span>{s}</span>
                  {selected && <Check className="size-3 text-amber-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Summary Badges */}
        {(cuisines.length > 0 || dietary.length > 0 || budget || seating.length > 0) && (
          <div className="rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100 space-y-2">
            <p className="text-xs font-bold text-[#6B1E2E] uppercase tracking-wider">Active Preference Profile:</p>
            <div className="flex flex-wrap gap-1.5">
              {cuisines.map((c) => (
                <Badge key={c} className="bg-[#6B1E2E] text-white text-[11px] font-bold rounded-xl px-2.5 py-0.5">
                  {c}
                </Badge>
              ))}
              {dietary.map((d) => (
                <Badge key={d} className="bg-[#B08D57] text-white text-[11px] font-bold rounded-xl px-2.5 py-0.5">
                  {d}
                </Badge>
              ))}
              {budget && (
                <Badge className="bg-emerald-600 text-white text-[11px] font-bold rounded-xl px-2.5 py-0.5">
                  {budget}
                </Badge>
              )}
              {seating.map((s) => (
                <Badge key={s} className="bg-[#292526] text-white text-[11px] font-bold rounded-xl px-2.5 py-0.5">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {status === "error" && (
          <p className="text-xs text-rose-600 font-medium">Failed to save preferences. Please try again.</p>
        )}

        {/* Save button */}
        <Button
          onClick={save}
          disabled={status === "saving"}
          className="w-full h-11 rounded-2xl bg-[#6B1E2E] hover:bg-[#521725] text-white font-bold text-sm shadow-md shadow-[#6B1E2E]/20 transition-all duration-200 flex items-center justify-center gap-2"
        >
          {status === "saving" ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="size-4 border-2 border-white border-t-transparent rounded-full"
              />
              <span>Saving Preferences…</span>
            </>
          ) : status === "saved" ? (
            <>
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>Preferences Saved!</span>
            </>
          ) : (
            <>
              <Save className="size-4" />
              <span>Save Preferences</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
