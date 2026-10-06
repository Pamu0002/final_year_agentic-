// UI-only redesign: Restyled menu management page with category sections and dietary badges
import Image from "next/image";
import { serverFetch } from "@/lib/server/api";
import { Badge } from "@/components/ui/badge";
import { ToggleAvailabilityButton, DeleteMenuItemButton, EditMenuItemButton } from "@/components/restaurant-portal/MenuItemActions";
import { AddMenuItemForm } from "@/components/restaurant-portal/AddMenuItemForm";
import { PortalPageHeader } from "@/components/restaurant-portal/PortalPageHeader";
import { UtensilsCrossed, Sparkles, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  dietaryInfo: string;
  isAvailable: boolean;
  imageUrl: string | null;
}

export default async function PortalMenuPage() {
  const items = await serverFetch<MenuItem[]>("restaurant-portal/menu");

  const byCategory = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
      <PortalPageHeader
        title="Menu Management"
        description={`${items.length} items ready to manage, price, and publish.`}
      />

      <AddMenuItemForm />

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/80 bg-card py-20 text-center shadow-xs">
          <UtensilsCrossed className="size-12 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-foreground">No menu items found</p>
          <p className="text-xs text-muted-foreground">Click the &quot;+ Add Menu Item&quot; button above to publish your first dish.</p>
        </div>
      )}

      {Object.entries(byCategory).map(([category, categoryItems]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary dark:text-[#D4B57D]">
              <ChefHat className="size-4" />
            </span>
            <h2 className="font-heading text-lg font-bold text-foreground">{category}</h2>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
              {categoryItems.length}
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/70 bg-muted/30 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5 text-left">Item Details</th>
                    <th className="px-5 py-3.5 text-left">Price (LKR)</th>
                    <th className="px-5 py-3.5 text-left">Dietary Info</th>
                    <th className="px-5 py-3.5 text-left">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {categoryItems.map((item) => {
                    const dietary = (() => {
                      try { return JSON.parse(item.dietaryInfo) as string[]; } catch { return []; }
                    })();
                    return (
                      <tr key={item.id} className="group transition-colors duration-150 hover:bg-muted/30">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3.5">
                            {item.imageUrl ? (
                              <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border/80 shadow-2xs">
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="size-12 shrink-0 rounded-xl border border-border/80 bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-xl shadow-2xs">
                                🍽️
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-foreground truncate">{item.name}</div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground mt-0.5 max-w-sm truncate">{item.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-foreground font-sans">
                          {item.price.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {dietary.length > 0 ? (
                              dietary.map((d) => (
                                <Badge key={d} variant="secondary" className="text-[0.66rem] font-bold uppercase tracking-wider rounded-md bg-muted text-muted-foreground">
                                  {d}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground/40 text-xs font-mono">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border",
                              item.isAvailable
                                ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-[#D4B57D] border-primary/30"
                                : "bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-500/30"
                            )}
                          >
                            <span className={cn("size-2 rounded-full", item.isAvailable ? "bg-primary" : "bg-rose-500")} />
                            {item.isAvailable ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <EditMenuItemButton item={item} />
                            <ToggleAvailabilityButton itemId={item.id} isAvailable={item.isAvailable} />
                            <DeleteMenuItemButton itemId={item.id} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
