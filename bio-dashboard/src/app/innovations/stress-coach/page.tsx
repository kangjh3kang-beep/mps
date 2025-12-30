"use client";

/**
 * AI Stress Coach Page
 * AI 스트레스 코치 - 학생용 시험 스트레스 관리
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Wind, 
  Music, 
  Dumbbell, 
  BookOpen,
  Timer,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  aiStressCoach, 
  STRESS_INTERVENTIONS,
  type StressAnalysis, 
  type StressIntervention 
} from "@/lib/innovations";

export default function StressCoachPage() {
  const [analysis, setAnalysis] = React.useState<StressAnalysis | null>(null);
  const [activeIntervention, setActiveIntervention] = React.useState<StressIntervention | null>(null);
  const [timer, setTimer] = React.useState(0);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);

  React.useEffect(() => {
    // Initialize coach
    aiStressCoach.initialize({
      id: 'student_1',
      name: '학생',
      grade: 'high',
      age: 17,
      examSchedule: [
        {
          id: 'exam_1',
          name: '기말고사',
          subject: '수학',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          importance: 'high',
          preparationStatus: 60,
        },
      ],
      stressHistory: [],
      preferredRelaxation: ['breathing', 'music', 'stretching'],
      parentNotificationEnabled: true,
      privacyLevel: 'limited',
    });

    // Get initial analysis
    const result = aiStressCoach.analyzeStress(
      18, // cortisol
      85, // heart rate
      42, // hrv
      6,  // sleep hours
      [{
        id: 'exam_1',
        name: '기말고사',
        subject: '수학',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        importance: 'high',
        preparationStatus: 60,
      }]
    );
    setAnalysis(result);
  }, []);

  // Timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else if (timer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setActiveIntervention(null);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const startIntervention = (intervention: StressIntervention) => {
    setActiveIntervention(intervention);
    setTimer(intervention.duration * 60);
    setIsTimerRunning(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStressLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-500 bg-green-50';
      case 'moderate': return 'text-amber-500 bg-amber-50';
      case 'high': return 'text-orange-500 bg-orange-50';
      case 'critical': return 'text-red-500 bg-red-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  const getInterventionIcon = (type: string) => {
    switch (type) {
      case 'breathing': return <Wind className="w-5 h-5" />;
      case 'meditation': return <Brain className="w-5 h-5" />;
      case 'music': return <Music className="w-5 h-5" />;
      case 'stretching': return <Dumbbell className="w-5 h-5" />;
      case 'journaling': return <BookOpen className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI 스트레스 코치</h1>
              <p className="text-muted-foreground">시험 스트레스 관리</p>
            </div>
          </div>
        </motion.div>

        {/* Active Intervention Modal */}
        <AnimatePresence>
          {activeIntervention && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
            >
              <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white">
                    {getInterventionIcon(activeIntervention.type)}
                  </div>
                  <CardTitle>{activeIntervention.title}</CardTitle>
                  <CardDescription>{activeIntervention.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Timer */}
                  <div className="text-center">
                    <div className="text-5xl font-bold text-purple-600">
                      {formatTime(timer)}
                    </div>
                    <Progress 
                      value={(timer / (activeIntervention.duration * 60)) * 100} 
                      className="mt-4"
                    />
                  </div>

                  {/* Steps */}
                  {activeIntervention.steps && (
                    <div className="space-y-2">
                      {activeIntervention.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                            {i + 1}
                          </div>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Controls */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          일시정지
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          재개
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTimer(activeIntervention.duration * 60);
                      }}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setActiveIntervention(null);
                        setIsTimerRunning(false);
                      }}
                    >
                      종료
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Stress Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">현재 스트레스 상태</CardTitle>
              <CardDescription>바이오 시그널 분석 결과</CardDescription>
            </CardHeader>
            <CardContent>
              {analysis && (
                <div className="space-y-4">
                  {/* Stress Level */}
                  <div className={`p-4 rounded-xl ${getStressLevelColor(analysis.currentLevel)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">스트레스 레벨</span>
                      {analysis.currentLevel === 'low' || analysis.currentLevel === 'moderate' ? (
                        <TrendingDown className="w-5 h-5" />
                      ) : (
                        <TrendingUp className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-3xl font-bold capitalize">
                      {analysis.currentLevel === 'low' && '낮음'}
                      {analysis.currentLevel === 'moderate' && '보통'}
                      {analysis.currentLevel === 'high' && '높음'}
                      {analysis.currentLevel === 'critical' && '매우 높음'}
                    </div>
                    <Progress value={analysis.score} className="mt-2" />
                  </div>

                  {/* Urgent Alert */}
                  {analysis.urgentAlert && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{analysis.urgentAlert}</p>
                      </div>
                    </div>
                  )}

                  {/* Triggers */}
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="font-medium mb-2 text-sm">스트레스 원인</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.triggers.map((trigger, i) => (
                        <Badge key={i} variant="secondary">{trigger}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Physical Indicators */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-purple-50 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">코르티솔</p>
                      <p className="font-bold">{analysis.physicalIndicators.cortisol.value} μg/dL</p>
                      <p className="text-xs text-purple-600">{analysis.physicalIndicators.cortisol.status}</p>
                    </div>
                    <div className="p-3 bg-pink-50 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">심박수</p>
                      <p className="font-bold">{analysis.physicalIndicators.heartRate.value} bpm</p>
                      <p className="text-xs text-pink-600">{analysis.physicalIndicators.heartRate.status}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">HRV</p>
                      <p className="font-bold">{analysis.physicalIndicators.hrv.value} ms</p>
                      <p className="text-xs text-blue-600">{analysis.physicalIndicators.hrv.status}</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">수면 부채</p>
                      <p className="font-bold">{analysis.physicalIndicators.sleepDebt.hours}시간</p>
                      <p className="text-xs text-amber-600">{analysis.physicalIndicators.sleepDebt.impact}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interventions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">추천 휴식 활동</CardTitle>
              <CardDescription>지금 바로 시작해보세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis?.recommendations.map((intervention) => (
                <motion.button
                  key={intervention.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startIntervention(intervention)}
                  className="w-full p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white shadow flex items-center justify-center text-purple-600">
                      {getInterventionIcon(intervention.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{intervention.title}</p>
                        <Badge variant="secondary" className="text-xs">
                          {intervention.duration}분
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{intervention.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-purple-600">
                        효과 {intervention.effectiveness}%
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}

              {/* All Interventions */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">모든 휴식 활동</p>
                <div className="grid grid-cols-2 gap-2">
                  {STRESS_INTERVENTIONS.slice(0, 6).map((intervention) => (
                    <Button
                      key={intervention.id}
                      variant="outline"
                      className="flex-col h-auto py-3 text-xs"
                      onClick={() => startIntervention(intervention)}
                    >
                      {getInterventionIcon(intervention.type)}
                      <span className="mt-1">{intervention.title}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}




