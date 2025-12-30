"use client";

import * as React from "react";
import {
  Award,
  ChevronRight,
  Coins,
  Flame,
  Gift,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Zap
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  type TierId,
  type UserPoints,
  type RedemptionItem,
  TIERS,
  getProgressToNextTier,
  calculateStreak,
  getAvailableRedemptions,
  canAfford,
  REDEMPTION_CATALOG
} from "@/lib/h2e-engine";

interface H2EWidgetProps {
  className?: string;
  locale?: "ko" | "en";
  /** Initial points data (fetched from server) */
  initialPoints?: Partial<UserPoints>;
  /** Callback when points change */
  onPointsUpdate?: () => void;
  /** Navigate to rewards page */
  onViewRewards?: () => void;
}

export function H2EWidget({
  className,
  locale = "ko",
  initialPoints,
  onPointsUpdate,
  onViewRewards
}: H2EWidgetProps) {
  const isKo = locale === "ko";
  const [points, setPoints] = React.useState<Partial<UserPoints>>(
    initialPoints ?? {
      currentBalance: 0,
      lifetimeEarned: 0,
      tierId: "bronze",
      currentStreak: 0,
      longestStreak: 0
    }
  );
  const [loading, setLoading] = React.useState(!initialPoints);
  const [redeeming, setRedeeming] = React.useState<string | null>(null);

  // Fetch points on mount
  React.useEffect(() => {
    if (initialPoints) return;
    
    const fetchPoints = async () => {
      try {
        const res = await fetch("/api/points?history=false");
        const json = await res.json();
        if (json.success) {
          setPoints(json.points);
        }
      } catch (err) {
        console.error("Failed to fetch points:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPoints();
  }, [initialPoints]);

  const tier = TIERS[points.tierId as TierId ?? "bronze"];
  const progress = getProgressToNextTier(points.lifetimeEarned ?? 0);
  const availableRedemptions = getAvailableRedemptions(
    points.tierId as TierId ?? "bronze",
    points.currentBalance ?? 0
  ).slice(0, 4);

  // Handle redemption
  const handleRedeem = async (item: RedemptionItem) => {
    if (redeeming) return;
    if (!canAfford(points.currentBalance ?? 0, item)) return;

    setRedeeming(item.id);
    try {
      const res = await fetch("/api/points/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id })
      });
      const json = await res.json();
      if (json.success) {
        setPoints(prev => ({
          ...prev,
          currentBalance: json.newBalance
        }));
        onPointsUpdate?.();
      }
    } catch (err) {
      console.error("Redemption failed:", err);
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="pb-3">
          <div className="h-4 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-2 overflow-hidden", tier.borderColor, className)}>
      {/* Header with animated gradient */}
      <div className={cn("p-4", tier.bgColor)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{tier.emoji}</span>
            <div>
              <div className={cn("font-bold", tier.color)}>
                {isKo ? tier.nameKo : tier.name} {isKo ? "멤버" : "Member"}
              </div>
              <div className="text-xs text-muted-foreground">
                Health-to-Earn
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-2xl font-bold text-amber-600">
              <Coins className="h-5 w-5" />
              {(points.currentBalance ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">
              MPS Points
            </div>
          </div>
        </div>

        {/* Progress to next tier */}
        {progress.nextTier && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {isKo ? "다음 등급" : "Next tier"}: {isKo ? progress.nextTier.nameKo : progress.nextTier.name}
              </span>
              <span className="font-medium">
                {progress.pointsToNext.toLocaleString()} pts
              </span>
            </div>
            <Progress value={progress.progressPct} className="h-2" />
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Streak Display */}
        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Flame className="h-6 w-6 text-orange-500" />
              {(points.currentStreak ?? 0) >= 7 && (
                <span className="absolute -top-1 -right-1 text-[10px]">🔥</span>
              )}
            </div>
            <div>
              <div className="font-bold text-orange-700">
                {points.currentStreak ?? 0} {isKo ? "일 연속" : "Day Streak"}
              </div>
              <div className="text-[10px] text-orange-600">
                {(points.currentStreak ?? 0) >= 7
                  ? `${tier.streakMultiplier}x ${isKo ? "보너스 활성화!" : "Bonus Active!"}`
                  : isKo
                    ? "7일 연속 달성 시 1.5x 보너스"
                    : "7-day streak = 1.5x bonus"}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">
              {isKo ? "최장 기록" : "Best"}
            </div>
            <div className="font-bold text-orange-600">
              {points.longestStreak ?? 0} {isKo ? "일" : "days"}
            </div>
          </div>
        </div>

        {/* Tier Benefits */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">
            {isKo ? "현재 혜택" : "Current Benefits"}
          </div>
          <div className="flex flex-wrap gap-1">
            {tier.mallDiscountPct > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                🛒 {isKo ? `몰 ${tier.mallDiscountPct}% 할인` : `${tier.mallDiscountPct}% Mall Discount`}
              </Badge>
            )}
            {tier.streakMultiplier > 1 && (
              <Badge variant="secondary" className="text-[10px]">
                ⚡ {tier.streakMultiplier}x {isKo ? "연속 보너스" : "Streak Bonus"}
              </Badge>
            )}
            {tier.perksKo.slice(0, 2).map((perk, idx) => (
              <Badge key={idx} variant="outline" className="text-[10px]">
                ✨ {isKo ? perk : tier.perks[idx]}
              </Badge>
            ))}
          </div>
        </div>

        {/* Quick Redemption */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">
              {isKo ? "포인트 사용" : "Redeem Points"}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={onViewRewards}
            >
              {isKo ? "전체 보기" : "View All"}
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {availableRedemptions.map(item => {
              const affordable = canAfford(points.currentBalance ?? 0, item);
              return (
                <button
                  key={item.id}
                  onClick={() => handleRedeem(item)}
                  disabled={!affordable || redeeming === item.id}
                  className={cn(
                    "flex flex-col items-center rounded-lg border p-2 text-center transition-all",
                    affordable
                      ? "hover:border-amber-300 hover:bg-amber-50"
                      : "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Gift className="h-5 w-5 text-amber-500 mb-1" />
                  <div className="text-[10px] font-medium line-clamp-1">
                    {isKo ? item.nameKo : item.name}
                  </div>
                  <div className="flex items-center gap-0.5 text-[10px] text-amber-600">
                    <Coins className="h-2.5 w-2.5" />
                    {item.pointsCost}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/50 p-2">
            <TrendingUp className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
            <div className="text-xs font-bold">{(points.lifetimeEarned ?? 0).toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">{isKo ? "총 획득" : "Earned"}</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <Gift className="h-4 w-4 text-purple-500 mx-auto mb-1" />
            <div className="text-xs font-bold">{(points.lifetimeSpent ?? 0).toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">{isKo ? "총 사용" : "Spent"}</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <Award className="h-4 w-4 text-amber-500 mx-auto mb-1" />
            <div className="text-xs font-bold">{tier.emoji}</div>
            <div className="text-[10px] text-muted-foreground">{isKo ? tier.nameKo : tier.name}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================
 * Compact H2E Badge (for headers)
 * ============================================ */

export function H2EBadge({
  balance,
  tierId,
  streak,
  onClick,
  locale = "ko"
}: {
  balance: number;
  tierId: TierId;
  streak: number;
  onClick?: () => void;
  locale?: "ko" | "en";
}) {
  const tier = TIERS[tierId];
  const isKo = locale === "ko";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1.5 transition-all hover:scale-105",
        tier.bgColor,
        tier.borderColor,
        "border"
      )}
    >
      <span className="text-sm">{tier.emoji}</span>
      <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
        <Coins className="h-3 w-3" />
        {balance.toLocaleString()}
      </div>
      {streak >= 3 && (
        <div className="flex items-center gap-0.5 text-[10px] text-orange-600">
          <Flame className="h-3 w-3" />
          {streak}
        </div>
      )}
    </button>
  );
}

export default H2EWidget;






