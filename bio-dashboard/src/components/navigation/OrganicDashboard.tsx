"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sun, 
  Moon,
  Cloud,
  Thermometer,
  Droplets,
  Wind,
  Bell,
  CheckCircle2,
  Circle,
  Activity,
  Pill,
  Stethoscope,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Heart,
  Volume2,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings, DEFAULT_SUBTITLE } from "@/context/SettingsContext";
import { ManpasikFooter } from "@/components/ui/manpasik-footer";
import { QuickBridgeLink } from "./BridgeButton";

/* ============================================
 * Types
 * ============================================ */

interface TodoItem {
  id: string;
  title: string;
  time: string;
  type: "measure" | "medication" | "appointment" | "exercise" | "custom";
  completed: boolean;
  urgent?: boolean;
  deepLink: string;
}

interface WeatherAlert {
  type: "dust" | "uv" | "cold" | "heat" | "virus";
  level: "low" | "medium" | "high";
  message: string;
}

interface MateMessage {
  id: string;
  message: string;
  type: "greeting" | "insight" | "reminder" | "alert";
}

/* ============================================
 * Mock Data
 * ============================================ */

const MOCK_TODOS: TodoItem[] = [
  {
    id: "1",
    title: "오전 젖산 측정",
    time: "09:00",
    type: "measure",
    completed: true,
    deepLink: "/analyze?mode=lactate"
  },
  {
    id: "2",
    title: "비타민 D 복용",
    time: "12:00",
    type: "medication",
    completed: false,
    urgent: true,
    deepLink: "/care/mall?product=vitamin-d"
  },
  {
    id: "3",
    title: "김 원장님 원격 진료",
    time: "14:30",
    type: "appointment",
    completed: false,
    deepLink: "/care/telemedicine?appointment=dr-kim"
  },
  {
    id: "4",
    title: "저녁 혈당 측정",
    time: "18:00",
    type: "measure",
    completed: false,
    deepLink: "/analyze?mode=glucose"
  }
];

const MOCK_WEATHER: WeatherAlert[] = [
  {
    type: "dust",
    level: "medium",
    message: "미세먼지 보통 (45㎍/m³)"
  }
];

const MOCK_MATE_MESSAGE: MateMessage = {
  id: "1",
  message: "좋은 아침이에요! 어제보다 수면 점수가 15% 향상됐어요. 오늘도 좋은 하루 보내세요! 💪",
  type: "greeting"
};

/* ============================================
 * Health Score Moon Jar Component
 * ============================================ */

interface HealthScoreJarProps {
  score: number;
  trend: "up" | "down" | "stable";
  className?: string;
}

function HealthScoreJar({ score, trend, className }: HealthScoreJarProps) {
  const getScoreColor = () => {
    if (score >= 80) return "from-emerald-400 to-teal-500";
    if (score >= 60) return "from-amber-400 to-orange-500";
    return "from-rose-400 to-red-500";
  };

  const getScoreLabel = () => {
    if (score >= 80) return "우수";
    if (score >= 60) return "보통";
    return "주의";
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn("relative", className)}
    >
      {/* Moon Jar Shape */}
      <div className="relative w-32 h-40 mx-auto">
        {/* Jar Body */}
        <svg viewBox="0 0 100 120" className="w-full h-full">
          {/* Jar Outline */}
          <defs>
            <linearGradient id="jarGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" className="text-primary" stopColor="currentColor" stopOpacity="0.8" />
              <stop offset={`${score}%`} className="text-primary" stopColor="currentColor" stopOpacity="0.3" />
              <stop offset={`${score}%`} stopColor="transparent" />
            </linearGradient>
            <clipPath id="jarClip">
              <path d="M20,30 Q10,30 10,45 L10,100 Q10,115 25,115 L75,115 Q90,115 90,100 L90,45 Q90,30 80,30 L80,20 Q80,10 70,10 L30,10 Q20,10 20,20 Z" />
            </clipPath>
          </defs>
          
          {/* Jar Fill */}
          <rect 
            x="0" 
            y={120 - (score / 100) * 105} 
            width="100" 
            height={(score / 100) * 105}
            className={cn("fill-current", getScoreColor().split(" ")[0].replace("from-", "text-"))}
            clipPath="url(#jarClip)"
            opacity="0.6"
          />
          
          {/* Jar Border */}
          <path 
            d="M20,30 Q10,30 10,45 L10,100 Q10,115 25,115 L75,115 Q90,115 90,100 L90,45 Q90,30 80,30 L80,20 Q80,10 70,10 L30,10 Q20,10 20,20 L20,30" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className="text-slate-300"
          />
        </svg>

        {/* Score Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={score}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
              getScoreColor()
            )}
          >
            {score}
          </motion.span>
          <span className="text-xs text-slate-500 font-medium">{getScoreLabel()}</span>
        </div>

        {/* Trend Indicator */}
        <div className={cn(
          "absolute -right-2 top-1/2 -translate-y-1/2",
          "w-6 h-6 rounded-full flex items-center justify-center",
          trend === "up" ? "bg-emerald-100 text-emerald-600" :
          trend === "down" ? "bg-rose-100 text-rose-600" :
          "bg-slate-100 text-slate-600"
        )}>
          <TrendingUp className={cn(
            "w-3 h-3",
            trend === "down" && "rotate-180",
            trend === "stable" && "rotate-90"
          )} />
        </div>
      </div>

      {/* Label */}
      <div className="text-center mt-2">
        <span className="text-sm font-semibold text-slate-900">건강 점수</span>
      </div>
    </motion.div>
  );
}

