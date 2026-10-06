"use client";

import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export type BentoCardVariant =
  | "white"
  | "peach"
  | "lavender"
  | "mint"
  | "dark-indigo"
  | "navy-photo"
  | "gradient-pink-purple";

interface BentoCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  variant?: BentoCardVariant;
  className?: string;
  enableHoverLift?: boolean;
}

const VARIANT_STYLES: Record<BentoCardVariant, string> = {
  white:
    "bg-white text-slate-800 shadow-sm border border-slate-100 hover:shadow-md",
  peach:
    "bg-[#fff3eb] text-slate-800 shadow-sm border border-[#ffe4d4]/60 hover:shadow-md",
  lavender:
    "bg-[#F0E6D6] text-slate-800 shadow-sm border border-[#E7D8C5]/60 hover:shadow-md",
  mint:
    "bg-[#eefbf3] text-slate-800 shadow-sm border border-[#d3f5df]/60 hover:shadow-md",
  "dark-indigo":
    "bg-[#342528] text-white shadow-sm border border-[#522231] hover:shadow-md",
  "navy-photo":
    "bg-[#15193a] text-white shadow-md border border-[#232959] relative overflow-hidden",
  "gradient-pink-purple":
    "bg-gradient-to-br from-[#f43f8e] via-[#c026d3] to-[#8F6A3D] text-white shadow-md hover:shadow-lg",
};

export function BentoCard({
  children,
  variant = "white",
  className,
  enableHoverLift = true,
  ...props
}: BentoCardProps) {
  return (
    <motion.div
      whileHover={
        enableHoverLift
          ? {
              y: -4,
              transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
            }
          : undefined
      }
      className={cn(
        "relative rounded-3xl p-6 sm:p-7 transition-all duration-300",
        VARIANT_STYLES[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
