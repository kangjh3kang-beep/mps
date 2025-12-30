"use client";

/**
 * ============================================================
 * MANPASIK SYSTEM OPTIMIZATION - RENDER OPTIMIZER
 * Components for Optimized Rendering
 * ============================================================
 */

import * as React from "react";
import { memo, useState, useEffect, useRef, useCallback } from "react";
import { RENDER_CONFIG, MEMORY_CONFIG } from "./performance-config";
import { useIntersectionObserver, useThrottledCallback } from "./use-optimized";

// ============================================
// LAZY RENDER WRAPPER
// ============================================

interface LazyRenderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
}

export function LazyRender({
  children,
  fallback = null,
  rootMargin = RENDER_CONFIG.INTERSECTION.rootMargin,
  threshold = RENDER_CONFIG.INTERSECTION.threshold,
  once = true,
}: LazyRenderProps) {
  const [ref, isIntersecting] = useIntersectionObserver({ rootMargin, threshold });
  const [hasRendered, setHasRendered] = useState(false);

  useEffect(() => {
    if (isIntersecting && !hasRendered) {
      setHasRendered(true);
    }
  }, [isIntersecting, hasRendered]);

  const shouldRender = once ? hasRendered : isIntersecting;

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      {shouldRender ? children : fallback}
    </div>
  );
}

// ============================================
// OPTIMIZED LIST (Virtual Scrolling)
// ============================================

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  containerHeight?: number;
  className?: string;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight = 400,
  className = "",
  overscan = RENDER_CONFIG.VIRTUALIZATION.overscanCount,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useThrottledCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, RENDER_CONFIG.DEBOUNCE.scroll);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Calculate visible range
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  // Skip virtualization for small lists
  if (items.length < RENDER_CONFIG.VIRTUALIZATION.threshold) {
    return (
      <div className={className} style={{ maxHeight: containerHeight, overflow: "auto" }}>
        {items.map((item, index) => (
          <div key={index}>{renderItem(item, index)}</div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: containerHeight,
        overflow: "auto",
        position: "relative",
      }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MEMOIZED COMPONENT WRAPPER
// ============================================

interface MemoizedProps {
  children: React.ReactNode;
  deps?: unknown[];
}

export const Memoized = memo(function Memoized({ children }: MemoizedProps) {
  return <>{children}</>;
}, (prev, next) => {
  // Custom comparison for deps
  if (!prev.deps || !next.deps) return true;
  if (prev.deps.length !== next.deps.length) return false;
  return prev.deps.every((dep, i) => Object.is(dep, next.deps?.[i]));
});

// ============================================
// SKELETON LOADER (Optimized)
// ============================================

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  animation?: "pulse" | "wave" | "none";
}

export const Skeleton = memo(function Skeleton({
  width = "100%",
  height = 20,
  className = "",
  variant = "rectangular",
  animation = "pulse",
}: SkeletonProps) {
  const baseClass = "bg-slate-200";
  
  const variantClass = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  }[variant];

  const animationClass = {
    pulse: "animate-pulse",
    wave: "animate-shimmer",
    none: "",
  }[animation];

  return (
    <div
      className={`${baseClass} ${variantClass} ${animationClass} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
});

// ============================================
// PROGRESSIVE IMAGE LOADER
// ============================================

interface ProgressiveImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function ProgressiveImage({
  src,
  alt,
  placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
  className = "",
  width,
  height,
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver();

  useEffect(() => {
    if (!isIntersecting) return;

    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
  }, [isIntersecting, src]);

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      <img
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-50"
        }`}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

// ============================================
// DATA DOWNSAMPLER FOR CHARTS
// ============================================

interface DownsampledChartProps<T> {
  data: T[];
  maxPoints?: number;
  children: (data: T[]) => React.ReactNode;
}

export function DownsampledChart<T>({
  data,
  maxPoints = MEMORY_CONFIG.CHART.maxDataPoints,
  children,
}: DownsampledChartProps<T>) {
  const downsampledData = React.useMemo(() => {
    if (data.length <= maxPoints) return data;

    // Use LTTB (Largest Triangle Three Buckets) algorithm for better visualization
    const bucketSize = Math.floor(data.length / maxPoints);
    const result: T[] = [data[0]]; // Always include first point

    for (let i = 1; i < maxPoints - 1; i++) {
      const bucketStart = Math.floor(i * bucketSize);
      const bucketEnd = Math.min(Math.floor((i + 1) * bucketSize), data.length);
      
      // Pick the point in the middle of the bucket (simplified LTTB)
      const midIndex = Math.floor((bucketStart + bucketEnd) / 2);
      result.push(data[midIndex]);
    }

    result.push(data[data.length - 1]); // Always include last point
    return result;
  }, [data, maxPoints]);

  return <>{children(downsampledData)}</>;
}

// ============================================
// DEFERRED UPDATE WRAPPER
// ============================================

interface DeferredProps {
  children: React.ReactNode;
  priority?: "high" | "normal" | "low";
}

export function Deferred({ children, priority = "normal" }: DeferredProps) {
  const [shouldRender, setShouldRender] = useState(priority === "high");

  useEffect(() => {
    if (priority === "high") return;

    const delay = priority === "normal" ? 0 : 100;
    
    if ("requestIdleCallback" in window) {
      const id = (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
        () => setShouldRender(true),
        { timeout: delay + 500 }
      );
      return () => (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => setShouldRender(true), delay);
      return () => clearTimeout(id);
    }
  }, [priority]);

  if (!shouldRender) return null;
  return <>{children}</>;
}




