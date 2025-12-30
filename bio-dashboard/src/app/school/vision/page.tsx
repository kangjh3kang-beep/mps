"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronDown, Waves, Zap, Heart, Globe, Rocket, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The Hall of Origins - Parallax Storytelling Page
 * "The Legend of Manpasik (萬波息)"
 */

const chapters = [
  {
    id: "legend",
    title: "고대의 전설",
    titleEn: "The Ancient Legend",
    subtitle: "萬波息笛 - 만파식적",
    content: `천 년 전, 신라에는 신비로운 피리가 있었습니다.
    
    이 피리를 불면 거친 파도가 잠잠해지고,
    전염병이 물러가며,
    가뭄에는 비가 내렸습니다.
    
    사람들은 이 피리를 "만파식적(萬波息笛)"이라 불렀습니다.
    만 개의 파도를 잠재우는 피리라는 뜻입니다.`,
    icon: Waves,
    color: "from-indigo-500 to-purple-600",
    bgImage: "/images/school/legend-bg.jpg"
  },
  {
    id: "crisis",
    title: "현대의 거친 파도",
    titleEn: "The Modern Crisis",
    subtitle: "보이지 않는 위협들",
    content: `오늘날, 우리는 새로운 형태의 '거친 파도'에 직면해 있습니다.
    
    • 알 수 없는 바이러스와 변이체
    • 현대 사회의 스트레스와 피로
    • 환경 오염과 미세먼지
    • 우리 몸 안의 알 수 없는 독소들
    
    이 보이지 않는 파도들은 우리의 건강을 위협합니다.`,
    icon: Zap,
    color: "from-rose-500 to-orange-600",
    bgImage: "/images/school/crisis-bg.jpg"
  },
  {
    id: "solution",
    title: "현대의 만파식적",
    titleEn: "The Modern Solution",
    subtitle: "바이오-디지털 피리",
    content: `만파식(MPS)은 현대판 만파식적입니다.
    
    88차원의 바이오 센서가 당신 몸의 '파동'을 읽고,
    AI가 그 신호를 해석하여
    건강이라는 '평화'를 되찾아 줍니다.
    
    고대의 지혜 + 현대의 기술 = 만파식 솔루션`,
    icon: Heart,
    color: "from-emerald-500 to-teal-600",
    bgImage: "/images/school/solution-bg.jpg"
  },
  {
    id: "ecosystem",
    title: "생태계의 확장",
    titleEn: "Ecosystem Expansion",
    subtitle: "함께 만드는 미래",
    content: `만파식은 단순한 제품이 아닙니다.
    
    사용자, 의료진, 연구자가 함께
    데이터를 공유하고,
    지식을 축적하며,
    새로운 솔루션을 만들어가는 생태계입니다.
    
    당신도 이 여정의 일부가 되어주세요.`,
    icon: Globe,
    color: "from-sky-500 to-blue-600",
    bgImage: "/images/school/ecosystem-bg.jpg"
  },
  {
    id: "future",
    title: "미래를 향해",
    titleEn: "Towards the Future",
    subtitle: "무한한 가능성",
    content: `우리의 비전은 멈추지 않습니다.
    
    Phase 1: 당뇨 & 대사질환 (현재)
    Phase 2: 바이러스 & 전염병
    Phase 3: 환경 & 독성물질
    Phase 4: 우주 & 극한환경
    
    당신의 건강이 곧 우리의 목표입니다.`,
    icon: Rocket,
    color: "from-purple-500 to-pink-600",
    bgImage: "/images/school/future-bg.jpg"
  }
];

function ParallaxChapter({ 
  chapter, 
  index 
}: { 
  chapter: typeof chapters[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  return (
    <motion.section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center py-20 overflow-hidden"
      style={{ opacity }}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${chapter.color} opacity-20`} />
      
      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)
            }}
            animate={{ 
              y: [null, Math.random() * -200],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ 
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <motion.div 
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        style={{ y, scale }}
      >
        {/* Chapter Number */}
        <motion.div 
          className="text-8xl md:text-9xl font-bold text-white/5 absolute -top-16 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {String(index + 1).padStart(2, '0')}
        </motion.div>

        {/* Icon */}
        <motion.div 
          className={`w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br ${chapter.color} flex items-center justify-center shadow-2xl`}
          initial={{ scale: 0, rotate: -180 }}
          whileInView={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
        >
          <chapter.icon className="w-10 h-10 text-white" />
        </motion.div>

        {/* Subtitle */}
        <motion.p 
          className="text-white/50 text-sm tracking-widest uppercase mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {chapter.subtitle}
        </motion.p>

        {/* Title */}
        <motion.h2 
          className="text-4xl md:text-5xl font-bold text-white mb-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {chapter.title}
        </motion.h2>
        <motion.p 
          className="text-lg text-white/60 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {chapter.titleEn}
        </motion.p>

        {/* Content */}
        <motion.div 
          className="text-lg text-white/80 leading-relaxed whitespace-pre-line max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {chapter.content}
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

export default function VisionPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div ref={containerRef} className="relative">
      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-sky-500 to-emerald-500 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Navigation */}
      <div className="fixed top-4 left-4 z-50">
        <Button variant="glass" size="icon" asChild>
          <Link href="/school">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </Button>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900"
            animate={{ 
              background: [
                "linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #0f172a 100%)",
                "linear-gradient(135deg, #312e81 0%, #7c3aed 50%, #1e293b 100%)",
                "linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #0f172a 100%)"
              ]
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          
          {/* Stars */}
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            {/* Korean Hanja */}
            <motion.h1 
              className="text-8xl md:text-9xl font-bold mb-4"
              style={{ 
                fontFamily: "'Noto Serif KR', serif",
                background: "linear-gradient(135deg, #fcd34d, #f59e0b, #fcd34d)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
              animate={{ 
                textShadow: [
                  "0 0 20px rgba(252, 211, 77, 0.3)",
                  "0 0 40px rgba(252, 211, 77, 0.5)",
                  "0 0 20px rgba(252, 211, 77, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              萬波息
            </motion.h1>
            
            <motion.p 
              className="text-xl text-white/70 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              만 개의 파도를 잠재우다
            </motion.p>

            <motion.p 
              className="text-lg text-white/50 max-w-xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              스크롤하여 만파식의 이야기를 경험하세요
            </motion.p>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div 
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown className="w-8 h-8 text-white/50" />
          </motion.div>
        </div>
      </section>

      {/* Story Chapters */}
      {chapters.map((chapter, index) => (
        <ParallaxChapter key={chapter.id} chapter={chapter} index={index} />
      ))}

      {/* Call to Action */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div 
          className="text-center px-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Star className="w-16 h-16 mx-auto mb-8 text-amber-400" />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            당신의 이야기가 시작됩니다
          </h2>
          <p className="text-xl text-white/70 mb-10 max-w-xl mx-auto">
            만파식 생태계에 합류하여 
            건강이라는 평화를 함께 만들어가세요.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg"
              asChild
            >
              <Link href="/school/academy">
                학습 시작하기
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/">
                대시보드로 돌아가기
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}






