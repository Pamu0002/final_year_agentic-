"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";

interface AdminShellProps {
  children: React.ReactNode;
  email: string;
  name: string | null;
}



export function AdminShell({ children, email, name }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/55 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-out md:relative md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <AdminSidebar />
        </div>

        {/* Main content area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminTopBar
            email={email}
            name={name}
            onMenuClick={() => setSidebarOpen(true)}
          />

          <main className="admin-workspace flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </MotionConfig>
  );
}
