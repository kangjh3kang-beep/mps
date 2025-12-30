"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Activity, 
  Stethoscope, 
  Globe, 
  User,
  Plus,
  Zap,
  MessageCircle,
  Camera,
  AlertTriangle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

/* ============================================
 * Navigation Configuration
 * ============================================ */

export interface NavTab {
  id: string;
  label: string;
  labelKo: string;
  icon: React.ElementType;
  path: string;
  color: string;
  description: string;
}

export const NAV_TABS: NavTab[] = [
  {
    id: "home",
    label: "Home",
    labelKo: "홈",
    icon: Home,
    path: "/",
    color: "text-sky-500",
    description: "My Daily Rhythm - 오늘의 건강 리듬"
  },
  {
    id: "analyze",
    label: "Analyze",
    labelKo: "분석",
    icon: Activity,
    path: "/analyze",
    color: "text-emerald-500",
    description: "The Lab - 측정 및 데이터"
  },
  {
    id: "care",
    label: "Care",
    labelKo: "케어",
    icon: Stethoscope,
    path: "/care",
    color: "text-rose-500",
    description: "Hospital & Mall - 진료 및 쇼핑"
  },
  {
    id: "world",
    label: "World",
    labelKo: "월드",
    icon: Globe,
    path: "/world",
    color: "text-violet-500",
    description: "The Campus - 교육 및 커뮤니티"
  },
  {
    id: "me",
    label: "Me",
    labelKo: "나",
    icon: User,
    path: "/me",
    color: "text-amber-500",
    description: "Digital Twin - 프로필 및 설정"
  }
];

/* ============================================
 * Quick Action FAB Menu Items
 * ============================================ */
export interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  action: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "quick-measure",
    label: "빠른 측정",
    icon: Zap,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    action: "/analyze?mode=quick"
  },
  {
    id: "talk-mate",
    label: "메이트와 대화",
    icon: MessageCircle,
    color: "text-sky-600",
    bgColor: "bg-sky-100",
    action: "mate"
  },
  {
    id: "food-lens",
    label: "푸드 렌즈",
    icon: Camera,
    color: "text-green-600",
    bgColor: "bg-green-100",
    action: "/analyze?mode=food"
  },
  {
    id: "emergency",
    label: "긴급 SOS",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    action: "emergency"
  }
];

/* ============================================
 * Quick Action FAB Component
 * ============================================ */
interface QuickActionFABProps {
  onAction?: (action: string) => void;
}

export function QuickActionFAB({ onAction }: QuickActionFABProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();

  const handleAction = (action: QuickAction) => {
    setIsOpen(false);
    
    if (action.action === "mate") {
      // Trigger Mate voice mode
      onAction?.("mate");
    } else if (action.action === "emergency") {
      // Trigger emergency SOS
      onAction?.("emergency");
    } else {
      // Navigate to path
      router.push(action.action);
    }
  };

  return (
    <div className="relative">
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Quick Action Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="grid grid-cols-2 gap-3 p-4 bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200">
              {QUICK_ACTIONS.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleAction(action)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
                    "hover:scale-105 active:scale-95",
                    action.bgColor
                  )}
                >
                  <action.icon className={cn("w-6 h-6", action.color)} />
                  <span className={cn("text-xs font-medium", action.color)}>
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative z-50 w-14 h-14 rounded-full shadow-lg",
          "flex items-center justify-center",
          "transition-all duration-300",
          isOpen 
            ? "bg-slate-700 rotate-45" 
            : "bg-gradient-to-br from-primary to-primary-end"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Plus className="w-7 h-7 text-white" />
        )}
        
        {/* Pulse Animation */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        )}
      </motion.button>
    </div>
  );
}

/* ============================================
 * Bottom Tab Bar Component
 * ============================================ */
interface BottomTabBarProps {
  onQuickAction?: (action: string) => void;
}

