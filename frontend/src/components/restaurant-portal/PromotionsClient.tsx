// UI-only redesign: Restyled promotions manager with elevated promo cards and voucher badges
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CalendarHeart, Percent, Trash2, Plus, Tag, ToggleLeft, ToggleRight, UtensilsCrossed, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  type: string;
  discountValue: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  imageUrl: string | null;
  menuItems: MenuItem[];
}

const TYPES = ["DISCOUNT", "HAPPY_HOUR", "SPECIAL_EVENT", "SEASONAL", "COUPON"] as const;

const TYPE_LABEL: Record<string, string> = {
  DISCOUNT: "Discount", HAPPY_HOUR: "Happy Hour", SPECIAL_EVENT: "Special Event",
  SEASONAL: "Seasonal", COUPON: "Coupon",
};

function PromotionCard({ promo, onToggle, onDelete }: {
  promo: Promotion;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="group rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading text-lg font-bold text-foreground">{promo.title}</h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold border",
                promo.isActive
                  ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-[#D4B57D] border-primary/30"
                  : "bg-slate-500/10 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 border-slate-500/30"
              )}
            >
              <span className={cn("size-1.5 rounded-full", promo.isActive ? "bg-primary" : "bg-slate-400")} />
              {promo.isActive ? "Active Campaign" : "Inactive"}
            </span>
            <Badge variant="outline" className="text-[0.66rem] font-bold uppercase tracking-wider rounded-md border-border/80">
              {TYPE_LABEL[promo.type] ?? promo.type}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{promo.description}</p>

          <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground pt-1">
            {promo.discountValue != null && (
              <span className="inline-flex items-center gap-1 text-primary dark:text-[#D4B57D] font-bold bg-primary/10 px-2.5 py-0.5 rounded-md">
                <Percent className="size-3" /> {promo.discountValue}% off
              </span>
            )}
            <span className="flex items-center gap-1 font-mono">
              <Calendar className="size-3 text-muted-foreground" />
              {new Date(promo.startDate).toLocaleDateString("en-LK")} – {new Date(promo.endDate).toLocaleDateString("en-LK")}
            </span>
          </div>

          {promo.menuItems.length > 0 && (
            <div className="mt-4 rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-foreground">
                <UtensilsCrossed className="size-3.5 text-primary" /> Discounted Menu Dishes ({promo.menuItems.length})
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {promo.menuItems.map((item) => {
                  const discountedPrice = promo.discountValue != null
                    ? item.price * (1 - promo.discountValue / 100)
                    : item.price;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-card px-3 py-2 text-xs border border-border/60 shadow-2xs">
                      <span className="min-w-0 truncate font-semibold text-foreground">{item.name}</span>
                      <span className="shrink-0 font-sans">
                        <span className="text-muted-foreground line-through text-[0.68rem]">{item.price.toLocaleString()}</span>{" "}
                        <span className="font-bold text-primary dark:text-[#D4B57D]">LKR {Math.round(discountedPrice).toLocaleString()}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggle(promo.id, promo.isActive)}
            className={cn("size-8 rounded-xl", promo.isActive ? "text-amber-600 hover:bg-amber-500/10" : "text-primary hover:bg-primary/10")}
            title={promo.isActive ? "Deactivate promo" : "Activate promo"}
          >
            {promo.isActive ? <ToggleRight className="size-5" /> : <ToggleLeft className="size-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(promo.id)}
            title="Delete promo"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PromotionsClient({ initial, menuItems }: { initial: Promotion[]; menuItems: MenuItem[] }) {
  const [promotions, setPromotions] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const discountValue = fd.get("discountValue") ? Number(fd.get("discountValue")) : null;
    if (selectedMenuIds.length > 0 && (!discountValue || discountValue < 1 || discountValue > 100)) {
      setError("Enter a discount between 1% and 100% for the selected dishes.");
      return;
    }
    setError("");
    const body = {
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      type: fd.get("type") as string,
      discountValue,
      startDate: fd.get("startDate") as string,
      endDate: fd.get("endDate") as string,
      isActive: true,
      menuItemIds: selectedMenuIds,
    };
    setSaving(true);
    const res = await fetch("/api/proxy/restaurant-portal/promotions", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      const created = await res.json() as Promotion;
      setPromotions((p) => [created, ...p]);
      setShowForm(false);
      setSelectedMenuIds([]);
    } else {
      const result = await res.json().catch(() => null) as { error?: string } | null;
      setError(result?.error ?? "Could not create this promotion.");
    }
  };

  const toggle = async (id: string, current: boolean) => {
    const res = await fetch(`/api/proxy/restaurant-portal/promotions/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    if (res.ok) setPromotions((p) => p.map((pr) => pr.id === id ? { ...pr, isActive: !current } : pr));
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/proxy/restaurant-portal/promotions/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) setPromotions((p) => p.filter((pr) => pr.id !== id));
  };

  return (
    <div className="space-y-6">
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-primary hover:bg-primary text-white font-bold text-xs px-4 h-10 shadow-sm"
        >
          <Plus className="size-4 mr-1.5" /> Add Promotion
        </Button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6 rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-md">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 dark:bg-primary/20 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary dark:text-[#D4B57D]">
              <Tag className="size-3 text-primary" /> New Campaign
            </div>
            <h3 className="mt-2 font-heading text-2xl font-bold text-foreground">Create a Promotion</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">Choose a special offer for the whole restaurant, or attach a percentage discount to dishes on your menu.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-1">
              <CalendarHeart className="size-5 text-primary" />
              <p className="font-bold text-sm text-foreground">Special event or occasion</p>
              <p className="text-xs leading-relaxed text-muted-foreground">Select Special Event or Seasonal, describe the offer, and leave menu items unselected.</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-1">
              <Percent className="size-5 text-primary" />
              <p className="font-bold text-sm text-foreground">Menu item discount</p>
              <p className="text-xs leading-relaxed text-muted-foreground">Enter a discount percentage and select the dishes that should receive the special pricing.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs font-semibold">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="title" className="text-foreground">Campaign Title *</Label>
              <Input id="title" name="title" required placeholder="e.g. Weekend Family Feast 20% Off" className="rounded-xl border-border/80" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description" className="text-foreground">Description *</Label>
              <Textarea id="description" name="description" required rows={2} placeholder="Detail what makes this campaign special for your guests..." className="rounded-xl border-border/80" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-foreground">Campaign Type *</Label>
              <select id="type" name="type" required className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-semibold">
                {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discountValue" className="text-foreground">Discount % (optional)</Label>
              <Input id="discountValue" name="discountValue" type="number" min="0" max="100" placeholder="15" className="rounded-xl border-border/80" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-foreground">Start Date *</Label>
              <Input id="startDate" name="startDate" type="date" required className="rounded-xl border-border/80" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-foreground">End Date *</Label>
              <Input id="endDate" name="endDate" type="date" required className="rounded-xl border-border/80" />
            </div>

            <fieldset className="space-y-3 rounded-2xl border border-border/80 p-4 sm:col-span-2">
              <div>
                <legend className="font-bold text-sm text-foreground">Apply to Menu Dishes</legend>
                <p className="mt-0.5 text-xs text-muted-foreground">Optional. Leave all unchecked for a restaurant-wide promotional campaign.</p>
              </div>
              {menuItems.length === 0 ? (
                <p className="rounded-xl bg-muted/50 px-4 py-5 text-center text-xs text-muted-foreground">Add dishes to your Menu before creating a menu-item discount.</p>
              ) : (
                <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {menuItems.map((item) => {
                    const selected = selectedMenuIds.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all duration-150",
                          selected ? "border-primary bg-primary/10 shadow-2xs" : "border-border/80 hover:border-primary/30",
                          !item.isAvailable && "opacity-60"
                        )}
                      >
                        <input
                          type="checkbox"
                          value={item.id}
                          checked={selected}
                          onChange={(event) => setSelectedMenuIds((current) =>
                            event.target.checked
                              ? [...current, item.id]
                              : current.filter((id) => id !== item.id)
                          )}
                          className="size-4 accent-primary"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold text-foreground">{item.name}</span>
                          <span className="block text-[0.68rem] text-muted-foreground">{item.category}</span>
                        </span>
                        <span className="shrink-0 text-xs font-bold text-foreground font-sans">LKR {item.price.toLocaleString()}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>
          </div>
          {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive">{error}</p>}
          <div className="flex gap-2.5 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setSelectedMenuIds([]); setError(""); }} className="rounded-xl text-xs font-bold text-muted-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="rounded-xl bg-primary hover:bg-primary text-white font-bold text-xs px-5 shadow-sm">
              {saving ? "Saving…" : "Create Promotion"}
            </Button>
          </div>
        </form>
      )}

      {promotions.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/80 bg-card py-20 text-center shadow-xs">
          <Tag className="size-12 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-foreground">No promotions active</p>
          <p className="text-xs text-muted-foreground">Create your first special day offer or discounted menu item voucher above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {promotions.map((p) => (
            <PromotionCard key={p.id} promo={p} onToggle={toggle} onDelete={remove} />
          ))}
        </div>
      )}
    </div>
  );
}
