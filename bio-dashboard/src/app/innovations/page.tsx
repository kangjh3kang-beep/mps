"use client";

/**
 * Innovations Hub Page
 * 혁신 기능 허브 - 모든 혁신 기능 통합
 */

import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Leaf, 
  Watch, 
  Brain, 
  Cloud, 
  Database,
  CreditCard,
  Sparkles,
  ArrowRight,
  Star
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function InnovationsPage() {
  const innovations = [
    {
      id: 'food-safety',
      title: '식품 안전 카트리지',
      description: '과일, 채소의 농약 잔류 및 중금속을 검출합니다',
      icon: Leaf,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      status: 'new',
      href: '/innovations/food-safety',
    },
    {
      id: 'wearables',
      title: '웨어러블 퓨전',
      description: 'Apple Watch, Galaxy Watch와 실시간 연동',
      icon: Watch,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      status: 'new',
      href: '/innovations/wearables',
    },
    {
      id: 'stress-coach',
      title: 'AI 스트레스 코치',
      description: '학생용 시험 스트레스 관리 및 휴식 가이드',
      icon: Brain,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50',
      status: 'new',
      href: '/innovations/stress-coach',
    },
    {
      id: 'weather-health',
      title: '날씨-건강 AI',
      description: '미세먼지, 기압 변화와 건강 상관관계 분석',
      icon: Cloud,
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'from-cyan-50 to-blue-50',
      status: 'beta',
      href: '/settings', // Redirect to settings where WeatherHealthWidget exists
    },
    {
      id: 'research-hub',
      title: '연구 데이터 허브',
      description: '익명화된 건강 데이터셋 API 제공',
      icon: Database,
      color: 'from-slate-600 to-slate-800',
      bgColor: 'from-slate-50 to-gray-50',
      status: 'new',
      href: '/innovations/research-hub',
    },
    {
      id: 'payment',
      title: '결제 플랫폼',
      description: '구독, 포인트, 쿠폰 통합 결제 시스템',
      icon: CreditCard,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'from-amber-50 to-orange-50',
      status: 'stable',
      href: '/innovations/payment',
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-green-500">NEW</Badge>;
      case 'beta':
        return <Badge className="bg-blue-500">BETA</Badge>;
      case 'stable':
        return <Badge variant="secondary">STABLE</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">41-Persona Simulation에서 탄생</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            혁신 기능
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            41명의 가상 사용자 시뮬레이션을 통해 발견된 니즈를 바탕으로
            <br />개발된 차세대 기능들을 만나보세요
          </p>
        </motion.div>

        {/* Innovation Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {innovations.map((innovation) => {
            const Icon = innovation.icon;
            return (
              <motion.div key={innovation.id} variants={item}>
                <Link href={innovation.href}>
                  <Card className={`h-full cursor-pointer group hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${innovation.bgColor} border-0`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${innovation.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        {getStatusBadge(innovation.status)}
                      </div>
                      <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                        {innovation.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {innovation.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-primary font-medium">
                        자세히 보기
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-dashed">
            <CardContent className="py-8">
              <Star className="w-8 h-8 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-bold mb-2">더 많은 혁신이 준비 중입니다</h3>
              <p className="text-muted-foreground">
                Global Connect (16개 언어 실시간 번역), Manpasik Mate (AI 동반자),
                <br />그리고 더 많은 기능들이 곧 출시됩니다
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          <p>
            <span className="font-medium text-foreground">만파식</span> · ManPaSik —
            <span className="text-dancheong-red ml-1">모이고, 가공되어, 세계로 펼쳐지다</span>
          </p>
        </motion.footer>
      </div>
    </div>
  );
}