export function BottomTabBar({ onQuickAction }: BottomTabBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useI18n();

  const getActiveTab = () => {
    // Determine active tab based on pathname
    if (pathname === "/" || pathname.startsWith("/dashboard")) return "home";
    if (pathname.startsWith("/analyze") || pathname.startsWith("/result") || pathname.startsWith("/measure")) return "analyze";
    if (pathname.startsWith("/care") || pathname.startsWith("/telemedicine") || pathname.startsWith("/store")) return "care";
    if (pathname.startsWith("/world") || pathname.startsWith("/school")) return "world";
    if (pathname.startsWith("/me") || pathname.startsWith("/settings") || pathname.startsWith("/profile")) return "me";
    return "home";
  };

  const activeTab = getActiveTab();

  // Get translated label for tab
  const getTabLabel = (tab: NavTab) => {
    const key = `nav.${tab.id}` as keyof typeof t;
    return t(key);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {/* Left Tabs */}
        {NAV_TABS.slice(0, 2).map((tab) => (
          <TabButton 
            key={tab.id} 
            tab={tab} 
            isActive={activeTab === tab.id}
            onClick={() => router.push(tab.path)}
            translatedLabel={getTabLabel(tab)}
          />
        ))}

        {/* Center FAB */}
        <div className="relative -mt-6">
          <QuickActionFAB onAction={onQuickAction} />
        </div>

        {/* Right Tabs */}
        {NAV_TABS.slice(2).map((tab) => (
          <TabButton 
            key={tab.id} 
            tab={tab} 
            isActive={activeTab === tab.id}
            onClick={() => router.push(tab.path)}
            translatedLabel={getTabLabel(tab)}
          />
        ))}
      </div>
    </nav>
  );
}

/* ============================================
 * Tab Button Component
 * ============================================ */
interface TabButtonProps {
  tab: NavTab;
  isActive: boolean;
  onClick: () => void;
  translatedLabel?: string;
}

function TabButton({ tab, isActive, onClick, translatedLabel }: TabButtonProps) {
  const Icon = tab.icon;
  const displayLabel = translatedLabel || tab.labelKo;

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
        "min-w-[56px]",
        isActive 
          ? "bg-slate-100" 
          : "hover:bg-slate-50"
      )}
    >
      <motion.div
        initial={false}
        animate={{ 
          scale: isActive ? 1.1 : 1,
          y: isActive ? -2 : 0
        }}
      >
        <Icon 
          className={cn(
            "w-5 h-5 transition-colors",
            isActive ? tab.color : "text-slate-400"
          )} 
        />
      </motion.div>
      <span 
        className={cn(
          "text-[10px] font-medium transition-colors",
          isActive ? "text-slate-900" : "text-slate-400"
        )}
      >
        {displayLabel}
      </span>
      
      {/* Active Indicator */}
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className={cn("absolute bottom-1 w-1 h-1 rounded-full", tab.color.replace("text-", "bg-"))}
        />
      )}
    </motion.button>
  );
}

/* ============================================
 * Sidebar Navigation (Desktop)
 * ============================================ */
export function SidebarNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  const getActiveTab = () => {
    if (pathname === "/" || pathname.startsWith("/dashboard")) return "home";
    if (pathname.startsWith("/analyze") || pathname.startsWith("/result") || pathname.startsWith("/measure")) return "analyze";
    if (pathname.startsWith("/care") || pathname.startsWith("/telemedicine") || pathname.startsWith("/store")) return "care";
    if (pathname.startsWith("/world") || pathname.startsWith("/school")) return "world";
    if (pathname.startsWith("/me") || pathname.startsWith("/settings") || pathname.startsWith("/profile")) return "me";
    return "home";
  };

  const activeTab = getActiveTab();
  
  // Get translated label for tab
  const getTabLabel = (tab: NavTab) => {
    const key = `nav.${tab.id}` as keyof typeof t;
    return t(key);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-20 bg-white border-r border-slate-200 z-30 hidden lg:flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center h-20 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-end flex items-center justify-center">
          <span className="text-white text-lg font-bold">M</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center py-4 gap-2">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(tab.path)}
              className={cn(
                "relative w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all",
                isActive 
                  ? "bg-slate-100" 
                  : "hover:bg-slate-50"
              )}
            >
              <Icon 
                className={cn(
                  "w-5 h-5",
                  isActive ? tab.color : "text-slate-400"
                )} 
              />
              <span 
                className={cn(
                  "text-[9px] font-medium",
                  isActive ? "text-slate-900" : "text-slate-400"
                )}
              >
                {getTabLabel(tab)}
              </span>

              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebarActive"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Quick Action */}
      <div className="p-4 border-t border-slate-100">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-primary to-primary-end flex items-center justify-center shadow-lg"
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      </div>
    </aside>
  );
}

/* ============================================
 * Export Default Layout Wrapper
 * ============================================ */
interface AppNavigationLayoutProps {
  children: React.ReactNode;
  onQuickAction?: (action: string) => void;
}

export function AppNavigationLayout({ children, onQuickAction }: AppNavigationLayoutProps) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Desktop Sidebar */}
      <SidebarNavigation />
      
      {/* Main Content - 스크롤 가능 */}
      <main className="lg:pl-20 pb-24 lg:pb-8 min-h-screen overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <BottomTabBar onQuickAction={onQuickAction} />
      </div>
    </div>
  );
}

// Alias for backward compatibility
export const AppNavigation = AppNavigationLayout;

export default AppNavigationLayout;
