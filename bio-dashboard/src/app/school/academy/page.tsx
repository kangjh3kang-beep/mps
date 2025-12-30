"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  ChevronLeft, 
  GraduationCap, 
  BookOpen, 
  PlayCircle, 
  CheckCircle2,
  Lock,
  Star,
  Trophy,
  Zap,
  Clock,
  Users,
  Award,
  ChevronRight,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * AI Interactive Academy
 * Learn-to-Earn 시스템으로 학습하고 보상받기
 */

interface Course {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  duration: string;
  modules: number;
  completedModules: number;
  points: number;
  badge?: string;
  isLocked: boolean;
  category: string;
}

const courses: Course[] = [
  {
    id: "getting-started",
    title: "시작하기",
    titleEn: "Getting Started",
    description: "만파식 리더기와 앱의 기본 사용법을 배웁니다",
    level: "beginner",
    duration: "15분",
    modules: 5,
    completedModules: 3,
    points: 100,
    badge: "🎓 신입생",
    isLocked: false,
    category: "basics"
  },
  {
    id: "cartridge-mastery",
    title: "카트리지 마스터",
    titleEn: "Cartridge Mastery",
    description: "다양한 카트리지 타입과 올바른 사용법",
    level: "beginner",
    duration: "20분",
    modules: 6,
    completedModules: 0,
    points: 150,
    badge: "🧪 카트리지 전문가",
    isLocked: false,
    category: "hardware"
  },
  {
    id: "reading-results",
    title: "결과 해석하기",
    titleEn: "Understanding Results",
    description: "88차원 데이터와 건강 점수의 의미 이해",
    level: "intermediate",
    duration: "30분",
    modules: 8,
    completedModules: 0,
    points: 200,
    badge: "📊 데이터 분석가",
    isLocked: true,
    category: "data"
  },
  {
    id: "ai-coach",
    title: "AI 코치 활용",
    titleEn: "AI Coach Mastery",
    description: "AI 코치와 효과적으로 소통하는 방법",
    level: "intermediate",
    duration: "25분",
    modules: 7,
    completedModules: 0,
    points: 180,
    badge: "🤖 AI 마스터",
    isLocked: true,
    category: "ai"
  },
  {
    id: "advanced-sensing",
    title: "고급 센싱 기술",
    titleEn: "Advanced Sensing",
    description: "CV, EIS, DPV 원리와 해석",
    level: "advanced",
    duration: "45분",
    modules: 10,
    completedModules: 0,
    points: 300,
    badge: "🔬 바이오 과학자",
    isLocked: true,
    category: "science"
  },
  {
    id: "community-leader",
    title: "커뮤니티 리더",
    titleEn: "Community Leadership",
    description: "아이디어 제안과 커뮤니티 기여 방법",
    level: "advanced",
    duration: "35분",
    modules: 8,
    completedModules: 0,
    points: 250,
    badge: "👑 커뮤니티 리더",
    isLocked: true,
    category: "community"
  }
];

const userStats = {
  totalPoints: 450,
  coursesCompleted: 2,
  currentStreak: 7,
  badges: ["🎓", "🌟"],
  level: 3,
  nextLevelPoints: 500
};

const levelColors = {
  beginner: "from-emerald-500 to-teal-600",
  intermediate: "from-sky-500 to-blue-600",
  advanced: "from-purple-500 to-indigo-600"
};

const levelLabels = {
  beginner: "입문",
  intermediate: "중급",
  advanced: "고급"
};

