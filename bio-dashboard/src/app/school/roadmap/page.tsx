"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ChevronLeft, 
  Rocket, 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  Zap,
  Globe,
  Microscope,
  Satellite,
  Heart,
  Shield,
  Leaf,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Ecosystem Roadmap Visualization
 * Interactive timeline showing expansion phases
 */

interface RoadmapPhase {
  id: string;
  phase: number;
  title: string;
  titleEn: string;
  description: string;
  status: "completed" | "active" | "upcoming";
  startDate: string;
  endDate?: string;
  icon: React.ElementType;
  color: string;
  targets: string[];
  milestones: Array<{
    title: string;
    isCompleted: boolean;
  }>;
}

const roadmapPhases: RoadmapPhase[] = [
  {
    id: "phase-1",
    phase: 1,
    title: "당뇨 & 대사질환",
    titleEn: "Diabetes & Metabolic",
    description: "젖산, 포도당, 케톤 등 대사 관련 바이오마커 측정",
    status: "active",
    startDate: "2024 Q1",
    endDate: "2024 Q4",
    icon: Heart,
    color: "from-rose-500 to-pink-600",
    targets: ["젖산 (Lactate)", "포도당 (Glucose)", "케톤 (Ketone)", "pH"],
    milestones: [
      { title: "젖산 센서 출시", isCompleted: true },
      { title: "포도당 센서 베타", isCompleted: true },
      { title: "다중 바이오마커 통합", isCompleted: false },
      { title: "의료기기 인증", isCompleted: false }
    ]
  },
  {
    id: "phase-2",
    phase: 2,
    title: "바이러스 & 전염병",
    titleEn: "Virus & Infectious Disease",
    description: "호흡기 바이러스, 세균 감염 등 조기 탐지",
    status: "upcoming",
    startDate: "2025 Q1",
    endDate: "2025 Q4",
    icon: Shield,
    color: "from-blue-500 to-indigo-600",
    targets: ["COVID-19", "인플루엔자", "RSV", "세균 감염 마커"],
    milestones: [
      { title: "바이러스 검출 프로토타입", isCompleted: false },
      { title: "임상 시험", isCompleted: false },
      { title: "긴급 사용 승인", isCompleted: false },
      { title: "글로벌 출시", isCompleted: false }
    ]
  },
  {
    id: "phase-3",
    phase: 3,
    title: "환경 & 독성물질",
    titleEn: "Environment & Toxins",
    description: "미세먼지, 중금속, 환경호르몬 등 노출 분석",
    status: "upcoming",
    startDate: "2026 Q1",
    endDate: "2026 Q4",
    icon: Leaf,
    color: "from-emerald-500 to-teal-600",
    targets: ["미세먼지 노출", "납/수은", "BPA", "농약 잔류"],
    milestones: [
      { title: "환경 센서 R&D", isCompleted: false },
      { title: "중금속 검출 기술", isCompleted: false },
      { title: "휴대용 디바이스", isCompleted: false },
      { title: "스마트시티 연동", isCompleted: false }
    ]
  },
  {
    id: "phase-4",
    phase: 4,
    title: "우주 & 극한환경",
    titleEn: "Space & Extreme Environment",
    description: "우주 비행사, 극지 탐험가 등 극한 환경 건강 모니터링",
    status: "upcoming",
    startDate: "2027 Q1",
    icon: Satellite,
    color: "from-purple-500 to-violet-600",
    targets: ["우주 방사선", "무중력 스트레스", "극저온 노출", "고도 적응"],
    milestones: [
      { title: "NASA/ESA 협력", isCompleted: false },
      { title: "ISS 시범 운영", isCompleted: false },
      { title: "달 기지 배치", isCompleted: false },
      { title: "화성 탐사 준비", isCompleted: false }
    ]
  }
];

