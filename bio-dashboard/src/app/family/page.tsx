"use client";

/**
 * ============================================================
 * FAMILY DASHBOARD
 * 가족 구성원 건강 관리 대시보드
 * ============================================================
 * 
 * 41-Persona Simulation: User #26 (주부)
 * Issue: "가족 전체 관리 불편"
 */

import * as React from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Users, 
  Plus, 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useSettings } from "@/context/SettingsContext";

// ============================================
// TYPES
// ============================================

interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'adult' | 'teen' | 'child';
  age: number;
  healthScore: number | null;
  trend: 'up' | 'down' | 'stable';
  lastMeasurement: string;
  isPrivate: boolean;
  alerts: number;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_FAMILY: FamilyMember[] = [
  {
    id: "1",
    name: "나 (엄마)",
    avatar: "👩",
    role: "owner",
    age: 42,
    healthScore: 82,
    trend: "up",
    lastMeasurement: "오늘 오전 8:30",
    isPrivate: false,
    alerts: 0
  },
  {
    id: "2",
    name: "남편",
    avatar: "👨",
    role: "adult",
    age: 45,
    healthScore: 68,
    trend: "down",
    lastMeasurement: "어제",
    isPrivate: false,
    alerts: 1
  },
  {
    id: "3",
    name: "딸 (민지)",
    avatar: "👧",
    role: "teen",
    age: 16,
    healthScore: null, // 프라이버시 모드
    trend: "stable",
    lastMeasurement: "2일 전",
    isPrivate: true,
    alerts: 0
  },
  {
    id: "4",
    name: "아들 (준호)",
    avatar: "👦",
    role: "child",
    age: 10,
    healthScore: 91,
    trend: "up",
    lastMeasurement: "오늘 오전 7:00",
    isPrivate: false,
    alerts: 0
  }
];

// ============================================
// COMPONENTS
// ============================================

function FamilyScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getColor = () => {
    if (score >= 80) return "#10B981";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="10"
        />
        <motion.circle
          cx="64"
          cy="64"
          r="45"
          fill="none"
          stroke={getColor()}
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-3xl font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground">가족 평균</span>
      </div>
    </div>
  );
}

function MemberCard({ member, onViewDetails }: { 
  member: FamilyMember; 
  onViewDetails: () => void;
}) {
  const getTrendIcon = () => {
    switch (member.trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down": return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <span className="w-4 h-4 text-gray-400">―</span>;
    }
  };

  const getRoleBadge = () => {
    switch (member.role) {
      case "owner": return <Badge className="bg-primary/10 text-primary text-[10px]">관리자</Badge>;
      case "teen": return <Badge className="bg-purple-100 text-purple-700 text-[10px]">청소년</Badge>;
      case "child": return <Badge className="bg-amber-100 text-amber-700 text-[10px]">어린이</Badge>;
      default: return null;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`cursor-pointer transition-all hover:shadow-lg ${
          member.alerts > 0 ? 'border-red-200 bg-red-50/50' : ''
        }`}
        onClick={onViewDetails}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-3xl">
                {member.avatar}
              </div>
              {member.alerts > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <Bell className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{member.name}</span>
                {getRoleBadge()}
                {member.isPrivate && (
                  <Lock className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                마지막 측정: {member.lastMeasurement}
              </div>
            </div>

            {/* Health Score */}
            <div className="text-right">
              {member.isPrivate ? (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <EyeOff className="w-4 h-4" />
                  <span className="text-sm">비공개</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    <span className={`text-2xl font-bold ${
                      (member.healthScore ?? 0) >= 80 ? 'text-green-600' :
                      (member.healthScore ?? 0) >= 60 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {member.healthScore ?? '-'}
                    </span>
                    {getTrendIcon()}
                  </div>
                  <span className="text-xs text-muted-foreground">건강 점수</span>
                </>
              )}
            </div>
          </div>

          {/* Alert Banner */}
          {member.alerts > 0 && (
            <div className="mt-3 p-2 bg-red-100 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-700">
                건강 점수가 낮습니다. 확인이 필요합니다.
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AddMemberDialog() {
  const [name, setName] = React.useState("");
  const [age, setAge] = React.useState("");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-4">
          <Plus className="w-4 h-4 mr-2" />
          가족 구성원 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>가족 구성원 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium">이름</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 할머니"
            />
          </div>
          <div>
            <label className="text-sm font-medium">나이</label>
            <Input 
              type="number"
              value={age} 
              onChange={(e) => setAge(e.target.value)}
              placeholder="예: 70"
            />
          </div>
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            💡 추가된 구성원에게 초대 링크가 전송됩니다.
            구성원이 수락하면 건강 데이터를 공유할 수 있습니다.
          </div>
          <Button className="w-full">
            초대 보내기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function FamilyDashboardPage() {
  const { familyAccountEnabled } = useSettings();
  const [members] = React.useState<FamilyMember[]>(MOCK_FAMILY);

  // 가족 평균 점수 계산
  const visibleScores = members
    .filter(m => !m.isPrivate && m.healthScore !== null)
    .map(m => m.healthScore as number);
  const familyAverageScore = visibleScores.length > 0
    ? Math.round(visibleScores.reduce((a, b) => a + b, 0) / visibleScores.length)
    : 0;

  const alertCount = members.reduce((acc, m) => acc + m.alerts, 0);

  if (!familyAccountEnabled) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-background to-sky-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">가족 계정이 비활성화됨</h2>
            <p className="text-sm text-muted-foreground mb-6">
              가족 구성원의 건강을 함께 관리하려면 설정에서 가족 계정을 활성화하세요.
            </p>
            <Button onClick={() => window.location.href = '/settings'}>
              설정으로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-background to-sky-50/30 pb-20">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => history.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <div className="text-lg font-semibold">우리 가족 건강</div>
              <div className="text-xs text-muted-foreground">
                {members.length}명의 가족 구성원
              </div>
            </div>
          </div>
          {alertCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {alertCount}개 알림
            </Badge>
          )}
        </div>

        {/* Family Score Overview */}
        <Card className="mb-6 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">가족 건강 점수</h3>
                <p className="text-sm text-muted-foreground">
                  공개된 구성원 기준 평균
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-sm">
                    {visibleScores.length}명 중 {visibleScores.filter(s => s >= 80).length}명 양호
                  </span>
                </div>
              </div>
              <FamilyScoreGauge score={familyAverageScore} />
            </div>
          </CardContent>
        </Card>

        {/* Member List */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            가족 구성원
          </h3>
          
          {members.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MemberCard 
                member={member} 
                onViewDetails={() => {
                  if (member.isPrivate) {
                    alert("이 구성원은 프라이버시 모드를 활성화했습니다.");
                  } else {
                    window.location.href = `/family/${member.id}`;
                  }
                }}
              />
            </motion.div>
          ))}

          <AddMemberDialog />
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 p-4 bg-muted/50 rounded-xl">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">프라이버시 보호</h4>
              <p className="text-xs text-muted-foreground mt-1">
                만 14세 이상 구성원은 프라이버시 모드를 설정하여 
                특정 데이터를 가족에게 숨길 수 있습니다.
                응급 상황 시에는 사전 동의에 따라 데이터가 공유될 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