function CourseCard({ course }: { course: Course }) {
  const progress = course.modules > 0 ? (course.completedModules / course.modules) * 100 : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: course.isLocked ? 1 : 1.02 }}
      className={cn(course.isLocked && "opacity-60")}
    >
      <Card className="relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-md h-full">
        {course.isLocked && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              <Lock className="w-8 h-8 text-white/50 mx-auto mb-2" />
              <p className="text-sm text-white/50">이전 과정을 완료하세요</p>
            </div>
          </div>
        )}
        
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              "px-2 py-1 rounded-lg text-xs font-medium text-white",
              `bg-gradient-to-r ${levelColors[course.level]}`
            )}>
              {levelLabels[course.level]}
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
              <span className="text-sm font-medium">+{course.points}</span>
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-semibold text-white mb-1">{course.title}</h3>
          <p className="text-sm text-white/50 mb-1">{course.titleEn}</p>
          <p className="text-sm text-white/70 mb-4">{course.description}</p>
          
          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-white/50 mb-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {course.duration}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {course.modules} 모듈
            </span>
          </div>
          
          {/* Progress */}
          {progress > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                <span>진행률</span>
                <span>{course.completedModules}/{course.modules}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {/* Badge Preview */}
          {course.badge && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 mb-4">
              <span className="text-2xl">{course.badge.split(" ")[0]}</span>
              <span className="text-xs text-white/70">{course.badge.split(" ").slice(1).join(" ")} 배지 획득</span>
            </div>
          )}
          
          {/* Action Button */}
          <Button 
            className={cn(
              "w-full",
              progress > 0 
                ? "bg-gradient-to-r from-emerald-500 to-teal-600" 
                : "bg-gradient-to-r from-sky-500 to-blue-600"
            )}
            disabled={course.isLocked}
          >
            {progress > 0 ? (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                이어서 학습
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4 mr-2" />
                학습 시작
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AcademyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.titleEn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", label: "전체" },
    { id: "basics", label: "기초" },
    { id: "hardware", label: "하드웨어" },
    { id: "data", label: "데이터" },
    { id: "ai", label: "AI" },
    { id: "science", label: "과학" },
    { id: "community", label: "커뮤니티" }
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="glass" size="icon" asChild>
                <Link href="/school">
                  <ChevronLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">AI 인터랙티브 아카데미</h1>
                <p className="text-sm text-white/50">Learn-to-Earn</p>
              </div>
            </div>
            
            {/* User Stats Mini */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="font-medium">{userStats.totalPoints}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300">
                <Zap className="w-4 h-4" />
                <span className="font-medium">{userStats.currentStreak}일</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* User Progress Card */}
        <motion.section 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-white/10 bg-gradient-to-r from-purple-500/20 via-sky-500/20 to-emerald-500/20 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Level Badge */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">Lv.{userStats.level}</div>
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl font-bold text-white mb-2">학습 현황</h2>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold text-white">{userStats.coursesCompleted}</div>
                      <div className="text-xs text-white/50">완료한 과정</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{userStats.totalPoints}</div>
                      <div className="text-xs text-white/50">획득 포인트</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{userStats.currentStreak}일</div>
                      <div className="text-xs text-white/50">연속 학습</div>
                    </div>
                  </div>
                  
                  {/* Level Progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                      <span>다음 레벨까지</span>
                      <span>{userStats.totalPoints}/{userStats.nextLevelPoints}</span>
                    </div>
                    <Progress value={(userStats.totalPoints / userStats.nextLevelPoints) * 100} className="h-2" />
                  </div>
                </div>
                
                {/* Badges */}
                <div className="flex-shrink-0">
                  <div className="text-center">
                    <div className="text-sm text-white/50 mb-2">획득한 배지</div>
                    <div className="flex gap-2">
                      {userStats.badges.map((badge, i) => (
                        <div key={i} className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                          {badge}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Search and Filters */}
        <section className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                placeholder="과정 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "whitespace-nowrap",
                    selectedCategory === category.id 
                      ? "bg-gradient-to-r from-sky-500 to-blue-600" 
                      : "border-white/20 text-white/70"
                  )}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Courses Grid */}
        <section>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {filteredCourses.length === 0 && (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 mx-auto text-white/20 mb-4" />
              <p className="text-white/50">검색 결과가 없습니다</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}






