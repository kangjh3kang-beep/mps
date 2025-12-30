"use client";

/**
 * ============================================================
 * MANPASIK PRO MODE
 * 검증된 전문가 전용 고급 분석 화면
 * v0 디자인 적용 - 화선지/먹물 테마
 * ============================================================
 */

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity, Brain, FileText, Users, Settings, Shield, Download, Upload,
  Microscope, Database, BarChart3, LineChart, Zap, AlertTriangle, Check,
  ChevronRight, Clock, Calendar, TrendingUp, Target, Award, Stethoscope,
  Beaker, FlaskConical, Atom, Dna, HeartPulse
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { V0Sidebar } from "@/components/dashboard/v0-sidebar";
import { V0Header } from "@/components/dashboard/v0-header";
import { useAuth, RequireAuth } from "@/lib/auth/auth-context";
import { MemberLevel, getLevelMeta, canAccessProMode } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

// 프로모드 메뉴 정의
const PRO_MENU_ITEMS = [
  { id: 'overview', label: '개요', icon: BarChart3 },
  { id: 'patients', label: '환자 관리', icon: Users },
  { id: 'raw-data', label: '원시 데이터', icon: Database },
  { id: 'calibration', label: '교정 관리', icon: Target },
  { id: 'analytics', label: '고급 분석', icon: Brain },
  { id: 'reports', label: '리포트', icon: FileText },
];

// 통계 카드 데이터
const STATS = [
  { label: "오늘 분석", value: "47", change: "+12%", icon: Activity, color: "text-emerald-500" },
  { label: "등록 환자", value: "1,234", change: "+3", icon: Users, color: "text-blue-500" },
  { label: "연구 데이터", value: "52.8K", change: "+2.1K", icon: Database, color: "text-purple-500" },
  { label: "정확도", value: "98.7%", change: "+0.3%", icon: Target, color: "text-amber-500" },
];

// 최근 활동
const RECENT_ACTIVITIES = [
  { id: 1, type: "analysis", patient: "환자 #1234", time: "5분 전", status: "completed" },
  { id: 2, type: "calibration", patient: "장비 CAL-01", time: "1시간 전", status: "completed" },
  { id: 3, type: "report", patient: "환자 #1189", time: "2시간 전", status: "pending" },
  { id: 4, type: "analysis", patient: "환자 #1201", time: "3시간 전", status: "completed" },
];

// 알림
const ALERTS = [
  { id: 1, type: "warning", message: "카트리지 #3 교체 필요 (잔여 10%)", time: "10분 전" },
  { id: 2, type: "info", message: "새로운 펌웨어 업데이트 가능 (v2.4.1)", time: "1시간 전" },
  { id: 3, type: "success", message: "월간 리포트 생성 완료", time: "3시간 전" },
];

