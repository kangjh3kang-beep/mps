"use client";

import { V0Sidebar as Sidebar } from "@/components/dashboard/v0-sidebar";
import { V0Header as Header } from "@/components/dashboard/v0-header";
import { MpsEcosystem } from "@/components/dashboard/mps-ecosystem";
import { BioRhythmChart } from "@/components/dashboard/bio-rhythm-chart";
import { HongikScore } from "@/components/dashboard/hongik-score";
import { AiDoctor } from "@/components/dashboard/ai-doctor";
import { VitalCard } from "@/components/dashboard/vital-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { UpcomingSchedule } from "@/components/dashboard/upcoming-schedule";
import { Heart, Thermometer, Droplets, Wind } from "lucide-react";

export default function V0Dashboard() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar />

      <main className="pl-16 lg:pl-20 min-h-screen overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto p-4 lg:p-8 pb-24">
          <Header />

          {/* Bento Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 auto-rows-min">
            {/* Row 1: Ecosystem + Score + AI */}
            <MpsEcosystem />
            <HongikScore />
            <div className="row-span-2 col-span-2 lg:col-span-1">
              <AiDoctor />
            </div>

            {/* Row 2: Bio-Rhythm Chart */}
            <div className="col-span-2 row-span-2">
              <BioRhythmChart />
            </div>

            {/* Vital Cards */}
            <VitalCard icon={Heart} label="심박수" value="72" unit="bpm" trend="stable" status="normal" />
            <VitalCard icon={Thermometer} label="체온" value="36.5" unit="°C" trend="stable" status="normal" />
            <VitalCard icon={Droplets} label="혈중산소" value="98" unit="%" trend="up" status="normal" />
            <VitalCard icon={Wind} label="호흡수" value="16" unit="/분" trend="stable" status="normal" />

            {/* Row 4: Quick Actions + Schedule */}
            <QuickActions />
            <div className="col-span-2 lg:col-span-2">
              <UpcomingSchedule />
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-ink/6 text-center">
            <p className="text-responsive-xs text-muted-foreground">
              <span className="text-ink font-medium">만파식</span> · ManPaSik · MPS —
              <span className="text-dancheong-red ml-1">모이고, 가공되어, 세계로 펼쳐지다</span>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
