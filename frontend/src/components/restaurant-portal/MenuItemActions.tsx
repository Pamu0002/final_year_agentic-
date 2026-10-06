// UI-only redesign: Restyled menu item edit modal and action buttons
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Pencil, X, UtensilsCrossed } from "lucide-react";
import { ImageUploader } from "./ImageUploader";

// ── Toggle availability ───────────────────────────────────────────────────────

export function ToggleAvailabilityButton({
  itemId,
  isAvailable,
}: {
  itemId: string;
  isAvailable: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    await fetch(`/api/proxy/restaurant-portal/menu/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !isAvailable }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="h-8 rounded-xl text-[0.68rem] font-bold uppercase tracking-wider px-3 border-border/80 hover:bg-muted"
    >
      {isAvailable ? "Mark Unavailable" : "Mark Available"}
    </Button>
  );
}

// ── Delete ────────────────────────────────────────────────────────────────────

export function DeleteMenuItemButton({ itemId }: { itemId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Delete this menu item?")) return;
    setLoading(true);
    await fetch(`/api/proxy/restaurant-portal/menu/${itemId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={loading}
      className="size-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
      title="Delete menu item"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────

interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  dietaryInfo: string;
  isAvailable: boolean;
  imageUrl?: string | null;
}

export function EditMenuItemButton({ item }: { item: MenuItemData }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(item.imageUrl ?? null);
  const router = useRouter();

  const dietaryDefault = (() => {
    try { return (JSON.parse(item.dietaryInfo) as string[]).join(", "); } catch { return ""; }
  })();

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
      isAvailable: item.isAvailable,
      imageUrl: imageUrl ?? null,
    };

    setLoading(true);
    const res = await fetch(`/api/proxy/restaurant-portal/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);

    if (!res.ok) {
      setError("Failed to update item");
      return;
    }
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="size-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Edit item"
      >
        <Pencil className="size-4" />
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-border/70 px-6 py-4 bg-muted/30">
              <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                <UtensilsCrossed className="size-4 text-primary" />
                Edit Menu Item
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="edit-name" className="text-foreground">Name *</Label>
                  <Input id="edit-name" name="name" defaultValue={item.name} required className="rounded-xl border-border/80" />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="edit-description" className="text-foreground">Description</Label>
                  <Input id="edit-description" name="description" defaultValue={item.description ?? ""} className="rounded-xl border-border/80" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-price" className="text-foreground">Price (LKR) *</Label>
                  <Input
                    id="edit-price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={item.price}
                    required
                    className="rounded-xl border-border/80"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-category" className="text-foreground">Category *</Label>
                  <Input id="edit-category" name="category" defaultValue={item.category} required className="rounded-xl border-border/80" />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="edit-dietary" className="text-foreground">Dietary Info (comma-separated)</Label>
                  <Input
                    id="edit-dietary"
                    name="dietaryInfo"
                    defaultValue={dietaryDefault}
                    placeholder="Vegetarian, Halal"
                    className="rounded-xl border-border/80"
                  />
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
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl text-xs font-bold text-muted-foreground">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="rounded-xl bg-primary hover:bg-primary text-white font-bold text-xs px-5 shadow-sm">
                  {loading ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
