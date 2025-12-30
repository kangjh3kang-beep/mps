"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Box,
  Cpu,
  FileText,
  Globe,
  Heart,
  Home,
  LayoutDashboard,
  Lock,
  Radio,
  Server,
  Settings,
  Shield,
  Smartphone,
  Users,
  Zap
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MasterAdminAgent } from "@/components/admin/MasterAdminAgent";

const NAV_ITEMS = [
  {
    title: "Overview",
    titleKo: "개요",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", labelKo: "대시보드", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", labelKo: "분석", icon: BarChart3 }
    ]
  },
  {
    title: "Commerce AI",
    titleKo: "커머스 AI",
    items: [
      { href: "/admin/mall-editor", label: "Mall Designer", labelKo: "몰 디자이너", icon: Radio, badge: "AI" },
      { href: "/admin/inventory", label: "Smart Inventory", labelKo: "스마트 재고", icon: Box },
      { href: "/admin/cs", label: "CS Agent", labelKo: "CS 에이전트", icon: Activity }
    ]
  },
  {
    title: "Operations",
    titleKo: "운영",
    items: [
      { href: "/admin/devices", label: "Device Management", labelKo: "디바이스 관리", icon: Smartphone },
      { href: "/admin/users", label: "User Management", labelKo: "사용자 관리", icon: Users }
    ]
  },
  {
    title: "Security",
    titleKo: "보안",
    items: [
      { href: "/admin/audit", label: "Audit Logs", labelKo: "감사 로그", icon: FileText },
      { href: "/admin/security", label: "Security Center", labelKo: "보안 센터", icon: Shield, badge: "2" }
    ]
  },
  {
    title: "AIOps",
    titleKo: "AIOps",
    items: [
      { href: "/admin/aiops", label: "Immune System", labelKo: "면역 시스템", icon: Heart, badge: "AI" },
      { href: "/admin/omni-brain", label: "Omni Brain", labelKo: "옴니 브레인", icon: Cpu, badge: "AI" }
    ]
  },
  {
    title: "System",
    titleKo: "시스템",
    items: [
      { href: "/admin/servers", label: "Server Health", labelKo: "서버 상태", icon: Server },
      { href: "/admin/settings", label: "Settings", labelKo: "설정", icon: Settings }
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-slate-800 bg-slate-900 transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm">Manpasik</div>
                <div className="text-[10px] text-slate-400">Admin OS</div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-white"
            onClick={() => setCollapsed(!collapsed)}
          >
            <LayoutDashboard className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-6">
            {NAV_ITEMS.map((group, idx) => (
              <div key={idx}>
                {!collapsed && (
                  <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {group.title}
                  </div>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-slate-800 text-cyan-400"
                              : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="flex-1">{item.label}</span>
                              {item.badge && (
                                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-slate-800 p-3">
          <Link href="/">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors">
              <Home className="h-4 w-4" />
              {!collapsed && <span>Exit Admin</span>}
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400">Live</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium">Global Operations Center</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-slate-400">Systems OK</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-cyan-400" />
                <span className="text-slate-300">12,847 active</span>
              </div>
            </div>

            {/* Admin Badge */}
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">
              <Lock className="h-3 w-3 mr-1" />
              God Mode
            </Badge>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Master Admin Agent - Floating Chat */}
      <MasterAdminAgent />
    </div>
  );
}

