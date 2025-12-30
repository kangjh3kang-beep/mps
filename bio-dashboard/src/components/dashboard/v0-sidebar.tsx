"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  FileText,
  BarChart3,
  Settings,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "대시보드", href: "/" },
  { icon: Activity, label: "분석", href: "/analyze" },
  { icon: FileText, label: "건강 기록", href: "/result" },
  { icon: BarChart3, label: "데이터 분석", href: "/v0-dashboard/analytics" },
  { icon: User, label: "프로필", href: "/me" },
  { icon: Settings, label: "설정", href: "/settings" },
];

export function V0Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl hanji-card flex items-center justify-center shadow-md"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? "메뉴 닫기" : "메뉴 열기"}
      >
        {isMobileOpen ? (
          <X className="w-5 h-5 text-ink" />
        ) : (
          <Menu className="w-5 h-5 text-ink" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen z-50 transition-all duration-300 ease-in-out",
          "bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border",
          "overflow-hidden shadow-lg", // ✅ 오버플로우 방지 + 그림자로 구분
          // Desktop: narrow by default, expand on hover
          isExpanded ? "w-56" : "w-16 lg:w-20",
          // Mobile: slide in/out with full width when open
          isMobileOpen 
            ? "translate-x-0 w-64" 
            : "-translate-x-full lg:translate-x-0"
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="flex flex-col h-full py-4 overflow-hidden">
          {/* Logo */}
          <div className="px-3 mb-6 flex items-center overflow-hidden">
            <div className="w-10 h-10 min-w-[40px] rounded-xl bg-gradient-to-br from-dancheong-red to-dancheong-red/80 flex items-center justify-center text-hanji font-medium text-lg shadow-md flex-shrink-0">
              M
            </div>
            <span
              className={cn(
                "ml-3 font-semibold text-foreground whitespace-nowrap overflow-hidden transition-all duration-300",
                isExpanded || isMobileOpen 
                  ? "opacity-100 max-w-[120px]" 
                  : "opacity-0 max-w-0"
              )}
            >
              만파식
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    "hover:bg-sidebar-accent overflow-hidden",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0 min-w-[20px]",
                      isActive ? "text-dancheong-red" : ""
                    )}
                    strokeWidth={1.5}
                  />
                  <span
                    className={cn(
                      "text-sm whitespace-nowrap overflow-hidden transition-all duration-300",
                      isExpanded || isMobileOpen 
                        ? "opacity-100 max-w-[150px]" 
                        : "opacity-0 max-w-0"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Expand Toggle (Desktop only) */}
          <div className="hidden lg:flex px-2 mt-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
              aria-label={isExpanded ? "사이드바 접기" : "사이드바 펼치기"}
            >
              {isExpanded ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export { V0Sidebar as Sidebar };
