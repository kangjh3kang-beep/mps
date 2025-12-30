"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Globe,
  GraduationCap,
  MessageSquare,
  Heart,
  BookOpen,
  Award,
  Users,
  ChevronRight,
  Star,
  TrendingUp,
  Lightbulb,
  Vote
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AppNavigationLayout } from "@/components/navigation/AppNavigation";

/* ============================================
 * Tutorials Data
 * ============================================ */

interface Tutorial {
  id: string;
  title: string;
  category: string;
  duration: string;
  points: number;
  completed: boolean;
  progress?: number;
}

const TUTORIALS: Tutorial[] = [
  {
    id: "1",
    title: "혈당 측정 완벽 가이드",
    category: "기초",
    duration: "5분",
    points: 50,
    completed: true
  },
  {
    id: "2",
    title: "호기 분석으로 대사 이해하기",
    category: "중급",
    duration: "10분",
    points: 100,
    completed: false,
    progress: 40
  },
  {
    id: "3",
    title: "88차원 데이터 해석법",
    category: "고급",
    duration: "15분",
    points: 200,
    completed: false
  }
];

/* ============================================
 * Agora Ideas
 * ============================================ */

interface AgoraIdea {
  id: string;
  title: string;
  author: string;
  votes: number;
  status: "voting" | "funded" | "implemented";
}

const AGORA_IDEAS: AgoraIdea[] = [
  {
    id: "1",
    title: "반려동물 건강 카트리지",
    author: "김민수",
    votes: 234,
    status: "voting"
  },
  {
    id: "2",
    title: "수면 품질 심층 분석",
    author: "이서연",
    votes: 189,
    status: "funded"
  },
  {
    id: "3",
    title: "식품 알레르기 테스트",
    author: "박준호",
    votes: 156,
    status: "voting"
  }
];

/* ============================================
 * Success Stories
 * ============================================ */

interface Story {
  id: string;
  author: string;
  title: string;
  preview: string;
  likes: number;
}

const SUCCESS_STORIES: Story[] = [
  {
    id: "1",
    author: "건강맨",
    title: "당뇨 전단계에서 정상으로",
    preview: "만파식과 함께한 3개월간의 여정...",
    likes: 89
  },
  {
    id: "2",
    author: "마라토너",
    title: "젖산 관리로 PB 달성",
    preview: "AI 코치의 조언을 따라...",
    likes: 67
  }
];

/* ============================================
 * World Page Component
 * ============================================ */

export default function WorldPage() {
  const [activeTab, setActiveTab] = React.useState<"school" | "agora" | "stories">("school");

  return (
    <AppNavigationLayout>
      <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <header>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-6 h-6 text-violet-500" />
              만파식 월드
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              The Campus - 교육 및 커뮤니티
            </p>
          </header>

          {/* Tab Navigation */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            {[
              { id: "school", label: "학교", icon: GraduationCap },
              { id: "agora", label: "아고라", icon: MessageSquare },
              { id: "stories", label: "스토리", icon: Heart }
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

          {/* School Tab */}
          {activeTab === "school" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Points Banner */}
              <Card className="bg-gradient-to-r from-violet-500 to-purple-500 border-0 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Award className="w-10 h-10" />
                      <div>
                        <p className="text-sm text-violet-100">학습 포인트</p>
                        <p className="text-2xl font-bold">350 MPS</p>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary">
                      포인트 사용
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tutorials */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">추천 강의</h2>
                {TUTORIALS.map((tutorial) => (
                  <Card key={tutorial.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                          tutorial.completed 
                            ? "bg-emerald-100 text-emerald-600" 
                            : "bg-violet-100 text-violet-600"
                        )}>
                          <BookOpen className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{tutorial.title}</h3>
                            {tutorial.completed && (
                              <Badge className="text-[9px] bg-emerald-100 text-emerald-700">
                                완료
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span>{tutorial.category}</span>
                            <span>•</span>
                            <span>{tutorial.duration}</span>
                            <span>•</span>
                            <span className="text-violet-600 font-medium">+{tutorial.points} MPS</span>
                          </div>

                          {tutorial.progress !== undefined && (
                            <div className="mt-2">
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-violet-500 rounded-full"
                                  style={{ width: `${tutorial.progress}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">
                                {tutorial.progress}% 진행 중
                              </p>
                            </div>
                          )}
                        </div>

                        <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* Agora Tab */}
          {activeTab === "agora" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Submit Idea Button */}
              <Button className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-500">
                <Lightbulb className="w-4 h-4" />
                아이디어 제안하기
              </Button>

              {/* Ideas List */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">인기 아이디어</h2>
                {AGORA_IDEAS.map((idea) => (
                  <Card key={idea.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{idea.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">제안: {idea.author}</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={
                              idea.status === "implemented" ? "default" :
                              idea.status === "funded" ? "secondary" : "outline"
                            }
                            className="text-[10px]"
                          >
                            {idea.status === "voting" && "투표 중"}
                            {idea.status === "funded" && "펀딩 완료"}
                            {idea.status === "implemented" && "구현됨"}
                          </Badge>
                          <div className="flex items-center justify-end gap-1 mt-2 text-xs">
                            <Vote className="w-3 h-3 text-violet-500" />
                            <span className="font-medium">{idea.votes}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* Stories Tab */}
          {activeTab === "stories" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-500" />
                <h2 className="text-lg font-semibold">사용자 성공 스토리</h2>
              </div>

              {SUCCESS_STORIES.map((story) => (
                <Card key={story.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center shrink-0">
                        <span className="text-sm">{story.author[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500">{story.author}</p>
                        <h3 className="font-semibold text-sm mt-0.5">{story.title}</h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{story.preview}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-rose-500">
                          <Heart className="w-3 h-3 fill-rose-500" />
                          <span>{story.likes}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" className="w-full">
                내 스토리 공유하기 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </AppNavigationLayout>
  );
}
