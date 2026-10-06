"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function SavingsCard() {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="rounded-[28px] p-6 sm:p-7 text-white shadow-[0_12px_40px_rgba(249,139,200,0.35)] relative overflow-hidden flex flex-col justify-between min-h-[220px]"
      style={{
        background: "linear-gradient(135deg, #8F5260 0%, #C19B62 100%)",
      }}
    >
      {/* Decorative background glow circles */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-900/10 rounded-full blur-xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between z-10">
        <span className="text-white/85 text-sm font-medium tracking-wide">
          Great Job, You Saved
        </span>
        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Middle Amount */}
      <div className="my-auto py-2 z-10">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm"
        >
          $ 5,000
        </motion.h2>
        <p className="text-white/90 text-sm font-medium mt-1">
          Points Earned : <span className="font-bold text-white">10,000</span>
        </p>
      </div>

      {/* Bottom Mastercard indicator */}
      <div className="flex items-center justify-between pt-2 border-t border-white/15 z-10">
        <span className="text-xs text-white/70 font-medium">Valid Thru 12/28</span>

        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-2">
            <div className="w-5 h-5 rounded-full bg-[#EB001B]/90 shadow-sm" />
            <div className="w-5 h-5 rounded-full bg-[#F79E1B]/90 shadow-sm" />
          </div>
          <span className="text-[11px] font-bold text-white tracking-wider lowercase">
            mastercard
          </span>
        </div>
      </div>
    </motion.div>
  );
}
