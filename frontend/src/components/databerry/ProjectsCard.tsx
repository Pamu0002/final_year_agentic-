"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function ProjectsCard() {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="flex items-center justify-between gap-4 rounded-[28px] bg-[#F1E9DD] p-7 shadow-xs border border-slate-200/50"
    >
      <div className="space-y-1.5 min-w-0">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#746B66]">
          PRIORITY: REGULAR
        </span>
        <h2 className="text-xl font-extrabold tracking-tight text-[#292526] font-sans">
          Open projects
        </h2>
        <p className="text-xs font-semibold text-[#746B66]">
          30 tasks remaining
        </p>
        <div className="pt-2">
          <a
            href="#tasks"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#6B1E2E] hover:underline"
          >
            Complete tasks <ArrowRight className="size-3.5 stroke-[2.5]" />
          </a>
        </div>
      </div>

      {/* Blue Folder with Green Curved Arrow SVG */}
      <div className="shrink-0">
        <svg
          width="76"
          height="64"
          viewBox="0 0 76 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          {/* Back Folder Flap */}
          <path
            d="M 6,12 L 28,12 L 34,20 L 70,20 A 6,6 0 0,1 76,26 L 76,54 A 6,6 0 0,1 70,60 L 6,60 A 6,6 0 0,1 0,54 L 0,18 A 6,6 0 0,1 6,12 Z"
            fill="#3B82F6"
          />
          {/* Front Folder Pocket */}
          <path
            d="M 4,24 L 72,24 A 4,4 0 0,1 76,28 L 72,56 A 6,6 0 0,1 66,61 L 10,61 A 6,6 0 0,1 4,56 Z"
            fill="#60A5FA"
          />
          {/* Green Curved Sync Arrow */}
          <path
            d="M 52,42 C 52,32 40,28 32,34 M 32,34 L 38,30 M 32,34 L 33,40"
            stroke="#22C55E"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </motion.div>
  );
}
