"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { 
  Home, 
  Activity, 
  Stethoscope, 
  ShoppingBag, 
  GraduationCap, 
  Settings,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "홈", href: "/" },
  { icon: Activity, label: "분석", href: "/result" },
  { icon: Stethoscope, label: "진료", href: "/telemedicine" },
  { icon: ShoppingBag, label: "몰", href: "/store/products" },
  { icon: GraduationCap, label: "학교", href: "/school" },
  { icon: Settings, label: "설정", href: "/settings" },
];

export function Sidebar() {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [activeItem, setActiveItem] = React.useState("/");

  return (
    <motion.aside
      className={cn(
        "fixed left-0 top-0 h-full z-50",
        "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900",
        "border-r border-white/10",
        "flex flex-col items-center py-6",
        "transition-all duration-300 ease-out"
      )}
      initial={{ width: 80 }}
      animate={{ width: isExpanded ? 240 : 80 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <motion.span
          className="text-white font-bold text-lg whitespace-nowrap"
          initial={{ opacity: 0, width: 0 }}
          animate={{ 
            opacity: isExpanded ? 1 : 0, 
            width: isExpanded ? "auto" : 0 
          }}
        >
          만파식
        </motion.span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-full px-3 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.href;

          return (
            <motion.a
              key={item.href}
              href={item.href}
              onClick={() => setActiveItem(item.href)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl",
                "transition-all duration-200",
                isActive 
                  ? "bg-primary/20 text-primary" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <motion.span
                className="whitespace-nowrap text-sm font-medium"
                initial={{ opacity: 0, width: 0 }}
                animate={{ 
                  opacity: isExpanded ? 1 : 0, 
                  width: isExpanded ? "auto" : 0 
                }}
              >
                {item.label}
              </motion.span>
              {isExpanded && isActive && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </motion.a>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="w-full px-3 mt-auto">
        <motion.div
          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
            M
          </div>
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, width: 0 }}
            animate={{ 
              opacity: isExpanded ? 1 : 0, 
              width: isExpanded ? "auto" : 0 
            }}
          >
            <div className="text-white text-sm font-medium whitespace-nowrap">사용자</div>
            <div className="text-slate-400 text-xs whitespace-nowrap">Pro 회원</div>
          </motion.div>
        </motion.div>
      </div>
    </motion.aside>
  );
}






