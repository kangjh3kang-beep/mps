"use client";

import { Sidebar } from "@/components/dashboard/v0-sidebar";
import { Header } from "@/components/dashboard/v0-header";
import { MpsEcosystem } from "@/components/dashboard/mps-ecosystem";
import { BioRhythmChart } from "@/components/dashboard/bio-rhythm-chart";
import { HongikScore } from "@/components/dashboard/hongik-score";
import { AiDoctor } from "@/components/dashboard/ai-doctor";
import { VitalCard } from "@/components/dashboard/vital-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { UpcomingSchedule } from "@/components/dashboard/upcoming-schedule";
import { Heart, Thermometer, Droplets, Wind, Activity, Brain } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar />

      <main className="pl-16 lg:pl-20 min-h-screen overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto p-4 lg:p-8 pb-24">
          <Header title="대시보드" subtitle="오늘의 건강 현황을 한눈에 확인하세요" />

          {/* Bento Grid - 가독성 강화된 레이아웃 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 auto-rows-min">
            
            {/* Row 1: MPS 생태계 + 홍익 점수 */}
            <div className="col-span-1">
              <MpsEcosystem />
            </div>
            <div className="col-span-1">
              <HongikScore score={87} trend="up" />
            </div>
            
            {/* AI 헬스 코치 - 2행 차지 */}
            <div className="row-span-2 col-span-2 lg:col-span-1">
              <AiDoctor />
            </div>

            {/* 바이오리듬 차트 - 2열 2행 */}
            <div className="col-span-2 row-span-2">
              <BioRhythmChart />
            </div>

            {/* 바이탈 카드 4개 */}
            <VitalCard 
              icon={Heart} 
              label="심박수" 
              value="72" 
              unit="bpm" 
              trend="stable" 
              status="normal" 
            />
            <VitalCard 
              icon={Thermometer} 
              label="체온" 
              value="36.5" 
              unit="°C" 
              trend="stable" 
              status="normal" 
            />
            <VitalCard 
              icon={Droplets} 
              label="혈중산소" 
              value="98" 
              unit="%" 
              trend="up" 
              status="normal" 
            />
            <VitalCard 
              icon={Wind} 
              label="호흡수" 
              value="16" 
              unit="/분" 
              trend="stable" 
              status="normal" 
            />

            {/* 빠른 실행 + 일정 */}
            <div className="col-span-1">
              <QuickActions />
            </div>
            <div className="col-span-2 lg:col-span-2">
              <UpcomingSchedule />
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-8 lg:mt-10 pt-6 border-t border-ink/8 text-center">
            <p className="text-responsive-xs text-muted-foreground">
              <span className="text-ink font-semibold">만파식</span> 
              <span className="mx-2 text-ink/30">·</span>
              <span className="text-ink-light">ManPaSik</span>
              <span className="mx-2 text-ink/30">·</span>
              <span className="text-ink-light">MPS</span>
              <span className="mx-3">—</span>
              <span className="text-dancheong-red font-medium">모이고, 가공되어, 세계로 펼쳐지다</span>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

