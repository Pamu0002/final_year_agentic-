"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface StatGridProps {
  children: ReactNode;
}

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export function StatGrid({ children }: StatGridProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {children}
    </motion.div>
  );
}
