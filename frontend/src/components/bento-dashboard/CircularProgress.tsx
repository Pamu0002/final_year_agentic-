"use client";

import { motion } from "framer-motion";

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  sublabel?: string;
}

export function CircularProgress({
  percentage,
  size = 140,
  strokeWidth = 14,
  color = "#f97316", // vivid orange
  bgColor = "#f3f4f6", // light gray
  label,
  sublabel,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="rotate-[-90deg] transform"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bgColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
          />

          {/* Animated Value Arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-3xl font-extrabold tracking-tight text-slate-800"
          >
            {percentage}%
          </motion.span>
        </div>
      </div>

      {/* Optional Below Labels */}
      {(label || sublabel) && (
        <div className="mt-4 space-y-0.5">
          {label && (
            <p className="text-sm font-bold text-slate-800 tracking-tight">{label}</p>
          )}
          {sublabel && (
            <p className="text-xs font-medium text-slate-400">{sublabel}</p>
          )}
        </div>
      )}
    </div>
  );
}
