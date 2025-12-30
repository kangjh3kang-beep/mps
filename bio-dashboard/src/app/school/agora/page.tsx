"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  ChevronLeft, 
  Lightbulb, 
  Plus,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  Sparkles,
  Award,
  ChevronRight,
  BarChart3,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Idea Agora - Collective Intelligence Platform
 * 사용자 아이디어로 생태계 발전
 */

type IdeaStatus = "submitted" | "under_review" | "approved" | "implemented" | "rejected";
type IdeaCategory = "new_target" | "app_feature" | "design" | "hardware" | "community";

interface Idea {
  id: string;
  title: string;
  description: string;
  author: {
    name: string;
    avatar: string;
    level: number;
  };
  category: IdeaCategory;
  status: IdeaStatus;
  votes: number;
  comments: number;
  createdAt: string;
  aiAnalysis?: {
    feasibility: "high" | "medium" | "low";
    estimatedTime: string;
    similarPatents: number;
  };
  isVoted: boolean;
}

const mockIdeas: Idea[] = [
  {
    id: "1",
    title: "비타민 D 측정 카트리지",
    description: "겨울철 비타민D 결핍을 간편하게 확인할 수 있는 카트리지가 있으면 좋겠습니다. 특히 재택근무자들에게 유용할 것 같아요.",
    author: { name: "건강지킴이", avatar: "👨‍🔬", level: 5 },
    category: "new_target",
    status: "under_review",
    votes: 1247,
    comments: 89,
    createdAt: "2024-01-15",
    aiAnalysis: {
      feasibility: "high",
      estimatedTime: "6개월",
      similarPatents: 12
    },
    isVoted: true
  },
  {
    id: "2",
    title: "다크 모드 지원",
    description: "밤에 앱을 사용할 때 눈이 편하도록 다크 모드를 추가해주세요.",
    author: { name: "야행성개발자", avatar: "🦉", level: 3 },
    category: "design",
    status: "implemented",
    votes: 2341,
    comments: 156,
    createdAt: "2023-12-01",
    isVoted: true
  },
  {
    id: "3",
    title: "가족 계정 연동",
    description: "가족들의 건강 데이터를 한 화면에서 관리할 수 있으면 좋겠습니다. 특히 부모님 건강 관리에 유용할 것 같아요.",
    author: { name: "효자아들", avatar: "👪", level: 4 },
    category: "app_feature",
    status: "approved",
    votes: 987,
    comments: 67,
    createdAt: "2024-01-10",
    aiAnalysis: {
      feasibility: "medium",
      estimatedTime: "4개월",
      similarPatents: 5
    },
    isVoted: false
  },
  {
    id: "4",
    title: "스마트워치 연동",
    description: "Apple Watch, Galaxy Watch와 연동하여 심박수, 산소포화도 데이터를 함께 분석해주세요.",
    author: { name: "테크러버", avatar: "⌚", level: 6 },
    category: "hardware",
    status: "submitted",
    votes: 456,
    comments: 34,
    createdAt: "2024-01-20",
    aiAnalysis: {
      feasibility: "high",
      estimatedTime: "3개월",
      similarPatents: 8
    },
    isVoted: false
  },
  {
    id: "5",
    title: "지역 커뮤니티 기능",
    description: "같은 지역의 사용자들이 건강 정보를 공유하고 소통할 수 있는 기능이 있으면 좋겠습니다.",
    author: { name: "동네건강맨", avatar: "🏘️", level: 2 },
    category: "community",
    status: "submitted",
    votes: 234,
    comments: 21,
    createdAt: "2024-01-22",
    isVoted: false
  }
];

const statusConfig: Record<IdeaStatus, { label: string; color: string; icon: React.ElementType }> = {
  submitted: { label: "제출됨", color: "bg-slate-500", icon: Clock },
  under_review: { label: "검토 중", color: "bg-amber-500", icon: AlertCircle },
  approved: { label: "승인됨", color: "bg-emerald-500", icon: CheckCircle2 },
  implemented: { label: "구현됨", color: "bg-sky-500", icon: Sparkles },
  rejected: { label: "반려됨", color: "bg-rose-500", icon: AlertCircle }
};

const categoryConfig: Record<IdeaCategory, { label: string; emoji: string }> = {
  new_target: { label: "새 측정 대상", emoji: "🎯" },
  app_feature: { label: "앱 기능", emoji: "📱" },
  design: { label: "디자인", emoji: "🎨" },
  hardware: { label: "하드웨어", emoji: "🔧" },
  community: { label: "커뮤니티", emoji: "👥" }
};

