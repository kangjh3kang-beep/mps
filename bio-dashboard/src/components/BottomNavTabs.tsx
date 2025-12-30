"use client";

import { BarChart3, MessageCircleHeart, Stethoscope } from "lucide-react";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function BottomNavTabs({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 -mx-4 mt-4 border-t bg-background/90 px-4 py-2 backdrop-blur",
        className
      )}
    >
      <TabsList className="grid h-12 w-full grid-cols-3 rounded-xl">
        <TabsTrigger value="dashboard" className="flex gap-2">
          <Stethoscope className="h-4 w-4" />
          <span className="text-xs">대시보드</span>
        </TabsTrigger>
        <TabsTrigger value="coach" className="flex gap-2">
          <MessageCircleHeart className="h-4 w-4" />
          <span className="text-xs">AI 코칭</span>
        </TabsTrigger>
        <TabsTrigger value="sim" className="flex gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="text-xs">시뮬레이터</span>
        </TabsTrigger>
      </TabsList>
    </div>
  );
}