function ProModeContent() {
  const { user, getLevelMeta: getUserLevelMeta } = useAuth();
  const [activeTab, setActiveTab] = React.useState("overview");
  const levelMeta = getUserLevelMeta();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <V0Sidebar />

      <main className="pl-16 lg:pl-20 min-h-screen overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto p-4 lg:p-8 pb-24">
          {/* Header with Pro Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-responsive-2xl font-medium text-foreground brush-underline">
                    프로 모드
                  </h1>
                  <span className={cn(
                    "px-2 py-0.5 text-xs rounded-full font-medium",
                    levelMeta?.color === 'purple' && "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
                    levelMeta?.color === 'indigo' && "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
                    levelMeta?.color === 'amber' && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
                    levelMeta?.color === 'red' && "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
                  )}>
                    {levelMeta?.icon} {levelMeta?.nameKo}
                  </span>
                </div>
                <p className="text-responsive-sm text-muted-foreground">
                  검증된 전문가를 위한 고급 분석 도구
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="hanji-card">
                <Download className="w-4 h-4 mr-1" />
                내보내기
              </Button>
              <Button variant="outline" size="sm" className="hanji-card">
                <Settings className="w-4 h-4 mr-1" />
                설정
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="hanji-card rounded-2xl p-4 lg:p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("p-2 rounded-xl bg-ink/5", stat.color)}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">
                    {stat.change}
                  </span>
                </div>
                <p className="text-responsive-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-responsive-2xl font-light text-foreground">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="hanji-card p-1 rounded-xl">
              {PRO_MENU_ITEMS.map((item) => (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  className="rounded-lg data-[state=active]:bg-ink data-[state=active]:text-hanji"
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent Activities */}
                <div className="lg:col-span-2">
                  <div className="hanji-card rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-responsive-lg font-medium text-foreground flex items-center gap-2">
                        <Clock className="w-5 h-5 text-ink" />
                        최근 활동
                      </h3>
                      <Button variant="ghost" size="sm" className="text-xs">
                        전체보기
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {RECENT_ACTIVITIES.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-hanji-warm hover:bg-ink/5 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center",
                              activity.type === 'analysis' && "bg-emerald-100 text-emerald-600",
                              activity.type === 'calibration' && "bg-amber-100 text-amber-600",
                              activity.type === 'report' && "bg-blue-100 text-blue-600",
                            )}>
                              {activity.type === 'analysis' && <Activity className="w-4 h-4" />}
                              {activity.type === 'calibration' && <Target className="w-4 h-4" />}
                              {activity.type === 'report' && <FileText className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-responsive-sm font-medium text-foreground">
                                {activity.patient}
                              </p>
                              <p className="text-responsive-xs text-muted-foreground">
                                {activity.time}
                              </p>
                            </div>
                          </div>
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            activity.status === 'completed' && "bg-emerald-100 text-emerald-700",
                            activity.status === 'pending' && "bg-amber-100 text-amber-700",
                          )}>
                            {activity.status === 'completed' ? '완료' : '대기중'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Alerts */}
                <div className="hanji-card rounded-2xl p-5">
                  <h3 className="text-responsive-lg font-medium text-foreground flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    알림
                  </h3>
                  <div className="space-y-3">
                    {ALERTS.map((alert) => (
                      <div
                        key={alert.id}
                        className={cn(
                          "p-3 rounded-xl text-sm",
                          alert.type === 'warning' && "bg-amber-50 dark:bg-amber-900/20",
                          alert.type === 'info' && "bg-blue-50 dark:bg-blue-900/20",
                          alert.type === 'success' && "bg-emerald-50 dark:bg-emerald-900/20",
                        )}
                      >
                        <p className={cn(
                          "font-medium mb-1",
                          alert.type === 'warning' && "text-amber-700 dark:text-amber-400",
                          alert.type === 'info' && "text-blue-700 dark:text-blue-400",
                          alert.type === 'success' && "text-emerald-700 dark:text-emerald-400",
                        )}>
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground">{alert.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="hanji-card rounded-2xl p-5">
                <h3 className="text-responsive-lg font-medium text-foreground mb-4">
                  빠른 실행
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Microscope, label: "새 분석", color: "bg-emerald-500" },
                    { icon: Users, label: "환자 등록", color: "bg-blue-500" },
                    { icon: Download, label: "데이터 내보내기", color: "bg-purple-500" },
                    { icon: FileText, label: "리포트 생성", color: "bg-amber-500" },
                  ].map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      className="h-auto flex-col gap-2 py-4 hanji-card hover:bg-hanji-warm"
                    >
                      <div className={cn("p-2 rounded-lg text-white", action.color)}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Patients Tab */}
            <TabsContent value="patients" className="space-y-4">
              <div className="hanji-card rounded-2xl p-6">
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">환자 관리</h3>
                  <p className="text-muted-foreground mb-4">
                    등록된 환자의 건강 데이터를 관리하고 분석할 수 있습니다.
                  </p>
                  <Button className="ink-btn">
                    <Users className="w-4 h-4 mr-2" />
                    환자 목록 보기
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Raw Data Tab */}
            <TabsContent value="raw-data" className="space-y-4">
              <div className="hanji-card rounded-2xl p-6">
                <div className="text-center py-12">
                  <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">원시 데이터 접근</h3>
                  <p className="text-muted-foreground mb-4">
                    88차원 센서 데이터 및 원시 측정값에 직접 접근할 수 있습니다.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button className="ink-btn">
                      <Download className="w-4 h-4 mr-2" />
                      CSV 다운로드
                    </Button>
                    <Button variant="outline" className="hanji-card">
                      <Atom className="w-4 h-4 mr-2" />
                      API 연동
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Calibration Tab */}
            <TabsContent value="calibration" className="space-y-4">
              <div className="hanji-card rounded-2xl p-6">
                <div className="text-center py-12">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">교정 관리</h3>
                  <p className="text-muted-foreground mb-4">
                    센서 교정 및 정밀도 관리 도구에 접근할 수 있습니다.
                  </p>
                  <Button className="ink-btn">
                    <Target className="w-4 h-4 mr-2" />
                    교정 시작
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <div className="hanji-card rounded-2xl p-6">
                <div className="text-center py-12">
                  <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">고급 분석</h3>
                  <p className="text-muted-foreground mb-4">
                    AI 기반 패턴 인식 및 예측 분석 도구를 사용할 수 있습니다.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button className="ink-btn">
                      <Brain className="w-4 h-4 mr-2" />
                      AI 분석 시작
                    </Button>
                    <Button variant="outline" className="hanji-card">
                      <Dna className="w-4 h-4 mr-2" />
                      패턴 매칭
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4">
              <div className="hanji-card rounded-2xl p-6">
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">리포트 생성</h3>
                  <p className="text-muted-foreground mb-4">
                    전문가용 상세 리포트를 생성하고 내보낼 수 있습니다.
                  </p>
                  <Button className="ink-btn">
                    <FileText className="w-4 h-4 mr-2" />
                    새 리포트 생성
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <footer className="mt-8 pt-6 border-t border-ink/6 text-center">
            <p className="text-responsive-xs text-muted-foreground">
              <span className="text-ink font-medium">만파식 프로</span> · 
              전문가 전용 · {levelMeta?.icon} {levelMeta?.nameKo} 인증됨
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

