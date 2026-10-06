"use client";

import { Plus, CloudSun } from "lucide-react";
import { motion } from "framer-motion";

export function WeatherCard() {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="relative flex flex-col justify-between rounded-[28px] overflow-hidden p-7 text-white shadow-md min-h-[380px]"
    >
      {/* Background Architectural Photo with Dark Blue Overlay */}
      <img
        src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80"
        alt="City architecture night"
        className="absolute inset-0 size-full object-cover object-center"
      />
      {/* Dark Blue / Indigo Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#342528]/80 via-[#521725]/85 to-[#0F172A]/95" />

      {/* Card Header Content */}
      <div className="relative z-10 space-y-1.5">
        <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans leading-tight">
          What&apos;s your plan ?
        </h2>
        <p className="text-xs font-medium text-white/80 flex items-center gap-1.5">
          <CloudSun className="size-4 text-amber-300" />
          Looks like a shady day
        </p>
      </div>

      {/* Temperature Display & Bottom Blob Action */}
      <div className="relative z-10 flex items-end justify-between pt-6">
        <div>
          <span className="text-6xl sm:text-7xl font-extralight tracking-tighter text-white font-sans">
            36°
          </span>
        </div>

        {/* White Rounded Blob Button with Blue Circular "+" Button */}
        <div className="flex items-center rounded-full bg-white/95 p-1.5 shadow-lg backdrop-blur-xs transition-transform duration-200 hover:scale-105">
          <button
            className="grid size-11 place-items-center rounded-full bg-[#3B82F6] text-white shadow-md shadow-blue-500/30 transition-transform active:scale-95"
            title="Create plan"
            aria-label="Create plan"
          >
            <Plus className="size-6 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
