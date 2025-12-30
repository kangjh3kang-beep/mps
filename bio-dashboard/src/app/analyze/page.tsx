"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Droplets,
  Wind,
  Microscope,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Clock,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppNavigationLayout } from "@/components/navigation/AppNavigation";

/* ============================================
 * Measurement Modes
 * ============================================ */

interface MeasurementMode {
  id: string;
  title: string;
  titleKo: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  estimatedTime: string;
}

const MEASUREMENT_MODES: MeasurementMode[] = [
  {
    id: "liquid",
    title: "Liquid Analysis",
    titleKo: "액체 분석",
    description: "혈액, 땀, 침 등 체액 바이오마커 측정",
    icon: Droplets,
    color: "text-blue-600",
    bgGradient: "from-blue-50 to-cyan-50",
    estimatedTime: "2분"
  },
  {
    id: "gas",
    title: "Gas Analysis",
    titleKo: "가스 분석",
    description: "호기 분석을 통한 대사 상태 확인",
    icon: Wind,
    color: "text-emerald-600",
    bgGradient: "from-emerald-50 to-teal-50",
    estimatedTime: "1분"
  },
  {
    id: "solid",
    title: "Solid Analysis",
    titleKo: "고체 분석",
    description: "음식물, 환경 샘플 분석",
    icon: Microscope,
    color: "text-amber-600",
    bgGradient: "from-amber-50 to-orange-50",
    estimatedTime: "3분"
  },
  {
    id: "nontarget",
    title: "Non-Target Analysis",
    titleKo: "비표적 분석",
    description: "AI 기반 미지 물질 탐지",
    icon: Sparkles,
    color: "text-violet-600",
    bgGradient: "from-violet-50 to-purple-50",
    estimatedTime: "5분"
  }
];

/* ============================================
 * Recent Measurement History
 * ============================================ */

interface RecentMeasurement {
  id: string;
  type: string;
  date: string;
  summary: string;
  status: "normal" | "warning" | "alert";
}

const RECENT_MEASUREMENTS: RecentMeasurement[] = [
  {
    id: "1",
    type: "혈당",
    date: "오늘 09:00",
    summary: "95 mg/dL - 정상 범위",
    status: "normal"
  },
  {
    id: "2",
    type: "젖산",
    date: "어제 18:30",
    summary: "2.1 mmol/L - 약간 높음",
    status: "warning"
  },
  {
    id: "3",
    type: "스트레스",
    date: "2일 전",
    summary: "코르티솔 정상",
    status: "normal"
  }
];

/* ============================================
 * Analyze Page Component
 * ============================================ */

export default function AnalyzePage() {
  return (
    <AppNavigationLayout>
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-6 h-6 text-emerald-500" />
                분석 랩
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                The Lab - 측정 및 데이터 분석
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1">
              <Clock className="w-4 h-4" />
              히스토리
            </Button>
          </header>

          {/* Quick Measure */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Card className="bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">빠른 측정</h2>
                    <p className="text-sm text-emerald-100">
                      마지막 측정: 혈당 (오늘 09:00)
                    </p>
                  </div>
                  <Button 
                    size="lg"
                    className="bg-white text-emerald-600 hover:bg-emerald-50"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    시작하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Measurement Modes */}
          <section>
            <h2 className="text-lg font-semibold mb-4">측정 모드 선택</h2>
            <div className="grid grid-cols-2 gap-3">
              {MEASUREMENT_MODES.map((mode, index) => (
                <motion.div
                  key={mode.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
                      `bg-gradient-to-br ${mode.bgGradient}`
                    )}
                  >
                    <CardContent className="p-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", mode.color, "bg-white/80")}>
                        <mode.icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-sm text-slate-900">{mode.titleKo}</h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{mode.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] text-slate-500">
                          ⏱️ {mode.estimatedTime}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Recent Measurements */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">최근 측정</h2>
              <Button variant="ghost" size="sm" className="text-xs">
                전체 보기 <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <Card>
              <CardContent className="p-0 divide-y divide-slate-100">
                {RECENT_MEASUREMENTS.map((measurement) => (
                  <div 
                    key={measurement.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        measurement.status === "normal" && "bg-emerald-500",
                        measurement.status === "warning" && "bg-amber-500",
                        measurement.status === "alert" && "bg-rose-500"
                      )} />
                      <div>
                        <div className="text-sm font-medium">{measurement.type}</div>
                        <div className="text-xs text-slate-500">{measurement.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-600">{measurement.summary}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Weekly Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                주간 트렌드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center text-sm text-muted-foreground bg-slate-50 rounded-lg">
                📈 트렌드 차트 영역
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppNavigationLayout>
  );
}
