"use client";

import { useState } from "react";
import { Sidebar } from "@/components/databerry/Sidebar";
import { Header } from "@/components/databerry/Header";
import { UploadsCard } from "@/components/databerry/UploadsCard";
import { ProjectsCard } from "@/components/databerry/ProjectsCard";
import { MediaCard } from "@/components/databerry/MediaCard";
import { UrgentCard } from "@/components/databerry/UrgentCard";
import { WeatherCard } from "@/components/databerry/WeatherCard";
import { UpdatesSection } from "@/components/databerry/UpdatesSection";
import { CompletionGauge } from "@/components/databerry/CompletionGauge";
import { SavingsCard } from "@/components/databerry/SavingsCard";
import { DataberryNavId } from "@/components/databerry/types";

export default function DataberryDashboardPage() {
  const [activeNav, setActiveNav] = useState<DataberryNavId>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F1E7] py-4 sm:py-6 px-3 sm:px-6 lg:px-8 flex items-center justify-center font-sans antialiased text-[#292526]">
      {/* Centered Rounded App Shell */}
      <div className="w-full max-w-[1560px] bg-white rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-200/50 p-4 sm:p-5 lg:p-6 flex flex-col lg:flex-row gap-5 lg:gap-7 items-stretch">
        
        {/* Floating Indigo Left Sidebar */}
        <Sidebar
          activeNav={activeNav}
          onSelectNav={setActiveNav}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Area */}
        <main className="flex-1 flex flex-col min-w-0 justify-between py-2 sm:py-3 pr-0 sm:pr-2">
          <div>
            {/* Header */}
            <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

            {/* Bento Grid: Row 1 (Cards Grid 3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
              {/* Column 1: Latest Uploads Tall Peach Card */}
              <div className="h-full">
                <UploadsCard />
              </div>

              {/* Column 2: Open Projects + Media & Urgent Cards */}
              <div className="flex flex-col justify-between gap-5">
                <ProjectsCard />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MediaCard />
                  <UrgentCard />
                </div>
              </div>

              {/* Column 3: Weather Card with Architectural Night Photo */}
              <div className="h-full">
                <WeatherCard />
              </div>
            </div>

            {/* Bento Grid: Row 2 (Latest updates section) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch mt-6 pt-2">
              {/* Col 1: Latest Updates & Tabs */}
              <div className="rounded-[28px] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)] border border-slate-100/80 flex flex-col justify-between min-h-[220px]">
                <UpdatesSection />
              </div>

              {/* Col 2: Task Completion Rate Half-Ring Gauge */}
              <div className="h-full">
                <CompletionGauge />
              </div>

              {/* Col 3: Great Job You Saved Pink-Purple Gradient Card */}
              <div className="h-full">
                <SavingsCard />
              </div>
            </div>
          </div>

          {/* Footer inside canvas */}
          <footer className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#746B66] font-medium">
            <p>© 2026 databerry™ Studio. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <span className="hover:text-[#292526] cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-[#292526] cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-[#292526] cursor-pointer transition-colors">API Docs</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
