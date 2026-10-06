"use client";

import { motion } from "framer-motion";

export function CompletionGauge() {
  const percentage = 89;
  const radius = 68;
  const strokeWidth = 14;
  // Arc calculation for semi-circle / curved gauge (bottom half arc)
  // Circumference for 200 degree arc
  const arcLength = Math.PI * radius; // 180 degree half-ring
  const strokeDashoffset = arcLength - (arcLength * percentage) / 100;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-[28px] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)] border border-slate-100/80 flex flex-col items-center justify-between min-h-[220px] relative overflow-hidden"
    >
      <div className="w-full flex justify-between items-center text-xs font-semibold text-[#746B66] uppercase tracking-wider">
        <span>Performance</span>
        <span className="w-2 h-2 rounded-full bg-[#B08D57]" />
      </div>

      {/* Main Circular Gauge Display */}
      <div className="relative flex flex-col items-center justify-center my-auto py-2">
        {/* SVG Arc Gauge */}
        <div className="relative w-44 h-28 flex items-end justify-center overflow-hidden">
          <svg className="w-44 h-44 -rotate-90 transform origin-center" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B08D57" />
                <stop offset="100%" stopColor="#FF6B1A" />
              </linearGradient>
            </defs>
            {/* Background track (semi-circle) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#F7F1E7"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${arcLength} ${arcLength}`}
              strokeLinecap="round"
            />
            {/* Animated Progress Arc */}
            <motion.circle
              cx="80"
              cy="80"
              r={radius}
              stroke="url(#gaugeGradient)"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${arcLength} ${arcLength}`}
              strokeLinecap="round"
              initial={{ strokeDashoffset: arcLength }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            />
          </svg>

          {/* Centered Percentage Number */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 pointer-events-none">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl font-light tracking-tight text-[#292526] leading-none"
            >
              89<span className="text-3xl font-light text-[#746B66]">%</span>
            </motion.span>
          </div>
        </div>

        <p className="text-sm font-medium text-[#746B66] mt-3">Task completion rate</p>
      </div>

      <div className="w-full flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50/80 py-1.5 px-3 rounded-full">
        <span>↑ 14% from last week</span>
      </div>
    </motion.div>
  );
}
