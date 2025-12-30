"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  User,
  Wallet,
  Smartphone,
  Settings,
  FileText,
  Dna,
  Heart,
  ChevronRight,
  Gift,
  Crown,
  Cpu,
  Bluetooth,
  Battery,
  RefreshCw,
  Shield,
  Bell,
  HelpCircle,
  LogOut
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AppNavigationLayout } from "@/components/navigation/AppNavigation";

/* ============================================
 * User Profile Data
 * ============================================ */

interface UserProfile {
  name: string;
  email: string;
  tier: "basic" | "pro" | "premium";
  joinDate: string;
  points: number;
  coupons: number;
}

const USER_PROFILE: UserProfile = {
  name: "사용자",
  email: "user@example.com",
  tier: "pro",
  joinDate: "2024-06-15",
  points: 2500,
  coupons: 3
};

/* ============================================
 * Connected Devices
 * ============================================ */

interface Device {
  id: string;
  name: string;
  type: "reader" | "wearable" | "sensor";
  status: "connected" | "disconnected" | "updating";
  battery?: number;
  firmware?: string;
}

const DEVICES: Device[] = [
  {
    id: "1",
    name: "Manpasik Reader Pro",
    type: "reader",
    status: "connected",
    battery: 85,
    firmware: "v2.4.1"
  },
  {
    id: "2",
    name: "Apple Watch",
    type: "wearable",
    status: "connected",
    battery: 72
  }
];

/* ============================================
 * Me Page Component
 * ============================================ */

export default function MePage() {
  const getTierColor = (tier: UserProfile["tier"]) => {
    switch (tier) {
      case "premium": return "from-amber-400 to-yellow-500";
      case "pro": return "from-violet-500 to-purple-500";
      default: return "from-slate-400 to-slate-500";
    }
  };

  const getTierLabel = (tier: UserProfile["tier"]) => {
    switch (tier) {
      case "premium": return "Premium";
      case "pro": return "Pro";
      default: return "Basic";
    }
  };

  return (
    <AppNavigationLayout>
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Profile Card */}
          <Card className="overflow-hidden">
            <div className={cn(
              "h-20 bg-gradient-to-r",
              getTierColor(USER_PROFILE.tier)
            )} />
            <CardContent className="pt-0 pb-4">
              <div className="flex items-end gap-4 -mt-10">
                <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <User className="w-8 h-8 text-slate-500" />
                  </div>
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold">{USER_PROFILE.name}</h1>
                    <Badge className={cn(
                      "text-[10px] bg-gradient-to-r text-white",
                      getTierColor(USER_PROFILE.tier)
                    )}>
                      <Crown className="w-3 h-3 mr-1" />
                      {getTierLabel(USER_PROFILE.tier)}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{USER_PROFILE.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                MPS 월렛
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-center">
                  <p className="text-2xl font-bold text-primary">{USER_PROFILE.points.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">포인트</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 text-center">
                  <p className="text-2xl font-bold text-rose-500">{USER_PROFILE.coupons}</p>
                  <p className="text-xs text-slate-500 mt-1">쿠폰</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" size="sm">
                <Gift className="w-4 h-4 mr-2" />
                포인트 충전 / 쿠폰 등록
              </Button>
            </CardContent>
          </Card>

          {/* Digital Twin Section */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Dna className="w-5 h-5 text-violet-500" />
              디지털 트윈
            </h2>
            <div className="space-y-2">
              {[
                { icon: FileText, label: "의료 기록", desc: "진단 및 처방 이력", path: "/me/records" },
                { icon: Dna, label: "DNA 프로필", desc: "유전자 분석 결과", path: "/me/dna" },
                { icon: Heart, label: "건강 목표", desc: "체중 감량, 근육 증가 등", path: "/me/goals" }
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium">{item.label}</h3>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Devices Section */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-500" />
              연결된 기기
            </h2>
            <div className="space-y-2">
              {DEVICES.map((device) => (
                <Card key={device.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      device.status === "connected" 
                        ? "bg-emerald-100 text-emerald-600" 
                        : "bg-slate-100 text-slate-600"
                    )}>
                      {device.type === "reader" && <Cpu className="w-5 h-5" />}
                      {device.type === "wearable" && <Smartphone className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">{device.name}</h3>
                        <Bluetooth className={cn(
                          "w-3 h-3",
                          device.status === "connected" ? "text-blue-500" : "text-slate-300"
                        )} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {device.battery && (
                          <>
                            <Battery className="w-3 h-3" />
                            <span>{device.battery}%</span>
                          </>
                        )}
                        {device.firmware && (
                          <>
                            <span>•</span>
                            <span>{device.firmware}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {device.status === "updating" ? (
                      <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                    ) : (
                      <Badge 
                        variant={device.status === "connected" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {device.status === "connected" ? "연결됨" : "연결 끊김"}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" size="sm" className="w-full">
                <Bluetooth className="w-4 h-4 mr-2" />
                기기 추가
              </Button>
            </div>
          </section>

          {/* Settings Section */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-500" />
              설정
            </h2>
            <Card>
              <CardContent className="p-0 divide-y divide-slate-100">
                {[
                  { icon: Bell, label: "알림 설정", path: "/settings/notifications" },
                  { icon: Shield, label: "개인정보 및 보안", path: "/settings/privacy" },
                  { icon: Settings, label: "앱 설정", path: "/settings" },
                  { icon: HelpCircle, label: "도움말 및 지원", path: "/help" }
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <item.icon className="w-5 h-5 text-slate-400" />
                    <span className="flex-1 text-left text-sm">{item.label}</span>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Logout */}
          <Button variant="ghost" className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50">
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </div>
    </AppNavigationLayout>
  );
}
