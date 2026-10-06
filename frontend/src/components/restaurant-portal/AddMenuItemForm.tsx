// UI-only redesign: Restyled add menu item form with soft rounded inputs and brand accenting
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "./ImageUploader";
import { Plus, UtensilsCrossed } from "lucide-react";

export function AddMenuItemForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name") as string,
      description: (fd.get("description") as string) || null,
      price: Number(fd.get("price")),
      category: fd.get("category") as string,
      dietaryInfo: (fd.get("dietaryInfo") as string)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      isAvailable: true,
      imageUrl: imageUrl ?? null,
    };

    setLoading(true);
    const res = await fetch("/api/proxy/restaurant-portal/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);

    if (!res.ok) {
      setError("Failed to add item");
      return;
    }
    setOpen(false);
    setImageUrl(null);
    router.refresh();
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-primary hover:bg-primary text-white font-bold text-xs px-4 h-10 shadow-sm"
      >
        <Plus className="size-4 mr-1.5" />
        Add Menu Item
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-2xl border border-border/80 bg-card p-6 shadow-md">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 dark:bg-primary/20 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary dark:text-[#D4B57D]">
          <UtensilsCrossed className="size-3 text-primary" />
          Add A Dish
        </div>
        <h3 className="mt-2 font-heading text-xl font-bold text-foreground">New Menu Item</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="name" className="text-foreground">Name *</Label>
          <Input id="name" name="name" required placeholder="e.g. Seafood Kottu Special" className="rounded-xl border-border/80" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="description" className="text-foreground">Description</Label>
          <Input id="description" name="description" placeholder="Short appetizing description" className="rounded-xl border-border/80" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price" className="text-foreground">Price (LKR) *</Label>
          <Input id="price" name="price" type="number" min="0" step="0.01" required placeholder="1850" className="rounded-xl border-border/80" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-foreground">Category *</Label>
          <Input id="category" name="category" required placeholder="Mains, Starters, Desserts" className="rounded-xl border-border/80" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="dietaryInfo" className="text-foreground">Dietary Info (comma-separated)</Label>
          <Input id="dietaryInfo" name="dietaryInfo" placeholder="Vegetarian, Halal, Spicy" className="rounded-xl border-border/80" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-foreground">Item Photo</Label>
          <ImageUploader
            endpoint="menuItemImage"
            value={imageUrl}
            onChange={setImageUrl}
            label="Upload item photo"
          />
        </div>
      </div>

      {error && <p className="text-xs font-bold text-destructive">{error}</p>}

      <div className="flex gap-2.5 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={() => { setOpen(false); setImageUrl(null); }} className="rounded-xl text-xs font-bold text-muted-foreground">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="rounded-xl bg-primary hover:bg-primary text-white font-bold text-xs px-5 shadow-sm">
          {loading ? "Adding…" : "Add Item"}
        </Button>
      </div>
    </form>
  );
}
