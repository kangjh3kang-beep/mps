"use client";

/**
 * ============================================================
 * MANPASIK WELCOME PAGE
 * 회원가입 완료 후 환영 화면
 * ============================================================
 */

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Sparkles, Gift, ChevronRight, Heart, Activity, Brain,
  Trophy, Rocket, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import confetti from "canvas-confetti";

// 온보딩 스텝
const ONBOARDING_STEPS = [
  {
    icon: Heart,
    title: "건강 프로필 설정",
    desc: "기본 건강 정보를 입력하고 맞춤 분석을 받아보세요",
    href: "/me",
    color: "text-rose-500 bg-rose-100 dark:bg-rose-900/30",
  },
  {
    icon: Activity,
    title: "첫 측정 시작",
    desc: "만파식 디바이스로 첫 번째 건강 측정을 해보세요",
    href: "/analyze",
    color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    icon: Brain,
    title: "AI 코치 만나기",
    desc: "개인 맞춤형 AI 건강 코치와 대화를 시작하세요",
    href: "/",
    color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  },
];

// 혜택
const BENEFITS = [
  { icon: "🎁", title: "1,000 MPS 포인트", desc: "즉시 지급 완료" },
  { icon: "📊", title: "무료 AI 분석 3회", desc: "30일간 유효" },
  { icon: "💊", title: "첫 상담 50% 할인", desc: "전문가 상담 쿠폰" },
];

export default function WelcomePage() {
  const { user, getLevelMeta } = useAuth();
  const levelMeta = getLevelMeta();

  // 축하 효과
  React.useEffect(() => {
    // confetti 효과
    if (typeof window !== 'undefined') {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* 환영 메시지 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-dancheong-red/20 to-dancheong-yellow/20 flex items-center justify-center"
          >
            <Sparkles className="w-10 h-10 text-dancheong-red" />
          </motion.div>

          <h1 className="text-3xl font-medium text-foreground mb-2">
            환영합니다, {user?.name || '회원'}님! 🎉
          </h1>
          <p className="text-muted-foreground">
            만파식 가족이 되신 것을 축하드립니다.<br />
            건강한 미래가 시작됩니다!
          </p>

          {levelMeta && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 rounded-full"
            >
              <span className="text-lg">{levelMeta.icon}</span>
              <span className="font-medium text-foreground">{levelMeta.nameKo}</span>
              <span className="text-sm text-muted-foreground">으로 시작합니다</span>
            </motion.div>
          )}
        </motion.div>

        {/* 가입 혜택 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="hanji-card rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-dancheong-red" />
            <h2 className="text-lg font-medium text-foreground">가입 축하 혜택</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {BENEFITS.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="text-center p-4 bg-hanji-warm rounded-xl"
              >
                <div className="text-2xl mb-2">{benefit.icon}</div>
                <p className="font-medium text-foreground text-sm">{benefit.title}</p>
                <p className="text-xs text-muted-foreground">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 온보딩 스텝 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="hanji-card rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-medium text-foreground">시작하기</h2>
          </div>
          <div className="space-y-3">
            {ONBOARDING_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <Link 
                  href={step.href}
                  className="flex items-center gap-4 p-4 rounded-xl bg-hanji-warm hover:bg-ink/5 transition-colors group"
                >
                  <div className={`p-3 rounded-xl ${step.color}`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground group-hover:text-dancheong-blue transition-colors">
                      {step.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button className="flex-1 h-12 ink-btn" asChild>
            <Link href="/">
              <Target className="w-4 h-4 mr-2" />
              대시보드로 이동
            </Link>
          </Button>
          <Button variant="outline" className="flex-1 h-12 hanji-card" asChild>
            <Link href="/school/tutorial">
              <Trophy className="w-4 h-4 mr-2" />
              튜토리얼 시작
            </Link>
          </Button>
        </motion.div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          도움이 필요하시면 언제든 AI 코치에게 물어보세요!
        </p>
      </div>
    </div>
  );
}


