"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { 
  Sun, 
  Moon,
  Bell,
  CheckCircle2,
  Circle,
  Activity,
  Pill,
  Stethoscope,
  TrendingUp,
  Heart,
  Volume2,
  Calendar,
  Sparkles,
  ChevronRight,
  Wind
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings, DEFAULT_SUBTITLE } from "@/context/SettingsContext";
import { useI18n } from "@/lib/i18n";
import { QuickBridgeLink } from "@/components/navigation/BridgeButton";

/* ============================================
 * Types
 * ============================================ */

interface TodoItem {
  id: string;
  titleKey: string;
  time: string;
  type: "measure" | "medication" | "appointment" | "exercise" | "custom";
  completed: boolean;
  urgent?: boolean;
  deepLink: string;
}

interface WeatherAlert {
  type: "dust" | "uv" | "cold" | "heat" | "virus";
  level: "low" | "medium" | "high";
  messageKey: string;
}

/* ============================================
 * Home Page (My Daily Rhythm)
 * ============================================ */

export default function OrganicHomePage() {
  const { customSubtitle } = useSettings();
  const { t, locale } = useI18n();
  const [hasMounted, setHasMounted] = React.useState(false);

  const [todos, setTodos] = React.useState<TodoItem[]>([
    {
      id: "1",
      titleKey: "오전 젖산 측정",
      time: "09:00",
      type: "measure",
      completed: true,
      deepLink: "/analyze?mode=lactate"
    },
    {
      id: "2",
      titleKey: "비타민 D 복용",
      time: "12:00",
      type: "medication",
      completed: false,
      urgent: true,
      deepLink: "/care/mall?product=vitamin-d"
    },
    {
      id: "3",
      titleKey: "김 원장님 원격 진료",
      time: "14:30",
      type: "appointment",
      completed: false,
      deepLink: "/care/telemedicine?appointment=dr-kim"
    },
    {
      id: "4",
      titleKey: "저녁 혈당 측정",
      time: "18:00",
      type: "measure",
      completed: false,
      deepLink: "/analyze?mode=glucose"
    }
  ]);

  const weatherAlerts: WeatherAlert[] = [
    {
      type: "dust",
      level: "medium",
      messageKey: "미세먼지 보통 (45㎍/m³)"
    }
  ];

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { key: "home.greeting.morning", icon: Sun };
    if (hour < 18) return { key: "home.greeting.afternoon", icon: Sun };
    return { key: "home.greeting.evening", icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const handleToggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const displaySubtitle = hasMounted ? customSubtitle : DEFAULT_SUBTITLE;

  const getTypeIcon = (type: TodoItem["type"]) => {
    switch (type) {
      case "measure": return Activity;
      case "medication": return Pill;
      case "appointment": return Stethoscope;
      case "exercise": return Heart;
      default: return CheckCircle2;
    }
  };

  const getTypeColor = (type: TodoItem["type"]) => {
    switch (type) {
      case "measure": return "text-emerald-500 bg-emerald-50";
      case "medication": return "text-amber-500 bg-amber-50";
      case "appointment": return "text-rose-500 bg-rose-50";
      case "exercise": return "text-violet-500 bg-violet-50";
      default: return "text-slate-500 bg-slate-50";
    }
  };

  // Health Score
  const healthScore = 82;
  const getScoreColor = () => {
    if (healthScore >= 80) return "from-emerald-400 to-teal-500";
    if (healthScore >= 60) return "from-amber-400 to-orange-500";
    return "from-rose-400 to-red-500";
  };

  const getScoreLabel = () => {
    if (healthScore >= 80) return t("home.excellent");
    if (healthScore >= 60) return t("home.good");
    return t("home.attention");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50 pb-24">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <GreetingIcon className="w-4 h-4" />
              <span className="text-sm">
                {hasMounted ? t(greeting.key as keyof typeof t) : ""}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {locale === "ko" ? "사용자님 👋" : "Hello! 👋"}
            </h1>
          </div>

          <button className="relative p-2 rounded-full bg-white shadow-sm border border-slate-200">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center">
              3
            </span>
          </button>
        </header>

        {/* Weather/Alert Banner */}
        {weatherAlerts.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {weatherAlerts.map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border whitespace-nowrap shrink-0",
                  alert.level === "high" && "bg-rose-100 text-rose-700 border-rose-200",
                  alert.level === "medium" && "bg-amber-100 text-amber-700 border-amber-200",
                  alert.level === "low" && "bg-emerald-100 text-emerald-700 border-emerald-200"
                )}
              >
                <Wind className="w-4 h-4" />
                <span className="text-xs font-medium">{alert.messageKey}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Health Score & AI Mate Row */}
        <div className="grid grid-cols-5 gap-4">
          {/* Health Score Card */}
          <div className="col-span-2">
            <Card className="h-full bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(healthScore / 100) * 251.2} 251.2`}
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn(
                      "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                      getScoreColor()
                    )}>
                      {healthScore}
                    </span>
                    <span className="text-[10px] text-slate-500">{getScoreLabel()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-slate-600">
                    {t("home.healthScore")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Mate Greeting */}
          <div className="col-span-3">
            <Card className="h-full bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shrink-0 shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-sky-600">
                        {t("mate.title")}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {locale === "ko" 
                        ? "좋은 하루예요! 어제보다 수면 점수가 15% 향상됐어요. 오늘도 건강한 하루 보내세요! 💪"
                        : "Great day! Your sleep score improved by 15% from yesterday. Have a healthy day! 💪"
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* To-Do List */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{t("home.todoTitle")}</span>
              </div>
              <span className="text-xs text-slate-500">
                {todos.filter(i => i.completed).length}/{todos.length} {t("home.completed")}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {todos.map((item, index) => {
                const Icon = getTypeIcon(item.type);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                      "hover:bg-slate-50",
                      item.completed && "opacity-60"
                    )}
                  >
                    <button
                      onClick={() => handleToggleTodo(item.id)}
                      className="shrink-0"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className={cn(
                          "w-5 h-5",
                          item.urgent ? "text-rose-400" : "text-slate-300"
                        )} />
                      )}
                    </button>

                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      getTypeColor(item.type)
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "text-sm font-medium",
                        item.completed && "line-through text-slate-400"
                      )}>
                        {item.titleKey}
                        {item.urgent && !item.completed && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600">
                            {t("common.now")}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{item.time}</div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              {t("home.quickAction")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <QuickBridgeLink 
                to="/analyze?mode=quick" 
                icon={Activity} 
                label={t("quick.measure")}
                color="emerald"
              />
              <QuickBridgeLink 
                to="/care/telemedicine" 
                icon={Stethoscope} 
                label={t("care.bookNow")}
                color="rose"
              />
              <QuickBridgeLink 
                to="/care/mall" 
                icon={Pill} 
                label={t("care.mall")}
                color="amber"
              />
              <QuickBridgeLink 
                to="/world/school" 
                icon={Heart} 
                label={t("world.school")}
                color="violet"
              />
            </div>
          </CardContent>
        </Card>

        {/* Subtitle */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            <span className="text-ink font-medium">만파식</span> · ManPaSik
          </p>
          <p className="text-xs text-dancheong-red mt-1">
            {displaySubtitle}
          </p>
        </div>
      </div>
    </div>
  );
}




