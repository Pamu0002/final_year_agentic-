"use client";

import { Flame } from "lucide-react";
import { motion } from "framer-motion";

export function UrgentCard() {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="flex flex-col justify-between rounded-[28px] bg-[#6B1E2E] p-6 shadow-lg shadow-[#6B1E2E]/25 border border-indigo-950/30 min-h-[160px] text-white"
    >
      {/* Orange/Yellow Flame Icon Badge */}
      <div className="grid size-11 place-items-center rounded-2xl bg-[#B08D57]/20 text-[#B08D57] shadow-xs border border-[#B08D57]/30">
        <Flame className="size-5 fill-[#B08D57]" />
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-extrabold tracking-tight text-white font-sans">
          Urgent to do
        </h2>
        <p className="text-xs font-medium text-white/70 mt-0.5">
          High priority tasks
        </p>
      </div>
    </motion.div>
  );
}
