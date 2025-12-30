"use client";

/**
 * ============================================================
 * MANPASIK MODE SELECTION PAGE
 * v0 디자인 적용 - 화선지/먹물/단청 테마
 * ============================================================
 */

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Smartphone, 
  Monitor, 
  Cpu, 
  ArrowRight,
  Activity,
  Users,
  Zap,
  Shield,
  Crown,
  Lock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { MemberLevel, getLevelMeta, canAccessProMode } from "@/lib/auth/permissions";

/* ============================================
 * Mode Options Configuration
 * ============================================ */

interface ModeOption {
  id: string;
  path: string;
  name: string;
  nameKo: string;
  description: string;
  icon: React.ReactNode;
  resolution: string;
  features: string[];
  recommended?: string;
  color: string;
  bgColor: string;
  requiresAuth?: boolean;
  minLevel?: MemberLevel;
}

const MODES: ModeOption[] = [
  {
    id: "reader",
    path: "/mode/reader",
    name: "Reader Mode",
    nameKo: "리더 모드",
    description: "임베디드 디바이스용 간소화된 인터페이스",
    icon: <Cpu className="w-7 h-7" />,
    resolution: "480×320",
    features: ["측정", "결과 확인", "긴급 호출"],
    recommended: "측정 장치",
    color: "text-slate-600",
    bgColor: "bg-slate-100 dark:bg-slate-800"
  },
  {
    id: "mobile",
    path: "/",
    name: "Smartphone Mode",
    nameKo: "스마트폰 모드",
    description: "풀 기능 소비자 앱 경험",
    icon: <Smartphone className="w-7 h-7" />,
    resolution: "모바일 최적화",
    features: ["AI 코치", "쇼핑몰", "원격 진료", "분석"],
    recommended: "일반 사용자",
    color: "text-dancheong-blue",
    bgColor: "bg-dancheong-blue/10"
  },
  {
    id: "pro",
    path: "/mode/pro",
    name: "Pro Mode",
    nameKo: "프로 모드",
    description: "검증된 전문가 전용 고급 분석 도구",
    icon: <Monitor className="w-7 h-7" />,
    resolution: "데스크톱 와이드스크린",
    features: ["실시간 신호", "장기 추세", "병원 기록", "다중 환자"],
    recommended: "의사 / 연구원",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    requiresAuth: true,
    minLevel: MemberLevel.EXPERT
  }
];

export default function ModeSelectionPage() {
  const { user, canAccessProMode: checkProAccess } = useAuth();
  const userLevel = user?.level || MemberLevel.GUEST;
  const levelMeta = user ? getLevelMeta(userLevel) : null;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden overflow-y-auto">
      {/* Header */}
      <header className="text-center py-10 lg:py-14 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dancheong-red to-dancheong-red/80 flex items-center justify-center text-hanji font-medium text-xl shadow-md">
            M
          </div>
          <h1 className="text-3xl font-semibold text-foreground brush-underline">만파식</h1>
        </motion.div>
        <p className="text-muted-foreground max-w-md mx-auto">
          사용 환경에 맞는 인터페이스를 선택하세요
        </p>
        
        {/* User Level Badge */}
        {user && levelMeta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 hanji-card rounded-full"
          >
            <span className="text-lg">{levelMeta.icon}</span>
            <span className="text-sm font-medium text-foreground">{levelMeta.nameKo}</span>
            <span className="text-xs text-muted-foreground">등급</span>
          </motion.div>
        )}
      </header>
      
      {/* Mode Cards */}
      <main className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
          {MODES.map((mode, i) => {
            const isLocked = mode.minLevel !== undefined && userLevel < mode.minLevel;
            const canAccess = !isLocked || (mode.id === "pro" && checkProAccess());
            
            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={canAccess ? mode.path : "/auth/signin"}>
                  <div className={cn(
                    "group h-full hanji-card rounded-2xl overflow-hidden transition-all duration-300",
                    "hover:shadow-lg hover:scale-[1.02]",
                    isLocked && "opacity-70"
                  )}>
                    <CardHeader className="pb-3">
                      {/* Icon with colored background */}
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center mb-3",
                        mode.bgColor,
                        mode.color
                      )}>
                        {mode.icon}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-foreground text-lg">{mode.nameKo}</CardTitle>
                        <Badge variant="outline" className="text-xs border-ink/20 text-muted-foreground">
                          {mode.resolution}
                        </Badge>
                        {mode.requiresAuth && (
                          <Badge className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                            <Crown className="w-3 h-3 mr-1" />
                            전문가
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-muted-foreground text-sm">
                        {mode.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Features */}
                      <div className="space-y-1.5">
                        {mode.features.map((feature, j) => (
                          <div key={j} className="flex items-center gap-2 text-sm text-foreground/80">
                            <Zap className="w-3 h-3 text-dancheong-yellow" />
                            {feature}
                          </div>
                        ))}
                      </div>
                      
                      {/* Recommended For */}
                      {mode.recommended && (
                        <div className="flex items-center gap-2 pt-3 border-t border-ink/8">
                          <Users className="w-4 h-4 text-dancheong-blue" />
                          <span className="text-xs text-muted-foreground">
                            추천: {mode.recommended}
                          </span>
                        </div>
                      )}
                      
                      {/* Enter Button or Lock */}
                      <div className="flex items-center justify-between pt-2">
                        {isLocked && !canAccess ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Lock className="w-4 h-4" />
                            <span className="text-xs">
                              {getLevelMeta(mode.minLevel!).nameKo} 이상 필요
                            </span>
                          </div>
                        ) : (
                          <div className="flex-1" />
                        )}
                        <div className={cn(
                          "flex items-center transition-colors",
                          canAccess 
                            ? "text-dancheong-blue group-hover:text-dancheong-red" 
                            : "text-muted-foreground"
                        )}>
                          <span className="text-sm mr-1">입장</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
        
        {/* Login Prompt for Guests */}
        {!user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 hanji-card rounded-2xl p-6 text-center"
          >
            <Shield className="w-10 h-10 mx-auto text-dancheong-blue mb-3" />
            <h3 className="font-medium text-foreground mb-2">프로 모드를 사용하려면?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              전문가 인증을 완료하면 고급 분석 도구에 접근할 수 있습니다.
            </p>
            <div className="flex justify-center gap-3">
              <Link 
                href="/auth/signin" 
                className="px-4 py-2 ink-btn rounded-xl text-sm"
              >
                로그인
              </Link>
              <Link 
                href="/auth/signup" 
                className="px-4 py-2 hanji-card rounded-xl text-sm hover:bg-ink/5 transition-colors"
              >
                회원가입
              </Link>
            </div>
          </motion.div>
        )}
        
        {/* Tip Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-10 text-muted-foreground text-sm"
        >
          <p>💡 팁: 메인 페이지(/)에서는 화면 크기에 따라 자동으로 적절한 모드가 선택됩니다</p>
        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="py-8 text-center border-t border-ink/8">
        <p className="text-responsive-xs text-muted-foreground">
          <span className="text-ink font-medium">만파식</span> · ManPaSik · MPS —
          <span className="text-dancheong-red ml-1">모이고, 가공되어, 나만의 세계로 펼쳐지다</span>
        </p>
      </footer>
    </div>
  );
}
