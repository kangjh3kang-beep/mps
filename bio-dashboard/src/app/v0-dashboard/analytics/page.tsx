"use client";

import { V0Sidebar as Sidebar } from "@/components/dashboard/v0-sidebar";
import { V0Header as Header } from "@/components/dashboard/v0-header";
import { TrendingUp, TrendingDown, Activity, Brain, Heart, Zap, LucideIcon } from "lucide-react";
import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { InsightCard } from "@/components/analytics/insight-card";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar />

      <main className="pl-16 lg:pl-20 min-h-screen overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto p-4 lg:p-8 pb-24">
          <Header title="데이터 분석" subtitle="만파식 생태계가 수집하고 가공한 건강 인사이트" />

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            <SummaryCard icon={Heart} label="심장 건강" value="95" change={+3} />
            <SummaryCard icon={Brain} label="정신 건강" value="88" change={+5} />
            <SummaryCard icon={Activity} label="활동량" value="72" change={-2} />
            <SummaryCard icon={Zap} label="에너지" value="81" change={+8} />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 mb-6">
            <AnalyticsChart title="주간 활동 추이" type="activity" />
            <AnalyticsChart title="수면 패턴 분석" type="sleep" />
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
            <InsightCard
              title="수집된 데이터"
              description="이번 주 12,847개의 데이터 포인트가 수집되었습니다"
              icon="collect"
              value="12,847"
            />
            <InsightCard
              title="가공된 인사이트"
              description="AI가 847개의 건강 인사이트를 생성했습니다"
              icon="process"
              value="847"
            />
            <InsightCard
              title="확산된 권장사항"
              description="개인화된 15개의 건강 권장사항이 전달되었습니다"
              icon="expand"
              value="15"
            />
          </div>

          <footer className="mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-ink/6 text-center">
            <p className="text-responsive-xs text-muted-foreground">
              <span className="text-ink font-medium">만파식</span> · ManPaSik · MPS
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  change,
}: { icon: LucideIcon; label: string; value: string; change: number }) {
  const isPositive = change >= 0;
  return (
    <div className="hanji-card rounded-2xl p-4 lg:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-ink/5 flex items-center justify-center text-ink">
          <Icon className="w-4 h-4 lg:w-[18px] lg:h-[18px]" strokeWidth={1.5} />
        </div>
        <div
          className={`flex items-center gap-1 text-responsive-xs ${isPositive ? "text-dancheong-green" : "text-dancheong-red"}`}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>
            {isPositive ? "+" : ""}
            {change}%
          </span>
        </div>
      </div>
      <p className="text-responsive-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-responsive-2xl font-light text-foreground">
        {value}
        <span className="text-responsive-xs text-muted-foreground ml-1">점</span>
      </p>
    </div>
  );
}

