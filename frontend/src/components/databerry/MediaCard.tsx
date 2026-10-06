"use client";

import { Play } from "lucide-react";
import { motion } from "framer-motion";

export function MediaCard() {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="flex flex-col justify-between rounded-[28px] bg-[#F1E9DD] p-6 shadow-xs border border-slate-200/50 min-h-[160px]"
    >
      {/* Green Play-Circle Badge */}
      <div className="grid size-11 place-items-center rounded-2xl bg-[#E8FAF0] text-[#16A34A] shadow-xs">
        <Play className="size-5 fill-current ml-0.5" />
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-extrabold tracking-tight text-[#292526] font-sans">
          Latest media
        </h2>
        <p className="text-xs font-semibold text-[#746B66] mt-0.5">
          23 media files
        </p>
      </div>
    </motion.div>
  );
}
