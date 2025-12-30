"use client";

/**
 * ============================================================
 * SKELETON LOADER COMPONENTS
 * 성능 최적화를 위한 스켈레톤 로딩 시스템
 * ============================================================
 * 
 * 41-Persona Simulation: User #15 (풀스택 개발자)
 * Issue: "초기 로딩이 느리고 스피너만 보임"
 */

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================
// BASE SKELETON
// ============================================

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <motion.div
      className={cn(
        "bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg",
        animate && "animate-pulse",
        className
      )}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 0.8, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
}

// ============================================
// DASHBOARD SKELETONS
// ============================================

export function HealthScoreSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-surface/60 backdrop-blur-md shadow-soft-lg">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="w-24 h-24 rounded-full" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
    </div>
  );
}

export function AIInsightSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-surface/60 backdrop-blur-md shadow-soft-lg">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <Skeleton className="h-10 w-full mt-4 rounded-xl" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-surface/60 backdrop-blur-md shadow-soft-lg">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>
      <div className="h-48 flex items-end gap-2 pt-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-primary/10 rounded-t-lg"
            initial={{ height: 0 }}
            animate={{ height: `${20 + Math.random() * 60}%` }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          />
        ))}
      </div>
    </div>
  );
}

export function WidgetGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-4 rounded-2xl bg-surface/60 backdrop-blur-md shadow-soft-lg"
        >
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-24 mt-2" />
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// CHAT SKELETONS
// ============================================

export function ChatMessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {!isUser && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
      <div className={cn(
        "space-y-2",
        isUser ? "items-end" : "items-start"
      )}>
        <Skeleton className={cn(
          "h-12 rounded-2xl",
          isUser ? "w-48" : "w-64"
        )} />
      </div>
    </div>
  );
}

export function ChatLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <ChatMessageSkeleton isUser />
      <ChatMessageSkeleton />
      <ChatMessageSkeleton isUser />
      <ChatMessageSkeleton />
    </div>
  );
}

// ============================================
// PRODUCT CARD SKELETON
// ============================================

export function ProductCardSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-surface/60 backdrop-blur-md shadow-soft-lg">
      <Skeleton className="h-40 w-full rounded-xl mb-4" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2 mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <ProductCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// RESULT PAGE SKELETON
// ============================================

export function RadarChartSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-surface/60 backdrop-blur-md shadow-soft-lg">
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="flex items-center justify-center">
        <div className="relative w-64 h-64">
          {/* Octagon Shape */}
          <Skeleton className="absolute inset-0 rounded-full opacity-20" />
          <Skeleton className="absolute inset-8 rounded-full opacity-30" />
          <Skeleton className="absolute inset-16 rounded-full opacity-40" />
          {/* Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-12 h-12 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FULL PAGE LOADER
// ============================================

export function FullPageSkeleton() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-background to-sky-50/30 p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        {/* Main Content */}
        <HealthScoreSkeleton />
        <AIInsightSkeleton />
        <ChartSkeleton />
        <WidgetGridSkeleton />
      </div>
    </div>
  );
}

// ============================================
// LOADING WRAPPER
// ============================================

interface LoadingWrapperProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

export function LoadingWrapper({ isLoading, skeleton, children }: LoadingWrapperProps) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {isLoading ? skeleton : children}
    </motion.div>
  );
}






