"use client";

import { useState } from "react";
import { Coffee, Camera, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TransactionItem {
  id: string;
  name: string;
  category: string;
  amount: string;
  amountColor: string;
  brand: "starbucks" | "instagram" | "bunch";
}

const TRANSACTIONS: TransactionItem[] = [
  {
    id: "tx-1",
    name: "Starbucks",
    category: "F&B Industry",
    amount: "+987.00",
    amountColor: "text-[#16A34A]",
    brand: "starbucks",
  },
  {
    id: "tx-2",
    name: "Instagram",
    category: "Tech Business",
    amount: "-655.00",
    amountColor: "text-[#DC2626]",
    brand: "instagram",
  },
  {
    id: "tx-3",
    name: "Bunch app",
    category: "IT Business",
    amount: "+390.00",
    amountColor: "text-[#EA580C]",
    brand: "bunch",
  },
];

const SAMPLE_TASKS = [
  { id: "t-1", title: "Approve Starbucks branding proposal", due: "Today", completed: true },
  { id: "t-2", title: "Schedule Instagram marketing sync", due: "Tomorrow", completed: false },
  { id: "t-3", title: "Review Bunch app IT infrastructure", due: "Sep 28", completed: false },
];

export function UpdatesSection() {
  const [activeTab, setActiveTab] = useState<"brand" | "tasks">("brand");
  const [tasks, setTasks] = useState(SAMPLE_TASKS);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  return (
    <div className="space-y-4">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold tracking-tight text-[#292526] font-sans">
          Latest updates
        </h2>

        {/* Tab Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("brand")}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 border",
              activeTab === "brand"
                ? "border-[#292526] text-[#292526] bg-white shadow-2xs"
                : "border-transparent text-[#746B66] hover:text-[#292526]"
            )}
          >
            Brand addition
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 border",
              activeTab === "tasks"
                ? "border-[#292526] text-[#292526] bg-white shadow-2xs"
                : "border-transparent text-[#746B66] hover:text-[#292526]"
            )}
          >
            Upcoming tasks
          </button>
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === "brand" ? (
          <motion.div
            key="brand-list"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {TRANSACTIONS.map((tx) => (
              <div
                key={tx.id}
                className="group flex items-center justify-between rounded-2xl p-2 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Brand Rounded-Square Icon */}
                  {tx.brand === "starbucks" && (
                    <div className="grid size-11 place-items-center rounded-2xl bg-[#00704A] text-white shadow-xs">
                      <Coffee className="size-5" />
                    </div>
                  )}
                  {tx.brand === "instagram" && (
                    <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] text-white shadow-xs">
                      <Camera className="size-5" />
                    </div>
                  )}
                  {tx.brand === "bunch" && (
                    <div className="grid size-11 place-items-center rounded-2xl bg-[#8F6A3D] text-white font-extrabold text-lg shadow-xs font-sans">
                      B
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#292526] tracking-tight">
                      {tx.name}
                    </p>
                    <p className="truncate text-xs font-medium text-[#746B66]">
                      {tx.category}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={cn("text-sm font-extrabold tracking-tight font-sans", tx.amountColor)}>
                    {tx.amount}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="tasks-list"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="space-y-2.5"
          >
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-[#F1E9DD] p-3 transition-colors hover:bg-slate-100"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                      task.completed ? "bg-[#6B1E2E] border-[#6B1E2E] text-white" : "border-slate-300 bg-white"
                    )}
                  >
                    {task.completed && <CheckCircle2 className="size-3.5" />}
                  </div>
                  <span className={cn("truncate text-xs font-bold text-[#292526]", task.completed && "line-through text-[#746B66]")}>
                    {task.title}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#746B66] shrink-0">
                  {task.due}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
