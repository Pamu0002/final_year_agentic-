// UI-only redesign: Restyled shell layout with Framer Motion drawer transitions
"use client";

import { useState } from "react";
import { PortalSidebar } from "./PortalSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { motion, AnimatePresence } from "framer-motion";

interface PortalShellProps {
  children: React.ReactNode;
  email: string;
  name: string | null;
}

export function PortalShell({ children, email, name }: PortalShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground antialiased selection:bg-primary/15 selection:text-primary">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-72 md:hidden"
          >
            <PortalSidebar onMobileItemClick={() => setSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:relative md:flex md:shrink-0">
        <PortalSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <AdminTopBar
          email={email}
          name={name}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="portal-workspace flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/30">
          {children}
        </main>
      </div>
    </div>
  );
}