// 접근 거부 화면
function AccessDeniedScreen() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10 flex items-center justify-center">
          <Shield className="w-10 h-10 text-purple-600 dark:text-purple-400" />
        </div>
        
        <h1 className="text-2xl font-medium text-foreground mb-2">
          전문가 전용 영역
        </h1>
        <p className="text-muted-foreground mb-6">
          프로 모드는 <span className="font-medium text-purple-600">검증된 전문가</span> 이상
          등급에서만 접근할 수 있습니다.
        </p>

        <div className="hanji-card rounded-2xl p-6 mb-6 text-left">
          <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            전문가 인증 방법
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>의료 면허증 또는 전문 자격증 제출</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>소속 기관 확인 (병원, 연구소 등)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>심사 후 1-3일 내 승인</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="flex-1 ink-btn" asChild>
            <Link href="/auth/verify-expert">
              <Stethoscope className="w-4 h-4 mr-2" />
              전문가 인증 신청
            </Link>
          </Button>
          <Button variant="outline" className="flex-1 hanji-card" asChild>
            <Link href="/">
              홈으로 돌아가기
            </Link>
          </Button>
        </div>

        {user && (
          <p className="mt-6 text-xs text-muted-foreground">
            현재 등급: {getLevelMeta(user.level).icon} {getLevelMeta(user.level).nameKo}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProModePage() {
  return (
    <RequireAuth
      minLevel={MemberLevel.EXPERT}
      fallback={<AccessDeniedScreen />}
    >
      <ProModeContent />
    </RequireAuth>
  );
}

