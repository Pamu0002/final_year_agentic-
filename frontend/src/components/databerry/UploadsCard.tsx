"use client";

import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export function UploadsCard() {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="relative flex flex-col justify-between rounded-[28px] bg-[#FDF1EF] p-7 shadow-xs border border-[#fadcd6]/50 min-h-[380px] overflow-hidden"
    >
      {/* 3D Geometric Illustration (CSS/SVG) */}
      <div className="relative mx-auto w-full max-w-[210px] aspect-[4/3] flex items-center justify-center pt-2">
        <svg
          viewBox="0 0 200 160"
          className="w-full h-full drop-shadow-lg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Teal Base Backdrop Shape */}
          <rect x="25" y="20" width="150" height="115" rx="30" fill="#20B2AA" fillOpacity="0.85" />
          
          {/* Subtle Back Grid Glow */}
          <circle cx="150" cy="40" r="18" fill="#48D1CC" fillOpacity="0.4" />
          <circle cx="45" cy="115" r="12" fill="#E0F7FA" fillOpacity="0.5" />

          {/* Pink Cylinder */}
          <g transform="translate(45, 45)">
            {/* Cylinder Body */}
            <path d="M 0,20 L 0,65 A 24,10 0 0,0 48,65 L 48,20 Z" fill="#F472B6" />
            {/* Cylinder Top Ellipse */}
            <ellipse cx="24" cy="20" rx="24" ry="9" fill="#FB7185" />
            {/* Cylinder Bottom Shadow Ellipse */}
            <ellipse cx="24" cy="65" rx="24" ry="9" fill="#E11D48" fillOpacity="0.25" />
          </g>

          {/* Yellow 3D Blocks */}
          <g transform="translate(100, 60)">
            {/* Front Face */}
            <path d="M 10,25 L 45,25 L 45,60 L 10,60 Z" fill="#FBBF24" />
            {/* Top Face */}
            <path d="M 10,25 L 22,10 L 57,10 L 45,25 Z" fill="#FDE68A" />
            {/* Right Face */}
            <path d="M 45,25 L 57,10 L 57,45 L 45,60 Z" fill="#D97706" />
          </g>

          {/* Teal Cone / Wedge */}
          <g transform="translate(75, 75)">
            <path d="M 30,0 L 55,45 L 5,45 Z" fill="#0D9488" />
            <path d="M 30,0 L 55,45 L 30,45 Z" fill="#14B8A6" />
          </g>

          {/* White Sphere with Radial Shading */}
          <defs>
            <radialGradient id="sphereGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="68" r="16" fill="url(#sphereGrad)" />

          {/* Small Floating Accents */}
          <circle cx="140" cy="100" r="6" fill="#F59E0B" />
          <circle cx="55" cy="35" r="4.5" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Card Details & Action Button */}
      <div className="flex items-end justify-between pt-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-[#292526] font-sans">
            Latest uploads
          </h2>
          <p className="text-xs font-semibold text-[#746B66] mt-1">
            987 total files
          </p>
        </div>

        {/* Indigo Rounded-Square "+" Button */}
        <button
          className="grid size-12 place-items-center rounded-2xl bg-[#6B1E2E] text-white shadow-md shadow-[#6B1E2E]/25 transition-transform duration-200 hover:scale-110 active:scale-95"
          title="Upload new file"
          aria-label="Upload new file"
        >
          <Plus className="size-6 stroke-[2.5]" />
        </button>
      </div>
    </motion.div>
  );
}
