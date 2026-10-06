"use client";

import { TransactionItem } from "./types";
import { ArrowDownLeft, ArrowUpRight, Clock, Palette, Layers, Sparkles, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionRowProps {
  item: TransactionItem;
}

export function TransactionRow({ item }: TransactionRowProps) {
  const isPositive = item.amount > 0;

  // Select brand icon
  const renderBrandIcon = () => {
    switch (item.brand) {
      case "figma":
        return <Palette className="size-4.5" />;
      case "stripe":
        return <ArrowDownLeft className="size-4.5" />;
      case "vercel":
        return <Terminal className="size-4.5" />;
      case "linear":
        return <Layers className="size-4.5" />;
      default:
        return <Sparkles className="size-4.5" />;
    }
  };

  return (
    <div className="group flex items-center justify-between gap-3.5 rounded-2xl p-2.5 transition-all duration-200 hover:bg-slate-50">
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105",
            item.iconBg,
            item.iconColor
          )}
        >
          {renderBrandIcon()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-slate-800 tracking-tight">
            {item.name}
          </p>
          <p className="truncate text-[11px] font-medium text-slate-400">
            {item.category}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p
          className={cn(
            "text-xs font-extrabold tracking-tight font-sans",
            item.type === "positive" && "text-emerald-600",
            item.type === "negative" && "text-rose-500",
            item.type === "pending" && "text-amber-500"
          )}
        >
          {isPositive ? `+` : `-`}$
          {Math.abs(item.amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-[10px] font-medium text-slate-400 mt-0.5">{item.date}</p>
      </div>
    </div>
  );
}
