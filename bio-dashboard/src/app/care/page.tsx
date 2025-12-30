"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Stethoscope,
  ShoppingBag,
  Pill,
  Video,
  Calendar,
  Star,
  Globe,
  ChevronRight,
  Clock,
  BadgeCheck,
  Heart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AppNavigationLayout } from "@/components/navigation/AppNavigation";

/* ============================================
 * Featured Doctors
 * ============================================ */

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  available: boolean;
  image?: string;
  languages: string[];
  nextSlot: string;
}

const FEATURED_DOCTORS: Doctor[] = [
  {
    id: "1",
    name: "김영희 원장",
    specialty: "내분비내과",
    rating: 4.9,
    available: true,
    languages: ["한국어", "English"],
    nextSlot: "오늘 14:30"
  },
  {
    id: "2",
    name: "Dr. Sarah Chen",
    specialty: "영양학",
    rating: 4.8,
    available: true,
    languages: ["English", "中文"],
    nextSlot: "내일 10:00"
  },
  {
    id: "3",
    name: "박민수 원장",
    specialty: "스포츠의학",
    rating: 4.7,
    available: false,
    languages: ["한국어"],
    nextSlot: "화요일"
  }
];

/* ============================================
 * Featured Products
 * ============================================ */

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  recommended: boolean;
  image?: string;
}

const FEATURED_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "고흡수 킬레이트 아연",
    category: "미네랄",
    price: 29000,
    rating: 4.8,
    recommended: true
  },
  {
    id: "2",
    name: "오메가-3 EPA/DHA",
    category: "필수지방산",
    price: 45000,
    rating: 4.9,
    recommended: true
  },
  {
    id: "3",
    name: "프로바이오틱스 50억",
    category: "장 건강",
    price: 35000,
    rating: 4.7,
    recommended: false
  }
];

/* ============================================
 * Care Page Component
 * ============================================ */

export default function CarePage() {
  const [activeTab, setActiveTab] = React.useState<"doctors" | "mall" | "pharmacy">("doctors");

  return (
    <AppNavigationLayout>
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <header>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-rose-500" />
              케어 센터
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Hospital & Mall - 진료 및 건강식품
            </p>
          </header>

          {/* Tab Navigation */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            {[
              { id: "doctors", label: "전문가", icon: Video },
              { id: "mall", label: "건강몰", icon: ShoppingBag },
              { id: "pharmacy", label: "처방전", icon: Pill }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Doctors Tab */}
          {activeTab === "doctors" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Global Connect Banner */}
              <Card className="bg-gradient-to-r from-violet-500 to-purple-500 border-0 text-white">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-8 h-8" />
                    <div>
                      <h3 className="font-semibold">Global Connect</h3>
                      <p className="text-sm text-violet-100">실시간 AI 번역으로 전 세계 전문가와 상담</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </CardContent>
              </Card>

              {/* Doctor List */}
              <div className="space-y-3">
                {FEATURED_DOCTORS.map((doctor) => (
                  <Card key={doctor.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center shrink-0">
                          <Stethoscope className="w-6 h-6 text-rose-500" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{doctor.name}</h3>
                            <BadgeCheck className="w-4 h-4 text-blue-500" />
                          </div>
                          <p className="text-xs text-slate-500">{doctor.specialty}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span>{doctor.rating}</span>
                            </div>
                            <span className="text-slate-300">|</span>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Globe className="w-3 h-3" />
                              <span>{doctor.languages.join(", ")}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="text-right">
                          <Badge 
                            variant={doctor.available ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {doctor.available ? "예약 가능" : "예약 마감"}
                          </Badge>
                          <p className="text-[10px] text-slate-500 mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {doctor.nextSlot}
                          </p>
                        </div>
                      </div>
                      
                      <Button className="w-full mt-3" size="sm" disabled={!doctor.available}>
                        <Calendar className="w-4 h-4 mr-2" />
                        예약하기
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* Mall Tab */}
          {activeTab === "mall" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* AI Recommendation Banner */}
              <Card className="bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Heart className="w-8 h-8" />
                    <div>
                      <h3 className="font-semibold">AI 맞춤 추천</h3>
                      <p className="text-sm text-amber-100">
                        당신의 88차원 바이오시그널 기반 추천
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Grid */}
              <div className="grid grid-cols-2 gap-3">
                {FEATURED_PRODUCTS.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-slate-300" />
                    </div>
                    <CardContent className="p-3">
                      {product.recommended && (
                        <Badge className="text-[9px] mb-1 bg-primary/10 text-primary">
                          AI 추천
                        </Badge>
                      )}
                      <h3 className="text-sm font-semibold line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-slate-500">{product.category}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-primary">
                          ₩{product.price.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>{product.rating}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button variant="outline" className="w-full">
                전체 상품 보기 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {/* Pharmacy Tab */}
          {activeTab === "pharmacy" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Pill className="w-4 h-4 text-primary" />
                    E-처방전 관리
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">아직 처방전이 없습니다</p>
                    <p className="text-xs mt-1">원격 진료 후 처방전을 받으실 수 있습니다</p>
                    <Button className="mt-4" size="sm" onClick={() => setActiveTab("doctors")}>
                      진료 예약하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </AppNavigationLayout>
  );
}
