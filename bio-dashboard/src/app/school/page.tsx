"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Scroll, 
  Lightbulb, 
  Users, 
  BookOpen,
  Award,
  ChevronRight,
  Sparkles,
  Target,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Manpasik School - Main Landing Page
 * "From User to Creator" Philosophy
 */

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const schoolSections = [
  {
    id: "vision",
    title: "만파식의 전설",
    titleEn: "The Legend of Manpasik",
    description: "고대의 지혜에서 현대의 건강 솔루션까지",
    icon: Scroll,
    color: "from-purple-500 to-indigo-600",
    href: "/school/vision",
    badge: "Origin Story"
  },
  {
    id: "academy",
    title: "AI 인터랙티브 아카데미",
    titleEn: "AI Interactive Academy",
    description: "AI 튜터와 함께하는 맞춤형 학습",
    icon: GraduationCap,
    color: "from-sky-500 to-blue-600",
    href: "/school/academy",
    badge: "Learn-to-Earn"
  },
  {
    id: "agora",
    title: "아이디어 아고라",
    titleEn: "Idea Agora",
    description: "당신의 아이디어로 생태계를 진화시키세요",
    icon: Lightbulb,
    color: "from-amber-500 to-orange-600",
    href: "/school/agora",
    badge: "Collective Intelligence"
  },
  {
    id: "community",
    title: "커뮤니티 허브",
    titleEn: "Community Hub",
    description: "경험을 공유하고 함께 성장하세요",
    icon: Users,
    color: "from-emerald-500 to-teal-600",
    href: "/school/community",
    badge: "Social Learning"
  }
];

const stats = [
  { label: "활성 학습자", value: "12,847", suffix: "명" },
  { label: "완료된 튜토리얼", value: "89,432", suffix: "개" },
  { label: "제안된 아이디어", value: "2,156", suffix: "개" },
  { label: "채택된 기능", value: "47", suffix: "개" }
];

export default function SchoolPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center px-4">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl" />
        </div>
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />

        <motion.div 
          className="relative z-10 text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-white/90">From User to Creator</span>
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-sky-200 to-purple-200 bg-clip-text text-transparent">
              Manpasik School
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/70 mb-4">
            만파식적 생태계의 배움과 성장의 공간
          </p>
          <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto">
            Learn-to-Earn 시스템으로 학습하고, 아이디어를 제안하여 생태계를 함께 발전시키세요.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30"
              asChild
            >
              <Link href="/school/academy">
                <BookOpen className="w-5 h-5 mr-2" />
                학습 시작하기
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/school/vision">
                <Scroll className="w-5 h-5 mr-2" />
                만파식의 전설 보기
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <motion.div 
          className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6"
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10"
            >
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                {stat.value}
                <span className="text-lg text-white/50">{stat.suffix}</span>
              </div>
              <div className="text-sm text-white/60">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Sections Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              학습과 성장의 여정
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              만파식 생태계에서 당신의 역할을 찾고, 커뮤니티와 함께 성장하세요.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 gap-6"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {schoolSections.map((section, index) => (
              <motion.div key={section.id} variants={fadeInUp}>
                <Link href={section.href}>
                  <Card 
                    className="group relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  >
                    {/* Gradient Overlay */}
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity",
                      `bg-gradient-to-br ${section.color}`
                    )} />
                    
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg",
                          `bg-gradient-to-br ${section.color}`
                        )}>
                          <section.icon className="w-7 h-7" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {section.title}
                            </h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                              {section.badge}
                            </span>
                          </div>
                          <p className="text-sm text-white/50 mb-1">
                            {section.titleEn}
                          </p>
                          <p className="text-sm text-white/70">
                            {section.description}
                          </p>
                        </div>
                        
                        {/* Arrow */}
                        <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Learn-to-Earn Banner */}
      <section className="py-20 px-4">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 p-8 md:p-12 border border-amber-500/30">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/30 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/30 rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm mb-4">
                  <Award className="w-4 h-4" />
                  Learn-to-Earn
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  배우면서 보상받으세요
                </h3>
                <p className="text-white/70 mb-6">
                  튜토리얼 완료, 퀴즈 통과, 커뮤니티 기여로 MPS 포인트를 획득하세요.
                  포인트로 프리미엄 기능, 카트리지 할인, 특별 배지를 얻을 수 있습니다.
                </p>
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                  asChild
                >
                  <Link href="/school/academy">
                    <Target className="w-4 h-4 mr-2" />
                    첫 번째 포인트 획득하기
                  </Link>
                </Button>
              </div>
              
              <div className="flex-shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/50">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white">+100</div>
                    <div className="text-sm text-white/80">MPS</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="ghost" className="text-white/60 hover:text-white" asChild>
              <Link href="/school/faq">자주 묻는 질문</Link>
            </Button>
            <Button variant="ghost" className="text-white/60 hover:text-white" asChild>
              <Link href="/school/roadmap">로드맵</Link>
            </Button>
            <Button variant="ghost" className="text-white/60 hover:text-white" asChild>
              <Link href="/school/badges">배지 컬렉션</Link>
            </Button>
            <Button variant="ghost" className="text-white/60 hover:text-white" asChild>
              <Link href="/school/leaderboard">리더보드</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}






