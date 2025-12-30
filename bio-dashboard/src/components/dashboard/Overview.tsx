"use client";

import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { MpsEcosystem } from "@/components/dashboard/mps-ecosystem"
import { BioRhythmChart } from "@/components/dashboard/bio-rhythm-chart"
import { HongikScore } from "@/components/dashboard/hongik-score"
import { AiDoctor } from "@/components/dashboard/ai-doctor"
import { VitalCard } from "@/components/dashboard/vital-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { UpcomingSchedule } from "@/components/dashboard/upcoming-schedule"
import { Heart, Thermometer, Droplets, Wind } from "lucide-react"
import { ManpasikFooter } from "@/components/ui/manpasik-footer"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="pl-20">
        <div className="max-w-7xl mx-auto p-8">
          <Header />

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-4 gap-4 auto-rows-min">
            <MpsEcosystem />
            <HongikScore />
            <div className="row-span-2">
              <AiDoctor />
            </div>

            {/* Row 2: Bio-Rhythm Chart */}
            <div className="col-span-2 row-span-2">
              <BioRhythmChart />
            </div>

            {/* Vital Cards */}
            <VitalCard icon={Heart} label="Heart Rate" value="72" unit="bpm" trend="stable" status="normal" />

            {/* Row 3: More Vitals + Quick Actions + Schedule */}
            <VitalCard icon={Thermometer} label="Temperature" value="36.5" unit="°C" trend="stable" status="normal" />
            <VitalCard icon={Droplets} label="Blood O2" value="98" unit="%" trend="up" status="normal" />
            <VitalCard icon={Wind} label="Resp. Rate" value="16" unit="/min" trend="stable" status="normal" />

            {/* Row 4: Quick Actions + Schedule */}
            <QuickActions />
            <div className="col-span-2">
              <UpcomingSchedule />
            </div>
          </div>

          <ManpasikFooter />
        </div>
      </main>
    </div>
  )
}



