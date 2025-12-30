"use client";

import * as React from "react";
import { Bell, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <header className="flex items-center justify-between mb-8">
      {/* Left: Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          안녕하세요, <span className="text-primary">사용자</span>님 👋
        </h1>
        <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
          <Calendar className="w-4 h-4" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Right: Search + Notifications */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="검색..."
            className="pl-10 w-64 bg-surface border-border/50 focus:border-primary"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <Badge 
            className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-[10px] bg-danger"
          >
            3
          </Badge>
        </Button>

        {/* Quick Measure Button */}
        <Button className="bg-gradient-to-r from-primary to-primary-end text-white shadow-lg">
          <span className="mr-2">🔬</span>
          측정하기
        </Button>
      </div>
    </header>
  );
}