function PhaseCard({ phase, index }: { phase: RoadmapPhase; index: number }) {
  const [isExpanded, setIsExpanded] = useState(phase.status === "active");
  const StatusIcon = phase.status === "completed" ? CheckCircle2 : Circle;
  const completedMilestones = phase.milestones.filter(m => m.isCompleted).length;
  const progress = (completedMilestones / phase.milestones.length) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="relative"
    >
      {/* Timeline connector */}
      {index < roadmapPhases.length - 1 && (
        <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full h-16 w-0.5 bg-gradient-to-b from-white/30 to-transparent" />
      )}
      
      <Card 
        className={cn(
          "border-white/10 backdrop-blur-md overflow-hidden cursor-pointer transition-all duration-300",
          phase.status === "active" && "border-2 border-sky-500/50 bg-sky-500/10",
          phase.status === "completed" && "bg-emerald-500/10",
          phase.status === "upcoming" && "bg-white/5 opacity-70"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            {/* Phase Icon */}
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0",
              `bg-gradient-to-br ${phase.color}`
            )}>
              <phase.icon className="w-8 h-8 text-white" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  phase.status === "active" && "bg-sky-500/30 text-sky-300",
                  phase.status === "completed" && "bg-emerald-500/30 text-emerald-300",
                  phase.status === "upcoming" && "bg-white/20 text-white/60"
                )}>
                  Phase {phase.phase}
                </span>
                <span className="text-xs text-white/50">{phase.startDate}</span>
                {phase.endDate && (
                  <>
                    <ArrowRight className="w-3 h-3 text-white/30" />
                    <span className="text-xs text-white/50">{phase.endDate}</span>
                  </>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-1">{phase.title}</h3>
              <p className="text-sm text-white/50 mb-1">{phase.titleEn}</p>
              <p className="text-sm text-white/70">{phase.description}</p>
            </div>
            
            {/* Status Indicator */}
            <div className="flex-shrink-0">
              <StatusIcon className={cn(
                "w-6 h-6",
                phase.status === "active" && "text-sky-400 animate-pulse",
                phase.status === "completed" && "text-emerald-400 fill-emerald-400",
                phase.status === "upcoming" && "text-white/30"
              )} />
            </div>
          </div>
          
          {/* Expanded Content */}
          <motion.div
            initial={false}
            animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-6 border-t border-white/10">
              {/* Target Analytes */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-white/70 mb-3">측정 대상</h4>
                <div className="flex flex-wrap gap-2">
                  {phase.targets.map((target, i) => (
                    <span 
                      key={i}
                      className={cn(
                        "text-xs px-3 py-1 rounded-full",
                        `bg-gradient-to-r ${phase.color} text-white`
                      )}
                    >
                      {target}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Milestones */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-white/70">마일스톤</h4>
                  <span className="text-xs text-white/50">
                    {completedMilestones}/{phase.milestones.length}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 bg-white/10 rounded-full mb-4 overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", `bg-gradient-to-r ${phase.color}`)}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
                
                {/* Milestone List */}
                <div className="space-y-2">
                  {phase.milestones.map((milestone, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {milestone.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-white/30 flex-shrink-0" />
                      )}
                      <span className={cn(
                        "text-sm",
                        milestone.isCompleted ? "text-white/90" : "text-white/50"
                      )}>
                        {milestone.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="glass" size="icon" asChild>
              <Link href="/school">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">생태계 로드맵</h1>
              <p className="text-sm text-white/50">Ecosystem Roadmap</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.section 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 mb-6">
            <Rocket className="w-4 h-4" />
            <span className="text-sm">끊임없이 확장하는 비전</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            만파식의 여정
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            당뇨 관리에서 시작하여 우주 건강까지, 
            만파식은 인류의 건강을 위한 여정을 멈추지 않습니다.
          </p>
        </motion.section>

        {/* Timeline */}
        <section className="space-y-8">
          {roadmapPhases.map((phase, index) => (
            <PhaseCard key={phase.id} phase={phase} index={index} />
          ))}
        </section>

        {/* Future Vision */}
        <motion.section 
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-500/20 via-sky-500/20 to-emerald-500/20 border border-white/10">
            <Sun className="w-12 h-12 mx-auto text-amber-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">
              그리고 그 너머로...
            </h3>
            <p className="text-white/70 max-w-xl mx-auto mb-6">
              당신의 아이디어가 다음 Phase를 결정할 수 있습니다.
              아이디어 아고라에서 제안해주세요!
            </p>
            <Button 
              className="bg-gradient-to-r from-amber-500 to-orange-600"
              asChild
            >
              <Link href="/school/agora">
                아이디어 제안하기
              </Link>
            </Button>
          </div>
        </motion.section>
      </main>
    </div>
  );
}