/* ============================================
 * AI Mate Greeting Component
 * ============================================ */

interface MateGreetingProps {
  message: MateMessage;
  onSpeak?: () => void;
  className?: string;
}

function MateGreeting({ message, onSpeak, className }: MateGreetingProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className={cn("relative", className)}
    >
      <Card className="bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shrink-0 shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-sky-600">만파식 메이트</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {message.message}
              </p>
            </div>

            {/* Voice Button */}
            {onSpeak && (
              <button 
                onClick={onSpeak}
                className="p-2 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
              >
                <Volume2 className="w-4 h-4 text-sky-600" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ============================================
 * Weather & Alert Banner
 * ============================================ */

interface WeatherBannerProps {
  alerts: WeatherAlert[];
  className?: string;
}

function WeatherBanner({ alerts, className }: WeatherBannerProps) {
  const getAlertIcon = (type: WeatherAlert["type"]) => {
    switch (type) {
      case "dust": return Wind;
      case "uv": return Sun;
      case "cold": return Thermometer;
      case "heat": return Thermometer;
      case "virus": return AlertTriangle;
      default: return Cloud;
    }
  };

  const getAlertColor = (level: WeatherAlert["level"]) => {
    switch (level) {
      case "high": return "bg-rose-100 text-rose-700 border-rose-200";
      case "medium": return "bg-amber-100 text-amber-700 border-amber-200";
      case "low": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2 -mx-4 px-4", className)}>
      {alerts.map((alert, index) => {
        const Icon = getAlertIcon(alert.type);
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border whitespace-nowrap shrink-0",
              getAlertColor(alert.level)
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium">{alert.message}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ============================================
 * To-Do List Component
 * ============================================ */

interface TodoListProps {
  items: TodoItem[];
  onToggle?: (id: string) => void;
  onItemClick?: (item: TodoItem) => void;
  className?: string;
}

function TodoList({ items, onToggle, onItemClick, className }: TodoListProps) {
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

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">오늘의 할 일</span>
          </div>
          <span className="text-xs text-slate-500">
            {items.filter(i => i.completed).length}/{items.length} 완료
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {items.map((item, index) => {
            const Icon = getTypeIcon(item.type);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onItemClick?.(item)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                  "hover:bg-slate-50",
                  item.completed && "opacity-60"
                )}
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle?.(item.id);
                  }}
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

                {/* Icon */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  getTypeColor(item.type)
                )}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm font-medium",
                    item.completed && "line-through text-slate-400"
                  )}>
                    {item.title}
                    {item.urgent && !item.completed && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600">
                        지금
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{item.time}</div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================
 * Main Organic Dashboard Component
 * ============================================ */

interface OrganicDashboardProps {
  className?: string;
}

export function OrganicDashboard({ className }: OrganicDashboardProps) {
  const { customSubtitle } = useSettings();
  const [todos, setTodos] = React.useState(MOCK_TODOS);
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "좋은 아침이에요", icon: Sun };
    if (hour < 18) return { text: "좋은 오후예요", icon: Sun };
    return { text: "좋은 저녁이에요", icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const handleToggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const displaySubtitle = hasMounted ? customSubtitle : DEFAULT_SUBTITLE;

  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50", className)}>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <GreetingIcon className="w-4 h-4" />
              <span className="text-sm">{greeting.text}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              사용자님 👋
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
        <WeatherBanner alerts={MOCK_WEATHER} />

        {/* Health Score & Mate Row */}
        <div className="grid grid-cols-5 gap-4">
          {/* Health Score Moon Jar */}
          <div className="col-span-2">
            <Card className="h-full bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center justify-center">
                <HealthScoreJar score={82} trend="up" />
              </CardContent>
            </Card>
          </div>

          {/* AI Mate Greeting */}
          <div className="col-span-3">
            <MateGreeting message={MOCK_MATE_MESSAGE} />
          </div>
        </div>

        {/* To-Do List */}
        <TodoList 
          items={todos} 
          onToggle={handleToggleTodo}
          onItemClick={(item) => {
            // Deep link navigation
            console.log("Navigate to:", item.deepLink);
          }}
        />

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              빠른 실행
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <QuickBridgeLink 
                to="/analyze?mode=quick" 
                icon={Activity} 
                label="빠른 측정"
                color="emerald"
              />
              <QuickBridgeLink 
                to="/care/telemedicine" 
                icon={Stethoscope} 
                label="진료 예약"
                color="rose"
              />
              <QuickBridgeLink 
                to="/care/mall" 
                icon={Pill} 
                label="건강식품 주문"
                color="amber"
              />
              <QuickBridgeLink 
                to="/world/school" 
                icon={Heart} 
                label="건강 지식"
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

export default OrganicDashboard;
