"use client";

import React, { useState, useEffect } from "react";
import { Bell, Search, Moon, Sun } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function V0Header({ title = "대시보드", subtitle }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    document.documentElement.classList.toggle("dark", newMode);
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
      <div>
        <h1 className="text-responsive-2xl font-medium text-foreground brush-underline">
          {title}
        </h1>
        {subtitle && (
          <p className="text-responsive-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
        {!subtitle && (
          <p className="text-responsive-sm text-muted-foreground mt-1">
            오늘의 건강 현황을 한눈에 확인하세요
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search Button */}
        <button className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl hanji-card flex items-center justify-center hover:bg-hanji-warm transition-colors">
          <Search className="w-4 h-4 text-ink-light" strokeWidth={1.5} />
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 lg:w-10 lg:h-10 rounded-xl hanji-card flex items-center justify-center hover:bg-hanji-warm transition-colors">
          <Bell className="w-4 h-4 text-ink-light" strokeWidth={1.5} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-dancheong-red rounded-full" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl hanji-card flex items-center justify-center hover:bg-hanji-warm transition-colors"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-dancheong-yellow" strokeWidth={1.5} />
          ) : (
            <Moon className="w-4 h-4 text-ink-light" strokeWidth={1.5} />
          )}
        </button>

        {/* Profile Avatar */}
        <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-ink/70 to-ink-light/50 flex items-center justify-center text-hanji text-sm font-medium shadow-md">
          M
        </div>
      </div>
    </header>
  );
}

export { V0Header as Header };