function IdeaCard({ idea, onVote }: { idea: Idea; onVote: (id: string) => void }) {
  const status = statusConfig[idea.status];
  const category = categoryConfig[idea.category];
  const StatusIcon = status.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card className="border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge className={cn(status.color, "text-white")}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
              <span className="text-sm text-white/50">
                {category.emoji} {category.label}
              </span>
            </div>
            <span className="text-xs text-white/40">{idea.createdAt}</span>
          </div>
          
          {/* Content */}
          <h3 className="text-lg font-semibold text-white mb-2">{idea.title}</h3>
          <p className="text-sm text-white/70 mb-4 line-clamp-2">{idea.description}</p>
          
          {/* AI Analysis */}
          {idea.aiAnalysis && (
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-purple-300">AI 분석</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-white/50">실현 가능성</span>
                  <div className={cn(
                    "font-medium",
                    idea.aiAnalysis.feasibility === "high" && "text-emerald-400",
                    idea.aiAnalysis.feasibility === "medium" && "text-amber-400",
                    idea.aiAnalysis.feasibility === "low" && "text-rose-400"
                  )}>
                    {idea.aiAnalysis.feasibility === "high" && "높음"}
                    {idea.aiAnalysis.feasibility === "medium" && "보통"}
                    {idea.aiAnalysis.feasibility === "low" && "낮음"}
                  </div>
                </div>
                <div>
                  <span className="text-white/50">예상 개발기간</span>
                  <div className="text-white">{idea.aiAnalysis.estimatedTime}</div>
                </div>
                <div>
                  <span className="text-white/50">유사 특허</span>
                  <div className="text-white">{idea.aiAnalysis.similarPatents}건</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Author */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{idea.author.avatar}</span>
            <span className="text-sm text-white/70">{idea.author.name}</span>
            <Badge variant="outline" className="text-xs border-white/20">
              Lv.{idea.author.level}
            </Badge>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onVote(idea.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
                  idea.isVoted 
                    ? "bg-amber-500/20 text-amber-300" 
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                )}
              >
                <ThumbsUp className={cn("w-4 h-4", idea.isVoted && "fill-amber-400")} />
                <span className="font-medium">{idea.votes.toLocaleString()}</span>
              </button>
              <div className="flex items-center gap-1.5 text-white/50">
                <MessageSquare className="w-4 h-4" />
                <span>{idea.comments}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
              자세히 보기
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AgoraPage() {
  const [ideas, setIdeas] = useState(mockIdeas);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<IdeaCategory | "all">("all");
  const [sortBy, setSortBy] = useState<"votes" | "recent">("votes");
  const [isNewIdeaOpen, setIsNewIdeaOpen] = useState(false);
  
  const handleVote = (id: string) => {
    setIdeas(prev => prev.map(idea => {
      if (idea.id === id) {
        return {
          ...idea,
          isVoted: !idea.isVoted,
          votes: idea.isVoted ? idea.votes - 1 : idea.votes + 1
        };
      }
      return idea;
    }));
  };
  
  const filteredIdeas = ideas
    .filter(idea => {
      const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           idea.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || idea.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "votes") return b.votes - a.votes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const stats = {
    totalIdeas: ideas.length,
    implemented: ideas.filter(i => i.status === "implemented").length,
    totalVotes: ideas.reduce((sum, i) => sum + i.votes, 0)
  };

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
                <h1 className="text-xl font-bold text-white">아이디어 아고라</h1>
                <p className="text-sm text-white/50">Collective Intelligence</p>
              </div>
            </div>
            
            <Dialog open={isNewIdeaOpen} onOpenChange={setIsNewIdeaOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-amber-500 to-orange-600">
                  <Plus className="w-4 h-4 mr-2" />
                  아이디어 제안
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">새 아이디어 제안</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm text-white/70 mb-2 block">제목</label>
                    <Input 
                      placeholder="아이디어 제목을 입력하세요"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/70 mb-2 block">카테고리</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(categoryConfig).map(([key, value]) => (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white/70"
                        >
                          {value.emoji} {value.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-white/70 mb-2 block">설명</label>
                    <Textarea 
                      placeholder="아이디어를 자세히 설명해주세요..."
                      className="bg-white/5 border-white/10 text-white min-h-[120px]"
                    />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600">
                    제출하기
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <motion.section 
          className="grid grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardContent className="p-4 text-center">
              <Lightbulb className="w-8 h-8 mx-auto text-amber-400 mb-2" />
              <div className="text-2xl font-bold text-white">{stats.totalIdeas}</div>
              <div className="text-xs text-white/50">제안된 아이디어</div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
              <div className="text-2xl font-bold text-white">{stats.implemented}</div>
              <div className="text-xs text-white/50">구현된 아이디어</div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardContent className="p-4 text-center">
              <ThumbsUp className="w-8 h-8 mx-auto text-sky-400 mb-2" />
              <div className="text-2xl font-bold text-white">{stats.totalVotes.toLocaleString()}</div>
              <div className="text-xs text-white/50">총 투표 수</div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Filters */}
        <section className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                placeholder="아이디어 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === "votes" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("votes")}
                className={sortBy === "votes" ? "bg-gradient-to-r from-amber-500 to-orange-600" : "border-white/20 text-white/70"}
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                인기순
              </Button>
              <Button
                variant={sortBy === "recent" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("recent")}
                className={sortBy === "recent" ? "bg-gradient-to-r from-amber-500 to-orange-600" : "border-white/20 text-white/70"}
              >
                <Clock className="w-4 h-4 mr-1" />
                최신순
              </Button>
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={selectedCategory === "all" ? "bg-gradient-to-r from-sky-500 to-blue-600" : "border-white/20 text-white/70"}
            >
              전체
            </Button>
            {Object.entries(categoryConfig).map(([key, value]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(key as IdeaCategory)}
                className={cn(
                  "whitespace-nowrap",
                  selectedCategory === key 
                    ? "bg-gradient-to-r from-sky-500 to-blue-600" 
                    : "border-white/20 text-white/70"
                )}
              >
                {value.emoji} {value.label}
              </Button>
            ))}
          </div>
        </section>

        {/* Ideas List */}
        <section className="space-y-4">
          <AnimatePresence>
            {filteredIdeas.map((idea, index) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <IdeaCard idea={idea} onVote={handleVote} />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredIdeas.length === 0 && (
            <div className="text-center py-20">
              <Lightbulb className="w-16 h-16 mx-auto text-white/20 mb-4" />
              <p className="text-white/50">아직 아이디어가 없습니다. 첫 번째로 제안해보세요!</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}






