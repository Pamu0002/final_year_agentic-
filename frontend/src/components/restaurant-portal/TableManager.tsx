// UI-only redesign: Restyled dining table manager with seat capacity badges and rounded inputs
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Utensils, Armchair } from "lucide-react";
import { cn } from "@/lib/utils";

interface RestaurantTable {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
}

export function TableManager() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(2);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const response = await fetch("/api/proxy/restaurant-portal/tables", { cache: "no-store" });
    if (response.ok) setTables(await response.json() as RestaurantTable[]);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const response = await fetch("/api/proxy/restaurant-portal/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, capacity }),
    });
    const body = await response.json().catch(() => ({})) as RestaurantTable & { error?: string };
    if (!response.ok) return setError(body.error ?? "Could not add table");
    setTables((current) => [...current, body]);
    setName("");
    setCapacity(2);
  };

  const update = async (table: RestaurantTable, changes: Partial<RestaurantTable>) => {
    const response = await fetch(`/api/proxy/restaurant-portal/tables/${table.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    if (response.ok) {
      const updated = await response.json() as RestaurantTable;
      setTables((current) => current.map((item) => item.id === updated.id ? updated : item));
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this table from capacity calculations?")) return;
    const response = await fetch(`/api/proxy/restaurant-portal/tables/${id}`, { method: "DELETE" });
    if (response.ok) setTables((current) => current.filter((table) => table.id !== id));
  };

  const activeSeats = tables.filter((table) => table.isActive).reduce((sum, table) => sum + table.capacity, 0);

  return (
    <section className="space-y-5 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
            <Armchair className="size-4 text-primary" /> Dining Tables & Layout
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Configure physical seating layout and total dining capacity.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-primary/10 dark:bg-primary/20 px-3.5 py-1.5 text-xs font-bold text-primary dark:text-[#D4B57D]">
          <Utensils className="size-3.5 text-primary" />
          Active Capacity: <span className="font-sans text-sm">{activeSeats}</span> seats
        </div>
      </div>

      <form onSubmit={create} className="grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end text-xs font-semibold">
        <div className="space-y-1.5">
          <Label htmlFor="table-name" className="text-foreground">Table Name *</Label>
          <Input id="table-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Table 01 (Patio)" required className="rounded-xl border-border/80" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="table-capacity" className="text-foreground">Seats *</Label>
          <Input id="table-capacity" type="number" min={1} max={100} value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} required className="rounded-xl border-border/80" />
        </div>
        <Button type="submit" className="rounded-xl bg-primary hover:bg-primary text-white font-bold text-xs px-4 h-10 shadow-sm">
          <Plus className="mr-1.5 size-4" /> Add Table
        </Button>
      </form>
      {error && <p className="text-xs font-bold text-destructive">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => (
          <div key={table.id} className={cn("flex items-center gap-3 rounded-2xl border p-3.5 shadow-2xs transition-all", table.isActive ? "border-border/80 bg-card" : "border-border/60 bg-muted/20 opacity-70")}>
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
              <Armchair className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-foreground">{table.name}</p>
              <p className="text-[0.68rem] text-muted-foreground font-semibold">{table.capacity} seats</p>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer font-bold select-none">
              <input type="checkbox" checked={table.isActive} onChange={(event) => void update(table, { isActive: event.target.checked })} className="size-3.5 accent-primary rounded" />
              Active
            </label>
            <Button type="button" variant="ghost" size="icon" className="size-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => void remove(table.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
